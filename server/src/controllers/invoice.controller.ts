import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { ChangeOrder } from '../models/ChangeOrder.js';
import { Project } from '../models/Project.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';
import { z } from 'zod';

const createInvoiceSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  changeOrderIds: z.array(z.string()).min(1, 'At least one change order must be included in billing'),
  invoiceNumber: z.string().min(1, 'Invoice number is required').trim().toUpperCase(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  subtotalRupees: z.number().min(0),
  taxRupees: z.number().min(0).default(0),
  notes: z.string().optional(),
});

const recordPaymentSchema = z.object({
  amountRupees: z.number().min(1, 'Payment amount must be greater than zero'),
  paymentDate: z.string(),
  paymentMethod: z.enum(['Bank Transfer', 'NEFT', 'RTGS', 'Cheque', 'Letter of Credit', 'Other']),
  referenceNumber: z.string().min(2, 'Transaction reference number is required').trim(),
  notes: z.string().optional(),
});

export async function getInvoices(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.orgId;
    const { projectId, status, search, page = '1', limit = '20' } = req.query;

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
    if (search) {
      query.invoiceNumber = { $regex: search as string, $options: 'i' };
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('project', 'name code clientName')
        .populate('changeOrders', 'orderNumber title totalApprovedPaise')
        .populate('createdBy', 'name email'),
      Invoice.countDocuments(query),
    ]);

    // Financial totals for this invoice query
    const statsAgg = await Invoice.aggregate([
      { $match: { organization: orgId, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: '$totalAmountPaise' },
          totalPaid: { $sum: '$amountPaidPaise' },
          totalBalanceDue: { $sum: '$balanceDuePaise' },
        },
      },
    ]);

    sendSuccess(
      res,
      {
        invoices,
        summary: statsAgg[0] || {
          totalInvoiced: 0,
          totalPaid: 0,
          totalBalanceDue: 0,
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
    console.error('[GetInvoices] Error:', error);
    sendError(res, 'FETCH_INVOICES_FAILED', error.message || 'Failed to fetch invoices', 500);
  }
}

export async function getInvoiceById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      sendError(res, 'INVALID_ID', 'Invalid invoice identifier', 400);
      return;
    }

    const invoice = await Invoice.findOne({ _id: id, organization: req.orgId })
      .populate('project')
      .populate('changeOrders')
      .populate('createdBy', 'name email');

    if (!invoice) {
      sendError(res, 'NOT_FOUND', 'Invoice not found', 404);
      return;
    }

    const payments = await Payment.find({ invoice: invoice._id })
      .sort({ paymentDate: -1 })
      .populate('recordedBy', 'name email');

    sendSuccess(res, { invoice, payments });
  } catch (error: any) {
    console.error('[GetInvoiceById] Error:', error);
    sendError(res, 'FETCH_INVOICE_FAILED', error.message || 'Failed to fetch invoice details', 500);
  }
}

