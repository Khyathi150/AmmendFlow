export type UserRole =
  | 'owner'
  | 'admin'
  | 'project_manager'
  | 'site_engineer'
  | 'commercial_manager'
  | 'finance_officer'
  | 'client_approver';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Organization {
  _id: string;
  name: string;
  legalEntityName?: string;
  taxId?: string;
  currency: string;
  role?: UserRole;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  settings?: {
    defaultOverheadPct: number;
    defaultMarkupPct: number;
    defaultTaxPct: number;
    autoLockBaseline: boolean;
  };
}

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';

export interface Project {
  _id: string;
  organization: string;
  name: string;
  code: string;
  description?: string;
  clientName: string;
  clientContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  contractorName: string;
  location: {
    address?: string;
    city: string;
    state: string;
    country?: string;
  };
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;
  originalContractPaise: number;
  currency: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type BOQCategory =
  | 'Civil'
  | 'Structural'
  | 'MEP'
  | 'Finishing'
  | 'Infrastructure'
  | 'External Works'
  | 'General';

export interface BOQItem {
  _id: string;
  organization: string;
  project: string;
  itemCode: string;
  description: string;
  category: BOQCategory;
  unit: string;
  baselineQuantity: number;
  unitRatePaise: number;
  baselineAmountPaise: number;
  isLocked: boolean;
  notes?: string;
  revisedQuantity?: number;
  varianceQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export type ChangeOrderCategory =
  | 'Additional Work'
  | 'Omitted Work'
  | 'Quantity Variation'
  | 'Material Substitution'
  | 'Design Modification'
  | 'Time Extension'
  | 'Other';

export type ChangeOrderPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ChangeOrderStatus =
  | 'Draft'
  | 'Submitted'
  | 'Technical Review'
  | 'Commercial Review'
  | 'Internal Approval'
  | 'Client Approval'
  | 'Approved'
  | 'Authorised for Execution'
  | 'In Progress'
  | 'Completed'
  | 'Ready for Invoicing'
  | 'Invoiced'
  | 'Paid'
  | 'Changes Requested'
  | 'Rejected'
  | 'Cancelled';

export interface CostEstimateItem {
  _id?: string;
  description: string;
  category: 'Material' | 'Labour' | 'Equipment' | 'Subcontracting' | 'Other';
  quantity: number;
  unit: string;
  unitRatePaise: number;
  totalPaise: number;
  boqItemRef?: string;
}

export interface CostEstimate {
  _id: string;
  changeOrder: string;
  version: number;
  isFrozen: boolean;
  items: CostEstimateItem[];
  directCostPaise: number;
  overheadPct: number;
  overheadPaise: number;
  markupPct: number;
  markupPaise: number;
  taxPct: number;
  taxablePaise: number;
  taxPaise: number;
  totalProposedPaise: number;
  preparedBy: {
    _id: string;
    name: string;
    email: string;
  } | string;
  notes?: string;
  createdAt: string;
}

export interface Approval {
  _id: string;
  changeOrder: string;
  stage: 'Technical Review' | 'Commercial Review' | 'Internal Approval' | 'Client Approval';
  approver: {
    _id: string;
    name: string;
    email: string;
  };
  decision: 'Approved' | 'Rejected' | 'Changes Requested';
  comments: string;
  previousStatus: string;
  newStatus: string;
  signedAt: string;
}

export interface ChangeOrder {
  _id: string;
  organization: string;
  project: Project | string;
  orderNumber: string;
  title: string;
  description: string;
  category: ChangeOrderCategory;
  priority: ChangeOrderPriority;
  requestedBy: {
    _id: string;
    name: string;
    email: string;
  } | string;
  originatingParty: 'Contractor' | 'Client' | 'Architect' | 'Consultant' | 'Site Condition';
  requestDate: string;
  reason: string;
  scheduleImpactDays: number;
  totalProposedPaise: number;
  totalApprovedPaise: number;
  invoicedAmountPaise: number;
  status: ChangeOrderStatus;
  unapprovedExecution: boolean;
  unapprovedJustification?: string;
  unapprovedAuthorizedBy?: {
    _id: string;
    name: string;
  } | string;
  unapprovedAuthorizedAt?: string;
  activeEstimate?: CostEstimate;
  linkedBoqItemIds?: (BOQItem | string)[];
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  _id: string;
  organization: string;
  project: Project | string;
  changeOrders: (ChangeOrder | string)[];
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotalPaise: number;
  taxPaise: number;
  totalAmountPaise: number;
  amountPaidPaise: number;
  balanceDuePaise: number;
  status: InvoiceStatus;
  notes?: string;
  createdBy: {
    _id: string;
    name: string;
  } | string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  invoice: Invoice | string;
  organization: string;
  project: string;
  paymentDate: string;
  amountPaise: number;
  paymentMethod: 'Bank Transfer' | 'NEFT' | 'RTGS' | 'Cheque' | 'Letter of Credit' | 'Other';
  referenceNumber: string;
  notes?: string;
  recordedBy: {
    _id: string;
    name: string;
  } | string;
  createdAt: string;
}

export interface FinancialExposureSummary {
  totalContractBaselinePaise: number;
  approvedVariationsPaise: number;
  revisedContractTotalPaise: number;
  pendingApprovalPaise: number;
  unapprovedWorkExposurePaise: number;
  approvedUnbilledPaise: number;
  invoicedReceivablesPaise: number;
  realisedCashflowPaise: number;
}

