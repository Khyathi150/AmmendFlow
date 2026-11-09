import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { BOQItem } from '../models/BOQItem.js';
import { Project } from '../models/Project.js';
import { CostEstimate } from '../models/CostEstimate.js';
import { ChangeOrder } from '../models/ChangeOrder.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';
import { createBOQItemSchema, updateBOQItemSchema } from '../validators/boq.validator.js';

export async function getProjectBOQ(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const { category, search } = req.query;

    if (!Types.ObjectId.isValid(projectId)) {
      sendError(res, 'INVALID_ID', 'Invalid project identifier', 400);
      return;
    }

    const project = await Project.findOne({ _id: projectId, organization: req.orgId });
    if (!project) {
      sendError(res, 'NOT_FOUND', 'Project not found', 404);
      return;
    }

    const query: any = { project: project._id, organization: req.orgId };
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { itemCode: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
        { notes: { $regex: search as string, $options: 'i' } },
      ];
    }

    const boqItems = await BOQItem.find(query).sort({ itemCode: 1 });

    // Aggregate approved variations that reference these BOQ items
    const approvedOrders = await ChangeOrder.find({
      project: project._id,
      status: {
        $in: [
          'Approved',
          'Authorised for Execution',
          'In Progress',
          'Completed',
          'Ready for Invoicing',
          'Invoiced',
          'Paid',
        ],
      },
    }).select('activeEstimateId');

    const estimateIds = approvedOrders
      .map((o) => o.activeEstimateId)
      .filter((id): id is Types.ObjectId => Boolean(id));

    // Find line items in those approved estimates that reference BOQ items
    const variationEstimates = await CostEstimate.find({
      _id: { $in: estimateIds },
    });

    const boqVarianceMap = new Map<string, number>();
    variationEstimates.forEach((est) => {
      est.items.forEach((item) => {
        if (item.boqItemRef) {
          const key = item.boqItemRef.toString();
          const prev = boqVarianceMap.get(key) || 0;
          boqVarianceMap.set(key, prev + (item.quantity || 0));
        }
      });
    });

    // Compute augmented items with revised quantities and variance
    let totalBaselineAmountPaise = 0;
    let totalRevisedAmountPaise = 0;

    const augmentedItems = boqItems.map((item) => {
      const variationQty = boqVarianceMap.get(item._id.toString()) || 0;
      const revisedQuantity = item.baselineQuantity + variationQty;
      const revisedAmountPaise = Math.round(revisedQuantity * item.unitRatePaise);

      totalBaselineAmountPaise += item.baselineAmountPaise;
      totalRevisedAmountPaise += revisedAmountPaise;

      return {
        ...item.toObject(),
        variationQuantity: variationQty,
        revisedQuantity,
        revisedAmountPaise,
        hasVariation: variationQty !== 0,
      };
    });

    sendSuccess(res, {
      items: augmentedItems,
      project: {
        _id: project._id,
        name: project.name,
        code: project.code,
        originalContractPaise: project.originalContractPaise,
      },
      summary: {
        itemCount: boqItems.length,
        totalBaselineAmountPaise,
        totalRevisedAmountPaise,
        netVariancePaise: totalRevisedAmountPaise - totalBaselineAmountPaise,
      },
    });
  } catch (error: any) {
    console.error('[GetProjectBOQ] Error:', error);
    sendError(res, 'FETCH_BOQ_FAILED', error.message || 'Failed to retrieve BOQ schedule', 500);
  }
}

export async function createBOQItem(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    if (!Types.ObjectId.isValid(projectId)) {
      sendError(res, 'INVALID_ID', 'Invalid project identifier', 400);
      return;
    }

    const parseResult = createBOQItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const project = await Project.findOne({ _id: projectId, organization: req.orgId });
    if (!project) {
      sendError(res, 'NOT_FOUND', 'Project not found', 404);
      return;
    }

    const data = parseResult.data;
    const existing = await BOQItem.findOne({ project: project._id, itemCode: data.itemCode });
    if (existing) {
      sendError(res, 'DUPLICATE_ITEM_CODE', `BOQ item code ${data.itemCode} already exists for this project`, 409);
      return;
    }

    const baselineAmountPaise = Math.round(data.baselineQuantity * data.unitRatePaise);

    const boqItem = new BOQItem({
      ...data,
      organization: req.orgId,
      project: project._id,
      baselineAmountPaise,
      isLocked: false,
    });

    await boqItem.save();
    sendSuccess(res, { boqItem }, 201, 'BOQ item created');
  } catch (error: any) {
    console.error('[CreateBOQItem] Error:', error);
    sendError(res, 'CREATE_BOQ_FAILED', error.message || 'Failed to create BOQ item', 500);
  }
}

