# High-End Furniture Marketplace with Secure Escrow

A production-grade backend for a high-end furniture marketplace that enforces secure escrow, hub-based logistics, and automated payouts. Designed for reliability, auditability, and operational safety with professional-grade documentation and monitoring.

## Tech Stack
- Node.js, Express
- MongoDB with Mongoose
- Chapa Payment Gateway (Initialize + Transfer API)
- Swagger/OpenAPI
- JWT Authentication + RBAC
- node-cron background jobs

## Key Features
- **Secure Escrow System**: Direct transfers from merchant to seller are triggered only after physical verification codes are confirmed.
- **Hub-Based Logistics**: Multi-point delivery tracking (Seller → Hub → Buyer) with hub assignment validation.
- **Automated Payouts**: Chapa Transfer API initiates real-time seller payouts after final delivery confirmation.
- **Security**: JWT auth, RBAC for admin/hub manager/user, and webhook signature verification.
- **Background Tasks**: Cron jobs monitor stagnant orders and protect escrow flow.
- **API Documentation**: Swagger UI available at `/api-docs`.

## Architecture & Chain of Custody
This backend enforces a strict chain of custody for **inventory** and **funds**:

- **Inventory custody** moves from **Seller → Hub → Buyer**.
- **Funds custody** remains in escrow until the **Buyer’s verification code** confirms pickup, then triggers a **direct transfer** to the seller.

This dual-chain approach creates an auditable trail that protects buyers, sellers, and the marketplace operator.

## Business Logic Flow
1. **Checkout**: Buyer places an order and selects a pickup hub.
2. **Payment Initialization**: Chapa payment is created for the order.
3. **Webhook Verification**: Payment webhook is verified via HMAC signature to mark order as paid.
4. **Shipment & Hub Arrival**: Order status progresses to “Shipped” and then “Arrived at Hub”.
5. **Final Pickup**: Buyer confirms pickup with verification code.
6. **Escrow Release**: System initiates seller payout via Chapa Transfer API.
7. **Completion**: Order is marked “Completed” and seller is notified.
8. **Background Monitoring**: Cron jobs alert admins and hub managers about stalled orders.

## Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm run dev
   ```

## Environment Variables
Create a `.env` file in the project root and configure the following:

```dotenv
PORT=5001
MONGO_URI=your_mongodb_connection_string
ADMIN_NAME=your_admin_name
ADMIN_EMAIL=admin@furniture.com
ADMIN_PASSWORD=your_admin_password

JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

CHAPA_SECRET_KEY=your_chapa_public_key
CHAPA_WEBHOOK_SECRET=your_chapa_webhook_secret
CHAPA_TEST_SECRET_KEY=your_chapa_test_secret_key
CHAPA_CALLBACK_URL=your_callback_url
```

## Background Tasks
- **Order Cleanup**: Daily job to flag long-stagnant hub arrivals.
- **Escrow Watchdog**: Runs every 6 hours to identify orders stuck at hubs for 48+ hours and notify hub managers and admins.

## API Documentation
Swagger UI is available at:
- `http://localhost:5001/api-docs`

---

