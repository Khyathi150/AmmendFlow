import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { ChangeOrder } from '../models/ChangeOrder.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';

export async function getFinancialExposure(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.orgId!;
    const { projectId } = req.query;

    const projectQuery: any = { organization: orgId };
    const coQuery: any = { organization: orgId };
    const invoiceQuery: any = { organization: orgId };
    const paymentQuery: any = { organization: orgId };

    if (projectId && Types.ObjectId.isValid(projectId as string)) {
      const pId = new Types.ObjectId(projectId as string);
      projectQuery._id = pId;
      coQuery.project = pId;
      invoiceQuery.project = pId;
      paymentQuery.project = pId;
    }

    // 1. Projects baseline total
    const projects = await Project.find(projectQuery);
    const totalContractBaselinePaise = projects.reduce(
      (sum, p) => sum + (p.originalContractPaise || 0),
      0
    );

    // 2. Change Orders Aggregation
    const approvedStates = [
      'Approved',
      'Authorised for Execution',
      'In Progress',
      'Completed',
      'Ready for Invoicing',
      'Invoiced',
      'Paid',
    ];
    const pendingStates = [
      'Submitted',
      'Technical Review',
      'Commercial Review',
      'Internal Approval',
      'Client Approval',
    ];

    const [
      approvedCoAgg,
      pendingCoAgg,
      unapprovedWorkAgg,
      invoicesAgg,
      paymentsAgg,
      categoryAgg,
    ] = await Promise.all([
      ChangeOrder.aggregate([
        { $match: { ...coQuery, status: { $in: approvedStates } } },
        { $group: { _id: null, total: { $sum: '$totalApprovedPaise' }, count: { $sum: 1 } } },
      ]),
      ChangeOrder.aggregate([
        { $match: { ...coQuery, status: { $in: pendingStates } } },
        { $group: { _id: null, total: { $sum: '$totalProposedPaise' }, count: { $sum: 1 } } },
      ]),
      ChangeOrder.aggregate([
        {
          $match: {
            ...coQuery,
            unapprovedExecution: true,
            status: { $nin: ['Approved', 'Invoiced', 'Paid'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalProposedPaise' }, count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { ...invoiceQuery, status: { $nin: ['Cancelled'] } } },
        {
          $group: {
            _id: null,
            totalBilled: { $sum: '$totalAmountPaise' },
            totalPaid: { $sum: '$amountPaidPaise' },
            balanceDue: { $sum: '$balanceDuePaise' },
          },
        },
      ]),
      Payment.aggregate([
        { $match: paymentQuery },
        { $group: { _id: null, totalRealised: { $sum: '$amountPaise' } } },
      ]),
      ChangeOrder.aggregate([
        { $match: coQuery },
        {
          $group: {
            _id: '$category',
            totalProposed: { $sum: '$totalProposedPaise' },
            totalApproved: { $sum: '$totalApprovedPaise' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const approvedVariationsPaise = approvedCoAgg[0]?.total || 0;
    const pendingApprovalPaise = pendingCoAgg[0]?.total || 0;
    const unapprovedWorkExposurePaise = unapprovedWorkAgg[0]?.total || 0;
    const revisedContractTotalPaise = totalContractBaselinePaise + approvedVariationsPaise;

    const invoicedReceivablesPaise = invoicesAgg[0]?.balanceDue || 0;
    const totalBilledPaise = invoicesAgg[0]?.totalBilled || 0;
    const approvedUnbilledPaise = Math.max(0, approvedVariationsPaise - totalBilledPaise);
    const realisedCashflowPaise = paymentsAgg[0]?.totalRealised || 0;

    // Per-project breakdown
    const projectBreakdown = await Promise.all(
      projects.map(async (p) => {
        const [projApproved, projPending, projUnapproved, projInvoices] = await Promise.all([
          ChangeOrder.aggregate([
            { $match: { project: p._id, status: { $in: approvedStates } } },
            { $group: { _id: null, total: { $sum: '$totalApprovedPaise' } } },
          ]),
          ChangeOrder.aggregate([
            { $match: { project: p._id, status: { $in: pendingStates } } },
            { $group: { _id: null, total: { $sum: '$totalProposedPaise' } } },
          ]),
          ChangeOrder.aggregate([
            {
              $match: {
                project: p._id,
                unapprovedExecution: true,
                status: { $nin: ['Approved', 'Invoiced', 'Paid'] },
              },
            },
            { $group: { _id: null, total: { $sum: '$totalProposedPaise' } } },
          ]),
          Invoice.aggregate([
            { $match: { project: p._id, status: { $nin: ['Cancelled'] } } },
            { $group: { _id: null, balanceDue: { $sum: '$balanceDuePaise' } } },
          ]),
        ]);

        const pApproved = projApproved[0]?.total || 0;
        const pPending = projPending[0]?.total || 0;
        const pUnapproved = projUnapproved[0]?.total || 0;
        const pReceivables = projInvoices[0]?.balanceDue || 0;

        return {
          _id: p._id,
          name: p.name,
          code: p.code,
          originalContractPaise: p.originalContractPaise,
          approvedVariationsPaise: pApproved,
          revisedContractTotalPaise: p.originalContractPaise + pApproved,
          pendingApprovalPaise: pPending,
          unapprovedWorkExposurePaise: pUnapproved,
          invoicedReceivablesPaise: pReceivables,
          status: p.status,
        };
      })
    );

    sendSuccess(res, {
      summary: {
        totalContractBaselinePaise,
        approvedVariationsPaise,
        revisedContractTotalPaise,
        pendingApprovalPaise,
        unapprovedWorkExposurePaise,
        approvedUnbilledPaise,
        invoicedReceivablesPaise,
        realisedCashflowPaise,
      },
      projectBreakdown,
      categoryDistribution: categoryAgg.map((c) => ({
        category: c._id,
        totalProposedPaise: c.totalProposed,
        totalApprovedPaise: c.totalApproved,
        count: c.count,
      })),
    });
  } catch (error: any) {
    console.error('[GetFinancialExposure] Error:', error);
    sendError(res, 'FETCH_EXPOSURE_FAILED', error.message || 'Failed to calculate financial exposure', 500);
  }
}

