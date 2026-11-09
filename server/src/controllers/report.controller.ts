import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ChangeOrder } from '../models/ChangeOrder.js';
import { Project } from '../models/Project.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';

export async function getVariationRegister(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.orgId;
    const { projectId, format } = req.query;

    const query: any = { organization: orgId };
    if (projectId && Types.ObjectId.isValid(projectId as string)) {
      query.project = new Types.ObjectId(projectId as string);
    }

    const changeOrders = await ChangeOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('project', 'name code clientName')
      .populate('requestedBy', 'name email');

    // If format is CSV, stream CSV file directly
    if (format === 'csv') {
      const headers = [
        'Order Number',
        'Project Code',
        'Project Name',
        'Title',
        'Category',
        'Priority',
        'Originating Party',
        'Request Date',
        'Schedule Delay (Days)',
        'Proposed Amount (INR)',
        'Approved Amount (INR)',
        'Status',
        'Unapproved Execution',
        'Unapproved Justification',
      ];

      const csvRows = [headers.join(',')];

      changeOrders.forEach((co: any) => {
        const proj = co.project || {};
        const row = [
          `"${co.orderNumber}"`,
          `"${proj.code || ''}"`,
          `"${(proj.name || '').replace(/"/g, '""')}"`,
          `"${co.title.replace(/"/g, '""')}"`,
          `"${co.category}"`,
          `"${co.priority}"`,
          `"${co.originatingParty}"`,
          `"${new Date(co.requestDate || co.createdAt).toISOString().split('T')[0]}"`,
          co.scheduleImpactDays || 0,
          ((co.totalProposedPaise || 0) / 100).toFixed(2),
          ((co.totalApprovedPaise || 0) / 100).toFixed(2),
          `"${co.status}"`,
          co.unapprovedExecution ? 'YES' : 'NO',
          `"${(co.unapprovedJustification || '').replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="Variation-Register.csv"');
      res.status(200).send(csvRows.join('\n'));
      return;
    }

    sendSuccess(res, { changeOrders });
  } catch (error: any) {
    console.error('[GetVariationRegister] Error:', error);
    sendError(res, 'REPORT_FAILED', error.message || 'Failed to generate variation register', 500);
  }
}
