# AmendFlow — Comprehensive Implementation Plan

## 1. Overview & Phased Roadmap

This plan outlines the systematic engineering execution of **AmendFlow**, moving through 6 planned, verifiable development phases. Each phase culminates in functional verification, automated tests, and persistence confirmation.

---

## 2. Phase Breakdown

### Phase 1: Foundation & Application Shell
- **Monorepo Structure Setup:** Root workspace with `server/` (Node.js, Express, TypeScript) and `client/` (React, Vite, TypeScript, Tailwind CSS, Lucide, shadcn/ui components).
- **Database & Resilience Layer:** Mongoose connection configuration supporting standard `MONGODB_URI` for MongoDB Atlas and an automatic zero-config in-memory MongoDB fallback (`mongodb-memory-server`) so the entire application runs cleanly out of the box.
- **Design System Implementation:** Tailwind color palette matching the specification tokens:
  - Background: `#F5F6F4`
  - Primary Surface: `#FFFFFF`
  - Text Primary: `#172B3A`, Secondary: `#697783`
  - Borders: `#E3E7E9`
  - Brand Primary: `#183B45`, Secondary: `#357B75`
  - Status tokens: Muted Green, Muted Amber, Restrained Red, Muted Blue.
  - Tabular numerals font configurations for financial tables.
- **Authentication & Multi-Tenant Infrastructure:**
  - Password hashing with `bcrypt`.
  - JWT token generation & verification stored in HTTP-Only cookies.
  - User model, Organization model, OrganizationMember model.
  - Auth routes: `/register`, `/login`, `/logout`, `/me`, `/switch-org`.
  - Frontend Auth Provider, protected routes, and session persistence.
- **Application Shell & Layout:**
  - Responsive fixed navigation sidebar with icons (Overview, Projects, Change Orders, BOQ Management, Financial Exposure, Documents, Reports, Team & Settings).
  - Compact top header with active Organization selector, Search, Notification bell, and User menu.
  - Toast notification system, breadcrumbs, and modal dialog system.

### Phase 2: Core Project Management & BOQ Baseline
- **Project Master Module:**
  - Project model with codes (e.g. `PRJ-NSR-001`), client/contractor information, start/end dates, location, baseline amount in paise, currency, statuses (`Planning`, `Active`, `On Hold`, `Completed`, `Archived`).
  - Project Control Center dashboard showing baseline contract value, approved variations, revised contract total, and project timeline.
  - Project creation modal and editing capabilities.
- **Contract & BOQ (Bill of Quantities) Module:**
  - BOQItem model: item code, description, category (`Civil`, `Structural`, `MEP`, `Finishing`, `Infrastructure`), unit, baseline quantity, unit rate in paise, baseline amount in paise.
  - BOQ Management UI: Search, filter by category, item creation, and CSV import parser.
  - Baseline lock mechanism to preserve immutable contractual baseline.
  - Revised quantity recalculation based on approved change orders.

### Phase 3: Change Management & Precision Cost Estimation Engine
- **Change Order Core:**
  - ChangeOrder model with auto-generated order numbers (`CO-PRJ-001`), categories, priority, requesting party, root cause, schedule impact in days, and lifecycle statuses.
  - 5-Step Creation Wizard:
    - Step 1: Basic details & classification.
    - Step 2: Scope description & BOQ item linking.
    - Step 3: Supporting documents & engineering evidence.
    - Step 4: Cost estimation line items and schedule impact.
    - Step 5: Summary review & formal submission.
  - Draft autosave capability.
- **High-Precision Cost Estimation Engine:**
  - Direct cost breakdown across Materials, Labour, Equipment, Subcontracting, and Other costs.
  - Integer paise math implementation:
    - `Direct Cost = Sum(Quantity * Unit Rate Paise)`
    - `Overhead = Direct Cost * Overhead %`
    - `Pre-Markup = Direct Cost + Overhead`
    - `Profit Markup = Pre-Markup * Markup %`
    - `Tax = (Pre-Markup + Markup) * Tax %`
    - `Proposed Amount = Pre-Markup + Markup + Tax`
  - Versioned Cost Estimates (`v1`, `v2`) with immutable snapshot freezing upon approval.
  - Indian currency formatting (Lakhs & Crores) with tabular figures.

