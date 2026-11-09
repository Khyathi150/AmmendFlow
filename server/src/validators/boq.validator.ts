import { z } from 'zod';

export const createBOQItemSchema = z.object({
  itemCode: z.string().min(1, 'Item code is required').trim(),
  description: z.string().min(3, 'Description is required').trim(),
  category: z.enum([
    'Civil',
    'Structural',
    'MEP',
    'Finishing',
    'Infrastructure',
    'External Works',
    'General',
  ]),
  unit: z.string().min(1, 'Unit of measurement is required').trim(),
  baselineQuantity: z.number().min(0, 'Baseline quantity must be non-negative'),
  unitRatePaise: z.number().int().min(0, 'Unit rate in paise must be non-negative'),
  notes: z.string().optional(),
});

export const updateBOQItemSchema = createBOQItemSchema.partial();

