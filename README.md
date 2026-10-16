# ManaRural Storefront

ManaRural is a web application prototype for a neighborhood grocery (kirana) store. It brings a local product catalog, a customer-facing storefront, digital-service enquiry forms, and a browser-based business administration panel together in one React application.

The project is intended to serve two purposes:

1. Provide a convenient online storefront for a local shop whose customers can also visit or contact the physical business.
2. Act as the starting point for a configurable product that can be adapted for other small retailers and service businesses.

### Application workflows

**Customer storefront**

- Customers browse or search grocery categories such as staples, spices, snacks, drinks, dairy, personal care, and home essentials.
- Product cards show sample pack variants, prices, and ratings. Category shelf items show an indicative price and unit, with an Add action.
- Customers build a basket and review items, quantities, and estimated totals.
- Local grocery checkout collects delivery details and displays an order summary. The current preview accepts delivery only for PIN code `531036` and requires at least ₹500 of priced groceries to proceed to checkout.
- The checkout displays a WhatsApp order-message preview. Payment is not connected, so the payment action is deliberately disabled and no paid order is submitted.
- Digital services include mobile recharge, DTH/cable, electricity bills, document services, travel bookings, OTT subscriptions, and gift cards. Their forms prepare a request for WhatsApp; they do not process payments automatically.
- Xerox and printing supports file selection, copy and print options, a basket entry, and a WhatsApp quote request. Selected files remain in the browser and must be attached manually in WhatsApp.

**Business administration**

- The `/admin` page provides browser-local management for products, categories, brands, locations, reviews, stores, users, and orders.
- The panel includes sales/report views and CSV order export for Excel.
- These records are stored in the current browser rather than a shared server database. The admin page has no authentication.

**Multi-business direction**

Business identity, catalog, delivery rules, staff access, and customer/order data should become tenant-specific configuration and backend data before offering the application to multiple businesses. The current source is a prototype, not yet a production-ready multi-tenant commerce service.

The current project is a static frontend; it does not yet include a .NET API, database, real payment processing, or authenticated admin access.

## Current features

- Grocery categories, sample products, pack variants, indicative prices, ratings, and basket.
- Category shelf lists with sample prices and pack units.
- Digital-service enquiry forms that prepare WhatsApp messages.
- Xerox and printing quote requests.
- Admin interface at `/admin` for local product, category, brand, location, review, store, user, and order management.
- Local kirana-store image at `public/images/kirana-store.jpg`.

Product prices, ratings, brands, stock, and availability are examples. Confirm them against the business's actual catalog before publishing.

## Technology currently in this repository

- React 18
- Vite 6
- JavaScript / JSX
- CSS
- Browser `localStorage` for admin lists and the current order register
- WhatsApp click-to-chat links (`wa.me`)

The repository currently does **not** include ASP.NET Core, SQL Server, a payment provider, or AWS deployment configuration.

## Prerequisites

- Node.js 20 LTS or a newer supported LTS release
- npm (installed with Node.js)
- Git, if cloning from a Git repository

Check the installed versions:

```powershell
node --version
npm --version
```

## Install and run locally

Run these commands from the project root (the folder containing `package.json`):

```powershell
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173/`.

The admin interface is available at:

```text
http://localhost:5173/admin
```

To create and test the production bundle:

```powershell
npm run build
npm run preview
```

`npm run build` writes the deployable static files to `dist/`. The package currently does not define a test or lint script.

## Source layout

```text
src/
  main.jsx                 Selects the storefront or /admin page
  landing/
    App.jsx                Storefront, basket, service requests, checkout preview
    styles.css             Storefront styles
  admin/
    AdminPanel.jsx         Browser-local admin UI
    admin.css              Admin styles
    ReviewPages.jsx        Review UI module
    reviews.css            Review styles
  shared/
    catalog.js             Sample catalog, categories, brands, prices, contact number
    adminStorage.js        Browser localStorage helpers
public/
  images/
    kirana-store.jpg
    manarural-logo.png
index.html
package.json
package-lock.json
```

## Business-specific configuration today

The current app is a ManaRural-specific prototype. Before reusing it for a different business, check these settings and sample values:

