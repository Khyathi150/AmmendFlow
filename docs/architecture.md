# AmendFlow — System Architecture Document

## 1. System Overview & Architecture Principles

AmendFlow is architected as a modern, decoupled, multi-tenant enterprise application designed for high financial precision, auditable state management, and clear separation of concerns.

### Core Architectural Tenets
1. **Financial Exactness:** All currency arithmetic is performed exclusively on the server in **integer minor units** (paise: ₹1 = 100 paise) using strict integer math or exact decimal utilities. No JavaScript floating-point arithmetic is permitted in financial pipelines.
2. **Strict Multi-Tenancy:** All queries, mutations, indexes, and cache keys are scoped to `organizationId`. A tenant context middleware resolves and guarantees that cross-organization leakage is structurally impossible.
3. **Decoupled Layers:**
   - **Presentation Layer (`client/src/components`, `features`):** Pure rendering, user interactions, local form validation.
   - **API & Protocol Layer (`server/src/controllers`, `routes`):** Transport serialization, HTTP status mapping, request validation.
   - **Domain & Service Layer (`server/src/services`):** Pure business logic, state machine validation, financial calculations, audit emission.
   - **Persistence Layer (`server/src/models`):** Mongoose schemas, compound indexes, constraints, transactions.
4. **Resilient Data Storage:** Seamless operational mode with built-in Mongo memory server for instant zero-dependency local startup and testing, alongside seamless connection to MongoDB Atlas.

---

## 2. High-Level C4 Container Architecture

```
+-----------------------------------------------------------------------------------+
|                                  USER BROWSER                                     |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                 React 18 + TypeScript SPA (Vite Bundler)                    |  |
|  |                                                                             |  |
|  |  +-------------------------+  +-----------------------+  +---------------+  |  |
|  |  | TanStack Query (Server) |  | Zustand (Client State)|  | React Router  |  |  |
|  |  +-------------------------+  +-----------------------+  +---------------+  |  |
|  |  +-------------------------+  +-----------------------+  +---------------+  |  |
|  |  | Apache ECharts / Konva  |  | React Hook Form + Zod |  | Tailwind / UI |  |  |
|  |  +-------------------------+  +-----------------------+  +---------------+  |  |
|  +-----------------------------------------------------------------------------+  |
+---------------------------------------+-------------------------------------------+
                                        | HTTP/HTTPS (REST) + WebSocket (Socket.IO)
                                        | Secured by HTTP-Only JWT Cookies
                                        v
+-----------------------------------------------------------------------------------+
|                             BACKEND API CONTAINER                                 |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                   Node.js + Express + TypeScript Application                |  |
|  |                                                                             |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | Security Middleware (Helmet, CORS, RateLimiter, CookieParser, CSRF)   |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | Auth & Tenancy Context Middleware (JWT verify, Org/Project RBAC)      |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | Zod Request Validation Middleware                                      |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | Express Controllers (REST Endpoints)                                  |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | Domain Services:                                                      |  |  |
|  |  |  - FinancialCalculationEngine (paise math, markups, exposure buckets)  |  |  |
|  |  |  - ApprovalStateMachine (guarded transitions, role gates)             |  |  |
|  |  |  - BOQRevisionService (baseline vs variations reconciliation)         |  |  |
|  |  |  - InvoiceReconciliationService (overpayment guards)                  |  |  |
|  |  |  - AuditLogService (append-only ledger)                                |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | Persistence Layer: Mongoose Models & Transactions                     |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | Storage Driver (Local Disk / S3 / Cloudinary Storage Abstraction)     |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
+---------------------------------------+-------------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
+----------------------------------+          +----------------------------------+
|         DATABASE LAYER           |          |         STORAGE ENGINE           |
|                                  |          |                                  |
| MongoDB Atlas (or Memory Server) |          | Local Uploads / Cloud Object     |
| - Strictly Indexed Collections   |          | Storage (Drawings, Evidence,     |
| - ACID Multi-Doc Transactions    |          | Invoices, Baseline Schedules)    |
+----------------------------------+          +----------------------------------+
```

---

## 3. Directory Layout & Organization

The codebase is organized into a clean mono-repository with distinct `client` and `server` trees:

