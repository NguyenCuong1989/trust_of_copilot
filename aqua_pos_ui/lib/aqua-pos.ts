import {
  createPageInDatabase,
  getPage,
  logSystemEvent,
  numberProp,
  queryDatabaseByKey,
  readNumber,
  readSelect,
  readTitle,
  relationProp,
  selectProp,
  textProp,
  titleProp,
  updatePage,
  type AquaDatabaseKey
} from './notion';

export type SaleItemInput = {
  fishPageId: string;
  quantity: number;
  unitPrice: number;
  fishName?: string;
  tankPageId?: string;
};

export type SaleInput = {
  orderTitle?: string;
  customerName?: string;
  paymentMethod?: string;
  note?: string;
  discount?: number;
  items: SaleItemInput[];
};

export type AdjustmentInput = {
  fishPageId: string;
  fishName?: string;
  quantityLoss?: number;
  healthDelta?: number;
  reason: 'death' | 'health_drop' | 'manual_count' | 'transfer' | 'treatment';
  note?: string;
};

const DB: Record<string, AquaDatabaseKey> = {
  fish: 'fish',
  orders: 'orders',
  orderItems: 'orderItems',
  inventory: 'inventory',
  tanks: 'tanks',
  customers: 'customers',
  suppliers: 'suppliers',
  purchases: 'purchases',
  inventoryAdjustments: 'inventoryAdjustments',
  systemLogs: 'systemLogs'
};

function money(value: number) {
  return Math.round(value);
}

function buildOrderTitle(input: SaleInput) {
  return input.orderTitle ?? 'AQUA SALE ' + new Date().toISOString().slice(0, 19);
}

function statusFromStock(stock: number) {
  if (stock <= 0) return 'Out of stock';
  if (stock <= 5) return 'Low';
  return 'Active';
}

async function logThen<T>(entry: string, message: string, op: () => Promise<T>, relatedEntity?: string) {
  await logSystemEvent({ entry, message, relatedEntity, status: 'OK' });
  return op();
}

export async function createFishSale(input: SaleInput) {
  if (!input.items?.length) {
    throw new Error('Sale must contain at least one item');
  }

  const lineTotals = input.items.map((item) => money(item.quantity * item.unitPrice));
  const subtotal = lineTotals.reduce((sum, value) => sum + value, 0);
  const discount = money(input.discount ?? 0);
  const total = Math.max(0, subtotal - discount);
  const orderTitle = buildOrderTitle(input);

  return logThen('FISH_SALE_REQUESTED', 'Sale request received for ' + orderTitle, async () => {
    const order = await createPageInDatabase(DB.orders, {
      Name: titleProp(orderTitle),
      Status: selectProp('Paid'),
      Customer: textProp(input.customerName ?? 'Walk-in'),
      Payment_Method: textProp(input.paymentMethod ?? 'cash'),
      Subtotal: numberProp(subtotal),
      Discount: numberProp(discount),
      Total: numberProp(total),
      Notes: textProp(input.note ?? '')
    });

    const orderId = (order as any).id as string;

    const itemResults = [];
    for (let index = 0; index < input.items.length; index += 1) {
      const item = input.items[index];
      const lineTotal = lineTotals[index];
      const fishPage = await getPage(item.fishPageId);
      const currentStock = readNumber(fishPage, 'Stock');
      const nextStock = Math.max(0, currentStock - item.quantity);
      const nextStatus = statusFromStock(nextStock);
      const fishName = item.fishName ?? readTitle(fishPage, 'Name') ?? 'Fish item';

      await logSystemEvent({
        entry: 'FISH_STOCK_DECREMENT_REQUESTED',
        message: 'Decrement ' + fishName + ' by ' + item.quantity + ' from sale ' + orderTitle,
        relatedEntity: item.fishPageId,
        status: 'OK'
      });

      await updatePage(item.fishPageId, {
        Stock: numberProp(nextStock),
        Status: selectProp(nextStatus)
      });

      const orderItem = await createPageInDatabase(DB.orderItems, {
        Name: titleProp(fishName),
        Order: relationProp([orderId]),
        Fish: relationProp([item.fishPageId]),
        Quantity: numberProp(item.quantity),
        Unit_Price: numberProp(item.unitPrice),
        Line_Total: numberProp(lineTotal),
        Tank: item.tankPageId ? relationProp([item.tankPageId]) : relationProp([]),
        Status: selectProp('Recorded')
      });

      itemResults.push({
        orderItemId: (orderItem as any).id as string,
        fishPageId: item.fishPageId,
        previousStock: currentStock,
        nextStock,
        lineTotal
      });
    }

    await logSystemEvent({
      entry: 'FISH_SALE_COMPLETED',
      message: 'Created order ' + orderTitle + ' with ' + input.items.length + ' item(s)',
      relatedEntity: orderId,
      status: 'OK'
    });

    return {
      orderId,
      orderTitle,
      subtotal,
      discount,
      total,
      items: itemResults
    };
  });
}

