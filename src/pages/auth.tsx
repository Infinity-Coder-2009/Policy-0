/**
 * Authentication Pages
 * ============================================================
 * Login and Signup pages with form validation.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useAuthStore } from '../stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  role: z.enum(['admin', 'operator', 'viewer']).default('operator'),
  acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch {
      // Error is handled by store
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0055FF] to-[#0088FF] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0055FF]/20">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-[#A0A0B8] mt-2">Sign in to your Policy-0 account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FF3355]/10 border border-[#FF3355]/30 text-sm text-[#FF3355]">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="engineer@robotics-lab.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-[#A0A0B8]">
              <input
                type="checkbox"
                onChange={() => setShowPassword(!showPassword)}
                className="rounded border-[#2A2A4A] bg-[#0A0A1A]"
              />
              Show password
            </label>
            <a href="#" className="text-[#0055FF] hover:underline">
              Forgot password?
            </a>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-center text-sm text-[#A0A0B8] mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#0055FF] font-medium hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'operator', acceptTerms: false },
  });

  const onSubmit = async (data: SignupFormData) => {
    clearError();
    try {
      await signup(data.email, data.password, data.name, data.role);
      navigate('/');
    } catch {
      // Error is handled by store
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0055FF] to-[#0088FF] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0055FF]/20">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-[#A0A0B8] mt-2">Join 500+ robotics engineers building embodied AI</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FF3355]/10 border border-[#FF3355]/30 text-sm text-[#FF3355]">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="engineer@robotics-lab.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-password"
              onChange={() => setShowPassword(!showPassword)}
              className="rounded border-[#2A2A4A] bg-[#0A0A1A]"
            />
            <label htmlFor="show-password" className="text-sm text-[#A0A0B8]">
              Show password
            </label>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create Account
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-center text-sm text-[#A0A0B8] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0055FF] font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}