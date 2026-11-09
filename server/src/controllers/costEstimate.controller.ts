import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { CostEstimate } from '../models/CostEstimate.js';
import { ChangeOrder } from '../models/ChangeOrder.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';
import { calculateEstimateTotals } from '../utils/currencyMath.js';

export async function saveEstimate(req: Request, res: Response): Promise<void> {
  try {
    const { changeOrderId } = req.params;
    const { items, overheadPct = 10, markupPct = 15, taxPct = 18, notes } = req.body;

    if (!Types.ObjectId.isValid(changeOrderId)) {
      sendError(res, 'INVALID_ID', 'Invalid change order identifier', 400);
      return;
    }

    const changeOrder = await ChangeOrder.findOne({
      _id: changeOrderId,
      organization: req.orgId,
    });

    if (!changeOrder) {
      sendError(res, 'NOT_FOUND', 'Change order not found', 404);
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      sendError(res, 'INVALID_ITEMS', 'Estimate must contain at least one line item', 400);
      return;
    }

    // Format line items to integer paise
    const formattedItems = items.map((it: any) => {
      const rateRupees = parseFloat(it.unitRateRupees || it.unitRate) || 0;
      const ratePaise = Math.round(rateRupees * 100);
      const qty = parseFloat(it.quantity) || 0;
      const total = Math.round(qty * ratePaise);

      return {
        description: String(it.description || 'Line Item').trim(),
        category: it.category || 'Material',
        quantity: qty,
        unit: String(it.unit || 'nos').trim(),
        unitRatePaise: ratePaise,
        totalPaise: total,
        boqItemRef: it.boqItemRef && Types.ObjectId.isValid(it.boqItemRef)
          ? new Types.ObjectId(it.boqItemRef)
          : undefined,
      };
    });

    const directCost = formattedItems.reduce((acc, it) => acc + it.totalPaise, 0);
    const totals = calculateEstimateTotals(directCost, overheadPct, markupPct, taxPct);

    // Check existing versions
    const existingEstimates = await CostEstimate.find({ changeOrder: changeOrder._id }).sort({
      version: -1,
    });
    const latestVersion = existingEstimates[0]?.version || 0;

    let targetEstimate: any = null;

    // If latest version exists and is NOT frozen, we can update it; otherwise create next version
    if (existingEstimates.length > 0 && !existingEstimates[0].isFrozen) {
      targetEstimate = existingEstimates[0];
      targetEstimate.items = formattedItems;
      targetEstimate.directCostPaise = totals.directCostPaise;
      targetEstimate.overheadPct = totals.overheadPct;
      targetEstimate.overheadPaise = totals.overheadPaise;
      targetEstimate.markupPct = totals.markupPct;
      targetEstimate.markupPaise = totals.markupPaise;
      targetEstimate.taxPct = totals.taxPct;
      targetEstimate.taxablePaise = totals.taxablePaise;
      targetEstimate.taxPaise = totals.taxPaise;
      targetEstimate.totalProposedPaise = totals.totalProposedPaise;
      targetEstimate.notes = notes;
      targetEstimate.preparedBy = req.user?._id;
      await targetEstimate.save();
    } else {
      targetEstimate = new CostEstimate({
        changeOrder: changeOrder._id,
        version: latestVersion + 1,
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
        preparedBy: req.user?._id,
        notes,
      });
      await targetEstimate.save();
    }

    changeOrder.activeEstimateId = targetEstimate._id;
    changeOrder.totalProposedPaise = totals.totalProposedPaise;
    await changeOrder.save();

    await ActivityLog.create({
      organization: req.orgId,
      project: changeOrder.project,
      entityType: 'CostEstimate',
      entityId: targetEstimate._id,
      actor: req.user?._id,
      action: 'ESTIMATE_UPDATED',
      summary: `Cost Estimate v${targetEstimate.version} formulated for ${changeOrder.orderNumber}. Proposed total: ₹${(totals.totalProposedPaise / 100).toLocaleString('en-IN')}`,
    });

    sendSuccess(res, { estimate: targetEstimate }, 200, 'Cost estimate calculated and saved');
  } catch (error: any) {
    console.error('[SaveEstimate] Error:', error);
    sendError(res, 'SAVE_ESTIMATE_FAILED', error.message || 'Failed to save cost estimate', 500);
  }
}

export async function getEstimates(req: Request, res: Response): Promise<void> {
  try {
    const { changeOrderId } = req.params;
    const estimates = await CostEstimate.find({ changeOrder: changeOrderId })
      .sort({ version: -1 })
      .populate('preparedBy', 'name email');

    sendSuccess(res, { estimates });
  } catch (error: any) {
    console.error('[GetEstimates] Error:', error);
    sendError(res, 'FETCH_ESTIMATES_FAILED', error.message || 'Failed to fetch estimates', 500);
  }
}