export async function recordInventoryAdjustment(input: AdjustmentInput) {
  return logThen('INVENTORY_ADJUSTMENT_REQUESTED', 'Adjustment request received for fish ' + input.fishPageId, async () => {
    const fishPage = await getPage(input.fishPageId);
    const fishName = input.fishName ?? readTitle(fishPage, 'Name') ?? 'Fish item';
    const currentStock = readNumber(fishPage, 'Stock');
    const currentHealth = readNumber(fishPage, 'Health');
    const quantityLoss = Math.max(0, input.quantityLoss ?? 0);
    const healthDelta = input.healthDelta ?? 0;
    const nextStock = Math.max(0, currentStock - quantityLoss);
    const nextHealth = Math.max(0, currentHealth + healthDelta);
    const nextStatus = nextStock === 0 ? 'Out of stock' : nextStock <= 5 ? 'Low' : 'Active';

    await logSystemEvent({
      entry: 'INVENTORY_ADJUSTMENT_APPLIED',
      message: 'Applying ' + input.reason + ' adjustment for ' + fishName + ' (stock ' + currentStock + ' → ' + nextStock + ')',
      relatedEntity: input.fishPageId,
      status: 'OK'
    });

    await updatePage(input.fishPageId, {
      Stock: numberProp(nextStock),
      Health: numberProp(nextHealth),
      Status: selectProp(nextStatus)
    });

    const adjustment = await createPageInDatabase(DB.inventoryAdjustments, {
      Name: titleProp('ADJ ' + fishName + ' ' + new Date().toISOString().slice(0, 19)),
      Fish: relationProp([input.fishPageId]),
      Reason: selectProp(input.reason),
      Quantity_Loss: numberProp(quantityLoss),
      Health_Delta: numberProp(healthDelta),
      Note: textProp(input.note ?? ''),
      Status: selectProp('Recorded')
    });

    await logSystemEvent({
      entry: 'INVENTORY_ADJUSTMENT_RECORDED',
      message: 'Recorded adjustment for ' + fishName + ' and updated stock to ' + nextStock,
      relatedEntity: (adjustment as any).id as string,
      status: 'OK'
    });

    return {
      adjustmentId: (adjustment as any).id as string,
      fishPageId: input.fishPageId,
      fishName,
      previousStock: currentStock,
      nextStock,
      previousHealth: currentHealth,
      nextHealth,
      reason: input.reason
    };
  });
}

export async function listAquaDatabase(key: AquaDatabaseKey, pageSize = 10) {
  return queryDatabaseByKey(key, { page_size: pageSize });
}

export async function getFishPageSummary(pageId: string) {
  const page = await getPage(pageId);
  return {
    id: (page as any).id as string,
    name: readTitle(page, 'Name'),
    stock: readNumber(page, 'Stock'),
    health: readNumber(page, 'Health'),
    status: readSelect(page, 'Status')
  };
}
