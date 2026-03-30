# AQUA_POS UI

Next.js App Router prototype for the AQUA_POS system.

## What is included
- Dashboard overview for revenue and low stock signals
- Fish CRUD workspace
- POS register screen for orders and order_items
- Inventory / tank health view
- Notion integration for 10 databases through API routes
- Sales endpoint that creates orders, order items, and updates fish stock
- Inventory adjustment endpoint for death loss and health changes
- Vercel deployment config

## Notion databases
Configure these environment variables:
- NOTION_FISH_DATABASE_ID
- NOTION_ORDERS_DATABASE_ID
- NOTION_ORDER_ITEMS_DATABASE_ID
- NOTION_INVENTORY_DATABASE_ID
- NOTION_TANKS_DATABASE_ID
- NOTION_CUSTOMERS_DATABASE_ID
- NOTION_SUPPLIERS_DATABASE_ID
- NOTION_PURCHASES_DATABASE_ID
- NOTION_INVENTORY_ADJUSTMENTS_DATABASE_ID
- NOTION_SYSTEM_LOGS_DATABASE_ID

## API routes
- GET /api/health
- GET/POST /api/notion/[database]
- PATCH/DELETE /api/notion/[database]
- POST /api/sales
- POST /api/adjustments

## Sales payload example
{
  "customerName": "Walk-in",
  "paymentMethod": "cash",
  "items": [
    {
      "fishPageId": "notion-page-id",
      "quantity": 2,
      "unitPrice": 350000,
      "fishName": "Koi Platinum"
    }
  ]
}

## Inventory adjustment payload example
{
  "fishPageId": "notion-page-id",
  "quantityLoss": 1,
  "healthDelta": -8,
  "reason": "death",
  "note": "Dead on arrival"
}

## Notes
The prototype expects common Notion property names such as Name, Stock, Health, Status, Quantity, Unit_Price, Line_Total, and Relation fields. If your live databases use different names, update the mappings in lib/aqua-pos.ts.
