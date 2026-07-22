import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { emailSchema, passwordSchema, userSchema } from '../common/schemas.js';

export const registerSchema = z
  .object({ email: emailSchema, displayName: z.string().trim().min(1).max(100), password: passwordSchema })
  .strict();
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) }).strict();
export const refreshSchema = z.object({ refreshToken: z.string().min(1) }).strict();
export const tokenPairSchema = z.object({ accessToken: z.string(), refreshToken: z.string(), user: userSchema });
export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class RefreshDto extends createZodDto(refreshSchema) {}
export class TokenPairDto extends createZodDto(tokenPairSchema) {}
