import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { emailSchema, passwordSchema, uuidSchema } from '../common/schemas.js';

export const idParamSchema = z.object({ id: uuidSchema });
export const updateMeSchema = z
  .object({ email: emailSchema.optional(), displayName: z.string().trim().min(1).max(100).optional() })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'At least one field is required');
export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema })
  .strict()
  .refine((v) => v.currentPassword !== v.newPassword, { message: 'New password must differ', path: ['newPassword'] });
export const createUserSchema = z
  .object({
    email: emailSchema,
    displayName: z.string().trim().min(1).max(100),
    password: passwordSchema,
    role: z.enum(['USER', 'ADMIN']),
  })
  .strict();
export const updateUserSchema = z
  .object({
    email: emailSchema.optional(),
    displayName: z.string().trim().min(1).max(100).optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    status: z.enum(['ACTIVE', 'DEACTIVATED']).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'At least one field is required');
export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'DEACTIVATED', 'DELETED']).optional(),
});
export class IdParamDto extends createZodDto(idParamSchema) {}
export class UpdateMeDto extends createZodDto(updateMeSchema) {}
export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
export class CreateUserDto extends createZodDto(createUserSchema) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
export class ListUsersDto extends createZodDto(listUsersSchema) {}