export async function createInvoice(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = createInvoiceSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const data = parseResult.data;
    const orgId = req.orgId!;

    const project = await Project.findOne({ _id: data.projectId, organization: orgId });
    if (!project) {
      sendError(res, 'NOT_FOUND', 'Target project not found', 404);
      return;
    }

    // Check unique invoice number within project
    const existingInv = await Invoice.findOne({ project: project._id, invoiceNumber: data.invoiceNumber });
    if (existingInv) {
      sendError(res, 'DUPLICATE_INVOICE', `Invoice number ${data.invoiceNumber} already exists for this project`, 409);
      return;
    }

    // Verify all change orders belong to project and are approved
    const changeOrderObjectIds = data.changeOrderIds.map((id) => new Types.ObjectId(id));
    const changeOrders = await ChangeOrder.find({
      _id: { $in: changeOrderObjectIds },
      project: project._id,
    });

    if (changeOrders.length !== changeOrderObjectIds.length) {
      sendError(res, 'INVALID_ORDERS', 'One or more change orders could not be found for this project', 400);
      return;
    }

    const unapprovedOrders = changeOrders.filter(
      (co) => !['Approved', 'Authorised for Execution', 'In Progress', 'Completed'].includes(co.status)
    );
    if (unapprovedOrders.length > 0) {
      sendError(
        res,
        'UNAPPROVED_ORDERS_INCLUDED',
        `Cannot issue invoice against unapproved change orders: [${unapprovedOrders.map((o) => o.orderNumber).join(', ')}]`,
        422
      );
      return;
    }

    const subtotalPaise = Math.round(data.subtotalRupees * 100);
    const taxPaise = Math.round(data.taxRupees * 100);
    const totalAmountPaise = subtotalPaise + taxPaise;

    const invoice = new Invoice({
      organization: orgId,
      project: project._id,
      changeOrders: changeOrderObjectIds,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: new Date(data.dueDate),
      subtotalPaise,
      taxPaise,
      totalAmountPaise,
      amountPaidPaise: 0,
      balanceDuePaise: totalAmountPaise,
      status: 'Issued',
      notes: data.notes,
      createdBy: req.user?._id,
    });

    await invoice.save();

    // Update Change Orders status to 'Invoiced' and record invoiced amounts
    for (const co of changeOrders) {
      co.status = 'Invoiced';
      co.invoicedAmountPaise = co.totalApprovedPaise;
      await co.save();
    }

    await ActivityLog.create({
      organization: orgId,
      project: project._id,
      entityType: 'Invoice',
      entityId: invoice._id,
      actor: req.user?._id,
      action: 'INVOICE_ISSUED',
      summary: `Variation Invoice ${invoice.invoiceNumber} issued for ₹${(totalAmountPaise / 100).toLocaleString('en-IN')}. Covers change orders: [${changeOrders.map((o) => o.orderNumber).join(', ')}]`,
    });

    sendSuccess(res, { invoice }, 201, 'Invoice created and issued successfully');
  } catch (error: any) {
    console.error('[CreateInvoice] Error:', error);
    sendError(res, 'CREATE_INVOICE_FAILED', error.message || 'Failed to create invoice', 500);
  }
}

export async function recordPayment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const parseResult = recordPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const { amountRupees, paymentDate, paymentMethod, referenceNumber, notes } = parseResult.data;
    const paymentPaise = Math.round(amountRupees * 100);

    const invoice = await Invoice.findOne({ _id: id, organization: req.orgId });
    if (!invoice) {
      sendError(res, 'NOT_FOUND', 'Invoice not found', 404);
      return;
    }

    if (invoice.balanceDuePaise <= 0) {
      sendError(res, 'ALREADY_PAID', 'This invoice is already settled in full.', 422);
      return;
    }

    if (paymentPaise > invoice.balanceDuePaise) {
      sendError(
        res,
        'OVERPAYMENT_NOT_ALLOWED',
        `Payment amount (₹${amountRupees}) exceeds current balance due of ₹${invoice.balanceDuePaise / 100}. Overpayment allocation is prohibited.`,
        422
      );
      return;
    }

    const payment = new Payment({
      invoice: invoice._id,
      organization: req.orgId,
      project: invoice.project,
      paymentDate: new Date(paymentDate),
      amountPaise: paymentPaise,
      paymentMethod,
      referenceNumber,
      notes,
      recordedBy: req.user?._id,
    });
    await payment.save();

    // Reconcile Invoice Balances
    invoice.amountPaidPaise += paymentPaise;
    invoice.balanceDuePaise = Math.max(0, invoice.totalAmountPaise - invoice.amountPaidPaise);

    if (invoice.balanceDuePaise === 0) {
      invoice.status = 'Paid';
      // Mark linked change orders as Paid
      await ChangeOrder.updateMany(
        { _id: { $in: invoice.changeOrders } },
        { $set: { status: 'Paid' } }
      );
    } else {
      invoice.status = 'Partially Paid';
    }
    await invoice.save();

    await ActivityLog.create({
      organization: req.orgId,
      project: invoice.project,
      entityType: 'Payment',
      entityId: payment._id,
      actor: req.user?._id,
      action: 'PAYMENT_RECORDED',
      summary: `Payment of ₹${amountRupees.toLocaleString('en-IN')} (${paymentMethod} Ref: ${referenceNumber}) received for Invoice ${invoice.invoiceNumber}. Remaining balance: ₹${(invoice.balanceDuePaise / 100).toLocaleString('en-IN')}`,
    });

    sendSuccess(
      res,
      { payment, invoice },
      201,
      invoice.status === 'Paid'
        ? 'Payment reconciled successfully. Invoice marked PAID IN FULL.'
        : `Payment reconciled. Remaining balance: ₹${(invoice.balanceDuePaise / 100).toLocaleString('en-IN')}`
    );
  } catch (error: any) {
    console.error('[RecordPayment] Error:', error);
    sendError(res, 'RECORD_PAYMENT_FAILED', error.message || 'Failed to record payment', 500);
  }
}
