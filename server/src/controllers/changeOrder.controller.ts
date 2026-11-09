import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ChangeOrder } from '../models/ChangeOrder.js';
import { Project } from '../models/Project.js';
import { CostEstimate } from '../models/CostEstimate.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Approval } from '../models/Approval.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';
import {
  createChangeOrderSchema,
  updateChangeOrderSchema,
  authorizeExecutionSchema,
} from '../validators/changeOrder.validator.js';
import { calculateEstimateTotals } from '../utils/currencyMath.js';

export async function getChangeOrders(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.orgId;
    const {
      projectId,
      status,
      category,
      priority,
      unapprovedOnly,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query: any = { organization: orgId };

    if (projectId && Types.ObjectId.isValid(projectId as string)) {
      query.project = new Types.ObjectId(projectId as string);
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (unapprovedOnly === 'true') {
      query.unapprovedExecution = true;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search as string, $options: 'i' } },
        { title: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
        { reason: { $regex: search as string, $options: 'i' } },
      ];
    }

    const [changeOrders, total] = await Promise.all([
      ChangeOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('project', 'name code clientName')
        .populate('requestedBy', 'name email'),
      ChangeOrder.countDocuments(query),
    ]);

    // Financial aggregates for query
    const statsAgg = await ChangeOrder.aggregate([
      { $match: { organization: orgId } },
      {
        $group: {
          _id: null,
          totalProposed: { $sum: '$totalProposedPaise' },
          totalApproved: { $sum: '$totalApprovedPaise' },
          unapprovedWorkCount: {
            $sum: { $cond: [{ $eq: ['$unapprovedExecution', true] }, 1, 0] },
          },
        },
      },
    ]);

    sendSuccess(
      res,
      {
        changeOrders,
        summary: statsAgg[0] || {
          totalProposed: 0,
          totalApproved: 0,
          unapprovedWorkCount: 0,
        },
      },
      200,
      undefined,
      {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      }
    );
  } catch (error: any) {
    console.error('[GetChangeOrders] Error:', error);
    sendError(res, 'FETCH_ORDERS_FAILED', error.message || 'Failed to retrieve change orders', 500);
  }
}

export async function getChangeOrderById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      sendError(res, 'INVALID_ID', 'Invalid change order identifier', 400);
      return;
    }

    const changeOrder = await ChangeOrder.findOne({ _id: id, organization: req.orgId })
      .populate('project')
      .populate('requestedBy', 'name email phone avatarUrl')
      .populate('unapprovedAuthorizedBy', 'name email')
      .populate('linkedBoqItemIds')
      .populate('activeEstimateId');

    if (!changeOrder) {
      sendError(res, 'NOT_FOUND', 'Change order not found in current organization', 404);
      return;
    }

    // Fetch approval history
    const approvals = await Approval.find({ changeOrder: changeOrder._id })
      .sort({ signedAt: 1 })
      .populate('approver', 'name email');

    // Fetch all cost estimate versions
    const estimates = await CostEstimate.find({ changeOrder: changeOrder._id })
      .sort({ version: -1 })
      .populate('preparedBy', 'name email');

    // Fetch activity trail
    const activityLogs = await ActivityLog.find({
      entityId: changeOrder._id,
      entityType: 'ChangeOrder',
    })
      .sort({ createdAt: -1 })
      .populate('actor', 'name email');

    sendSuccess(res, {
      changeOrder,
      approvals,
      estimates,
      activityLogs,
    });
  } catch (error: any) {
    console.error('[GetChangeOrderById] Error:', error);
    sendError(res, 'FETCH_ORDER_FAILED', error.message || 'Failed to retrieve change order details', 500);
  }
}

