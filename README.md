# MarketLink

MarketLink helps shoppers see weekly stock from nearby farmers, reserve produce, and collect it at a market. Payment happens in person. The project includes customer, farmer, and admin demo flows plus a pointer-responsive 3D harvest scene.

## Install and run

Requirements: Node.js 20.19+ or 22.12+ and npm.

    npm install
    npm run dev

Open the local URL printed by Vite. To verify a release:

    npm run lint
    npm run build

The app works without a backend. It creates sample markets, growers, products, orders, and reviews in this browser's localStorage on first launch.

## Demo access

| Role | Email | Password |
| --- | --- | --- |
| Customer | customer@marketlink.demo | demo123 |
| Farmer | farmer@marketlink.demo | demo123 |
| Admin | admin@marketlink.demo | demo123 |

The login page has one-click buttons for each role. These accounts and passwords exist only in the local demo. Do not reuse them in a deployed service.

## Suggested walkthrough

1. Browse the home hero, product filters, farmer profiles, and market maps.
2. Save a product as a signed-in customer, add produce from two farmers, and choose a market that serves every item in the basket.
3. Place a reservation. The customer dashboard shows a separate pickup slip for each farmer.
4. Sign in as the farmer to accept a new order, mark it ready, and update live stock.
5. Sign in as the admin to approve a pending grower and inspect platform activity.

Product images are bundled in src/assets. Market coordinates and direction links use OpenStreetMap; map tiles need an internet connection. The 3D scene loads only on the home page. The assistant currently answers a small set of market and pickup questions from local demo data; it is not connected to a hosted language model.

## Project structure

- src/api/index.js: REST adapter and local demo data operations
- src/api/mockData.js: sample records
- src/context: authentication and basket state
- src/components/shared/ProduceScene.jsx: 3D harvest scene
- src/pages: public, customer, farmer, and admin views
- src/styles/globals.css: design system, responsive layout, and motion
- BACKEND_GUIDE.md: backend contract and transaction rules
- .env.example: optional backend URL

To start integrating a server, copy .env.example to .env and set VITE_API_URL. The current pages still read the browser-local snapshot for display. The backend teammate must replace those reads with asynchronous queries and implement the endpoints in BACKEND_GUIDE.md before this is a live full-stack product.

## Evaluation and attribution

This UI adapts visual ideas and the produce still-life technique from the supplied bloomscape-creative project. OpenAI Codex assisted with implementation and debugging. The team should review, understand, and modify this code and write the final competition report in its own words. This README is setup guidance, not the final project report.
"# Marketlink" 
