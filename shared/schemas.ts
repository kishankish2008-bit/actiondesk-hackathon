/**
 * ActionDesk Validation Schemas
 * Zod schemas to guarantee strict input/output validation.
 */

import { z } from 'zod';

export const ProviderCapabilitySchema = z.enum([
  'authorized_live_search',
  'user_handoff_only',
  'unavailable',
]);

export const TrainConstraintsSchema = z.object({
  origin: z.string().min(1, 'Origin station is required'),
  destination: z.string().min(1, 'Destination station is required'),
  date: z.string().min(1, 'Travel date is required'),
  timePreference: z.enum(['morning', 'afternoon', 'evening', 'any']).default('any'),
  passengerCount: z.number().int().min(1, 'At least 1 passenger is required').default(1),
  budget: z.number().positive().optional(),
  currency: z.string().default('INR'),
  preferredProvider: z.string().optional(),
});

export const ShoppingConstraintsSchema = z.object({
  query: z.string().min(1, 'Search term or product description is required'),
  category: z.string().optional(),
  budget: z.number().positive().optional(),
  currency: z.string().default('INR'),
  constraints: z.array(z.string()).default([]),
  preferredProvider: z.string().optional(),
});

export const GeneralInfoConstraintsSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  topic: z.string().optional(),
});

export const CreateTaskInputSchema = z.object({
  rawInput: z.string().trim().min(1, 'Input text cannot be empty').max(2000, 'Request is too long'),
  inputMode: z.enum(['text', 'voice']).default('text'),
  providerId: z.string().optional(),
});

export const AssistantMessageInputSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Message is too long'),
});

export const ClarifyTaskInputSchema = z.object({
  taskId: z.string().uuid(),
  answers: z
    .record(z.string().min(1).max(40), z.string().max(200))
    .refine(
      (answers) => Object.keys(answers).length <= 12,
      'At most 12 clarification fields are allowed',
    ),
});

export const HandoffTaskInputSchema = z.object({
  taskId: z.string().uuid(),
  providerId: z.string().min(1).max(80).optional(),
});

export const SelectOptionInputSchema = z.object({
  taskId: z.string().uuid(),
  selectedOptionId: z.string().min(1),
});

export const ConfirmActionInputSchema = z.object({
  taskId: z.string().uuid(),
  confirmed: z.boolean(),
  passengerOverrides: z.record(z.string(), z.any()).optional(),
  deliveryOverrides: z.record(z.string(), z.any()).optional(),
});

export const LiveProductResultSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().default('General'),
  price: z.number().positive(),
  currency: z.string().min(1),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  features: z.array(z.string()).default([]),
  inStock: z.boolean(),
  deliveryDays: z.number().int().nonnegative().default(3),
  description: z.string().default(''),
  sourceUrl: z.string().url(),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  retrievedAt: z.string().datetime(),
  uncertaintyNote: z.string().optional(),
});

export const LiveTrainResultSchema = z.object({
  id: z.string().min(1),
  carrier: z.string().min(1),
  trainNumber: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  departureTime: z.string().min(1),
  arrivalTime: z.string().min(1),
  duration: z.string().min(1),
  pricePerPassenger: z.number().positive(),
  totalPrice: z.number().positive(),
  currency: z.string().min(1),
  availableSeats: z.number().int().nonnegative(),
  cabinClass: z.enum(['Standard', 'Business', 'First']),
  carbonEmissionKg: z.number().nonnegative().default(10),
  sourceUrl: z.string().url(),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  retrievedAt: z.string().datetime(),
  uncertaintyNote: z.string().optional(),
});

export const AllowlistPolicySchema = z.object({
  url: z.string().url(),
  allowedHosts: z.array(z.string()),
});
