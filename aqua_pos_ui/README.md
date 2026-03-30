# AQUA_POS UI

Prototype Next.js App Router scaffold for the AQUA_POS system backed by Notion databases.

## What is included
- Dashboard overview for revenue and low stock signals
- Fish CRUD workspace
- POS register screen for orders and order_items
- Inventory / tank health view
- Shared Notion helper for server-side database queries

## Environment variables
- NOTION_API_KEY
- NOTION_VERSION (optional, defaults to 2022-06-28)
- NOTION_FISH_DATABASE_ID
- NOTION_ORDERS_DATABASE_ID
- NOTION_ORDER_ITEMS_DATABASE_ID
- NOTION_TANKS_DATABASE_ID
- NOTION_INVENTORY_DATABASE_ID
- NOTION_LOGS_DATABASE_ID

## Notes
This is a UI/UX prototype scaffold. The components render with mock data and are ready to connect to live Notion queries and CRUD handlers.
