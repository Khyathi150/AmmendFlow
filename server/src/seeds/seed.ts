import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { BOQItem } from '../models/BOQItem.js';
import { ChangeOrder } from '../models/ChangeOrder.js';
import { CostEstimate } from '../models/CostEstimate.js';
import { Approval } from '../models/Approval.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { DrawingAnnotation } from '../models/DrawingAnnotation.js';
import { Attachment } from '../models/Attachment.js';

export interface SeedDatabaseOptions {
  nodeEnv?: string;
  mongoUri?: string;
  allowDemoSeed?: boolean;
  demoPassword?: string;
  hasResetFlag?: boolean;
  confirmResetLocal?: boolean;
}

export async function seedDatabase(options: SeedDatabaseOptions = {}) {
  const effectiveNodeEnv = (options.nodeEnv ?? process.env.NODE_ENV ?? 'development').trim();
  if (effectiveNodeEnv === 'production') {
    throw new Error(
      '[Seed] FATAL: Destructive or demo database seeding is disabled when NODE_ENV=production.'
    );
  }

  const allowDemoSeed =
    options.allowDemoSeed ?? process.env.ALLOW_DEMO_SEED?.trim().toLowerCase() === 'true';
  if (!allowDemoSeed) {
    throw new Error(
      '[Seed] Refusing to seed automatically. Set ALLOW_DEMO_SEED=true explicitly in a non-production environment.'
    );
  }

  const demoPassword = (options.demoPassword ?? process.env.SEED_DEMO_PASSWORD ?? '').trim();
  if (!demoPassword || demoPassword.length < 8) {
    throw new Error(
      '[Seed] SEED_DEMO_PASSWORD (>= 8 characters) must be configured before running demo seeding.'
    );
  }

  console.log('--- Seeding AmendFlow Non-Production Demonstration Database ---');

  const mongoUri = (options.mongoUri ?? process.env.MONGODB_URI ?? '').trim();
  const isRemoteOrAtlas =
    mongoUri.startsWith('mongodb+srv://') ||
    (mongoUri !== '' && !/^mongodb:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(mongoUri));

  const [existingUsers, existingOrgs, existingProjects] = await Promise.all([
    User.estimatedDocumentCount(),
    Organization.estimatedDocumentCount(),
    Project.estimatedDocumentCount(),
  ]);
  const hasExistingData = existingUsers > 0 || existingOrgs > 0 || existingProjects > 0;

  if (hasExistingData) {
    if (isRemoteOrAtlas) {
      throw new Error(
        '[Seed] FATAL: Existing data detected on remote/Atlas database. Automatic deletion of remote collections is strictly prohibited.'
      );
    }

    const hasResetFlag = options.hasResetFlag ?? process.argv.includes('--reset-local');
    const confirmResetLocal =
      options.confirmResetLocal ?? process.env.CONFIRM_SEED_RESET === 'DELETE_LOCAL_DATA';

    if (!hasResetFlag || !confirmResetLocal) {
      throw new Error(
        '[Seed] Existing local database records detected. Aborting without deleting collections. Pass --reset-local and CONFIRM_SEED_RESET=DELETE_LOCAL_DATA to reset local dev data explicitly.'
      );
    }

    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      OrganizationMember.deleteMany({}),
      Project.deleteMany({}),
      ProjectMember.deleteMany({}),
      BOQItem.deleteMany({}),
      ChangeOrder.deleteMany({}),
      CostEstimate.deleteMany({}),
      Approval.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      ActivityLog.deleteMany({}),
      DrawingAnnotation.deleteMany({}),
      Attachment.deleteMany({}),
    ]);

    console.log('Explicit local dev reset requested; cleared existing local collections.');
  }

  // 1. Create Organization: Northstar Infrastructure Pvt. Ltd.
  const org = new Organization({
    name: 'Northstar Infrastructure Pvt. Ltd.',
    legalEntityName: 'Northstar Infrastructure Private Limited',
    taxId: '29AABCN8234M1Z5',
    currency: 'INR',
    address: {
      street: '45, Outer Ring Road, Kadubeesanahalli',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
      country: 'India',
    },
    settings: {
      defaultOverheadPct: 10,
      defaultMarkupPct: 15,
      defaultTaxPct: 18,
      autoLockBaseline: true,
    },
  });
  await org.save();
  console.log(`Created Organization: ${org.name} (${org._id})`);

  // 2. Create Users across all 6 core personas using explicitly provided SEED_DEMO_PASSWORD
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(demoPassword, salt);

  const usersData = [
    {
      name: 'Vikram Malhotra',
      email: 'vikram@northstarinfra.com',
      role: 'owner' as const,
      phone: '+91 98450 11223',
    },
    {
      name: 'Arjun Rao',
      email: 'arjun.pm@northstarinfra.com',
      role: 'project_manager' as const,
      phone: '+91 98450 33445',
    },
    {
      name: 'Priya Sharma',
      email: 'priya.site@northstarinfra.com',
      role: 'site_engineer' as const,
      phone: '+91 98450 55667',
    },
    {
      name: 'Manoj Hegde',
      email: 'manoj.comm@northstarinfra.com',
      role: 'commercial_manager' as const,
      phone: '+91 98450 77889',
    },
    {
      name: 'Anita Desai',
      email: 'anita.fin@northstarinfra.com',
      role: 'finance_officer' as const,
      phone: '+91 98450 99001',
    },
    {
      name: 'Rohan Kulkarni',
      email: 'client.rep@prestigecommercial.com',
      role: 'client_approver' as const,
      phone: '+91 98860 12345',
    },
  ];

  const userMap = new Map();

  for (const u of usersData) {
    const user = new User({
      name: u.name,
      email: u.email,
      passwordHash,
      phone: u.phone,
      activeOrgId: org._id,
      isEmailVerified: true,
    });
    await user.save();
    userMap.set(u.email, user);

    const member = new OrganizationMember({
      organization: org._id,
      user: user._id,
      role: u.role,
      status: 'active',
    });
    await member.save();
  }
  console.log(`Created ${usersData.length} team members with verified demo accounts.`);

  const owner = userMap.get('vikram@northstarinfra.com')!;
  const pm = userMap.get('arjun.pm@northstarinfra.com')!;
  const engineer = userMap.get('priya.site@northstarinfra.com')!;
  const estimator = userMap.get('manoj.comm@northstarinfra.com')!;
  const finance = userMap.get('anita.fin@northstarinfra.com')!;
  const clientApprover = userMap.get('client.rep@prestigecommercial.com')!;

  // 3. Create 3 Realistic Indian Construction Projects
  const projects = [
    {
      code: 'PRJ-NSR-001',
      name: 'Commercial Tech Park & High-Rise Office Complex',
      description:
        'Construction of 2B+G+18 storey Grade-A commercial office tower with post-tensioned slabs, high-performance curtain wall glazing, centralized VRV HVAC, and double-height entrance lobby.',
      clientName: 'Prestige Commercial Developers Ltd.',
      clientContact: {
        name: 'Rohan Kulkarni',
        email: 'client.rep@prestigecommercial.com',
        phone: '+91 98860 12345',
      },
      contractorName: 'Northstar Infrastructure Pvt. Ltd.',
      location: {
        address: 'ITPL Main Road, Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
      },
      startDate: new Date('2025-04-01'),
      targetEndDate: new Date('2027-03-31'),
      originalContractPaise: 18500000000, // ₹ 18.50 Crores = 185,000,000 Rupees
      currency: 'INR',
      status: 'Active' as const,
    },
    {
      code: 'PRJ-NSR-002',
      name: 'Apex Heights Luxury Residential Tower Development',
      description:
        'Twin 42-storey residential towers overlooking Worli Seaface featuring bored pile foundation in rock, composite steel-concrete core, Italian marble finishes, and automated multi-level car parking.',
      clientName: 'Oberoi Apex Real Estate LLP',
      clientContact: {
        name: 'Sunil Parekh',
        email: 'sunil.p@oberoiapex.com',
        phone: '+91 98200 45678',
      },
      contractorName: 'Northstar Infrastructure Pvt. Ltd.',
      location: {
        address: 'Worli Seaface Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      },
      startDate: new Date('2025-01-15'),
      targetEndDate: new Date('2027-12-31'),
      originalContractPaise: 24000000000, // ₹ 24.00 Crores
      currency: 'INR',
      status: 'Active' as const,
    },
    {
      code: 'PRJ-NSR-003',
      name: 'Mega Logistics & Cold Storage Warehouse Expansion',
      description:
        'Pre-Engineered Building (PEB) industrial logistics hub spanning 350,000 sq.ft with super-flat FM2 laser screed flooring, temperature-controlled cold chambers, and heavy-duty loading docks.',
      clientName: 'AllCargo Logistics Infra Corp.',
      clientContact: {
        name: 'Deepak Joshi',
        email: 'd.joshi@allcargologistics.com',
        phone: '+91 98190 67890',
      },
      contractorName: 'Northstar Infrastructure Pvt. Ltd.',
      location: {
        address: 'MIDC Phase II, Chakan',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
      },
      startDate: new Date('2025-06-01'),
      targetEndDate: new Date('2026-08-31'),
      originalContractPaise: 12250000000, // ₹ 12.25 Crores
      currency: 'INR',
      status: 'Active' as const,
    },
  ];

  const projectDocs: any[] = [];
  for (const p of projects) {
    const doc = new Project({ ...p, organization: org._id });
    await doc.save();
    projectDocs.push(doc);

    // Assign project members
    await ProjectMember.create({ project: doc._id, user: pm._id, projectRole: 'manager' });
    await ProjectMember.create({ project: doc._id, user: engineer._id, projectRole: 'engineer' });
    await ProjectMember.create({ project: doc._id, user: estimator._id, projectRole: 'estimator' });
    await ProjectMember.create({ project: doc._id, user: finance._id, projectRole: 'finance' });
    await ProjectMember.create({ project: doc._id, user: clientApprover._id, projectRole: 'client_rep' });
  }
  console.log(`Created 3 Projects with team assignments.`);

  const p1 = projectDocs[0]; // Bengaluru Tech Park
  const p2 = projectDocs[1]; // Mumbai Luxury Tower
  const p3 = projectDocs[2]; // Pune Logistics Hub

  // 4. Seed Baseline BOQ Items for Project 1 (Tech Park)
  const p1BOQ = [
    {
      itemCode: '1.01.A',
      category: 'Civil',
      description: 'Earthwork excavation in all types of soil including disposal within 2km lead',
      unit: 'm3',
      baselineQuantity: 12500,
      unitRatePaise: 38000, // ₹380.00
      notes: 'CPWD Item 2.6',
    },
    {
      itemCode: '1.02.B',
      category: 'Civil',
      description: 'Plain cement concrete (PCC) 1:4:8 under pile caps and raft foundation',
      unit: 'm3',
      baselineQuantity: 850,
      unitRatePaise: 440000, // ₹4,400.00
      notes: 'CPWD Item 4.1',
    },
    {
      itemCode: '2.01.A',
      category: 'Structural',
      description: 'Reinforced cement concrete (RCC) M35 grade in columns, shear walls, and core',
      unit: 'm3',
      baselineQuantity: 3200,
      unitRatePaise: 720000, // ₹7,200.00
      notes: 'High-strength mix design',
    },
    {
      itemCode: '2.02.B',
      category: 'Structural',
      description: 'Thermo-Mechanically Treated (TMT) Fe500D steel bar reinforcement cut and tied',
      unit: 'MT',
      baselineQuantity: 420,
      unitRatePaise: 6850000, // ₹68,500.00 per MT
      notes: 'Primary structural reinforcement',
    },
    {
      itemCode: '3.01.A',
      category: 'MEP',
      description: 'Electrical main distribution panel board 1200A with microprocessor ACB',
      unit: 'nos',
      baselineQuantity: 4,
      unitRatePaise: 125000000, // ₹12,50,000.00 per panel
      notes: 'Substation switchgear',
    },
    {
      itemCode: '4.01.A',
      category: 'Finishing',
      description: 'Double glazed unit (DGU) semi-unitized structural curtain wall glazing',
      unit: 'sqm',
      baselineQuantity: 2800,
      unitRatePaise: 880000, // ₹8,800.00 per sqm
      notes: 'Façade package specification',
    },
  ];

  const boqItemDocs: any[] = [];
  for (const item of p1BOQ) {
    const baselineAmountPaise = Math.round(item.baselineQuantity * item.unitRatePaise);
    const doc = new BOQItem({
      organization: org._id,
      project: p1._id,
      ...item,
      baselineAmountPaise,
      isLocked: true,
    });
    await doc.save();
    boqItemDocs.push(doc);
  }
  console.log(`Seeded ${boqItemDocs.length} locked baseline BOQ items for ${p1.code}.`);

  // 5. Seed Change Orders across diverse lifecycle states for P1 & P2

  // CO-1: Formally Approved, Completed, Invoiced, and Fully Paid
  const co1 = new ChangeOrder({
    organization: org._id,
    project: p1._id,
    orderNumber: `CO-${p1.code}-001`,
    title: 'Additional Bored Cast-in-Situ Piling for Substation Transformer Foundation',
    description:
      'Heavy transformer dead load of 45 MT required 8 additional bored cast-in-situ piles (600mm dia, 18m depth) into bedrock as instructed by electrical consultant.',
    category: 'Additional Work',
    priority: 'High',
    requestedBy: engineer._id,
    originatingParty: 'Consultant',
    reason: 'Electrical substation layout redesign necessitated reinforced machine foundation.',
    scheduleImpactDays: 8,
    status: 'Paid',
    totalProposedPaise: 147500000, // ₹ 14,75,000
    totalApprovedPaise: 147500000,
    invoicedAmountPaise: 147500000,
    linkedBoqItemIds: [boqItemDocs[0]._id, boqItemDocs[2]._id],
  });
  await co1.save();

  const est1 = new CostEstimate({
    changeOrder: co1._id,
    version: 1,
    isFrozen: true,
    items: [
      {
        description: 'Bored piling 600mm dia including drilling through weathered rock',
        category: 'Subcontracting',
        quantity: 8,
        unit: 'nos',
        unitRatePaise: 12500000, // ₹1,25,000
        totalPaise: 100000000,
      },
      {
        description: 'M35 Grade Concrete Supply',
        category: 'Material',
        quantity: 25,
        unit: 'm3',
        unitRatePaise: 720000,
        totalPaise: 18000000,
      },
    ],
    directCostPaise: 118000000,
    overheadPct: 10,
    overheadPaise: 11800000,
    markupPct: 15,
    markupPaise: 17700000,
    taxPct: 0,
    taxablePaise: 147500000,
    taxPaise: 0,
    totalProposedPaise: 147500000,
    preparedBy: estimator._id,
  });
  await est1.save();
  co1.activeEstimateId = est1._id;
  await co1.save();

  // Create Invoice and Payment for CO-1
  const inv1 = new Invoice({
    organization: org._id,
    project: p1._id,
    changeOrders: [co1._id],
    invoiceNumber: `INV-${p1.code}-001`,
    invoiceDate: new Date('2025-08-15'),
    dueDate: new Date('2025-09-14'),
    subtotalPaise: 125000000,
    taxPaise: 22500000,
    totalAmountPaise: 147500000,
    amountPaidPaise: 147500000,
    balanceDuePaise: 0,
    status: 'Paid',
    createdBy: finance._id,
  });
  await inv1.save();

  await Payment.create({
    invoice: inv1._id,
    organization: org._id,
    project: p1._id,
    paymentDate: new Date('2025-09-02'),
    amountPaise: 147500000,
    paymentMethod: 'RTGS',
    referenceNumber: 'UTR-HDFC-991283',
    recordedBy: finance._id,
  });

  // CO-2: UNAPPROVED WORK EXECUTION (CRITICAL RISK CASE)
  const co2 = new ChangeOrder({
    organization: org._id,
    project: p1._id,
    orderNumber: `CO-${p1.code}-002`,
    title: 'Emergency Deep Well Dewatering & Slurry Shoring Wall at South Retaining Pit',
    description:
      'Sudden artesian groundwater ingress threatened collapse of adjacent municipal road and structural shoring pit. Commenced continuous 24/7 pump dewatering and installed 22 emergency secant guide walls.',
    category: 'Design Modification',
    priority: 'Urgent',
    requestedBy: engineer._id,
    originatingParty: 'Site Condition',
    reason: 'Imminent catastrophic collapse of excavation embankment during monsoon season.',
    scheduleImpactDays: 14,
    status: 'In Progress',
    unapprovedExecution: true,
    unapprovedJustification:
      'Critical geotechnical emergency: Embankment soil subsidence would cause collapse of public arterial road and sever municipal water mains if not stabilized within 48 hours.',
    unapprovedAuthorizedBy: pm._id,
    unapprovedAuthorizedAt: new Date('2025-10-01'),
    totalProposedPaise: 285000000, // ₹ 28,50,000
    totalApprovedPaise: 0,
    invoicedAmountPaise: 0,
    linkedBoqItemIds: [boqItemDocs[0]._id],
  });
  await co2.save();

  const est2 = new CostEstimate({
    changeOrder: co2._id,
    version: 1,
    isFrozen: false,
    items: [
      {
        description: '24/7 Deep well turbine pumps with diesel generator backup',
        category: 'Equipment',
        quantity: 30,
        unit: 'days',
        unitRatePaise: 4500000, // ₹45,000/day
        totalPaise: 135000000,
      },
      {
        description: 'Emergency secant piles with cement-bentonite slurry',
        category: 'Subcontracting',
        quantity: 22,
        unit: 'nos',
        unitRatePaise: 4200000,
        totalPaise: 92400000,
      },
    ],
    directCostPaise: 227400000,
    overheadPct: 10,
    overheadPaise: 22740000,
    markupPct: 15,
    markupPaise: 34860000,
    taxPct: 0,
    taxablePaise: 285000000,
    taxPaise: 0,
    totalProposedPaise: 285000000,
    preparedBy: estimator._id,
  });
  await est2.save();
  co2.activeEstimateId = est2._id;
  await co2.save();

  // CO-3: Formally Approved, Completed, Ready for Invoicing (Approved Unbilled)
  const co3 = new ChangeOrder({
    organization: org._id,
    project: p1._id,
    orderNumber: `CO-${p1.code}-003`,
    title: 'Acoustic Ceiling Grid Upgrade in Atrium and Boardrooms',
    description:
      'Client opted to upgrade standard gypsum ceiling to Hunter Douglas aluminum acoustic baffle system with integrated linear LED light slots.',
    category: 'Material Substitution',
    priority: 'Medium',
    requestedBy: engineer._id,
    originatingParty: 'Client',
    reason: 'Client corporate aesthetic standard alignment.',
    scheduleImpactDays: 5,
    status: 'Ready for Invoicing',
    totalProposedPaise: 420000000, // ₹ 42,00,000
    totalApprovedPaise: 420000000,
    invoicedAmountPaise: 0,
    linkedBoqItemIds: [boqItemDocs[5]._id],
  });
  await co3.save();

  // CO-4: Currently in Client Review
  const co4 = new ChangeOrder({
    organization: org._id,
    project: p1._id,
    orderNumber: `CO-${p1.code}-004`,
    title: 'Additional 1000kVA Standby Diesel Generator Set (DGS)',
    description:
      'IT tenant required N+1 power redundancy requiring second 1000kVA Cummins generator with acoustic enclosure and exhaust piping to terrace level.',
    category: 'Additional Work',
    priority: 'High',
    requestedBy: engineer._id,
    originatingParty: 'Client',
    reason: 'Anchor IT tenant leasing requirement.',
    scheduleImpactDays: 12,
    status: 'Client Approval',
    totalProposedPaise: 850000000, // ₹ 85,00,000
    totalApprovedPaise: 0,
    invoicedAmountPaise: 0,
    linkedBoqItemIds: [boqItemDocs[4]._id],
  });
  await co4.save();

  // CO-5: Invoiced Unpaid (Partially Paid) on Mumbai Tower
  const co5 = new ChangeOrder({
    organization: org._id,
    project: p2._id,
    orderNumber: `CO-${p2.code}-001`,
    title: 'High-Strength M60 Concrete Transition Beam at 18th Floor Transfer Slab',
    description:
      'Structural design modification from consultant to alter column layout for luxury duplexes, requiring 1.8m deep post-tensioned transfer girder.',
    category: 'Design Modification',
    priority: 'High',
    requestedBy: engineer._id,
    originatingParty: 'Consultant',
    reason: 'Architectural layout revision of luxury residential floors.',
    scheduleImpactDays: 18,
    status: 'Invoiced',
    totalProposedPaise: 960000000, // ₹ 96,00,000
    totalApprovedPaise: 960000000,
    invoicedAmountPaise: 960000000,
  });
  await co5.save();

  const inv2 = new Invoice({
    organization: org._id,
    project: p2._id,
    changeOrders: [co5._id],
    invoiceNumber: `INV-${p2.code}-001`,
    invoiceDate: new Date('2025-10-10'),
    dueDate: new Date('2025-11-10'),
    subtotalPaise: 81355932,
    taxPaise: 14644068,
    totalAmountPaise: 96000000,
    amountPaidPaise: 50000000, // ₹50 Lakhs paid
    balanceDuePaise: 46000000, // ₹46 Lakhs balance
    status: 'Partially Paid',
    createdBy: finance._id,
  });
  await inv2.save();

  await Payment.create({
    invoice: inv2._id,
    organization: org._id,
    project: p2._id,
    paymentDate: new Date('2025-10-25'),
    amountPaise: 50000000,
    paymentMethod: 'NEFT',
    referenceNumber: 'NEFT-AXIS-482910',
    recordedBy: finance._id,
  });

  // 6. Record Formal Approval Records for Audit Trail
  await Approval.create({
    changeOrder: co1._id,
    stage: 'Technical Review',
    approver: pm._id,
    decision: 'Approved',
    comments: 'Pile load capacity and bedrock depth verified with geotechnical report. Technical design cleared.',
    previousStatus: 'Submitted',
    newStatus: 'Commercial Review',
  });
  await Approval.create({
    changeOrder: co1._id,
    stage: 'Commercial Review',
    approver: estimator._id,
    decision: 'Approved',
    comments: 'Unit rate of ₹1,25,000 per pile benchmarked with current market rates. Acceptable.',
    previousStatus: 'Technical Review',
    newStatus: 'Internal Approval',
  });
  await Approval.create({
    changeOrder: co1._id,
    stage: 'Internal Approval',
    approver: owner._id,
    decision: 'Approved',
    comments: 'Internal commercial clearance granted by Director.',
    previousStatus: 'Commercial Review',
    newStatus: 'Client Approval',
  });
  await Approval.create({
    changeOrder: co1._id,
    stage: 'Client Approval',
    approver: clientApprover._id,
    decision: 'Approved',
    comments: 'Prestige Commercial Developers acknowledges necessity and approves ₹14,75,000 cost impact.',
    previousStatus: 'Client Approval',
    newStatus: 'Approved',
  });

  // 7. Seed Initial Drawing Attachment & Annotations for P1
  const drawingAttachment = new Attachment({
    organization: org._id,
    project: p1._id,
    changeOrder: co2._id,
    filename: 'baseline-basement-layout-r1.png',
    originalName: 'Structural_Basement_Level_1_GA.png',
    mimeType: 'image/png',
    sizeBytes: 1024 * 480,
    storagePath: '/uploads/sample-drawing.png',
    category: 'Drawing',
    uploadedBy: engineer._id,
    notes: 'South retaining pit and pile cap location blueprint',
  });
  await drawingAttachment.save();

  await DrawingAnnotation.create({
    document: drawingAttachment._id,
    changeOrder: co2._id,
    pageNumber: 1,
    type: 'rect',
    normalizedX: 0.35,
    normalizedY: 0.42,
    normalizedWidth: 0.22,
    normalizedHeight: 0.18,
    color: '#C53030',
    label: 'REV-01',
    comment: 'Emergency secant shoring wall installed to arrest embankment failure',
    createdBy: engineer._id,
  });

  await DrawingAnnotation.create({
    document: drawingAttachment._id,
    changeOrder: co2._id,
    pageNumber: 1,
    type: 'marker',
    normalizedX: 0.58,
    normalizedY: 0.52,
    color: '#D97706',
    label: 'PUMP-1',
    comment: 'Artesian water ingress point (3500 LPM discharge rate)',
    createdBy: engineer._id,
  });

  console.log('--- Database Seeding Completed Successfully! ---');
  console.log('Summary of Seeded Data:');
  console.log(`- Organization: Northstar Infrastructure Pvt. Ltd.`);
  console.log(`- 6 Demo Accounts seeded using your configured SEED_DEMO_PASSWORD:`);
  console.log(`  * Owner / Director: vikram@northstarinfra.com`);
  console.log(`  * Project Manager: arjun.pm@northstarinfra.com`);
  console.log(`  * Site Engineer: priya.site@northstarinfra.com`);
  console.log(`  * Commercial Manager: manoj.comm@northstarinfra.com`);
  console.log(`  * Finance Officer: anita.fin@northstarinfra.com`);
  console.log(`  * Client Approver: client.rep@prestigecommercial.com`);
  console.log(`- 3 Active Projects: PRJ-NSR-001, PRJ-NSR-002, PRJ-NSR-003`);
  console.log(`- Reconciled Financial Exposure Buckets with real data`);
}

// Execute if run directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[Seed] FATAL: Demo seed script is disabled in production.');
    process.exit(1);
  }
  connectDB()
    .then(() => seedDatabase())
    .then(() => disconnectDB())
    .catch((err) => {
      console.error('Seed execution failed:', err.message || err);
      process.exit(1);
    });
}

