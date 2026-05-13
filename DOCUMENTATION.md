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
13. [Component Reference](#component-reference)

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
- Placeholder page — intended for saving furniture customizations for later reference
- Feature is not yet fully implemented

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
- **Image attachments** — customers and admins can attach images to messages
- **Message types:**
  - Customer messages
  - Admin messages
  - System messages (automatic, e.g., "Payment received", "Order accepted")
- Unread message counts are tracked per user
- Chat is accessible from both the order detail page (customer) and the admin order panel

### Chat Components

| Component | Purpose |
|---|---|
| `ChatModal` | Full modal wrapper for the chat thread |
| `ChatMessages` | Scrollable message list |
| `ChatMessageBubble` | Individual message bubble (text + images) |
| `ChatMessageImages` | Renders image attachments inside a bubble |
| `ChatImagePreview` | Lightbox-style full-size image preview |
| `ChatInput` | Text input with image upload button and Enter-to-send |

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
| Animation | Framer Motion |
| State Management | React Query (@tanstack/react-query) |
| Forms | React Hook Form |
| Backend / Database | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Authentication | Supabase Auth (email/password) |
| Payments | PayMongo (hosted checkout) |
| 3D Rendering | Three.js, React Three Fiber, @react-three/drei, three-mesh-bvh |
| AR | @google/model-viewer, AR.js, A-Frame, @react-three/xr |
| Icons | Lucide React |
| QR Codes | react-qr-code |
| DB Direct | pg (PostgreSQL client, used for server-side scripts) |

---

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── page.tsx            # Home page
│   ├── catalog/            # Catalog browse page
│   ├── furniture/[id]/     # Furniture detail + 3D viewer
│   ├── orders/             # Customer orders list + CustomerOrderPage
│   ├── saved/              # Saved configurations (placeholder)
│   ├── auth/               # Login and register pages
│   ├── admin/              # Admin panel (dashboard, furniture, orders)
│   ├── api/                # Server-side API routes
│   │   ├── payments/
│   │   │   ├── create-checkout/  # Initiate PayMongo checkout session
│   │   │   ├── status/           # Query checkout session status
│   │   │   └── webhooks/         # PayMongo webhook handler
│   │   └── test-paymongo/        # Dev testing endpoint
│   └── components/         # Shared UI components
│       ├── chat/           # Chat UI components (modal, bubbles, input, image preview)
│       └── sections/       # Reusable form-section panels
│           ├── admin/      # Admin furniture form sections (BasicInfo, Assets, Variants)
│           ├── orders/     # Order form sections
│           └── user/       # User-facing furniture variant/section panels
│
├── hooks/                  # React Query hooks (data fetching & mutations)
│   ├── useAdminOrders.ts
│   ├── useCancelOrder.ts
│   ├── useCancelReview.ts
│   ├── useChargeDecision.ts
│   ├── useChat.ts
│   ├── useConversationList.ts
│   ├── useCreateorder.ts
│   ├── useFetchPayments.ts
│   ├── useFurniture.ts / useFurnitureAdmin.ts / useFurnitureById.ts / useFurnitureAdminById.ts
│   ├── useFurnitureForm.ts / useFurnitureModalController.tsx / useFurnitureViewer.ts
│   ├── useOrderCharges.ts / useOrderFlow.ts / useOrderPayments.ts / useOrderPermissions.ts
│   ├── usePayment.ts
│   ├── useUser.ts
│   └── useUserOrders.ts
│
├── services/               # Supabase data access layer
│   ├── authService.ts
│   ├── dashboardService.ts
│   ├── furniturePublic.ts  # Public (customer-facing) furniture queries
│   ├── furnitureService.ts # Admin furniture CRUD
│   ├── storageService.ts
│   ├── userService.ts
│   ├── orders/
│   │   ├── createOrderService.ts
│   │   ├── fetchOrderService.ts
│   │   ├── orderCancellService.ts
│   │   ├── orderFlowService.ts
│   │   ├── chargesService.ts
│   │   └── chargeDecisionService.ts
│   ├── payments/
│   │   ├── paymentsService.ts   # Payment record CRUD
│   │   ├── paymongoService.ts   # PayMongo API calls
│   │   └── fetchPaymentService.ts
│   ├── chat/
│   │   ├── chatService.ts        # Message CRUD
│   │   └── chatRealTimeService.ts # Supabase Realtime subscription
│   └── handlers/
│       ├── imageHandlers.ts      # Furniture image upload/delete
│       └── variantHandlers.ts    # Variant image upload/delete
│
├── lib/                    # Utilities and Supabase client
│   ├── supabase.ts         # Supabase client instances (browser + server)
│   ├── orderFinancials.ts  # Single source of truth: subtotal, charges, payments, remaining
│   ├── orderCalculator.ts  # Lower-level order price calculations
│   ├── orderUserStatusUI.ts # UI metadata (labels, colors) for each order status
│   ├── OrderActions.ts     # Available admin/customer actions per status
│   ├── chatKeys.ts         # React Query key factories for chat
│   ├── conversationChannel.ts # Supabase Realtime channel factory
│   ├── generateThumbnail.ts   # Renders a 512×512 PNG thumbnail from a GLB model
│   ├── 3D/
│   │   └── nomarlizeFurnitureModel.ts  # Normalizes raw GLB/GLTF model data
│   └── storage/
│       └── uploadFile.ts   # Generic Supabase Storage upload helper
│
├── types/                  # TypeScript types and enums
│   ├── enums.ts            # PublishStatus, OrderStatus, CancelStatus, DeliveryMethod, UserRole, etc.
│   ├── order.ts            # Order, OrderItem, Payment, FurnitureSnapshot, etc.
│   ├── furniture.ts        # Admin-facing furniture types
│   ├── furniture-public.ts # Customer-facing furniture types
│   ├── furniture-ui.ts     # UI-specific furniture state types
│   ├── chat.ts             # Message, Conversation types
│   ├── user.ts             # Profile / UserRole types
│   ├── common.ts           # Shared utility types
│   ├── inquiry.ts          # Customer inquiry types
│   ├── supabase.ts         # Auto-generated Supabase schema types (via db:sync)
│   └── three-example.d.ts  # Three.js example module declarations
│
└── utils/                  # Helper functions
    ├── paymentCalculator.ts  # Payment amount helpers
    ├── normalizeOrderRow.ts  # Normalizes raw Supabase order rows
    ├── furnitureUtils.ts     # Furniture data helpers
    ├── chatDate.ts           # Chat timestamp formatting
    └── ar-debug-bus.ts       # Event bus for AR debug messages

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

---

## Component Reference

### Shared UI Components (`src/app/components/`)

| Component | Purpose |
|---|---|
| `Navbar` | Top navigation bar |
| `PageTransition` | Framer Motion page-level animation wrapper |
| `Reveal` | Scroll-triggered fade-in animation wrapper |
| `CustomerCard` | Furniture card for the home/catalog page |
| `FurnitureAdminModal` | Full create/edit modal for admin furniture management |
| `FurnitureCardAdmin` | Furniture card in the admin list view |
| `VariantManager` | UI to add, edit, and remove furniture variants |
| `PlaceOrderModal` | Customer order placement form (delivery method, notes) |
| `OrderCard` | Summary card for a customer's order |
| `OrderAdminCard` | Summary card for an order in the admin panel |
| `OrderActionBar` | Contextual action buttons based on current order status |
| `OrderFullDetailModal` | Full order detail view (timeline, items, charges, payments) |
| `ViewOrderListModal` | Admin modal listing all orders for a furniture item |
| `PayModal` | Customer payment initiation modal |
| `ChargesModal` | Admin interface to add/remove charges on an order |
| `UserChargesModal` | Customer view of proposed charges (accept/reject) |
| `DeliveryMethodModal` | Admin modal to assign delivery method |
| `CancelOrderModal` | Customer cancellation request form |
| `CancelRequestModal` | Admin interface to approve or reject a cancellation |
| `RequestModal` | Generic request confirmation modal |
| `ARModal` | Augmented Reality viewer modal |
| `Furniture3DViewer` | Three.js / React Three Fiber 3D model viewer |
| `ModelViewerElement` | `<model-viewer>` web component wrapper for AR |
| `AdminSidebar` | Admin panel sidebar navigation |

### Chat Components (`src/app/components/chat/`)

| Component | Purpose |
|---|---|
| `ChatModal` | Full modal wrapper for the chat thread |
| `ChatMessages` | Scrollable message list |
| `ChatMessageBubble` | Individual message bubble (text + images) |
| `ChatMessageImages` | Renders image grid inside a message bubble |
| `ChatImagePreview` | Lightbox full-size image preview overlay |
| `ChatInput` | Message input with image upload and Enter-to-send |

### Form Section Panels (`src/app/components/sections/`)

These are reusable panel components that divide long forms into logical sections.

| Path | Sections |
|---|---|
| `sections/admin/` | `BasicInfoSection`, `AssetsSection`, `VariantsSection` (admin furniture form) |
| `sections/orders/` | `BasicInfoSection`, `AssetsSection`, `VariantsSection` (order context) |
| `sections/user/` | `BasicInfoSection`, `AssetsSection`, `VariantSection` (customer-facing) |
