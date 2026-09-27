# MarketLink backend handoff

This is the implementation contract for the backend teammate. The Vite app currently runs in a browser-local demo mode. Its seed records, orders, and favorites live in localStorage; they are not a deployed database. Review this contract against the final project report and adapt it before submission.

## Run the frontend

From MarketLink, install packages and start Vite:

    npm install
    npm run dev

Use the demo with no environment file. To target a backend, set VITE_API_URL in .env to a base URL such as http://localhost:4000/api and restart Vite. The frontend attaches the value of marketlink_token as a Bearer token. The backend must allow the Vite origin in CORS.

The API adapter is src/api/index.js. It currently falls back to local demo data if the backend is unreachable. A backend HTTP error is surfaced instead of silently writing local data. Public pages and dashboards currently read api.snapshot(), which is the local demo store; replacing those reads with asynchronous API queries is required before claiming a live full-stack deployment.

## Data model

- User: id, name, email, password_hash, role (customer, farmer, admin), phone, address, status.
- Farmer: id, user_id, stall name, owner, bio, approval status, specialties, operating markets and pickup windows.
- Market: id, name, address, day, opening and closing time, latitude, longitude.
- Product: id, farmer_id, name, description, category, price in PKR, unit, available stock, image URL, availability flag, active markets.
- Order: id, customer_id, farmer_id, market_id, status, pickup date and slot, total, created time.
- Order item: order_id, product_id, product name and price snapshot, quantity.
- Review: id, customer_id, product_id, optional farmer_id, rating 1–5, comment, created time.
- Favorite: customer_id plus product_id or farmer_id.
- Notification: recipient, event type, message, read time.

Use integer minor currency units or DECIMAL(10,2) consistently. Never trust a price, total, farmer ID, or stock value sent by the browser.

## HTTP response contract

Return JSON. List endpoints return an array; detail endpoints return a single record. Error responses should contain a stable code and a readable message, for example:

    { error: { code: 'OUT_OF_STOCK', message: 'Only 3 baskets remain.' } }

Use 400 for malformed fields, 401 for missing login, 403 for wrong role or suspended account, 404 for a missing record, and 409 for stock conflicts or duplicate email. Pagination and filtering can be added without changing the record shapes.

| Method and path | Purpose | Roles |
| --- | --- | --- |
| POST /auth/register | Create customer or pending farmer account; return { token, user } | Guest |
| POST /auth/login | Verify credentials; return { token, user } | Guest |
| GET /products, GET /products/:id | Search and read products with farmer, market, category, day and price filters | Public |
| POST /products, PUT /products/:id, DELETE /products/:id | Manage own stock, price, image and availability | Approved farmer |
| GET /markets, GET /markets/:id | Market schedule, coordinates and attending farmers | Public |
| GET /farmers, GET /farmers/:id | Profiles, active stock and pickup windows | Public |
| PATCH /users/:id/favorites | Toggle a product or farmer favorite; body { itemId }; return updated user | Owner customer |
| GET /orders | Return orders scoped to the authenticated user or farmer | Customer, farmer |
| POST /orders/batch | Reserve a basket, split by farmer at one market, return an array of orders | Customer |
| PATCH /orders/:id | Change status; body { status } | Order owner or farmer, by transition |
| POST /reviews | Review a product from a completed order | Customer |
| PATCH /admin/farmers/:id | Approve or suspend a grower | Admin |
| PATCH /admin/users/:id | Activate or suspend an account | Admin |

The frontend has a single-order POST /orders method for compatibility, but checkout uses POST /orders/batch. The request body for batch reservations is:

    {
      customerId: 'u-customer',
      marketId: 'm-1',
      pickupDate: '26 Sep 2026',
      pickupSlot: '10:00–10:30 AM',
      items: [
        { productId: 'p-1', quantity: 2 },
        { productId: 'p-2', quantity: 1 }
      ]
    }

The server must derive customerId from the authenticated token, even if the browser includes it. It must validate that every item and its approved farmer attends the chosen market, that the slot falls within opening hours, and that all requested quantities remain in stock. Create one order for each farmer with the same pickup market/window and return all created orders.

## Reservation transaction

Run the following in one database transaction:

1. Lock all requested product rows.
2. Validate market eligibility, farmer approval, availability, quantity and pickup cutoff.
3. Recalculate each line price and the total from server records.
4. Create farmer-specific orders and order items.
5. Deduct stock exactly once, and commit.

If any line fails, roll back the entire basket and return 409. Use a client-generated idempotency key to guard against retries creating duplicate orders. Do not rely on the frontend's localStorage checks for concurrency or authorization.

Allowed status transitions are placed → accepted or declined or cancelled; accepted → ready or cancelled; ready → completed. Customer cancellation must be rejected after the farmer cutoff or once ready. Declining or cancelling an uncollected order restores its reserved stock exactly once. Completed orders allow verified reviews. Send in-app or email notifications after committed order and ready events.

## Authentication and security

Hash passwords with Argon2id or bcrypt. Never return password hashes. Issue short-lived access tokens and a safe refresh strategy; check role and account status on every protected route. Farmers may mutate only their own listings and orders. Customers may read or cancel only their own orders and manage only their own favorites. Admin routes must be server-enforced. Validate uploaded image type and size, store images separately, and return a URL. Add rate limits to login, registration, and contact endpoints.

The demo credentials in README.md are for local evaluation only. Do not publish them as production credentials. The current demo stores plain passwords in localStorage solely to let judges explore without a backend.

## Acceptance checks for the backend teammate

- Two customers reserving the last unit simultaneously yield one successful order and one 409 conflict.
- A basket containing products with no common market cannot be reserved.
- A valid mixed-farmer basket produces separate orders assigned to the correct growers.
- Cancel and decline restore stock once; a repeated status request does not restore it twice.
- A suspended account, pending farmer, or unrelated customer cannot access protected data.
- Reviews require a completed order containing the reviewed product.
- Market coordinates render as the correct pickup point on OpenStreetMap.