### Phase 4: Multi-Stage Approval Engine & Financial Exposure Matrix
- **Approval State Machine:**
  - State lifecycle: `Draft` ➔ `Submitted` ➔ `Technical Review` ➔ `Commercial Review` ➔ `Internal Approval` ➔ `Client Approval` ➔ `Approved` ➔ `Authorised for Execution` ➔ `In Progress` ➔ `Completed` ➔ `Ready for Invoicing` ➔ `Invoiced` ➔ `Paid`.
  - Role-based transition guardrails enforced on the backend.
  - Approval history record with approver, decision, timestamp, and comments.
  - **Unapproved Execution Gate:** Ability for authorized managers to mark work as `Authorised for Execution` before formal client approval *only* upon providing a mandatory justification, immediately flagging the work as unapproved risk.
- **Client Approval Portal:**
  - Dedicated, restricted client view for change orders routed to `Client Approval`.
  - Detailed scope review, cost substantiation, and formal `Approve`, `Request Clarification`, or `Reject` actions.
- **Financial Exposure & Risk Matrix:**
  - Real-time aggregation of the 5 mutually exclusive financial categories:
    1. Pending Approval Pipeline
    2. Work Performed Without Documented Approval (Unapproved Work Exposure)
    3. Approved Unbilled Value
    4. Invoiced Receivables (Unpaid)
    5. Realised Cashflow (Paid)
  - Interactive drill-down capabilities (clicking any KPI filters the specific underlying records).
  - Apache ECharts visualizations: Exposure distribution, monthly trend, project risk ranking.

### Phase 5: Document Annotation, Invoicing & Operational Reporting
- **Engineering Drawing Annotation:**
  - PDF/Drawing preview component with zoom, pan, and page navigation.
  - Konva canvas overlay allowing site engineers to draw revision boxes, pins, and notes.
  - Normalized coordinate storage ($0.0 \le x,y \le 1.0$) for device and resolution independence.
  - Direct link between drawing annotations and Change Order items.
- **Invoicing & Payment Reconciliation:**
  - Generate invoices against approved change orders.
  - Strict validations: Invoiced amount cannot exceed approved amount without authorized override.
  - Record partial and full payments with payment modes (NEFT, RTGS, Bank Transfer).
  - Dynamic reconciliation of balance due and payment status.
- **Activity Log & In-App Notifications:**
  - Tamper-evident, append-only activity trail.
  - Real-time in-app notification center for approvals, clarifications, and billing alerts.
- **Export & Reporting:**
  - Project Variation Register export (CSV / formatted print view).
  - Financial Exposure Summary export.

### Phase 6: Automated Testing, Realistic Demonstration Data & Verification
- **Realistic Seed Database:**
  - Illustrative tenant: **Northstar Infrastructure Pvt. Ltd.**
  - 3 realistic Indian construction projects:
    1. *Commercial Office Complex (Bengaluru Tech Corridor)*
    2. *Residential Tower Development (Mumbai High-Rise)*
    3. *Industrial Warehouse Expansion (Pune Logistics Hub)*
  - Realistic BOQ schedules, change orders across all stages, unapproved execution items, invoices, and payments.
  - Verified demo accounts for every role (`admin`, `pm`, `site_engineer`, `commercial_mgr`, `finance`, `client`).
- **Comprehensive Automated Tests:**
  - Unit tests: Financial calculations, paise rounding, Indian number formatting.
  - Backend integration tests: Authentication, RBAC, tenant isolation, approval transitions, unapproved work rules.
  - Frontend component and workflow tests.
  - End-to-end user journey tests.
- **Documentation & Deployment Readiness:**
  - Complete `README.md` with startup instructions, architecture guide, demo account credentials, and testing commands.

---

## 3. Verification & Quality Gates
At each phase completion:
1. Verify database write & read operations in MongoDB.
2. Confirm zero floating-point arithmetic errors in financial calculations.
3. Validate that UI respects design tokens, typography, and responsive breakpoints.
4. Execute test suites to ensure zero regressions.
5. Update `docs/progress.md`.

