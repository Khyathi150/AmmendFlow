import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(150),
  code: z.string().min(2, 'Project code must be at least 2 characters').max(20).toUpperCase(),
  description: z.string().optional(),
  clientName: z.string().min(2, 'Client name is required'),
  clientContact: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
    })
    .optional(),
  contractorName: z.string().min(2, 'Contractor name is required'),
  location: z.object({
    address: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    country: z.string().default('India'),
  }),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  targetEndDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  originalContractPaise: z.number().int().min(0, 'Contract amount must be a positive integer in paise'),
  currency: z.string().default('INR'),
  status: z.enum(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']).default('Active'),
});

export const updateProjectSchema = createProjectSchema.partial();

