import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';

describe('AmendFlow End-to-End Business Scenario & Governance Verification', () => {
  let orgAToken: string;
  let orgAUser: any;
  let orgA: any;
  let projectId: string;
  let boqItemId: string;
  let changeOrderId: string;
  let documentId: string;
  let invoiceId: string;

  let orgBToken: string;
  let orgBUser: any;

  before(async () => {
    await connectDB();

    // 1. Register Organization A (Owner)
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Chief Commercial Officer',
        email: `cco-${Date.now()}@infra-a.com`,
        password: 'Password123!',
        organizationName: 'Larsen & Northstar Infra Ltd',
        phone: '+91 9876543210',
      });

    assert.equal(resA.status, 201);
    orgAToken = resA.body.data.token;
    orgAUser = resA.body.data.user;
    orgA = resA.body.data.activeOrganization;

    // 2. Register Organization B (Competitor / Separate Tenant)
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Competitor PM',
        email: `competitor-${Date.now()}@infra-b.com`,
        password: 'Password123!',
        organizationName: 'Apex Construction Pvt Ltd',
        phone: '+91 9123456780',
      });

    assert.equal(resB.status, 201);
    orgBToken = resB.body.data.token;
    orgBUser = resB.body.data.user;
  });

  after(async () => {
    await disconnectDB();
  });

  // Step 1 & 2: Create a Project with Original Contract Baseline
  it('1 & 2. Creates a project with original contractual baseline', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        name: 'Bangalore Metro Line 4 Elevated Viaduct',
        code: `PRJ-BMRCL-${Date.now().toString().slice(-4)}`,
        clientName: 'Bangalore Metro Rail Corporation Limited',
        contractorName: 'Larsen & Northstar Infra Ltd',
        originalContractPaise: 5000000000, // ₹ 5.00 Crore in integer paise
        startDate: new Date().toISOString(),
        targetEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
        location: {
          address: 'Bannerghatta Road Corridor',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
        },
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    projectId = res.body.data.project._id;
    assert.equal(res.body.data.project.originalContractPaise, 5000000000);
  });

  // Step 3: Add BOQ Baseline Items
  it('3. Adds baseline BOQ items with locked unit rates and integer paise math', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/boq`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        itemCode: 'BOQ-CIV-001',
        description: 'Bored Cast-in-Situ Reinforced Concrete Piles 1200mm dia in hard rock',
        category: 'Civil',
        unit: 'rm',
        baselineQuantity: 1500,
        unitRatePaise: 2850000, // ₹ 28,500 per rm in paise
        notes: 'Governed by MORTH Section 1100 and IS:2911',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    boqItemId = res.body.data.boqItem._id;
    assert.equal(res.body.data.boqItem.unitRatePaise, 2850000);
    assert.equal(res.body.data.boqItem.baselineAmountPaise, 4275000000);
  });

  // Step 4: Create a Change Request
  it('4. Creates a Change Request linked to Differing Site Conditions', async () => {
    const res = await request(app)
      .post('/api/change-orders')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        projectId,
        title: 'Pier P-14 Geotechnical Fault Socket Deepening',
        description: 'Encountered fractured and fissured granite horizon requiring additional 3.5m pile socket depth.',
        category: 'Additional Work',
        priority: 'High',
        originatingParty: 'Site Condition',
        reason: 'Rotary core drill logs revealed sudden fissure zone not indicated in tender borehole logs.',
        scheduleImpactDays: 10,
        isDraft: true,
        linkedBoqItemIds: [boqItemId],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    changeOrderId = res.body.data.changeOrder._id;
    assert.equal(res.body.data.changeOrder.status, 'Draft');
    assert.ok(res.body.data.changeOrder.orderNumber.startsWith('CO-'));
  });

  // Step 5: Attach Supporting Evidence / Document
  it('5. Attaches supporting technical documentation and evidence', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${orgAToken}`)
      .field('projectId', projectId)
      .field('changeOrderId', changeOrderId)
      .field('category', 'Variation Evidence')
      .field('notes', 'Geotechnical Core Log & Unconfined Compressive Strength Test Certificates')
      .attach('file', Buffer.from('%PDF-1.4 Mock Geotech Borehole Core Test Data Log'), 'Borehole-P14-Geotech.pdf');

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    documentId = res.body.data.attachment._id;
    assert.equal(res.body.data.attachment.category, 'Variation Evidence');
  });

  // Step 6: Calculate the Additional Cost (Cost Estimation Engine)
  it('6. Calculates additional variation cost with overhead, markup, and 18% GST', async () => {
    const res = await request(app)
      .post(`/api/change-orders/${changeOrderId}/estimates`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        overheadPct: 10,
        markupPct: 15,
        taxPct: 18,
        items: [
          {
            description: 'Hydraulic Rig Hard Rock Drilling 1200mm Dia (+3.5m per pile across 4 piles = 14m)',
            category: 'Equipment',
            quantity: 14,
            unit: 'rm',
            unitRateRupees: 35000,
            boqItemRef: boqItemId,
          },
          {
            description: 'Reinforcement Steel Fe500D Cut and Bend for Socket Ext.',
            category: 'Material',
            quantity: 2.8,
            unit: 'MT',
            unitRateRupees: 72000,
          },
        ],
        notes: 'Rates benchmarked against CPWD DSR-2023 with verified market diesel escalations.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    // Direct cost: 14 * 35000 = 490000; 2.8 * 72000 = 201600. Direct = 691600 Rupees (69,160,000 Paise)
    assert.equal(res.body.data.estimate.directCostPaise, 69160000);
    // Overhead 10%: 6,916,000 Paise
    assert.equal(res.body.data.estimate.overheadPaise, 6916000);
    // Pre-Markup = 76,076,000 Paise. Markup 15% on pre-markup: 11,411,400 Paise
    assert.equal(res.body.data.estimate.markupPaise, 11411400);
    // Taxable: 87,487,400 Paise. GST 18%: 15,747,732 Paise.
    // Total: 103,235,132 Paise (₹ 10,32,351.32)
    assert.equal(res.body.data.estimate.totalProposedPaise, 103235132);
  });

  // Step 7: Submit the Request
  it('7. Submits the Change Order for multi-gate governance review', async () => {
    const res = await request(app)
      .post(`/api/change-orders/${changeOrderId}/submit`)
      .set('Authorization', `Bearer ${orgAToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.changeOrder.status, 'Submitted');
  });

  // Step 8: Complete the Dual-Gate Approval Workflow
  it('8. Navigates the formal 4-stage governance approval ladder to client sign-off', async () => {
    // Stage 1: Technical Review
    const r1 = await request(app)
      .post(`/api/change-orders/${changeOrderId}/approvals`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        stage: 'Technical Review',
        decision: 'Approved',
        comments: 'Verified geotechnical core logs and RQD < 25% at -14.2m. Socket extension technically justified.',
      });
    assert.equal(r1.status, 200);
    assert.equal(r1.body.data.changeOrder.status, 'Commercial Review');

    // Stage 2: Commercial Review
    const r2 = await request(app)
      .post(`/api/change-orders/${changeOrderId}/approvals`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        stage: 'Commercial Review',
        decision: 'Approved',
        comments: 'Unit rates verified against baseline BOQ-CIV-001 with 10% overhead and 18% statutory GST.',
      });
    assert.equal(r2.status, 200);
    assert.equal(r2.body.data.changeOrder.status, 'Internal Approval');

    // Stage 3: Internal Executive Approval
    const r3 = await request(app)
      .post(`/api/change-orders/${changeOrderId}/approvals`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        stage: 'Internal Approval',
        decision: 'Approved',
        comments: 'Project Director and Commercial Board authorized submission to Client BMRCL.',
      });
    assert.equal(r3.status, 200);
    assert.equal(r3.body.data.changeOrder.status, 'Client Approval');

    // Stage 4: Formal Client Approval
    const r4 = await request(app)
      .post(`/api/change-orders/${changeOrderId}/approvals`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        stage: 'Client Approval',
        decision: 'Approved',
        comments: 'BMRCL Chief Engineer signed off variation order with locked minor-unit financial ceiling.',
      });
    assert.equal(r4.status, 200);
    assert.equal(r4.body.data.changeOrder.status, 'Approved');
    // Approved variation amount is formally locked: 103,235,132 Paise (₹ 10,32,351.32)
    assert.equal(r4.body.data.changeOrder.totalApprovedPaise, 103235132);
  });

  // Step 9: Authorise Execution
  it('9. Formally authorises site execution following client sign-off', async () => {
    const res = await request(app)
      .post(`/api/change-orders/${changeOrderId}/authorize-execution`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({});

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.changeOrder.status, 'Authorised for Execution');
  });

  // Step 10: Record Execution and Completion Evidence
  it('10. Commences physical works and records verified completion', async () => {
    // Start Work
    const rStart = await request(app)
      .post(`/api/change-orders/${changeOrderId}/start-work`)
      .set('Authorization', `Bearer ${orgAToken}`);
    assert.equal(rStart.status, 200);
    assert.equal(rStart.body.data.changeOrder.status, 'In Progress');

    // Complete Work
    const rComp = await request(app)
      .post(`/api/change-orders/${changeOrderId}/complete-work`)
      .set('Authorization', `Bearer ${orgAToken}`);
    assert.equal(rComp.status, 200);
    assert.equal(rComp.body.data.changeOrder.status, 'Completed');
  });

  // Step 11: Generate Tax Invoice Against Approved Completed Variation
  it('11. Generates a commercial tax invoice with zero revenue leakage', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        projectId,
        changeOrderIds: [changeOrderId],
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        subtotalRupees: 874874, // ₹ 8,74,874
        taxRupees: 157477.32, // ₹ 1,57,477.32 (18% GST)
        notes: 'Tax Invoice for Variation Order P-14 Geotechnical Socketing',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    invoiceId = res.body.data.invoice._id;
    assert.equal(res.body.data.invoice.totalAmountPaise, 103235132);
    assert.equal(res.body.data.invoice.balanceDuePaise, 103235132);
    assert.equal(res.body.data.invoice.status, 'Issued');
  });

  // Step 12: Record a Partial Payment
  it('12. Reconciles a partial bank payment and updates remaining receivable balance', async () => {
    const res = await request(app)
      .post(`/api/invoices/${invoiceId}/payments`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        amountRupees: 500000, // ₹ 5,00,000 partial deposit (50,000,000 Paise)
        paymentDate: new Date().toISOString(),
        paymentMethod: 'RTGS',
        referenceNumber: 'RTGS-BMRCL-2026-981144',
        notes: 'Interim client milestone payment cleared in HDFC escrow account',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    // Total 103,235,132 - 50,000,000 = 53,235,132 Paise remaining
    assert.equal(res.body.data.invoice.amountPaidPaise, 50000000);
    assert.equal(res.body.data.invoice.balanceDuePaise, 53235132);
    assert.equal(res.body.data.invoice.status, 'Partially Paid');
  });

  // Step 13: Verify the Updated Financial Exposure Dashboard
  it('13. Verifies the updated financial dashboard across the 5 discrete risk buckets', async () => {
    const res = await request(app)
      .get(`/api/financial-exposure?projectId=${projectId}`)
      .set('Authorization', `Bearer ${orgAToken}`);

    assert.equal(res.status, 200);
    const summary = res.body.data.summary;

    // Original contract baseline = ₹ 5.00 Cr
    assert.equal(summary.totalContractBaselinePaise, 5000000000);
    // Approved variations = ₹ 10,32,351.32 (103,235,132 Paise)
    assert.equal(summary.approvedVariationsPaise, 103235132);
    // Revised contract value = 5,000,000,000 + 103,235,132 = 5,103,235,132 Paise
    assert.equal(summary.revisedContractTotalPaise, 5103235132);
    // Invoiced Receivables (Outstanding balance) = 53,235,132 Paise (₹ 5,32,351.32)
    assert.equal(summary.invoicedReceivablesPaise, 53235132);
    // Realised Cashflow = 50,000,000 Paise (₹ 5,00,000)
    assert.equal(summary.realisedCashflowPaise, 50000000);
  });

  // Negative Scenario 1: Authorizing unapproved execution without mandatory justification is rejected
  it('Rejects unapproved site execution when mandatory justification is missing', async () => {
    // Create an unapproved draft change order
    const draftRes = await request(app)
      .post('/api/change-orders')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        projectId,
        title: 'Emergency Storm Drain Diversion',
        description: 'Diversion to prevent flooding of the excavation pit',
        category: 'Additional Work',
        priority: 'Urgent',
        originatingParty: 'Site Condition',
        reason: 'Flash flood danger during monsoon season',
        isDraft: false,
      });

    assert.equal(draftRes.status, 201);
    const unapprovedId = draftRes.body.data.changeOrder._id;

    // Attempting authorization without justification should be blocked (422)
    const failRes = await request(app)
      .post(`/api/change-orders/${unapprovedId}/authorize-execution`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({ unapprovedJustification: 'too short' });

    assert.equal(failRes.status, 422);
    assert.equal(failRes.body.error.code, 'UNAPPROVED_JUSTIFICATION_REQUIRED');
  });

  // Negative Scenario 2: Overpayment allocation exceeding invoice balance due is rejected
  it('Rejects payment allocation that exceeds outstanding invoice balance due', async () => {
    const excessPaymentRes = await request(app)
      .post(`/api/invoices/${invoiceId}/payments`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        amountRupees: 600000, // Balance due is ₹ 5,20,110; ₹ 6,00,000 is an overpayment!
        paymentDate: new Date().toISOString(),
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'EXCESS-REF-001',
      });

    assert.equal(excessPaymentRes.status, 422);
    assert.equal(excessPaymentRes.body.error.code, 'OVERPAYMENT_NOT_ALLOWED');
  });

  // Negative Scenario 3: Rejected approval halts variation and shifts status to "Rejected"
  it('Halts change order when review stage records a Rejected decision', async () => {
    const coRes = await request(app)
      .post('/api/change-orders')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        projectId,
        title: 'Unwarranted Architectural Facade Cladding Upgrade',
        description: 'Titanium zinc cladding instead of powder-coated aluminum panels',
        category: 'Design Modification',
        priority: 'Low',
        originatingParty: 'Architect',
        reason: 'Aesthetic preference without structural justification',
        isDraft: false,
      });

    assert.equal(coRes.status, 201);
    const rejectCoId = coRes.body.data.changeOrder._id;

    const rejectRes = await request(app)
      .post(`/api/change-orders/${rejectCoId}/approvals`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        stage: 'Technical Review',
        decision: 'Rejected',
        comments: 'Rejected by PM: Tender BOQ specification is binding; zinc cladding creates unwarranted cost with zero structural benefit.',
      });

    assert.equal(rejectRes.status, 200);
    assert.equal(rejectRes.body.data.changeOrder.status, 'Rejected');
  });

  // Negative Scenario 4: Cross-Tenant Data Isolation Enforcement
  it('Strictly enforces tenant isolation: Org B user cannot access or modify Org A resources', async () => {
    // 1. Org B tries to view Org A project details
    const getProjRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${orgBToken}`);
    assert.equal(getProjRes.status, 404);

    // 2. Org B tries to view Org A change order
    const getCoRes = await request(app)
      .get(`/api/change-orders/${changeOrderId}`)
      .set('Authorization', `Bearer ${orgBToken}`);
    assert.equal(getCoRes.status, 404);

    // 3. Org B tries to view Org A invoice
    const getInvRes = await request(app)
      .get(`/api/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${orgBToken}`);
    assert.equal(getInvRes.status, 404);

    // 4. Org B tries to record approval on Org A change order
    const approveRes = await request(app)
      .post(`/api/change-orders/${changeOrderId}/approvals`)
      .set('Authorization', `Bearer ${orgBToken}`)
      .send({
        stage: 'Client Approval',
        decision: 'Approved',
        comments: 'Malicious unauthorized approval attempt',
      });
    assert.equal(approveRes.status, 404);

    // 5. Org B tries to upload document to Org A project
    const uploadRes = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${orgBToken}`)
      .field('projectId', projectId)
      .attach('file', Buffer.from('Malicious document'), 'exploit.pdf');
    assert.equal(uploadRes.status, 404);
  });
});