- **WhatsApp / phone:** `whatsappNumber` in `src/shared/catalog.js`. The visible formatted phone text is also in `src/landing/App.jsx`.
- **Delivery PIN and minimum basket:** currently `531036` and ₹500 in `src/landing/App.jsx`.
- **Brand name, logo, and page metadata:** `src/landing/App.jsx`, `index.html`, and `public/images/`.
- **Products, variants, categories, brands, and sample prices:** `src/shared/catalog.js`.
- **Product/category administration:** `src/admin/AdminPanel.jsx`.
- **Visual theme and layout:** `src/landing/styles.css` and `src/admin/admin.css`.

The delivery PIN, basket minimum, tenant branding, and business contact should be moved into an explicit business-settings model before offering this as a reusable multi-business product.

## Current behavior and important limitations

### Data and administration

The admin panel saves records in the current browser's `localStorage`. This is useful for a prototype but means:

- Data is not shared with another browser, device, or store.
- Clearing browser data can erase saved records.
- It is not a central database or a backup.
- `/admin` has no login or authorization and must not be exposed as a production admin.
- The order export is a CSV file that Excel can open; orders are not stored in a server database.

### Checkout and payments

The grocery basket currently validates delivery PIN `531036` and a ₹500 minimum, then shows a checkout form and order summary. Online payment is **not implemented**; the payment action is deliberately disabled. The frontend cannot safely verify payment or mark an order paid.

Digital-service forms and print-quote requests prepare WhatsApp messages. A WhatsApp message being opened is not proof of delivery, payment, or a confirmed order. Product orders must only be confirmed after a backend records the order and verifies payment.

### Messaging and customer data

The current `wa.me` links open a WhatsApp conversation from the customer's device. They do not send automatic server-side notifications. Do not put provider API tokens or payment secrets in React code, browser storage, or a built frontend bundle.

## Recommended production architecture

For a platform that can be customized and sold to multiple businesses, start with a **multi-tenant modular monolith**, not microservices. Keep clear server-side modules and boundaries, and split services later only when a real scaling or team need justifies it.

```text
Customer React storefront ─┐
                           ├─ HTTPS REST API ─ ASP.NET Core API ─ SQL Server
Business React admin ──────┘                        │
                                                    ├─ Payment provider
                                                    ├─ WhatsApp Business Platform
                                                    ├─ India DLT-capable SMS provider
                                                    ├─ S3 product images / uploads
                                                    └─ SQS notification jobs
```

Suggested responsibilities:

- **React:** public storefront and admin UI. Use one API client layer; do not embed provider credentials.
- **ASP.NET Core Web API:** authentication, authorization, validation, pricing, stock checks, order creation, tenant isolation, and provider integrations.
- **SQL Server:** authoritative business, catalog, inventory, order, payment-reference, consent, and audit data.
- **Payment provider:** create payment sessions on the server and verify signed callbacks/webhooks on the server. Never trust a success flag sent only by the browser.
- **WhatsApp Business Platform Cloud API:** approved templates and server-side order/service notifications. Track delivery through verified webhooks.
- **SMS provider:** choose one that supports the applicable Indian TRAI DLT registration and sender/template requirements.
- **AWS S3:** product images and uploads. Keep private customer documents private; use short-lived presigned URLs where appropriate.
- **Amazon SQS:** queue message delivery and retries; configure a dead-letter queue.
- **AWS Secrets Manager / IAM:** store and limit access to provider credentials.
- **CloudWatch:** application logs, alarms, and operational metrics.
- **GitHub Actions:** build/test/deploy from GitHub using short-lived AWS OIDC roles where supported.

### Tenant isolation

Resolve the business from a trusted hostname/domain or authenticated context. Add a `TenantId` to every tenant-owned record and enforce tenant filters in the API and database access layer. Never treat a `TenantId` supplied by the browser as proof of authorization. Each business should connect its own messaging account and payment-provider configuration. Store only references to credentials in ordinary application data; keep secrets in a secrets manager.

Likely starting data areas:

- Tenants, domains, settings, stores, locations
- Users, roles, tenant memberships
- Categories, brands, products, variants, prices
- Store/location inventory and stock movements
- Customers, consent and channel preferences
- Orders, order items, payments and payment-provider references
- Service requests, message outbox, delivery attempts and audit events

