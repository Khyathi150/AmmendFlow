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

## 5. Demonstration Accounts

The database comes pre-seeded with **Northstar Infrastructure Pvt. Ltd.** and accounts for every role:

| Role | Email Address | Password | Permissions & Focus |
| :--- | :--- | :--- | :--- |
| **Director / Owner** | `vikram@northstarinfra.com` | `DemoPass123!` | Full tenant control, internal sign-off, portfolio exposure |
| **Project Manager** | `arjun.pm@northstarinfra.com` | `DemoPass123!` | Technical reviews, work authorization, site coordination |
| **Site Engineer** | `priya.site@northstarinfra.com` | `DemoPass123!` | Change requests, drawing annotations, completion logs |
| **Commercial Manager** | `manoj.comm@northstarinfra.com` | `DemoPass123!` | Multi-tier cost estimation, baseline BOQ, rate evaluation |
| **Finance Officer** | `anita.fin@northstarinfra.com` | `DemoPass123!` | Invoice generation, payment allocation, balance reconciliation |
| **Client Approver** | `client.rep@prestigecommercial.com` | `DemoPass123!` | Client portal, scope review, formal approval/rejection |

---

## 6. Local Quick Start (Zero-Config)

AmendFlow features an automatic embedded MongoDB fallback. You can run it immediately without needing an external database setup!

### 1. Clone & Install
```bash
# In the root repository directory
npm --prefix server install
npm --prefix client install
```

### 2. Seed Realistic Indian Construction Data
```bash
npm run seed
```

### 3. Launch Development Environment
```bash
# Runs backend on :5000 and frontend on :5173 with API proxy
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser and sign in with any demo account!

---

## 7. Running Automated Tests

```bash
# Run all tests (backend governance/security + client unit tests)
npm test

# Run backend tests individually
npm run test:server

# Run client tests individually
npm run test:client
```
Tests cover:
- Exact integer paise mathematics without floating-point rounding.
- Indian numbering currency formatting.
- End-to-end 13-step construction variation & invoicing lifecycle.
- State machine role enforcement and cross-tenant API/Socket.IO isolation.
- Mandatory justification check for unapproved work execution.
- Overpayment prevention on variation invoices.
- Production startup guards (`JWT_SECRET`, `MONGODB_URI`, strict CORS, S3 object storage).

---

## 8. Production Deployment Guide (Separate Frontend & Backend)

AmendFlow strictly disables ephemeral local disk uploads, allow-all CORS, fallback JWT secrets, and in-memory MongoDB fallbacks when `NODE_ENV=production`.

### Required Backend Environment Variables (`server/.env` or Host Secrets)
| Variable | Required | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | Yes | Must be `production`. |
| `PORT` | Yes | Assigned server listening port (default `5000`). Server binds `0.0.0.0:PORT`. |
| `MONGODB_URI` | Yes | Production MongoDB Atlas URI (`mongodb+srv://...`). Never falls back to `MongoMemoryServer`. |
| `JWT_SECRET` | Yes | High-entropy random secret (>= 32 characters). |
| `CLIENT_URL` | Yes | Exact frontend origin (e.g. `https://app.amendflow.com`). Strict CORS + Socket.IO origin match. |
| `STORAGE_PROVIDER` | Yes | Must be `s3` in production (persistent object storage). |
| `S3_BUCKET` | Yes | Bucket name (AWS S3, Cloudflare R2, DigitalOcean Spaces, MinIO, Backblaze B2). |
| `S3_REGION` | Yes | Bucket region (e.g. `ap-south-1` or `auto` for R2). |
| `S3_ACCESS_KEY_ID` | Yes | Object storage access key ID. |
| `S3_SECRET_ACCESS_KEY` | Yes | Object storage secret access key. |
| `S3_ENDPOINT` | Optional | Custom endpoint URL for S3-compatible providers (e.g. Cloudflare R2 / MinIO). |
| `S3_FORCE_PATH_STYLE` | Optional | Set `true` for MinIO or path-style S3 endpoints. |
| `PUBLIC_API_URL` | Optional | Canonical public backend origin if needed behind reverse proxies. |

### Required Frontend Environment Variables (`client/.env.production`)
| Variable | Required | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | Yes (separate host) | Exact backend origin without `/api` suffix (e.g. `https://api.amendflow.com`). |

### Build & Start Commands
```bash
# 1. Build backend and frontend artifacts
npm run build

# 2. Deploy client/dist to static SPA host (Vercel/Netlify/Cloudflare Pages)
# SPA direct-refresh rewrites are preconfigured in client/vercel.json and client/public/_redirects.

# 3. Start backend API (binds 0.0.0.0:$PORT)
npm --prefix server run start
```


