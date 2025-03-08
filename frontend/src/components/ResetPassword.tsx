import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthService } from '../hooks/useServices';
import { FormInput } from './common/FormInput';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const authService = useAuthService();

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('password', {
        type: 'manual',
        message: 'Invalid reset token'
      });
      return;
    }

    try {
      await authService.resetPassword(token, data.password);
      setSuccessMessage('Password has been reset successfully.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error resetting password';
      setError('password', {
        type: 'manual',
        message
      });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Invalid or expired reset token. Please request a new password reset.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">Reset your password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password.
          </p>
        </div>
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <FormInput<ResetPasswordFormData>
            id="password"
            type="password"
            label="New Password"
            placeholder="Enter your new password"
            register={register}
            error={errors.password}
            required
          />
          <FormInput<ResetPasswordFormData>
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm your new password"
            register={register}
            error={errors.confirmPassword}
            required
          />
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};
