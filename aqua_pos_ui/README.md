# AQUA_POS UI

Next.js App Router prototype for the AQUA_POS system.

## Signal-first protocol
- SYSTEM_LOGS is the first write path for every mutation.
- All registry/database updates are derived after an event is recorded.
- If a log cannot be written, the state change does not proceed.

## What is included
- Dashboard overview for revenue and low stock signals
- Fish CRUD workspace
- POS register screen for orders and order_items
- Inventory / tank health view
- Notion integration for 10 databases through API routes
- Sales endpoint that logs first, then creates orders, order items, and updates fish stock
- Inventory adjustment endpoint that logs first, then applies stock and health changes
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

## Notes
The prototype expects common Notion property names such as Name, Stock, Health, Status, Quantity, Unit_Price, Line_Total, and Relation fields. If your live databases use different names, update the mappings in lib/aqua-pos.ts.
