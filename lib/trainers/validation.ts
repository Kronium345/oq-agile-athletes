import { z } from 'zod';
import { TRAINER_SPECIALTIES } from './constants';

export const trainerProfileSchema = z.object({
  displayName: z.string().min(2, 'Name is required'),
  bio: z.string().min(20, 'Bio must be at least 20 characters').max(2000),
  qualifications: z
    .array(z.string().min(2))
    .min(1, 'Add at least one qualification'),
  specialties: z
    .array(z.enum(TRAINER_SPECIALTIES as [string, ...string[]]))
    .min(1, 'Select at least one specialty'),
  gymName: z.string().min(2, 'Gym name is required'),
  postcode: z
    .string()
    .min(5, 'Enter a valid UK postcode')
    .max(8),
  priceFrom: z.coerce.number().min(0).optional(),
  priceUnit: z.enum(['session', 'hour', 'month']).optional(),
  instagram: z.string().max(100).optional(),
  availabilityNotes: z.string().max(500).optional(),
  published: z.boolean().optional(),
});

export const memberGymSchema = z.object({
  gymName: z.string().min(2, 'Gym name is required'),
  postcode: z.string().min(5).max(8),
});

export const contactRequestSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters'),
  goal: z.string().max(200).optional(),
  budget: z.string().max(100).optional(),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  text: z.string().min(10).max(1000),
});

export const matchWizardSchema = z.object({
  goal: z.string().min(5),
  budget: z.string().optional(),
  postcode: z.string().optional(),
  trainingStyle: z.string().optional(),
  experience: z.string().optional(),
});

export type TrainerProfileFormData = z.infer<typeof trainerProfileSchema>;
