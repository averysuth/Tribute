import { z } from '@tribute/validation';

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .transform((value) => value.toLowerCase())
  .refine((value) => /^[a-z0-9_]+$/.test(value), {
    message: 'Username can only contain lowercase letters, numbers, and underscores',
  });

export const syncUserProfileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1, 'Display name is required').max(50),
});

export type SyncUserProfileInput = z.infer<typeof syncUserProfileSchema>;
