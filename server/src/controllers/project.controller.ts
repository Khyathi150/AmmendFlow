import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { ChangeOrder } from '../models/ChangeOrder.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.orgId;
    const { status, search, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query: any = { organization: orgId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { code: { $regex: search as string, $options: 'i' } },
        { clientName: { $regex: search as string, $options: 'i' } },
        { 'location.city': { $regex: search as string, $options: 'i' } },
      ];
    }

    const [projects, total] = await Promise.all([
      Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Project.countDocuments(query),
    ]);

    // Augment with approved variation aggregates for each project
    const projectIds = projects.map((p) => p._id);
    const approvedVariations = await ChangeOrder.aggregate([
      {
        $match: {
          project: { $in: projectIds },
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
        },
      },
      {
        $group: {
          _id: '$project',
          totalApprovedPaise: { $sum: '$totalApprovedPaise' },
          count: { $sum: 1 },
        },
      },
    ]);

    const approvedMap = new Map();
    approvedVariations.forEach((item) => {
      approvedMap.set(item._id.toString(), item);
    });

    const augmented = projects.map((p) => {
      const v = approvedMap.get(p._id.toString()) || { totalApprovedPaise: 0, count: 0 };
      const original = p.originalContractPaise || 0;
      const approved = v.totalApprovedPaise || 0;
      return {
        ...p.toObject(),
        approvedVariationsPaise: approved,
        revisedContractPaise: original + approved,
        approvedVariationsCount: v.count,
      };
    });

    sendSuccess(res, { projects: augmented }, 200, undefined, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('[GetProjects] Error:', error);
    sendError(res, 'FETCH_PROJECTS_FAILED', error.message || 'Failed to retrieve projects', 500);
  }
}

export async function getProjectById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      sendError(res, 'INVALID_ID', 'Invalid project identifier', 400);
      return;
    }

    const project = await Project.findOne({ _id: id, organization: req.orgId });
    if (!project) {
      sendError(res, 'NOT_FOUND', 'Project not found in current organization', 404);
      return;
    }

    // Fetch team members
    const members = await ProjectMember.find({ project: project._id }).populate(
      'user',
      'name email phone avatarUrl'
    );

    // Calculate real-time financial metrics for this project
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

    const [approvedAgg, pendingAgg, unapprovedAgg, invoicesAgg, paymentsAgg, recentOrders] =
      await Promise.all([
        ChangeOrder.aggregate([
          { $match: { project: project._id, status: { $in: approvedStates } } },
          { $group: { _id: null, total: { $sum: '$totalApprovedPaise' }, count: { $sum: 1 } } },
        ]),
        ChangeOrder.aggregate([
          { $match: { project: project._id, status: { $in: pendingStates } } },
          { $group: { _id: null, total: { $sum: '$totalProposedPaise' }, count: { $sum: 1 } } },
        ]),
        ChangeOrder.aggregate([
          {
            $match: {
              project: project._id,
              unapprovedExecution: true,
              status: { $nin: ['Approved', 'Invoiced', 'Paid'] },
            },
          },
          { $group: { _id: null, total: { $sum: '$totalProposedPaise' }, count: { $sum: 1 } } },
        ]),
        Invoice.aggregate([
          { $match: { project: project._id, status: { $nin: ['Cancelled'] } } },
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
          { $match: { project: project._id } },
          { $group: { _id: null, totalPayments: { $sum: '$amountPaise' } } },
        ]),
        ChangeOrder.find({ project: project._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('requestedBy', 'name email'),
      ]);

    const originalContractPaise = project.originalContractPaise || 0;
    const approvedVariationsPaise = approvedAgg[0]?.total || 0;
    const pendingApprovalPaise = pendingAgg[0]?.total || 0;
    const unapprovedWorkExposurePaise = unapprovedAgg[0]?.total || 0;
    const revisedContractTotalPaise = originalContractPaise + approvedVariationsPaise;

    const invoicedReceivablesPaise = invoicesAgg[0]?.balanceDue || 0;
    const realisedCashflowPaise = paymentsAgg[0]?.totalPayments || 0;
    const approvedUnbilledPaise = Math.max(
      0,
      approvedVariationsPaise - (invoicesAgg[0]?.totalBilled || 0)
    );

    const financialSummary = {
      originalContractPaise,
      approvedVariationsPaise,
      revisedContractTotalPaise,
      pendingApprovalPaise,
      unapprovedWorkExposurePaise,
      approvedUnbilledPaise,
      invoicedReceivablesPaise,
      realisedCashflowPaise,
    };

    sendSuccess(res, {
      project,
      members,
      financialSummary,
      recentChangeOrders: recentOrders,
    });
  } catch (error: any) {
    console.error('[GetProjectById] Error:', error);
    sendError(res, 'FETCH_PROJECT_FAILED', error.message || 'Failed to retrieve project details', 500);
  }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = createProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const data = parseResult.data;
    const orgId = req.orgId!;

    const existingCode = await Project.findOne({ organization: orgId, code: data.code });
    if (existingCode) {
      sendError(res, 'DUPLICATE_CODE', `Project code ${data.code} already exists in this organization.`, 409);
      return;
    }

    const project = new Project({
      ...data,
      organization: orgId,
      startDate: new Date(data.startDate),
      targetEndDate: new Date(data.targetEndDate),
    });

    await project.save();

    // Assign creating user as Project Manager
    if (req.user) {
      const pm = new ProjectMember({
        project: project._id,
        user: req.user._id,
        projectRole: 'manager',
      });
      await pm.save();
    }

    // Log Activity
    await ActivityLog.create({
      organization: orgId,
      project: project._id,
      entityType: 'Project',
      entityId: project._id,
      actor: req.user?._id,
      action: 'PROJECT_CREATED',
      summary: `Project "${project.name}" (${project.code}) was created with baseline ₹${(project.originalContractPaise / 100).toLocaleString('en-IN')}`,
    });

    sendSuccess(res, { project }, 201, 'Project created successfully');
  } catch (error: any) {
    console.error('[CreateProject] Error:', error);
    sendError(res, 'CREATE_PROJECT_FAILED', error.message || 'Failed to create project', 500);
  }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      sendError(res, 'INVALID_ID', 'Invalid project identifier', 400);
      return;
    }

    const parseResult = updateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, organization: req.orgId },
      { $set: parseResult.data },
      { new: true }
    );

    if (!project) {
      sendError(res, 'NOT_FOUND', 'Project not found in current organization', 404);
      return;
    }

    sendSuccess(res, { project }, 200, 'Project updated successfully');
  } catch (error: any) {
    console.error('[UpdateProject] Error:', error);
    sendError(res, 'UPDATE_PROJECT_FAILED', error.message || 'Failed to update project', 500);
  }
}
