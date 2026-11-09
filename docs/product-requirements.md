# AmendFlow — Product Requirements Document (PRD)

**Product Name:** AmendFlow  
**Tagline:** Every change accounted for. Every cost protected.  
**Product Category:** Construction Change Management & Financial Control SaaS  
**Target Market:** General Contractors, Specialist Subcontractors, Infrastructure Developers, Commercial & Cost Managers, Project Directors.

---

## 1. Executive Summary & Problem Definition

In commercial and civil construction, project deviations are inevitable: scope modifications, design revisions, differing site conditions, client requests, and unforeseen structural adjustments occur daily. While modifications are common, the commercial management of these changes is notoriously fragmented:
- **Revenue Leakage:** Site teams execute changes verbally or through email instructions without formal cost sign-off, resulting in work performed that is rejected during billing or written off during contract closure.
- **Missing Audit Trails:** Lack of unified tracking creates severe disputes over what was requested, when it was approved, who authorised it, and what the baseline scope originally included.
- **Delayed Invoicing & Strained Cashflow:** Variations take months to be evaluated, reviewed, and billed, ballooning contractor working capital requirements.
- **Obscured Financial Exposure:** Executives and commercial managers lack a real-time, non-overlapping view of total project risk: pending claims, unapproved work executed on site, approved unbilled values, and overdue receivables.

**AmendFlow** provides a single, immutable, traceable operating system for construction variations, tracking the complete lifecycle:
```
REQUEST ➔ SCOPE REVIEW ➔ COST ESTIMATION ➔ APPROVAL ➔ EXECUTION ➔ COMPLETION ➔ INVOICING ➔ PAYMENT
```

Every single change order in AmendFlow is systematically linked to:
1. The original project baseline & Bill of Quantities (BOQ).
2. The requesting party and originating site instruction.
3. Supporting documentation, marked-up engineering drawings, and site photographs.
4. Exact unit-rate cost estimates broken down by labour, material, equipment, and subcontracting.
5. Internal commercial governance and client-side approvals.
6. Execution and physical completion logs with verification evidence.
7. Linked tax invoices and reconciled payment receipts.

---

## 2. Core Personas & Access Models

AmendFlow employs a dual-tier permission hierarchy: **Organization Level** (Tenancy) and **Project Level** (Assignment).

| Persona | Primary Goals | Key Capabilities |
| :--- | :--- | :--- |
| **Org Owner / Executive** | Protect contractor margin, prevent unbilled work, monitor portfolio financial exposure. | Full tenant access, portfolio dashboard, commercial threshold override, organization settings. |
| **Project Manager (PM)** | Ensure projects deliver on schedule, coordinate variations, review feasibility. | Manage assigned projects, technical review, authorize execution, monitor schedule milestones. |
| **Site Engineer** | Log site changes immediately, capture photographic evidence, annotate structural drawings. | Create change requests, attach drawings/annotations, record physical work execution, upload completion sign-offs. |
| **Commercial Manager** | Accurately estimate variation costs, enforce contract markups, verify BOQ alignment. | Formulate multi-tier cost estimates (materials, labour, plant), manage baseline BOQ, evaluate claims. |
| **Finance Officer** | Issue accurate variation billing, track retention and receivables, reconcile payments. | Generate invoices against approved change orders, record milestone payments, maintain ledger. |
| **Client Approver** | Review proposed variations, inspect technical substantiation, approve or seek clarification. | Restricted portal access to specifically shared change orders, interactive approval/rejection audit trail. |

---

## 3. Detailed Functional Modules

### Module A: Multi-Tenant Authentication & Organization Governance
- **Tenant Isolation:** Secure multi-tenant architecture where data is strictly partitioned by `organizationId`. A user can belong to multiple organizations with distinct roles per organization.
- **Secure Authentication:** JWT authentication delivered via HTTP-Only, `SameSite=Lax`, secure cookies. Passwords hashed using `bcrypt` (work factor 12).
- **Session & Identity:** Password reset flow with time-limited cryptographic tokens, profile management, and active session validation.
- **Invitations:** Team member invitation workflow with role pre-assignment and email verification tokens.