```
amendflow/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/               # Button, Input, Modal, Badge, Dropdown, Table, Card, Tabs, Select
│   │   │   ├── layout/           # AppShell, Sidebar, Header, Breadcrumbs, PageContainer
│   │   │   ├── charts/           # ECharts wrappers: ExposureChart, CashflowTrend, StatusDistribution
│   │   │   ├── drawing/          # PDFViewer, KonvaAnnotationCanvas, MarkupToolbar
│   │   │   └── shared/           # CurrencyDisplay, StatusBadge, EmptyState, SkeletonLoader, ConfirmModal
│   │   ├── features/
│   │   │   ├── auth/             # Login, Register, ForgotPassword, OrgSelector
│   │   │   ├── dashboard/        # Portfolio Overview, KPI cards, Exposure Breakdown
│   │   │   ├── projects/         # Project List, Create Project, Project Detail & Control Center
│   │   │   ├── boq/              # BOQ Baseline Table, Import CSV Modal, Quantity Comparison
│   │   │   ├── change-orders/    # 5-Step Creation Wizard, Change Order Detail, Line Item Editor
│   │   │   ├── cost-estimation/  # Unit Rate Breakdown, Markup/Overhead Calculator, Estimate Snapshots
│   │   │   ├── approvals/        # Approval Timeline, Sign-off Dialog, Clarification Drawer
│   │   │   ├── client-portal/    # Simplified Client Approval & Review Interface
│   │   │   ├── financial/        # Financial Exposure Matrix, Drilldown Tables, Risk Analysis
│   │   │   ├── invoices/         # Invoice Generation, Payment Logger, Reconciliation Table
│   │   │   ├── documents/        # Document Explorer, File Uploader, Version Browser
│   │   │   ├── reports/          # Variation Register Export, Exposure Summary, CSV/PDF download
│   │   │   └── settings/         # Organization Profile, Team Members, Role Permissions
│   │   ├── hooks/                # useAuth, useProject, useChangeOrders, usePermissions, useToast
│   │   ├── lib/                  # axios instance, queryClient, currency formatter, date utils
│   │   ├── store/                # authStore, uiStore, activeProjectStore (Zustand)
│   │   └── types/                # Shared TypeScript definitions (DTOs, domain models)
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── server.ts             # Application entry point, HTTP server & Socket.IO initialization
│   │   ├── app.ts                # Express app configuration, middleware pipeline
│   │   ├── config/               # Database connection, env validation, constants
│   │   ├── middleware/           # authGuard, rbacGuard, orgScope, errorHandler, rateLimiter, upload
│   │   ├── controllers/          # auth, organization, project, boq, changeOrder, estimate, approval, invoice, report
│   │   ├── services/             # Pure domain logic (financialEngine, stateMachine, auditService, etc.)
│   │   ├── models/               # Mongoose schemas: User, Org, Project, BOQ, ChangeOrder, Estimate, Invoice, etc.
│   │   ├── validators/           # Zod schemas for all incoming HTTP payloads
│   │   ├── utils/                # currencyMath, indianNumberFormat, responseEnvelope, tokenHelper
│   │   ├── sockets/              # Real-time event emitters (statusChanged, newNotification)
│   │   └── seeds/                # Realistic Northstar Infrastructure seed data generator
│
├── docs/                         # Engineering & operational documentation
├── package.json                  # Root runner script orchestration
└── README.md
```

---

## 4. Financial Engine & Precision Calculations

### Minor Units Implementation
All monetary columns in MongoDB are defined as `{ type: Number, required: true }` representing **integer paise**.
- ₹1.00 = 100 paise.
- ₹1,50,000.00 = 15,000,000 paise.

```typescript
// server/src/utils/currencyMath.ts
export function calculateDirectCost(items: Array<{ quantity: number; unitRatePaise: number }>): number {
  return items.reduce((acc, item) => acc + Math.round(item.quantity * item.unitRatePaise), 0);
}

export function calculateEstimateTotals(
  directCostPaise: number,
  overheadPct: number,
  markupPct: number,
  taxPct: number
) {
  const overheadPaise = Math.round((directCostPaise * overheadPct) / 100);
  const preMarkupPaise = directCostPaise + overheadPaise;
  const markupPaise = Math.round((preMarkupPaise * markupPct) / 100);
  const taxablePaise = preMarkupPaise + markupPaise;
  const taxPaise = Math.round((taxablePaise * taxPct) / 100);
  const totalProposedPaise = taxablePaise + taxPaise;

  return {
    directCostPaise,
    overheadPaise,
    preMarkupPaise,
    markupPaise,
    taxablePaise,
    taxPaise,
    totalProposedPaise,
  };
}
```

