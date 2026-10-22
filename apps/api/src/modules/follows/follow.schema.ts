import { z } from '@tribute/validation';

export const userIdParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const organizationIdParamsSchema = z.object({
  organizationId: z.string().uuid(),
});
