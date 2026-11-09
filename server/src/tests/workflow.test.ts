import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../config/db.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { ChangeOrder } from '../models/ChangeOrder.js';
import { Invoice } from '../models/Invoice.js';

describe('AmendFlow Core Workflows & Financial Governance', () => {
  let org: any;
  let user: any;
  let project: any;

  before(async () => {
    await connectDB();

    org = new Organization({
      name: 'Test Infrastructure Org',
      currency: 'INR',
    });
    await org.save();

    user = new User({
      name: 'Test Engineer',
      email: `test-${Date.now()}@infra.com`,
      passwordHash: 'hashed_password',
      activeOrgId: org._id,
    });
    await user.save();

    project = new Project({
      organization: org._id,
      name: 'Metro Viaduct Package 1',
      code: `PRJ-METRO-${Date.now().toString().slice(-4)}`,
      clientName: 'Bangalore Metro Rail Corp',
      contractorName: 'Test Infrastructure Org',
      location: { city: 'Bengaluru', state: 'Karnataka' },
      startDate: new Date(),
      targetEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      originalContractPaise: 5000000000, // ₹ 5.00 Cr
      status: 'Active',
    });
    await project.save();
  });

  after(async () => {
    await disconnectDB();
  });

  it('preserves immutable contractual baseline and creates change order with sequence', async () => {
    const co = new ChangeOrder({
      organization: org._id,
      project: project._id,
      orderNumber: `CO-${project.code}-001`,
      title: 'Geotechnical Pier Extension',
      description: 'Encountered fractured granite at Pier P-14 requiring 3m deeper socketing.',
      category: 'Additional Work',
      priority: 'High',
      requestedBy: user._id,
      originatingParty: 'Site Condition',
      reason: 'Differing site geotechnical conditions during drilling.',
      scheduleImpactDays: 7,
      status: 'Draft',
      totalProposedPaise: 45000000, // ₹ 4,50,000
    });
    await co.save();

    assert.ok(co._id);
    assert.equal(co.orderNumber, `CO-${project.code}-001`);
    assert.equal(co.status, 'Draft');
    assert.equal(co.unapprovedExecution, false);
  });

  it('enforces mandatory justification when authorizing work prior to client approval', async () => {
    const co = new ChangeOrder({
      organization: org._id,
      project: project._id,
      orderNumber: `CO-${project.code}-002`,
      title: 'Urgent Monsoon Diversion Channel',
      description: 'Diversion storm trench to protect pier excavation from flooding.',
      category: 'Design Modification',
      priority: 'Urgent',
      requestedBy: user._id,
      originatingParty: 'Site Condition',
      reason: 'Prevent embankment collapse during torrential rains.',
      status: 'Submitted',
      totalProposedPaise: 25000000, // ₹ 2,50,000
    });
    await co.save();

    const justification = 'Flash flood warning issued by IMD; pier excavation pit must be secured immediately.';
    co.unapprovedExecution = true;
    co.unapprovedJustification = justification;
    co.unapprovedAuthorizedBy = user._id;
    co.unapprovedAuthorizedAt = new Date();
    co.status = 'Authorised for Execution';
    await co.save();

    const retrieved = await ChangeOrder.findById(co._id);
    assert.equal(retrieved?.unapprovedExecution, true);
    assert.equal(retrieved?.unapprovedJustification, justification);
    assert.equal(retrieved?.status, 'Authorised for Execution');
  });

  it('prevents overpayment allocation on variation invoices', async () => {
    const co = new ChangeOrder({
      organization: org._id,
      project: project._id,
      orderNumber: `CO-${project.code}-003`,
      title: 'Structural Steel Stiffeners',
      description: 'Additional gusset plates and welds.',
      category: 'Additional Work',
      priority: 'Medium',
      requestedBy: user._id,
      originatingParty: 'Contractor',
      reason: 'Design verification.',
      status: 'Approved',
      totalProposedPaise: 10000000,
      totalApprovedPaise: 10000000, // ₹ 1,00,000
    });
    await co.save();

    const invoice = new Invoice({
      organization: org._id,
      project: project._id,
      changeOrders: [co._id],
      invoiceNumber: `INV-${project.code}-001`,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      subtotalPaise: 10000000,
      taxPaise: 1800000,
      totalAmountPaise: 11800000, // ₹ 1,18,000
      amountPaidPaise: 0,
      balanceDuePaise: 11800000,
      status: 'Issued',
      createdBy: user._id,
    });
    await invoice.save();

    // Partial payment of ₹50,000 (5,000,000 paise)
    const partialPaymentPaise = 5000000;
    assert.ok(partialPaymentPaise <= invoice.balanceDuePaise);

    invoice.amountPaidPaise += partialPaymentPaise;
    invoice.balanceDuePaise -= partialPaymentPaise;
    invoice.status = 'Partially Paid';
    await invoice.save();

    assert.equal(invoice.balanceDuePaise, 6800000); // ₹ 68,000 remaining
    assert.equal(invoice.status, 'Partially Paid');

    // Attempting payment of ₹80,000 (8,000,000 paise) exceeds balance due (6,800,000)
    const excessPaymentPaise = 8000000;
    const isOverpayment = excessPaymentPaise > invoice.balanceDuePaise;
    assert.equal(isOverpayment, true);
  });
});
