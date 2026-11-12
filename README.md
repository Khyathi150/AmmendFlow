# AmendFlow — Construction Change Management & Financial Control SaaS

> **"Every change accounted for. Every cost protected."**

AmendFlow is a premium, enterprise-grade Construction Change Management and Financial Control SaaS application designed for General Contractors, Specialist Subcontractors, Infrastructure Developers, Commercial Managers, and Cost Control Directors.

AmendFlow bridges the critical gap between site execution instructions, engineering drawing revisions, contractual baseline Bill of Quantities (BOQ), commercial approvals, and final client billing.

---

## 1. The Core Commercial Problem

In construction and infrastructure, project scope changes are inevitable: differing geotechnical site conditions, architectural variations, client scope expansions, and engineering adjustments occur daily. However, commercial change management is notoriously fragmented:
- **Revenue Leakage:** Site teams execute verbal or informal change requests without formal cost approval, leading to disputed variations that get rejected or heavily discounted at final contract closure.
- **Disputed Variations & Missing Audit Trails:** Approvals and site instructions are scattered across emails, site registers, and messaging apps, eliminating the evidence needed for claims.
- **Obscured Commercial Exposure:** Project directors lack a real-time, non-overlapping view of total project risk: pending approval claims, unapproved work executed on site, approved unbilled values, and overdue receivables.
- **Delayed Invoicing & Cashflow Strain:** Variations take months to evaluate and invoice, forcing contractors to finance extra work out-of-pocket.

### The Unified AmendFlow Lifecycle
```
REQUEST ➔ SCOPE REVIEW ➔ COST ESTIMATION ➔ APPROVAL ➔ EXECUTION ➔ COMPLETION ➔ INVOICING ➔ PAYMENT
```

Every change order in AmendFlow is systematically linked to:
1. The original contractual project scope and baseline BOQ.
2. The requesting party and originating site instruction.
3. Supporting documents, site photographs, and marked-up engineering drawings.
4. An itemized unit-rate cost estimate with exact integer-paise calculations.
5. Internal commercial governance and formal client-side approvals.
6. Execution and completion records with mandatory justification for any early execution.
7. Associated tax invoices and reconciled incoming payments.

---

## 2. Technology Stack & Architectural Decisions

| Layer | Technologies | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React | High-density enterprise layout, sub-millisecond local interactions, strict type safety. |
| **State & Cache** | TanStack Query v5, Zustand | Decoupled server-state caching with optimistic invalidations; lightweight client state. |
| **Visualizations** | Apache ECharts (`echarts-for-react`) | Responsive vector charts for exposure trajectories and category breakdowns. |
| **Canvas Markup** | Konva / `react-konva` | Vector drawing stage with normalized coordinates ($0.0 \le x, y \le 1.0$) for zoom independence. |
| **Backend API** | Node.js, Express.js, TypeScript | Modular REST API with strict request validation and multi-tenant scoping. |
| **Database** | MongoDB Atlas / Embedded `mongodb-memory-server` | ACID multi-document transactions with compound tenant indexing and zero-config local fallback. |
| **Security & Auth** | JWT in HTTP-Only Cookies, bcrypt (12 rounds), Zod | Protected from XSS token theft, strict RBAC, and payload validation. |

---

## 3. Financial Engine & Minor Units Precision

To guarantee **zero floating-point drift** across high-value infrastructure contracts, AmendFlow handles all monetary amounts on the server in **integer minor units** (paise: ₹1 = 100 paise):

$$\text{Direct Cost} = \sum (\text{Quantity} \times \text{Unit Rate Paise})$$
$$\text{Overhead} = \left\lfloor \text{Direct Cost} \times \frac{\text{Overhead Rate \%}}{100} \right\rfloor$$
$$\text{Pre-Markup Amount} = \text{Direct Cost} + \text{Overhead}$$
$$\text{Profit Markup} = \left\lfloor \text{Pre-Markup Amount} \times \frac{\text{Profit Markup \%}}{100} \right\rfloor$$
$$\text{Tax Base} = \text{Pre-Markup Amount} + \text{Profit Markup}$$
$$\text{Tax (GST)} = \left\lfloor \text{Tax Base} \times \frac{\text{Tax Rate \%}}{100} \right\rfloor$$
$$\text{Total Proposed Amount} = \text{Tax Base} + \text{Tax (GST)}$$

All financial displays format numbers using the standard **Indian Numbering System** with Lakhs (`₹1,50,000.00` or `₹1.50 L`) and Crores (`₹18,50,00,000.00` or `₹18.50 Cr`) with tabular numerals.

---

## 4. Discrete 5-Bucket Financial Exposure Matrix

AmendFlow calculates five **mutually exclusive, non-overlapping** exposure categories to eliminate double counting:

```
Contract Scope = Original Baseline BOQ Total + Approved Variations
```

1. **Pending Approval Value:** Sum of proposed change orders undergoing review (`Submitted`, `Technical Review`, `Commercial Review`, `Internal Approval`, `Client Approval`).
2. **Work Performed Without Documented Approval:** Cumulative commercial value of physical work executing or completed on site before securing formal client sign-off.
3. **Approved Unbilled Value:** Formally approved variations awaiting tax invoice generation.
4. **Invoiced Receivables (Unpaid):** Invoices issued to clients with outstanding balances due.
5. **Realised Cashflow (Paid):** Reconciled payments deposited into contractor accounts.

