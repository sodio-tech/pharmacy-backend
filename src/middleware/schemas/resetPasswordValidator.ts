import z from '../../config/zodConfig.js';

export const resetPasswordSchema = z.object({
  new_password: z.string()
    .regex(
      /^[a-zA-Z0-9!@#$%^&*]{8,}$/,
      'Password must be at least 8 characters long and contain only letters, numbers, and special characters !@#$%^&*'
    ),
});

// Type inference
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