export async function createChangeOrder(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = createChangeOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const data = parseResult.data;
    const orgId = req.orgId!;
    const userId = req.user!._id;

    const project = await Project.findOne({ _id: data.projectId, organization: orgId });
    if (!project) {
      sendError(res, 'NOT_FOUND', 'Target project not found', 404);
      return;
    }

    // Generate formatted sequential order number (e.g. CO-PRJ-001)
    const existingCount = await ChangeOrder.countDocuments({ project: project._id });
    const sequenceNum = String(existingCount + 1).padStart(3, '0');
    const orderNumber = `CO-${project.code}-${sequenceNum}`;

    // Process cost estimate line items if provided
    let totalProposedPaise = 0;
    const estimateInput = data.estimate;

    const changeOrder = new ChangeOrder({
      organization: orgId,
      project: project._id,
      orderNumber,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      requestedBy: userId,
      originatingParty: data.originatingParty,
      reason: data.reason,
      scheduleImpactDays: data.scheduleImpactDays,
      status: data.isDraft ? 'Draft' : 'Submitted',
      linkedBoqItemIds: data.linkedBoqItemIds?.map((id) => new Types.ObjectId(id)) || [],
    });

    await changeOrder.save();

    if (estimateInput && estimateInput.items && estimateInput.items.length > 0) {
      // Convert line items to integer paise
      const formattedItems = estimateInput.items.map((it) => {
        const ratePaise = Math.round(it.unitRateRupees * 100);
        const lineTotal = Math.round(it.quantity * ratePaise);
        return {
          description: it.description,
          category: it.category,
          quantity: it.quantity,
          unit: it.unit,
          unitRatePaise: ratePaise,
          totalPaise: lineTotal,
          boqItemRef: it.boqItemRef && Types.ObjectId.isValid(it.boqItemRef)
            ? new Types.ObjectId(it.boqItemRef)
            : undefined,
        };
      });

      const directCost = formattedItems.reduce((acc, it) => acc + it.totalPaise, 0);
      const totals = calculateEstimateTotals(
        directCost,
        estimateInput.overheadPct,
        estimateInput.markupPct,
        estimateInput.taxPct
      );

      totalProposedPaise = totals.totalProposedPaise;

      const estimate = new CostEstimate({
        changeOrder: changeOrder._id,
        version: 1,
        items: formattedItems,
        directCostPaise: totals.directCostPaise,
        overheadPct: totals.overheadPct,
        overheadPaise: totals.overheadPaise,
        markupPct: totals.markupPct,
        markupPaise: totals.markupPaise,
        taxPct: totals.taxPct,
        taxablePaise: totals.taxablePaise,
        taxPaise: totals.taxPaise,
        totalProposedPaise: totals.totalProposedPaise,
        preparedBy: userId,
        notes: estimateInput.notes,
      });

      await estimate.save();
      changeOrder.activeEstimateId = estimate._id;
      changeOrder.totalProposedPaise = totalProposedPaise;
      await changeOrder.save();
    }

    // Append to ActivityLog
    await ActivityLog.create({
      organization: orgId,
      project: project._id,
      entityType: 'ChangeOrder',
      entityId: changeOrder._id,
      actor: userId,
      action: data.isDraft ? 'DRAFT_CREATED' : 'SUBMITTED',
      summary: `Change Order ${orderNumber} "${changeOrder.title}" was ${data.isDraft ? 'saved as draft' : 'submitted for technical review'}. Proposed amount: ₹${(totalProposedPaise / 100).toLocaleString('en-IN')}`,
    });

    sendSuccess(res, { changeOrder }, 201, 'Change order created successfully');
  } catch (error: any) {
    console.error('[CreateChangeOrder] Error:', error);
    sendError(res, 'CREATE_ORDER_FAILED', error.message || 'Failed to create change order', 500);
  }
}

export async function submitChangeOrder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const changeOrder = await ChangeOrder.findOne({ _id: id, organization: req.orgId });

    if (!changeOrder) {
      sendError(res, 'NOT_FOUND', 'Change order not found', 404);
      return;
    }

    if (changeOrder.status !== 'Draft' && changeOrder.status !== 'Changes Requested') {
      sendError(
        res,
        'INVALID_TRANSITION',
        `Cannot submit change order currently in "${changeOrder.status}" state`,
        422
      );
      return;
    }

    changeOrder.status = 'Submitted';
    await changeOrder.save();

    await ActivityLog.create({
      organization: req.orgId,
      project: changeOrder.project,
      entityType: 'ChangeOrder',
      entityId: changeOrder._id,
      actor: req.user?._id,
      action: 'SUBMITTED',
      summary: `Change Order ${changeOrder.orderNumber} was submitted for technical & commercial review.`,
    });

    sendSuccess(res, { changeOrder }, 200, 'Change order submitted for review');
  } catch (error: any) {
    console.error('[SubmitChangeOrder] Error:', error);
    sendError(res, 'SUBMIT_ORDER_FAILED', error.message || 'Failed to submit change order', 500);
  }
}

