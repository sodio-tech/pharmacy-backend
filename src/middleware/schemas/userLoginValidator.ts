import z from '../../config/zodConfig.js';

export const userLoginSchema = z.object({
  email: z.email('Email must be a valid email'),
  password: z.string()
    .min(6, { message: 'Password cannot be an empty field' })
    .regex(
      /^[a-zA-Z0-9!@#$%^&*]{6,}$/,
      { message: 'Password must be at least 6 characters long and contain only letters, numbers, and special characters !@#$%^&*' }
    )
});

// Type inference
export type UserLogin = z.infer<typeof userLoginSchema>;