### Indian Currency Formatting Utility
For client display and PDF/CSV reporting, integers are converted into standard Indian Numbering notation:
- 1,00,000 = 1 Lakh (₹1,00,000)
- 1,00,00,000 = 1 Crore (₹1,00,00,000)

---

## 5. State Machine & Approval Workflow

The lifecycle of each Change Order is governed by a strict deterministic finite state machine (FSM).

```
[Draft]
   │
   ▼ (submit)
[Submitted]
   │
   ▼ (technical_review)
[Technical Review]
   │
   ▼ (commercial_review)
[Commercial Review]
   │
   ▼ (internal_approval)
[Internal Approval]
   │
   ▼ (client_approval)
[Client Approval] ───────────────► [Changes Requested]
   │                                        │
   │ (client_accept)                        │ (resubmit)
   ▼                                        ▼
[Approved] ◄────────────────────────────────┘
   │
   ▼ (authorize_execution)  *Can also be reached early with mandatory justification
[Authorised for Execution]
   │
   ▼ (start_work)
[In Progress]
   │
   ▼ (complete_work)
[Completed]
   │
   ▼ (prepare_billing)
[Ready for Invoicing]
   │
   ▼ (issue_invoice)
[Invoiced]
   │
   ▼ (receive_full_payment)
[Paid]
```

### Guard Conditions & Role Authorizations
1. `site_engineer` can only transition: `Draft` ➔ `Submitted`, `In Progress` ➔ `Completed`.
2. `commercial_manager` handles `Technical Review` ➔ `Commercial Review` ➔ `Internal Approval`.
3. `project_manager` or `admin` can authorize execution. If authorized prior to `Approved`, the system enforces a non-empty `unapprovedExecutionJustification` string and tags the order as `unapprovedWork: true`.
4. `client_approver` can only act on orders currently in `Client Approval` state.

---

## 6. Financial Exposure Ledger Architecture

The financial dashboard computes real-time aggregation across five discrete, non-overlapping financial domains:

```
Total Contract Scope = Original Baseline BOQ Total + Approved Variations
```

### Risk Ledger Buckets:
1. **Pending Approval Pipeline:** Sum of `totalProposedPaise` where `status` IN `['Submitted', 'Technical Review', 'Commercial Review', 'Internal Approval', 'Client Approval']`.
2. **Unapproved Work Performed:** Sum of `totalProposedPaise` where `unapprovedExecution = true` and `status` NOT IN `['Approved', 'Paid', 'Invoiced']`.
3. **Approved Unbilled Exposure:** Sum of `totalApprovedPaise` where `status` IN `['Approved', 'Authorised for Execution', 'In Progress', 'Completed', 'Ready for Invoicing']` and `invoicedAmountPaise == 0`.
4. **Invoiced Receivables (Unpaid):** Sum of `invoices.balanceDuePaise` where `status` IN `['Issued', 'Partially Paid', 'Overdue']`.
5. **Realised Cashflow (Paid):** Sum of verified recorded `payments.amountPaise`.

---

## 7. Security & Isolation Model

1. **Authentication Token Lifecycle:** JWT access tokens are signed using `HS256` with strong secrets. Issued in HTTP-only, secure, same-site cookies to eliminate XSS token theft.
2. **Organization Context Injection:** Every authenticated request executes `requireAuth` followed by `tenantScope`. Controllers query with `{ organization: req.orgId, ... }`, preventing multi-tenant data leaks.
3. **Payload Sanitization & Zod Enforcement:** Inbound requests are validated against strict Zod schemas with `.strip()` to reject unknown malicious fields.
4. **Rate Limiting & Headers:** Helmet configures secure HTTP response headers (CSP, HSTS, X-Frame-Options); express-rate-limit prevents brute force on auth endpoints.
