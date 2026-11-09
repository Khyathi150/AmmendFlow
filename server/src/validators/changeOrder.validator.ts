import { z } from 'zod';

export const costEstimateItemSchema = z.object({
  description: z.string().min(1, 'Item description is required').trim(),
  category: z.enum(['Material', 'Labour', 'Equipment', 'Subcontracting', 'Other']),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  unit: z.string().min(1, 'Unit is required').trim(),
  unitRateRupees: z.number().min(0, 'Unit rate must be non-negative'),
  boqItemRef: z.string().optional(),
});

export const createChangeOrderSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Detailed scope description is required'),
  category: z.enum([
    'Additional Work',
    'Omitted Work',
    'Quantity Variation',
    'Material Substitution',
    'Design Modification',
    'Time Extension',
    'Other',
  ]),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  originatingParty: z
    .enum(['Contractor', 'Client', 'Architect', 'Consultant', 'Site Condition'])
    .default('Contractor'),
  reason: z.string().min(5, 'Reason for modification is required'),
  scheduleImpactDays: z.number().int().min(0).default(0),
  linkedBoqItemIds: z.array(z.string()).optional(),
  isDraft: z.boolean().default(false),
  estimate: z
    .object({
      items: z.array(costEstimateItemSchema).default([]),
      overheadPct: z.number().min(0).max(100).default(10),
      markupPct: z.number().min(0).max(100).default(15),
      taxPct: z.number().min(0).max(100).default(18),
      notes: z.string().optional(),
    })
    .optional(),
});

export const updateChangeOrderSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  category: z
    .enum([
      'Additional Work',
      'Omitted Work',
      'Quantity Variation',
      'Material Substitution',
      'Design Modification',
      'Time Extension',
      'Other',
    ])
    .optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  reason: z.string().optional(),
  scheduleImpactDays: z.number().int().min(0).optional(),
  linkedBoqItemIds: z.array(z.string()).optional(),
});

export const authorizeExecutionSchema = z.object({
  unapprovedJustification: z.string().optional(),
});

