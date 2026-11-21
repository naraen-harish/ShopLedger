# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node.js/Express POS and Khata ledger app. `server.js` wires the app and serves the browser client from `public/` (`index.html`, `css/`, and `js/`). HTTP handlers live in `routes/`; business logic is in `lib/` (pricing, tax, coupons, inventory, orders, ledger, reports, persistence, and invoices). `config.js` holds shop and application settings. `data/db.json` is the local JSON database. `docs/` contains project documentation and diagrams. There is no test directory or separate build output in this repository.

## Build, Test, and Development Commands

- `npm start` — start the local server on port 3000, or the port set by `PORT`.
- `npm test` — currently a placeholder that exits with an error; no automated test suite is configured.

There is no build or lint command configured. Dependencies must be installed before running the app; do not treat a successful start as a substitute for validating billing behavior.

## Coding Style & Naming Conventions

Follow the existing CommonJS style (`require`, `module.exports`) and use plain JavaScript. Match the current two-space indentation, semicolon usage, and single-quoted strings. Use lowercase filenames such as `routes/orders.js`; route handlers use Express routers, and shared business functions are exported from `lib/`. Keep calculations in the relevant library module rather than duplicating them in route handlers or browser code.

## Testing Guidelines

No test framework, test files, or coverage requirement is present. For changes to pricing, coupons, GST, inventory, Khata, or invoices, add focused automated tests when introducing a test framework, and include representative boundary cases (rounding, coupon limits, stock edges, and credit limits). Until then, describe any manual checks in the change summary; never claim `npm test` passed.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries (for example, `customer khata credit ledger and order cancellation`); no stricter convention is evident. Use a concise imperative summary. Pull requests should explain the user-visible change, list affected modules, describe verification, and include screenshots for UI changes. Call out any change to stored JSON shape or financial calculations.

## Security & Data Handling

Treat `data/db.json` as sensitive: it contains customer and transaction records. Do not commit real customer data, credentials, or production exports. `config.js` currently contains an admin key; use a secure deployment-specific secret rather than adding credentials to source control.
