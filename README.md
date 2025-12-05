# Multi-Tenant Shopify Data Ingestion & Insights Service

A robust, multi-tenant backend service designed to ingest Shopify data (Orders, Products) via webhooks, ensuring strict data isolation, idempotency, and ACID compliance. Includes a modern Next.js dashboard for analytics.

##  Features

- **Strict Multi-Tenancy**: Logical isolation using `tenant_id` on every table. Middleware enforces tenant context.
- **Event-Driven Ingestion**: Handles `orders/create`, `orders/updated`, `products/update` webhooks.
- **Idempotency**: Prevents duplicate data processing using unique constraints (`shopify_id` + `tenant_id`) and `upsert` logic.
- **ACID Compliance**: Updates `Orders` and recalculates `Customer` total spend within a single database transaction.
- **Analytics Dashboard**: Visualizes Revenue, Active Customers, and Sales Trends with Date Filtering.
- **Authentication**: Simple Email-based login for Tenant Owners.

## 🏗 Architecture

```mermaid
graph TD
    Shopify[Shopify Webhooks] -->|HMAC Signed| API[Express Backend]
    User[User Browser] -->|Next.js Dashboard| API
    
    subgraph "Backend Service"
        API -->|Verify HMAC| Auth[Auth/Tenant Middleware]
        Auth -->|Resolve Tenant| Controller[Webhook Controller]
        Controller -->|ACID Tx| Service[Ingestion Service]
        Service -->|Upsert| DB[(PostgreSQL)]
    end
    
    subgraph "Database Schema"
        DB --> Tenant
        DB --> Product
        DB --> Customer
        DB --> Order
    end
```

##Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Frontend**: Next.js 15, TailwindCSS, Recharts
- **Tools**: Lucide React (Icons), Axios

##  Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### 1. Database Setup
Ensure PostgreSQL is running. Update `backend/.env` with your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shopify_ingestion_db?schema=public"
SHOPIFY_API_SECRET="your_secret"
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push  # Push schema to DB
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Seed Data (Optional)
You can manually insert a tenant into the database to log in:
```sql
INSERT INTO tenants (id, name, shop_domain, owner_email, updated_at) 
VALUES (gen_random_uuid(), 'Demo Store', 'demo.myshopify.com', 'demo@xeno.com', NOW());
```
Then login with `demo@xeno.com`.

##  API Documentation

### Webhooks
- `POST /webhooks/shopify`
  - Headers: `x-shopify-topic`, `x-shopify-shop-domain`, `x-shopify-hmac-sha256`
  - Body: Shopify JSON Payload

### Dashboard
- `GET /api/dashboard/stats`
  - Headers: `x-tenant-id`
  - Query: `startDate`, `endDate` (YYYY-MM-DD)

### Auth
- `POST /api/auth/login`
  - Body: `{ "email": "owner@example.com" }`

## 🧪 Testing

### Option 1: Simulated Testing (Local)
We have included a script to simulate Shopify webhooks without needing a real store.
```bash
cd backend
npx ts-node test-webhook.ts
```
This will:
1.  Generate a dummy Order payload.
2.  Sign it with your `SHOPIFY_API_SECRET` (HMAC).
3.  Send it to your local API.
4.  You should see the data appear in the Dashboard immediately.

### Option 2: Real-Time Testing (with ngrok)
To test with a real Shopify store:
1.  Install ngrok: `brew install ngrok/ngrok/ngrok`
2.  Start tunnel: `ngrok http 3003`
3.  Copy the HTTPS URL (e.g., `https://xyz.ngrok-free.app`).
4.  Go to **Shopify Admin > Settings > Notifications > Webhooks**.
5.  Create a webhook for `Order creation` pointing to `https://xyz.ngrok-free.app/webhooks/shopify`.
6.  **Important**: Update `SHOPIFY_API_SECRET` in `backend/.env` with the signing secret from the Shopify Webhooks page.
7.  Create a test order in Shopify and watch it appear in your Xeno Dashboard!

## Assumptions & Trade-offs
1.  **Auth**: Implemented a simple "Email -> Tenant" lookup for the assignment. In production, we'd use OAuth (Shopify OAuth or Auth0).
2.  **Queue**: Webhooks are processed asynchronously using **Redis (BullMQ)** to handle bursts and retries.
3.  **Aggregations**: "Total Spend" is aggregated via SQL. For massive scale, we might use materialized views or incremental counters.

## Next Steps
1.  **Testing**: Add Jest unit tests for Ingestion Logic.
2.  **Monitoring**: Add Prometheus/Grafana for queue metrics.