export async function updateBOQItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      sendError(res, 'INVALID_ID', 'Invalid item identifier', 400);
      return;
    }

    const item = await BOQItem.findOne({ _id: id, organization: req.orgId });
    if (!item) {
      sendError(res, 'NOT_FOUND', 'BOQ item not found', 404);
      return;
    }

    if (item.isLocked) {
      sendError(
        res,
        'BASELINE_LOCKED',
        'This BOQ item is part of the finalized contract baseline and cannot be modified directly. Scope adjustments must be processed as Change Orders.',
        422
      );
      return;
    }

    const parseResult = updateBOQItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const data = parseResult.data;
    if (data.baselineQuantity !== undefined || data.unitRatePaise !== undefined) {
      const q = data.baselineQuantity ?? item.baselineQuantity;
      const r = data.unitRatePaise ?? item.unitRatePaise;
      (data as any).baselineAmountPaise = Math.round(q * r);
    }

    const updated = await BOQItem.findByIdAndUpdate(id, { $set: data }, { new: true });
    sendSuccess(res, { boqItem: updated }, 200, 'BOQ item updated');
  } catch (error: any) {
    console.error('[UpdateBOQItem] Error:', error);
    sendError(res, 'UPDATE_BOQ_FAILED', error.message || 'Failed to update BOQ item', 500);
  }
}

export async function lockProjectBaseline(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    if (!Types.ObjectId.isValid(projectId)) {
      sendError(res, 'INVALID_ID', 'Invalid project identifier', 400);
      return;
    }

    const project = await Project.findOne({ _id: projectId, organization: req.orgId });
    if (!project) {
      sendError(res, 'NOT_FOUND', 'Project not found', 404);
      return;
    }

    const result = await BOQItem.updateMany(
      { project: project._id, organization: req.orgId },
      { $set: { isLocked: true } }
    );

    await ActivityLog.create({
      organization: req.orgId,
      project: project._id,
      entityType: 'BOQItem',
      entityId: project._id,
      actor: req.user?._id,
      action: 'BASELINE_LOCKED',
      summary: `Contract Baseline locked for "${project.name}". ${result.modifiedCount} items marked immutable.`,
    });

    sendSuccess(
      res,
      { lockedCount: result.modifiedCount },
      200,
      `Contract Baseline locked successfully. All ${result.modifiedCount} items are now immutable.`
    );
  } catch (error: any) {
    console.error('[LockBaseline] Error:', error);
    sendError(res, 'LOCK_BASELINE_FAILED', error.message || 'Failed to lock baseline', 500);
  }
}

export async function importBOQCSV(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      sendError(res, 'INVALID_PAYLOAD', 'Please provide an array of BOQ rows to import', 400);
      return;
    }

    const project = await Project.findOne({ _id: projectId, organization: req.orgId });
    if (!project) {
      sendError(res, 'NOT_FOUND', 'Project not found', 404);
      return;
    }

    const docsToInsert = [];
    for (const row of rows) {
      const q = parseFloat(row.baselineQuantity || row.quantity) || 0;
      const rateRupees = parseFloat(row.unitRateRupees || row.rate || row.unitRate) || 0;
      const ratePaise = Math.round(rateRupees * 100);
      const amountPaise = Math.round(q * ratePaise);

      docsToInsert.push({
        organization: req.orgId,
        project: project._id,
        itemCode: String(row.itemCode || row.code || `ITEM-${docsToInsert.length + 1}`).trim(),
        description: String(row.description || 'Imported Line Item').trim(),
        category: row.category || 'General',
        unit: String(row.unit || 'nos').trim(),
        baselineQuantity: q,
        unitRatePaise: ratePaise,
        baselineAmountPaise: amountPaise,
        isLocked: false,
        notes: row.notes || 'Imported via CSV',
      });
    }

    const inserted = await BOQItem.insertMany(docsToInsert);
    sendSuccess(res, { count: inserted.length }, 201, `Imported ${inserted.length} BOQ items successfully`);
  } catch (error: any) {
    console.error('[ImportBOQ] Error:', error);
    sendError(res, 'IMPORT_FAILED', error.message || 'Failed to import BOQ schedule', 500);
  }
}

export async function exportBOQCSV(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ _id: projectId, organization: req.orgId });
    if (!project) {
      sendError(res, 'NOT_FOUND', 'Project not found', 404);
      return;
    }

    const items = await BOQItem.find({ project: project._id }).sort({ itemCode: 1 });

    const headers = [
      'Item Code',
      'Category',
      'Description',
      'Unit',
      'Baseline Quantity',
      'Unit Rate (INR)',
      'Baseline Amount (INR)',
      'Is Locked',
      'Notes',
    ];

    const csvRows = [headers.join(',')];
    items.forEach((item) => {
      const row = [
        `"${item.itemCode}"`,
        `"${item.category}"`,
        `"${item.description.replace(/"/g, '""')}"`,
        `"${item.unit}"`,
        item.baselineQuantity,
        (item.unitRatePaise / 100).toFixed(2),
        (item.baselineAmountPaise / 100).toFixed(2),
        item.isLocked ? 'Yes' : 'No',
        `"${(item.notes || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="BOQ-${project.code}.csv"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('[ExportBOQ] Error:', error);
    sendError(res, 'EXPORT_FAILED', error.message || 'Failed to export BOQ CSV', 500);
  }
}