export async function authorizeExecution(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const parseResult = authorizeExecutionSchema.safeParse(req.body);
    const { unapprovedJustification } = parseResult.success ? parseResult.data : { unapprovedJustification: undefined };

    const changeOrder = await ChangeOrder.findOne({ _id: id, organization: req.orgId });
    if (!changeOrder) {
      sendError(res, 'NOT_FOUND', 'Change order not found', 404);
      return;
    }

    const isClientApproved = changeOrder.status === 'Approved';

    // If authorizing BEFORE formal client approval, require mandatory non-empty justification
    if (!isClientApproved) {
      if (!unapprovedJustification || unapprovedJustification.trim().length < 10) {
        sendError(
          res,
          'UNAPPROVED_JUSTIFICATION_REQUIRED',
          'Authorizing work execution prior to client approval requires a detailed mandatory justification explaining why execution cannot be delayed.',
          422,
          [{ field: 'unapprovedJustification', message: 'Must be at least 10 characters' }]
        );
        return;
      }

      changeOrder.unapprovedExecution = true;
      changeOrder.unapprovedJustification = unapprovedJustification.trim();
      changeOrder.unapprovedAuthorizedBy = req.user?._id;
      changeOrder.unapprovedAuthorizedAt = new Date();
    }

    changeOrder.status = 'Authorised for Execution';
    await changeOrder.save();

    await ActivityLog.create({
      organization: req.orgId,
      project: changeOrder.project,
      entityType: 'ChangeOrder',
      entityId: changeOrder._id,
      actor: req.user?._id,
      action: 'EXECUTION_AUTHORISED',
      summary: isClientApproved
        ? `Execution formally authorized following client approval for ${changeOrder.orderNumber}`
        : `CRITICAL: Unapproved site execution authorized by ${req.user?.name} for ${changeOrder.orderNumber}. Reason: "${unapprovedJustification}"`,
    });

    sendSuccess(
      res,
      { changeOrder },
      200,
      isClientApproved
        ? 'Work execution formally authorized'
        : 'Work execution authorized without client approval and flagged under unapproved exposure risk'
    );
  } catch (error: any) {
    console.error('[AuthorizeExecution] Error:', error);
    sendError(res, 'AUTHORIZE_FAILED', error.message || 'Failed to authorize work execution', 500);
  }
}

export async function startWork(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const changeOrder = await ChangeOrder.findOne({ _id: id, organization: req.orgId });
    if (!changeOrder) {
      sendError(res, 'NOT_FOUND', 'Change order not found', 404);
      return;
    }

    if (changeOrder.status !== 'Authorised for Execution') {
      sendError(
        res,
        'INVALID_STATE',
        `Work cannot be started from current status: "${changeOrder.status}"`,
        422
      );
      return;
    }

    changeOrder.status = 'In Progress';
    await changeOrder.save();

    await ActivityLog.create({
      organization: req.orgId,
      project: changeOrder.project,
      entityType: 'ChangeOrder',
      entityId: changeOrder._id,
      actor: req.user?._id,
      action: 'WORK_STARTED',
      summary: `Physical work commenced on site for ${changeOrder.orderNumber}`,
    });

    sendSuccess(res, { changeOrder }, 200, 'Physical work marked In Progress on site');
  } catch (error: any) {
    console.error('[StartWork] Error:', error);
    sendError(res, 'START_WORK_FAILED', error.message || 'Failed to record work start', 500);
  }
}

export async function completeWork(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const changeOrder = await ChangeOrder.findOne({ _id: id, organization: req.orgId });
    if (!changeOrder) {
      sendError(res, 'NOT_FOUND', 'Change order not found', 404);
      return;
    }

    if (changeOrder.status !== 'In Progress') {
      sendError(
        res,
        'INVALID_STATE',
        `Work cannot be marked completed from current status: "${changeOrder.status}"`,
        422
      );
      return;
    }

    changeOrder.status = 'Completed';
    await changeOrder.save();

    await ActivityLog.create({
      organization: req.orgId,
      project: changeOrder.project,
      entityType: 'ChangeOrder',
      entityId: changeOrder._id,
      actor: req.user?._id,
      action: 'WORK_COMPLETED',
      summary: `Physical work completed on site for ${changeOrder.orderNumber}. Ready for commercial invoicing.`,
    });

    sendSuccess(res, { changeOrder }, 200, 'Variation work verified and marked Completed');
  } catch (error: any) {
    console.error('[CompleteWork] Error:', error);
    sendError(res, 'COMPLETE_WORK_FAILED', error.message || 'Failed to complete work', 500);
  }
}