### Payment, order, and notification flow

1. React submits an order request to the API.
2. The API validates the tenant, customer, delivery area, current prices, stock, and ₹500 minimum; it then creates a pending order in SQL Server.
3. The API creates a payment session with the payment provider and returns only the client-safe payment details.
4. The provider sends a signed payment callback/webhook to the API.
5. The API verifies the signature and amount, updates payment/order state idempotently, and records a notification in an outbox.
6. A background worker sends the approved WhatsApp/SMS notifications; provider callbacks update delivery status.

The notification text should be rendered from server-side order data, not accepted as authoritative totals from the browser. Include order reference, customer contact, delivery PIN/address as appropriate, selected product names, variants, quantities, unit prices, line totals, delivery charge, payment status/reference, and final total. Avoid sending sensitive payment credentials or unnecessary personal data in messages.

### AWS starting point

For a SQL Server-backed first production version, consider:

- React static build in **Amazon S3 + CloudFront**
- ASP.NET Core API and background worker in **Docker on ECS Fargate**
- **Amazon RDS for SQL Server**
- **Amazon SQS** and a dead-letter queue for notification work
- **S3** for product images and private uploaded files
- **Secrets Manager**, **IAM**, and **CloudWatch**
- **Route 53** and managed TLS certificates for custom business domains

ECS Fargate is managed container hosting, not Lambda-style serverless. SQL Server on RDS is provisioned capacity. Lambda/API Gateway can be considered for particular event-driven workloads, but select hosting based on measured traffic, database connection behavior, and operational requirements.

## Backend version guidance

If creating the backend now, prefer **.NET 10 LTS** over starting a new service on .NET 8. Microsoft's support policy lists .NET 8 support ending **November 10, 2026**. Keep the target framework and deployed runtime on a currently supported, patched release.

## Suggested implementation sequence

1. Move business name, logo, contact, delivery PIN, order minimum, and enabled features into a business configuration model.
2. Create the ASP.NET Core API and SQL Server schema for tenants, catalog, variants, inventory, customers, and orders.
3. Add authentication, roles, and tenant isolation before using admin data with real customers.
4. Replace `localStorage` as the source of truth with API-backed repository/client modules.
5. Implement inventory-aware order creation and payment-provider verification.
6. Add the WhatsApp Cloud API and a TRAI/DLT-capable SMS provider through server-side adapters, customer consent, templates, queues, and delivery webhooks.
7. Deploy dev/staging/production environments with GitHub Actions, database migrations, backups, monitoring, and restore tests.
8. Add offline POS synchronization only if stores must continue taking orders during internet outages; it requires conflict handling and a local queue.

## Skill set mapping

- **C# / ASP.NET Core / REST APIs:** API, authorization, validation, integration adapters, and hosted background workers.
- **SQL Server:** schema design, constraints, tenant-aware indexes, migrations, transactions, and reports.
- **React:** storefront and admin UI.
- **jQuery:** not required in the React app; React and `fetch`/an API client handle the UI and HTTP requests. AJAX is the general pattern of making requests without a full page reload.
- **Docker:** local API/database development and packaging services for AWS.
- **GitHub:** version control, code reviews, CI, and deployment workflows.
- **AWS:** hosting, database, object storage, messaging queues, secrets, IAM, monitoring, DNS, and delivery.
- **Microservices:** a later option; first establish clear module boundaries in the modular monolith.

## Production launch checklist

- Replace sample product prices, ratings, brands, and product data with verified business data.
- Configure and verify each business's domain, branding, contact details, and delivery rules.
- Build authentication and tenant isolation; do not expose the current unauthenticated admin panel.
- Add backend validation, SQL persistence, payment verification, and order-state transitions.
- Set up WhatsApp/SMS provider accounts, templates, consent/opt-out handling, and India-specific SMS registrations.
- Add rate limiting, input validation, webhook signature checks, idempotency, backups, monitoring, and error reporting.
- Publish privacy, returns/refund, delivery, and terms policies appropriate for the business.
- Test restore, payment-failure, duplicate-webhook, notification-retry, and tenant-isolation scenarios.
