import { z } from '@tribute/validation';

const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(50)
  .transform((value) => value.toLowerCase())
  .refine((value) => /^[a-z0-9-]+$/.test(value), {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  });

export const createOrganizationSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    slug: slugSchema,
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateOrganizationSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

export const organizationRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER']);

export const addMemberSchema = z
  .object({
    userId: z.string().uuid(),
    role: organizationRoleSchema.default('MEMBER'),
  })
  .strict();

export const updateMemberRoleSchema = z
  .object({
    role: organizationRoleSchema,
  })
  .strict();

export const organizationIdParamsSchema = z.object({
  organizationId: z.string().uuid(),
});

export const organizationMemberParamsSchema = organizationIdParamsSchema.extend({
  userId: z.string().uuid(),
});

export const organizationSlugParamsSchema = z.object({
  slug: slugSchema,
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
