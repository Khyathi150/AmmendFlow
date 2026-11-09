# AmendFlow — REST API Design Specification

## 1. API Conventions & Standard Response Envelope

The AmendFlow backend exposes a strict, versioned RESTful JSON API under `/api`.

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_TRANSITION",
    "message": "Work cannot be authorized for execution before internal approval without formal justification.",
    "details": [
      { "field": "unapprovedJustification", "message": "Required when authorizing without client approval" }
    ]
  }
}
```

### HTTP Status Code Conventions
- `200 OK`: Successful read or update.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or bad request payload.
- `401 Unauthorized`: Missing or invalid session token.
- `403 Forbidden`: Insufficient role permissions or tenant mismatch.
- `404 Not Found`: Target resource not found in current organization.
- `409 Conflict`: Unique constraint violation or state transition conflict.
- `422 Unprocessable Entity`: Semantic business logic violation.
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Authentication & Tenancy Endpoints

### `POST /api/auth/register`
Creates an initial user profile and optionally sets up their primary organization.
- **Request:**
  ```json
  {
    "name": "Vikram Malhotra",
    "email": "vikram@northstarinfra.com",
    "password": "SecurePassword123!",
    "organizationName": "Northstar Infrastructure Pvt. Ltd.",
    "phone": "+91 98765 43210"
  }
  ```
- **Response `201`:** Sets `Set-Cookie: token=...; HttpOnly; SameSite=Lax; Path=/` and returns `{ user, organization }`.

### `POST /api/auth/login`
- **Request:**
  ```json
  {
    "email": "vikram@northstarinfra.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `200`:** Sets HTTP-only auth cookie and returns user profile, accessible organizations, and active role.

### `POST /api/auth/logout`
- **Response `200`:** Clears auth cookie.

### `GET /api/auth/me`
- **Response `200`:** Returns authenticated user, active tenant details, and member permissions.

### `POST /api/auth/switch-org`
- **Request:** `{ "organizationId": "65f..." }`
- **Response `200`:** Re-issues JWT cookie with new active tenant scope.

---

## 3. Organizations & Members Endpoints

- `GET /api/organizations` — List organizations user belongs to.
- `POST /api/organizations` — Create a new organization.
- `GET /api/organizations/:id` — Get organization profile, settings, and defaults.
- `PATCH /api/organizations/:id` — Update corporate details (Admin only).
- `GET /api/organizations/:id/members` — List members with their assigned roles.
- `POST /api/organizations/:id/invitations` — Send invitation link with assigned role.
- `PATCH /api/organizations/:id/members/:memberId` — Update member role.

---

## 4. Projects Endpoints

- `GET /api/projects` — Filter by `status`, `search`, with pagination.
- `POST /api/projects` — Create new project with baseline contract metadata.
- `GET /api/projects/:id` — Detailed project dashboard data including baseline vs revised value.
- `PATCH /api/projects/:id` — Update project metadata or status.
- `GET /api/projects/:id/members` — List members assigned to project.
- `POST /api/projects/:id/members` — Assign user with project role (`engineer`, `manager`, `client_rep`).
- `GET /api/projects/:id/financial-summary` — Reconciled real-time financial metrics for the project.

---

## 5. Bill of Quantities (BOQ) Endpoints

- `GET /api/projects/:id/boq` — Get BOQ item schedule with current revision calculations.
- `POST /api/projects/:id/boq` — Add a new BOQ item line (allowed before baseline is locked).
- `POST /api/projects/:id/boq/import` — Multipart CSV import with auto-column mapping.
- `PATCH /api/boq/:id` — Edit BOQ item (only permissible prior to lock).
- `POST /api/projects/:id/boq/lock` — Lock baseline schedule as immutable contract standard.
- `GET /api/projects/:id/boq/export` — Download CSV of baseline items with variation variances.

---

## 6. Change Order Endpoints

### `GET /api/change-orders`
- **Query Params:** `projectId`, `status`, `category`, `priority`, `unapprovedOnly`, `page`, `limit`, `search`.
- **Response `200`:** Paginated change order records.

### `POST /api/change-orders`
Creates a change order in `Draft` state or directly submits it.
- **Request:**
  ```json
  {
    "projectId": "65f...",
    "title": "Additional Deep Pile Foundation at Tower B",
    "description": "Encountered fractured bedrock at -12m depth requiring 18 additional bored cast-in-situ piles.",
    "category": "Additional Work",
    "priority": "High",
    "originatingParty": "Site Condition",
    "reason": "Geotechnical deviation during pile drilling.",
    "scheduleImpactDays": 14,
    "linkedBoqItemIds": ["65f..."],
    "isDraft": false
  }
  ```

### `GET /api/change-orders/:id`
Returns full Change Order aggregate: active Cost Estimate, Approval History, Drawing Annotations, Execution Records, and Activity Trail.

### `PATCH /api/change-orders/:id`
Updates draft details, scope description, or attached documents.

### `POST /api/change-orders/:id/submit`
Transitions `Draft` ➔ `Submitted`. Dispatches notifications to Project Manager and Commercial Manager.

### `POST /api/change-orders/:id/request-clarification`
Transitions to `Changes Requested` with comments.

### `POST /api/change-orders/:id/authorize-execution`
Transitions to `Authorised for Execution`.
- Enforces condition: If status is not yet `Approved`, requires:
  ```json
  {
    "unapprovedJustification": "Critical path foundation works will halt Tower B superstructure if delayed by client meeting next month."
  }
  ```

### `POST /api/change-orders/:id/start-work`
Transitions `Authorised for Execution` ➔ `In Progress`.

### `POST /api/change-orders/:id/complete-work`
Transitions `In Progress` ➔ `Completed` ➔ `Ready for Invoicing`.

---

## 7. Cost Estimation Endpoints

### `POST /api/change-orders/:id/estimates`
Creates or updates a versioned cost estimate.
- **Request:**
  ```json
  {
    "items": [
      {
        "description": "Bored cast-in-situ pile 600mm dia",
        "category": "Subcontracting",
        "quantity": 18,
        "unit": "nos",
        "unitRatePaise": 4500000,
        "boqItemRef": "65f..."
      },
      {
        "description": "M35 Grade Concrete Supply",
        "category": "Material",
        "quantity": 90,
        "unit": "cu.m",
        "unitRatePaise": 550000
      }
    ],
    "overheadPct": 8,
    "markupPct": 12,
    "taxPct": 18
  }
  ```
- **Response `201`:** Returns calculated line item totals, direct cost, overhead, markup, tax, and proposed client charge.

### `GET /api/change-orders/:id/estimates`
Returns version history of all prepared estimates for this change order.

---

## 8. Multi-Stage Approval Endpoints

### `POST /api/change-orders/:id/approvals`
Records an official review decision.
- **Request:**
  ```json
  {
    "stage": "Commercial Review",
    "decision": "Approved",
    "comments": "Unit rates verified against current CPWD Delhi Schedule of Rates (DSR). Acceptable."
  }
  ```
- **Behavior:** Updates change order status based on role-authorized transition graph, records immutable Approval document, and writes to ActivityLog.

---

## 9. Financial Exposure & Analytics Endpoints

### `GET /api/financial-exposure`
Returns organization-wide exposure metrics across all active projects.
- **Response `200`:**
  ```json
  {
    "summary": {
      "totalContractBaselinePaise": 18500000000,
      "approvedVariationsPaise": 1425000000,
      "revisedContractTotalPaise": 19925000000,
      "pendingApprovalPaise": 384000000,
      "unapprovedWorkExposurePaise": 125000000,
      "approvedUnbilledPaise": 620000000,
      "invoicedReceivablesPaise": 480000000,
      "realisedCashflowPaise": 325000000
    },
    "projectBreakdown": [ ... ],
    "monthlyExposureTrend": [ ... ],
    "categoryDistribution": [ ... ]
  }
  ```

### `GET /api/projects/:id/financial-summary`
Returns project-specific financial exposure numbers with underlying change order references.

---

## 10. Drawing Markups & Annotation Endpoints

- `GET /api/documents/:id/annotations` — Fetch all Konva vector shapes for a PDF document.
- `POST /api/documents/:id/annotations` — Save new annotation marker, bounding box, or revision note.
  - Payload: `{ pageNumber, type, normalizedX, normalizedY, normalizedWidth, normalizedHeight, color, label, comment, changeOrderId }`.
- `DELETE /api/annotations/:id` — Remove an annotation.

---

## 11. Invoicing & Payment Reconciliation Endpoints

- `GET /api/invoices` — List invoices by project, status, overdue filter.
- `POST /api/invoices` — Create invoice against one or more approved Change Orders.
  - Enforces: Invoiced sum $\le$ Approved variation sum.
- `GET /api/invoices/:id` — Detail view of invoice lines and payment history.
- `POST /api/invoices/:id/payments` — Record payment receipt.
  - Payload: `{ amountPaise, paymentDate, paymentMethod, referenceNumber, notes }`.
  - Recalculates `balanceDuePaise`, transitions to `Partially Paid` or `Paid`.

---

## 12. Documents, Activity Trail & Reports

- `POST /api/documents/upload` — Multipart upload for drawings, site photos, contracts, and change evidence.
- `GET /api/documents/:id` — Metadata and download/preview URL.
- `GET /api/activity-logs` — Filterable audit trail by `projectId`, `entityType`, `actorId`.
- `GET /api/reports/variation-register` — Detailed variation register table.
- `GET /api/reports/financial-exposure` — Executive financial exposure report.
- `GET /api/reports/export?type=variation-register&format=csv` — Direct CSV download with proper column formats.
