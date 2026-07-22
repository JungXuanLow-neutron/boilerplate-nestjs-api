import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const emailSchema = z
  .string()
  .email()
  .max(320)
  .transform((v) => v.trim().toLowerCase());
export const passwordSchema = z.string().min(12).max(128);
export const uuidSchema = z.string().uuid();
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  status: z.enum(['ACTIVE', 'DEACTIVATED', 'DELETED']),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  detail: z.string(),
  instance: z.string(),
  code: z.string(),
  requestId: z.string(),
  errors: z.array(z.object({ pointer: z.string(), detail: z.string(), code: z.string() })).optional(),
});
export class ProblemDto extends createZodDto(problemSchema) {}