### Module B: Project Control Center
- **Project Master Data:** Project code, descriptive metadata, client and contractor corporate details, geographic coordinates/location, contractual start & completion dates, baseline contract currency (INR with paise minor-unit precision).
- **Project Financial Statuses:** `Planning`, `Active`, `On Hold`, `Completed`, `Archived`.
- **Project Control Dashboard:** Real-time visibility into baseline contract amount, cumulative approved variation amount, revised contract value, pending approval pipeline, unapproved work exposure, approved unbilled balance, and invoiced receivables.
- **Milestone & Activity Timeline:** Complete historical audit feed of project events, pending approvals, and upcoming contractual deadlines.

### Module C: Contract Baseline & BOQ Management
- **Immutable Baseline:** The original Bill of Quantities (BOQ) represents the contractual scope agreed upon at contract signing. Once baseline is finalized, original line items are locked.
- **Structured BOQ Schema:** Item code, detailed scope description, work category (Civil, Structural, MEP, Finishing, Infrastructure), unit of measure (e.g., m², cu.m, MT, nos), contract unit rate (in paise), and original contractual quantity.
- **CSV Import & Bulk Processing:** Structured parser to import engineering schedules with header mapping, error checking, and decimal verification.
- **Dynamic Revision Analysis:** System maps all approved change order adjustments directly against BOQ item lines to compute `Revised Quantity = Baseline Quantity + Sum(Approved Variations)`.

### Module D: Change Order Lifecycle Engine
- **Unique Identification:** Formatted project-scoped identifiers (e.g., `CO-2026-001`).
- **5-Step Wizard Workflow:**
  1. *Basic Details:* Title, priority (`Low`, `Medium`, `High`, `Urgent`), category (`Additional Work`, `Omitted Work`, `Quantity Variation`, `Material Substitution`, `Design Modification`, `Time Extension`, `Other`), originating party.
  2. *Scope & BOQ Mapping:* Detailed justification, root cause, contractual clause references, linked baseline BOQ items.
  3. *Supporting Evidence:* Site photographs, instruction notices, request letters, marked-up drawings.
  4. *Cost & Schedule Impact:* Integrated estimate compilation and estimated project delay in days.
  5. *Review & Submission:* Verification checks before dispatching to the approval workflow.
- **Draft Auto-save:** In-progress change requests persist as drafts to prevent data loss on site.

### Module E: High-Precision Cost Estimation Engine
- **Cost Categories:** Direct Cost line items categorized into:
  - Materials
  - Labour
  - Equipment & Machinery
  - Subcontracting
  - Other Direct Costs
- **Mathematical Formulations (All calculated in integer paise minor units):**
  $$\text{Direct Cost} = \sum (\text{Quantity} \times \text{Unit Rate})$$
  $$\text{Overhead} = \left\lfloor \text{Direct Cost} \times \frac{\text{Overhead Rate \%}}{100} \right\rfloor$$
  $$\text{Pre-Markup Amount} = \text{Direct Cost} + \text{Overhead}$$
  $$\text{Profit Markup} = \left\lfloor \text{Pre-Markup Amount} \times \frac{\text{Profit Markup \%}}{100} \right\rfloor$$
  $$\text{Tax Amount} = \left\lfloor (\text{Pre-Markup Amount} + \text{Profit Markup}) \times \frac{\text{Tax Rate \%}}{100} \right\rfloor$$
  $$\text{Proposed Total Amount} = \text{Pre-Markup Amount} + \text{Profit Markup} + \text{Tax Amount}$$
- **Version Snapshots:** Once an estimate is submitted and subsequently approved, an immutable snapshot is frozen. Further negotiations spawn a new version (`v1`, `v2`, etc.) preserving full commercial comparison history.

### Module F: Multi-Stage Approval State Machine
- **State Progression:**
  `Draft` ➔ `Submitted` ➔ `Technical Review` ➔ `Commercial Review` ➔ `Internal Approval` ➔ `Client Approval` ➔ `Approved` ➔ `Authorised for Execution` ➔ `In Progress` ➔ `Completed` ➔ `Ready for Invoicing` ➔ `Invoiced` ➔ `Paid`
