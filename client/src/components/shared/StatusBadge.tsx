import React from 'react';
import { Badge } from '../ui/Badge';
import { ChangeOrderStatus, ProjectStatus, InvoiceStatus } from '../../types';

export interface StatusBadgeProps {
  status: ChangeOrderStatus | ProjectStatus | InvoiceStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' = 'neutral';

  switch (status) {
    // Success / Completed / Approved / Paid
    case 'Approved':
    case 'Completed':
    case 'Paid':
      variant = 'success';
      break;

    // In Progress / Active / Ready
    case 'Active':
    case 'Authorised for Execution':
    case 'In Progress':
    case 'Ready for Invoicing':
    case 'Issued':
      variant = 'info';
      break;

    // Pending / Review / Amber
    case 'Submitted':
    case 'Technical Review':
    case 'Commercial Review':
    case 'Internal Approval':
    case 'Client Approval':
    case 'Partially Paid':
    case 'Planning':
      variant = 'warning';
      break;

    // Rejected / Danger / Overdue
    case 'Rejected':
    case 'Changes Requested':
    case 'Overdue':
      variant = 'danger';
      break;

    // Inactive / Draft / Cancelled
    case 'Draft':
    case 'Cancelled':
    case 'On Hold':
    case 'Archived':
    default:
      variant = 'neutral';
      break;
  }

  return (
    <Badge variant={variant} size={size}>
      {status}
    </Badge>
  );
};
