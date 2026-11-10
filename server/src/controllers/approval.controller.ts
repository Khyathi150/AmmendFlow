import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ChangeOrder, ChangeOrderStatus } from '../models/ChangeOrder.js';
import { Approval, ApprovalStage, ApprovalDecision } from '../models/Approval.js';
import { CostEstimate } from '../models/CostEstimate.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';
import { z } from 'zod';

const approvalSchema = z.object({
  stage: z.enum(['Technical Review', 'Commercial Review', 'Internal Approval', 'Client Approval']),
  decision: z.enum(['Approved', 'Rejected', 'Changes Requested']),
  comments: z.string().min(5, 'Review comments must be at least 5 characters').trim(),
});

export async function recordApprovalDecision(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const parseResult = approvalSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const { stage, decision, comments } = parseResult.data;
    const userRole = req.userRole;

    const changeOrder = await ChangeOrder.findOne({ _id: id, organization: req.orgId });
    if (!changeOrder) {
      sendError(res, 'NOT_FOUND', 'Change order not found', 404);
      return;
    }

    // Role gate verification for approval stages
    if (stage === 'Technical Review' && !['owner', 'admin', 'project_manager'].includes(userRole || '')) {
      sendError(res, 'FORBIDDEN', 'Technical Review can only be conducted by Project Managers or Administrators', 403);
      return;
    }
    if (stage === 'Commercial Review' && !['owner', 'admin', 'commercial_manager'].includes(userRole || '')) {
      sendError(res, 'FORBIDDEN', 'Commercial Review can only be conducted by Commercial Managers or Administrators', 403);
      return;
    }
    if (stage === 'Internal Approval' && !['owner', 'admin'].includes(userRole || '')) {
      sendError(res, 'FORBIDDEN', 'Internal Approval can only be authorized by Organization Owners or Admins', 403);
      return;
    }
    if (stage === 'Client Approval' && userRole !== 'client_approver' && userRole !== 'owner') {
      sendError(res, 'FORBIDDEN', 'Client Approval stage can only be decided by appointed Client Approvers', 403);
      return;
    }

    const previousStatus = changeOrder.status;
    let newStatus: ChangeOrderStatus = previousStatus;

    if (decision === 'Rejected') {
      newStatus = 'Rejected';
    } else if (decision === 'Changes Requested') {
      newStatus = 'Changes Requested';
    } else if (decision === 'Approved') {
      switch (stage) {
        case 'Technical Review':
          newStatus = 'Commercial Review';
          break;
        case 'Commercial Review':
          newStatus = 'Internal Approval';
          break;
        case 'Internal Approval':
          newStatus = 'Client Approval';
          break;
        case 'Client Approval':
          newStatus = 'Approved';
          // Formal client approval locks the financial amount
          changeOrder.totalApprovedPaise = changeOrder.totalProposedPaise;
          // Freeze active estimate snapshot
          if (changeOrder.activeEstimateId) {
            await CostEstimate.findByIdAndUpdate(changeOrder.activeEstimateId, { isFrozen: true });
          }
          break;
      }
    }

    changeOrder.status = newStatus;
    await changeOrder.save();

    // Record formal Approval document
    const approval = new Approval({
      changeOrder: changeOrder._id,
      stage: stage as ApprovalStage,
      approver: req.user?._id,
      decision: decision as ApprovalDecision,
      comments,
      previousStatus,
      newStatus,
    });
    await approval.save();

    // Append to ActivityLog
    await ActivityLog.create({
      organization: req.orgId,
      project: changeOrder.project,
      entityType: 'Approval',
      entityId: approval._id,
      actor: req.user?._id,
      action: `DECISION_${decision.toUpperCase()}`,
      summary: `[${stage}] decision "${decision}" recorded by ${req.user?.name}. Status shifted from ${previousStatus} ➔ ${newStatus}. Comments: "${comments}"`,
    });

    sendSuccess(
      res,
      { changeOrder, approval },
      200,
      `Approval decision "${decision}" recorded successfully.`
    );
  } catch (error: any) {
    console.error('[RecordApproval] Error:', error);
    sendError(res, 'APPROVAL_ERROR', error.message || 'Failed to record approval decision', 500);
  }
}

export async function getApprovalsForOrder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      sendError(res, 'INVALID_ID', 'Invalid change order identifier', 400);
      return;
    }

    const changeOrder = await ChangeOrder.findOne({ _id: id, organization: req.orgId });
    if (!changeOrder) {
      sendError(res, 'NOT_FOUND', 'Change order not found in current organization', 404);
      return;
    }

    const approvals = await Approval.find({ changeOrder: id })
      .sort({ signedAt: 1 })
      .populate('approver', 'name email');

    sendSuccess(res, { approvals });
  } catch (error: any) {
    console.error('[GetApprovals] Error:', error);
    sendError(res, 'FETCH_APPROVALS_FAILED', error.message || 'Failed to fetch approval history', 500);
  }
}

