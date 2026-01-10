import { z } from 'zod';

export const UserRoleEnum = z.enum([
  'SYS_ADMIN',
  'ADMIN_SAAS',
  'ADMIN_POT',
  'ADMIN_LOJA',
  'SECRETARIO_LOJA',
  'TESOUREIRO',
  'LODGE_ADMIN',
  'SECRETARY',
  'FINANCE',
  'ADMIN',
  'MEMBER',
]);

export const UserStatusEnum = z.enum(['INVITED', 'ACTIVE', 'SUSPENDED']);

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  lojaId: z.string().uuid('ID da loja inválido'),
  role: UserRoleEnum.default('MEMBER'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  lojaId: z.string().uuid('ID da loja inválido').optional(),
  role: UserRoleEnum.optional(),
  status: UserStatusEnum.optional(),
});

export const setPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirmação de senha deve ter no mínimo 8 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirmação de senha deve ter no mínimo 8 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export type UserRole = z.infer<typeof UserRoleEnum>;
export type UserStatus = z.infer<typeof UserStatusEnum>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