- **Exceptions & Terminal States:** `Changes Requested`, `Rejected`, `Cancelled`, `Partially Paid`.
- **Strict Server-Side Validation:** Transition guard functions enforce role-based authorization for each state change. Site engineers cannot authorize execution; clients can only act on `Client Approval` stages.
- **Unapproved Work Execution Tracking:** In urgent construction situations, project managers may need to authorize work before formal client approval. AmendFlow permits this *only* if the manager records an explicit, mandatory justification. Such work is highlighted in bold amber/red and immediately counted under **Work Performed Without Documented Approval** exposure.

### Module G: Financial Exposure & Risk Dashboard
- **5 Mutually Exclusive Financial Buckets:**
  1. *Pending Approval Value:* Value of submitted/under-review change orders.
  2. *Unapproved Work Exposure:* Commercial value of work physically executed or in progress without formal client approval.
  3. *Approved Unbilled Value:* Formally approved variations where work is complete or underway but an invoice has not yet been raised.
  4. *Invoiced Receivables (Unpaid):* Billed variations awaiting client disbursement.
  5. *Realised Cashflow (Paid):* Reconciled payments received for variations.
- **Interactive Drill-downs:** Interactive charts (Apache ECharts) rendering monthly cashflow trajectories, status distribution, and risk categorization. Clicking any bucket or chart segment filters the exact underlying change orders.

### Module H: Engineering Drawing Annotation & Markups
- **PDF & Blueprint Viewer:** Built on PDF.js with pan, zoom, and multi-page navigation.
- **Konva Annotation Layer:** High-performance vector canvas overlay supporting:
  - Vector bounding boxes and revision clouds.
  - Callout pins and numeric markers.
  - Text notes and directional arrows.
- **Normalized Coordinates:** Coordinates stored as percentages/fractions of page dimensions ($0.0 \le x, y \le 1.0$), ensuring marks remain pinpoint-accurate regardless of viewport, DPI, or zoom level.
- **Change Order Linkage:** Annotations can be pinned directly to specific Change Order line items.

### Module I: Client Approval Portal
- **Secure Restricted Portal:** Dedicated clean interface for client representatives, showing only items formally routed for client review.
- **Clear Information Density:** Shows proposed financial impact, schedule impact, attached site instructions, and interactive drawing markups.
- **Formal Audit Decision:** Action buttons for `Approve`, `Request Clarification`, or `Reject with Reason`, complete with a cryptographic confirmation record and timestamp.

### Module J: Invoicing & Payment Reconciliation
- **Change Order Billing:** Finance officers generate invoices against approved change orders.
- **Financial Guards:** An invoice line cannot exceed the approved change order value without an explicit managerial override with logged reason.
- **Payment Allocation:** Register full or partial payments against invoices, recalculating remaining receivables and aging buckets automatically.

### Module K: Document Management & Append-Only Audit Trail
- **Document Repository:** Categorized storage for Contracts, Drawings, Site Photos, Variations, and Invoices.
- **Append-Only Activity Log:** Comprehensive, tamper-evident audit records tracking user, action, target entity, timestamp, IP address, and changed diffs. Historical approval logs cannot be edited or erased.

### Module L: Notifications & Enterprise Reporting
- **In-App Notification Feed:** Real-time event notifications for pending reviews, approvals, client comments, execution start/completion, and payment milestones.
- **Export Formats:** Dynamic export to CSV and formatted printable summaries for Variation Registers, Financial Exposure Summaries, and Project Cost Reports.

---

## 4. Non-Functional & Quality Standards
- **Precision:** Zero floating-point drift. All financial computations handled in integer minor units (paise). Formatted in Indian numbering system (Lakhs: `₹1,00,000`, Crores: `₹1,00,00,000`).
- **Performance:** Sub-100ms API response time on indexed queries; client-side optimistic caching via TanStack Query.
- **Reliability:** Fallback memory database server for instant zero-dependency execution in testing and local dev; production-ready connection to MongoDB Atlas.
- **Design Authenticity:** High-density, restrained enterprise design language using custom slate/teal tokens (`#183B45`, `#357B75`, `#F5F6F4`), crisp typography, and zero generic template artifacts.

