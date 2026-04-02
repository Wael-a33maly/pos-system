---
Task ID: 1
Agent: Main Agent
Task: Restore POS System v1.4.2 from GitHub

Work Log:
- Checked GitHub repo Wael-a33maly/pos-system and found tag v1.4.2 exists (but not published as release)
- Cloned the repo at tag v1.4.2 using the provided GitHub token
- Explored the project structure - comprehensive POS system with 20+ modules
- Removed existing project files to prepare for v1.4.2 restoration
- Copied all source files: modules, components, API routes, hooks, types, constants, store, middleware, services
- Copied UI component files (command-palette.tsx, visually-hidden.tsx)
- Copied lib files: payments, printer, print, notifications, cache, export, auth, currency, reports, db, utils, offline-db
- Copied prisma schema, seed files, and report-schemas
- Copied public assets: icons, manifest.json, sw.js, uploads
- Updated package.json with missing dependencies (jspdf, jspdf-autotable, socket.io, socket.io-client, xlsx)
- Updated recharts to v3.7.0
- Updated next.config.ts with v1.4.2 optimizations (optimizePackageImports, image settings, cache headers)
- Installed all dependencies via bun install
- Pushed Prisma schema to SQLite database
- Seeded database with initial data (admin user, branch, payment methods, currency, categories, brands, products, customers, suppliers, settings, print templates, barcode settings, chart of accounts)
- Verified dev server runs correctly (GET / returns 200)

Stage Summary:
- POS System v1.4.2 fully restored and running
- Database initialized with sample data
- Admin credentials: admin@pos.com / admin123
- App accessible at http://localhost:3000
- All modules restored: auth, dashboard, pos, products, customers, invoices, expenses, accounts, shifts, reports, settings, printing, transfers, loyalty, offers, inventory, purchases, payment gateways
