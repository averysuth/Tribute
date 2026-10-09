import { z } from '@tribute/validation';

const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .transform((value) => value.toLowerCase())
  .refine((value) => /^[a-z0-9-]+$/.test(value), {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  });

export const createEventSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    slug: slugSchema,
    description: z.string().trim().max(5000).optional(),
    posterUrl: z.string().url().optional(),
    venueName: z.string().trim().max(150).optional(),
    address: z.string().trim().max(300).optional(),
    mapUrl: z.string().url().optional(),
    registrationUrl: z.string().url().optional(),
    timeZone: z.string().trim().min(1).max(50),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .strict()
  .refine((data) => data.endsAt >= data.startsAt, {
    message: 'endsAt must be on or after startsAt',
    path: ['endsAt'],
  });

export const updateEventSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(5000).optional(),
    posterUrl: z.string().url().optional(),
    venueName: z.string().trim().max(150).optional(),
    address: z.string().trim().max(300).optional(),
    mapUrl: z.string().url().optional(),
    registrationUrl: z.string().url().optional(),
    timeZone: z.string().trim().min(1).max(50).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
  })
  .strict();

export const organizationEventsParamsSchema = z.object({
  organizationId: z.string().uuid(),
});

export const eventIdParamsSchema = z.object({
  eventId: z.string().uuid(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