---

## 5. Controlled Local Demo Seeding (Non-Production Only)

For local development or QA sandboxes, `npm run seed` can populate **Northstar Infrastructure Pvt. Ltd.** with 3 infrastructure projects (`PRJ-NSR-001`, `PRJ-NSR-002`, `PRJ-NSR-003`), BOQ baselines, change orders, annotations, and sample persona accounts across roles (`owner`, `project_manager`, `site_engineer`, `commercial_manager`, `finance_officer`, `client_approver`).

Seed safety safeguards:
- **Disabled in production:** The seed runner exits immediately whenever `NODE_ENV=production`.
- **Explicit opt-in required:** Requires `ALLOW_DEMO_SEED=true` and an explicit `SEED_DEMO_PASSWORD` (>= 8 characters) from your local environment — no shared password is published or hardcoded.
- **No automatic collection deletion:** Existing database records are never deleted automatically, and remote/Atlas databases containing data are strictly protected against scripted clearing.

---

## 6. Local Quick Start

AmendFlow uses local disk uploads (`./uploads`) and an optional embedded MongoDB Memory Server fallback during local development when `MONGODB_URI` is omitted.

### 1. Install Dependencies
```bash
npm --prefix server install
npm --prefix client install
```

### 2. Configure Local Environment (Optional Zero-Config Fallback)
Copy `server/.env.example` to `server/.env` if you want to set a local `MONGODB_URI`, custom `JWT_SECRET`, or explicit demo seeding credentials.

To populate sample data into an empty local dev database:
```bash
# PowerShell example:
$env:ALLOW_DEMO_SEED="true"
$env:SEED_DEMO_PASSWORD="choose-a-local-dev-password"
npm run seed
```

### 3. Launch Development Environment
```bash
# Runs Express + Socket.IO backend on 0.0.0.0:5000 and Vite frontend on :5173
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser and register a new organization or sign in with your locally seeded accounts.

---

## 7. Running Automated Tests & Production Builds

```bash
# Run production TypeScript/Vite builds for server and client
npm run build

# Run all automated tests (backend API/security/storage/seed + client unit tests)
npm test

# Run individually
npm run test:server
npm run test:client
```
Tests cover:
- Exact integer paise mathematics without floating-point rounding.
- Indian numbering currency formatting.
- End-to-end 13-step construction variation & invoicing lifecycle.
- State machine role enforcement and cross-tenant API/Socket.IO isolation.
- Mandatory justification check for unapproved work execution & invoice overpayment prevention.
- Production startup guards (`JWT_SECRET`, `MONGODB_URI`, strict `CLIENT_URL` CORS, Socket.IO auth & room membership, Cloudinary persistent storage, and seed-script safety guards).

---

## 8. Public Deployment Guide (Vercel + Render Free + MongoDB Atlas + Cloudinary)

In production (`NODE_ENV=production`), AmendFlow fails startup unless all security and persistence controls are properly configured: hardcoded JWT secrets, ephemeral local disk uploads, allow-all CORS, and in-memory MongoDB fallbacks are all strictly disabled.

### 1. Backend Environment Variables (Render Web Service — Root Directory: `server`)
| Variable | Required | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | Yes | Must be `production`. |
| `PORT` | Auto / Yes | Assigned listening port on Render (server binds `0.0.0.0:$PORT`). |
| `HOST` | Optional | Defaults to `0.0.0.0`. |
| `MONGODB_URI` | Yes | MongoDB Atlas URI (`mongodb+srv://...`). Fails startup if unreachable. |
| `JWT_SECRET` | Yes | Random high-entropy secret (>= 32 characters). |
| `JWT_EXPIRES_IN` | Optional | Token TTL (default `7d`). |
| `CLIENT_URL` | Yes | Exact deployed Vercel frontend URL (e.g. `https://amendflow.vercel.app`). Enforced for HTTP CORS & Socket.IO. |
| `PUBLIC_API_URL` | Recommended | Canonical Render backend URL (e.g. `https://amendflow-api.onrender.com`) for resolved download links behind proxy. |
| `STORAGE_PROVIDER` | Yes | Must be `cloudinary` in production (`local` is blocked). |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name (backend-only). |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key (backend-only). |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret (backend-only). |
| `CLOUDINARY_FOLDER` | Optional | Base Cloudinary folder prefix (default `amendflow`). |

> Never put `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `JWT_SECRET`, or `MONGODB_URI` into any `VITE_*` frontend variable.

**Render Service Settings:**
- **Root Directory:** `server`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`

### 2. Frontend Environment Variables (Vercel — Root Directory: `client`)
| Variable | Required | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | Yes | Exact deployed Render backend origin without `/api` suffix (e.g. `https://amendflow-api.onrender.com`). |

**Vercel Project Settings:**
- **Root Directory:** `client`
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **SPA Routing:** Configured in `client/vercel.json` so direct page refreshes resolve cleanly to `/index.html`.


