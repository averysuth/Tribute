import { z } from '@tribute/validation';

const uuidSchema = z.string().uuid();

const danceStyleEntrySchema = z.object({
  danceStyleId: uuidSchema,
  isPrimary: z.boolean().default(false),
});

export const upsertPerformerProfileSchema = z
  .object({
    performerType: z.string().trim().min(1, 'Performer type is required').max(50),
    journey: z.string().trim().max(2000).optional(),
    region: z.string().trim().max(100).optional(),
    community: z.string().trim().max(100).optional(),
    danceStyles: z.array(danceStyleEntrySchema).max(10).optional(),
  })
  .strict();

export type UpsertPerformerProfileInput = z.infer<typeof upsertPerformerProfileSchema>;

export const performerProfileParamsSchema = z.object({
  userId: uuidSchema,
});
