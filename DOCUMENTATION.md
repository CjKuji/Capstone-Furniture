# Furniture3D — Application Documentation

## Overview

**Furniture3D** is a made-to-order furniture platform built for a Philippine-based furniture business. It allows customers to browse a curated catalog of customizable furniture, visualize pieces in 3D and Augmented Reality (AR), place orders with custom specifications, and pay online. Administrators manage the catalog, process orders, handle payments, and communicate with customers through a dedicated admin panel.

---

## Table of Contents

1. [User Roles](#user-roles)
2. [Customer Features](#customer-features)
3. [Admin Features](#admin-features)
4. [Order Workflow](#order-workflow)
5. [Payment Flow](#payment-flow)
6. [Chat System](#chat-system)
7. [3D & AR Visualization](#3d--ar-visualization)
8. [Tech Stack](#tech-stack)
9. [Project Structure](#project-structure)
10. [Environment Variables](#environment-variables)
11. [Running the App](#running-the-app)
12. [Database](#database)

---

## User Roles

| Role | Description |
|---|---|
| `customer` | Default role. Can browse, order, pay, and chat. |
| `admin` | Can manage orders, update status, add charges, and chat with customers. |
| `super_admin` | Full access including furniture catalog management and user oversight. |

Role assignment is handled manually via the Supabase dashboard after a user registers.

---

## Customer Features

### Home Page (`/`)
- Displays all published furniture items as cards
- Hero section introduces the brand
- Links to the full catalog

### Catalog (`/catalog`)
- Browse all available furniture
- Filter by:
  - **Search** (name or description)
  - **Category** (sofa, table, chair, etc.)
  - **Price range** (min / max)

### Furniture Detail (`/furniture/[id]`)
- Full product page with:
  - Photo gallery
  - Dimensions (width, depth, height)
  - Base price
  - **3D model viewer** — rotate, zoom, inspect
  - **Texture/variant selector** — switch materials (e.g., oak, walnut, fabric)
  - **AR viewer** — view the piece in your room via phone camera
  - Place order button

### Placing an Order
1. Customer selects a furniture item and a variant (color/material)
2. Clicks **Place Order**
3. Fills in a form:
   - Delivery method: **Pickup** or **Delivery**
   - Any special notes/requests
4. Order is submitted with status `requested`
5. A frozen snapshot of the furniture and variant details is saved to preserve order integrity

### Orders Page (`/orders`)
- View all personal orders
- See order status, payment status, and charges
- Take actions depending on current status:
  - Pay (if awaiting payment)
  - Accept/reject additional charges
  - Request cancellation
  - View full order details and timeline

### Saved Configurations (`/saved`)
- Customers can save furniture customizations for later reference

### Authentication (`/auth/login`, `/auth/register`)
- Email and password registration/login via Supabase Auth
- Sessions persist across browser refreshes

---

## Admin Features

### Admin Dashboard (`/admin`)
- Overview statistics:
  - Total furniture items
  - Published furniture count
  - Total registered users
  - Saved configurations count

### Furniture Management (`/admin/furniture`)
- Create, edit, publish, archive furniture items
- Manage:
  - **Basic Info** — name, description, category, base price, dimensions
  - **Assets** — upload 3D model (GLB/GLTF), product images (gallery)
  - **Variants** — add texture/color options with price adjustments and preview images
- Publish status: `draft` → `published` → `archived`

### Order Management (`/admin/orders`)
- View all customer orders
- Advance orders through the workflow (see [Order Workflow](#order-workflow))
- Add or remove charges (additional fees or discounts)
- Assign delivery method
- View payment history per order
- Communicate with customers via the order chat

---

## Order Workflow

Orders follow a strict status machine:

```
requested
   ↓  (admin accepts)
accepted
   ↓  (payment initiated)
awaiting_payment
   ↓  (customer pays)
payment_verification
   ↓  (admin confirms)
in_production
   ↓
ready_for_pickup  OR  ready_for_shipment
   ↓
shipped / in_transit
   ↓
completed
```

At any stage, either party can initiate cancellation:

```
cancel_status: none → requested → approved / rejected
```

### Additional Charges
- Admins can propose extra charges (e.g., delivery fee, customization surcharge, or a discount)
- Customer sees the charge and can **accept** or **reject** it
- `charge_status`: `none` → `pending` → `accepted` / `rejected`

### Order Timeline
- Every status change is recorded in an order timeline
- System messages are also sent to the order chat automatically

---

## Payment Flow

The app uses **PayMongo**, a Philippine payment processor.

1. Customer clicks **Pay** on their order
2. A checkout session is created via `/api/payments/create-checkout`
3. Customer is redirected to the PayMongo hosted checkout page
4. Customer completes payment (credit card, GCash, Maya, etc.)
5. PayMongo sends a webhook to `/api/payments/webhooks/paymongo`
6. The webhook updates the payment record and advances the order status

### Payment Types
| Type | Description |
|---|---|
| `full` | Pay the entire order total |
| `partial` | Pay a deposit or installment |

### Payment Statuses
`pending` → `processing` → `paid` / `failed` / `expired` / `cancelled` / `refunded`

---

## Chat System

Each order has a dedicated conversation thread between the customer and an admin.

- **Real-time** — powered by Supabase Realtime subscriptions
- **Message types:**
  - Customer messages
  - Admin messages
  - System messages (automatic, e.g., "Payment received", "Order accepted")
- Unread message counts are tracked per user
- Chat is accessible from both the order detail page (customer) and the admin order panel

---

## 3D & AR Visualization

### 3D Viewer
- Built with **Three.js** and **React Three Fiber**
- Loads GLB/GLTF model files from Supabase Storage
- Supports:
  - Orbit controls (rotate, zoom, pan)
  - Texture swapping when a variant is selected
  - Lighting adjustments

### AR Viewer
- Uses **@google/model-viewer**, **AR.js**, and **A-Frame**
- Allows customers to place the 3D furniture model in their real environment via their phone camera
- Requires a WebXR-compatible mobile browser (Chrome on Android, Safari on iOS 16+)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| State Management | React Query (@tanstack/react-query) |
| Forms | React Hook Form |
| Backend / Database | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Authentication | Supabase Auth (email/password) |
| Payments | PayMongo (hosted checkout) |
| 3D Rendering | Three.js, React Three Fiber, @react-three/drei |
| AR | @google/model-viewer, AR.js, A-Frame, @react-three/xr |
| Icons | Lucide React |
| QR Codes | react-qr-code |

---

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── page.tsx            # Home page
│   ├── catalog/            # Catalog browse page
│   ├── furniture/[id]/     # Furniture detail + 3D viewer
│   ├── orders/             # Customer orders list
│   ├── saved/              # Saved configurations
│   ├── auth/               # Login and register pages
│   ├── admin/              # Admin panel (dashboard, furniture, orders)
│   ├── api/                # Server-side API routes
│   │   ├── payments/       # PayMongo checkout + webhooks
│   │   └── test-paymongo/  # Dev testing endpoint
│   └── components/         # Shared UI components
│
├── hooks/                  # React Query hooks (data fetching & mutations)
├── services/               # Supabase data access layer
│   ├── orders/             # Order CRUD and status transitions
│   ├── payments/           # PayMongo and payment records
│   ├── handlers/           # Image and variant upload handlers
│   └── chat/               # Chat messaging and realtime
├── lib/                    # Supabase client, utilities, channel helpers
├── types/                  # TypeScript types and enums
└── utils/                  # Helper functions (formatting, calculation, etc.)

supabase/                   # Supabase project config and migrations
```

---

## Environment Variables

Create a `.env.local` file in the project root with the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_PROJECT_ID=<project-ref>

# PayMongo
PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_WEBHOOK_SECRET=whsk_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000

# Build for production
npm run build

# Start production server
npm run start

# Regenerate Supabase TypeScript types from live schema
npm run db:sync
```

---

## Database

The database is hosted on **Supabase (PostgreSQL)** with Row-Level Security (RLS) enabled.

### Core Tables

| Table | Purpose |
|---|---|
| `profiles` | User accounts and roles |
| `furniture` | Furniture catalog items |
| `furniture_categories` | Category taxonomy |
| `furniture_images` | Gallery images per furniture item |
| `furniture_variants` | Texture/color variants with price adjustments |
| `furniture_configurations` | Saved customer customizations |
| `orders` | Customer orders with full status tracking |
| `order_items` | Line items with frozen product snapshots |
| `order_charges` | Additional fees or discounts on an order |
| `order_timelines` | Audit trail of order status changes |
| `payments` | Payment records linked to orders |
| `conversations` | Chat threads scoped to an order |
| `messages` | Individual messages within a conversation |
| `inquiries` | Customer inquiry submissions |

### Storage Buckets

| Bucket | Contents |
|---|---|
| `furniture-assets/models/` | GLB/GLTF 3D model files |
| `furniture-assets/gallery/` | Product photo gallery images |
| `furniture-assets/variants/` | Variant texture/material files |
