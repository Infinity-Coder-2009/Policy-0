/**
 * Design System Components
 * ============================================================
 * Reusable UI components for Policy-0.
 */

import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

// ===== Button =====
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const buttonVariants = {
  primary: 'bg-[#0055FF] hover:bg-[#0044DD] text-white shadow-lg shadow-[#0055FF]/20',
  secondary: 'bg-[#141428] hover:bg-[#1E1E3A] text-white border border-[#2A2A4A]',
  outline: 'border border-[#2A2A4A] hover:border-[#0055FF] text-white',
  danger: 'bg-[#FF3355] hover:bg-[#E62E4D] text-white shadow-lg shadow-[#FF3355]/20',
  success: 'bg-[#00CC88] hover:bg-[#00B377] text-white shadow-lg shadow-[#00CC88]/20',
  ghost: 'hover:bg-[#141428] text-[#A0A0B8] hover:text-white',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ===== Card =====
interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-[#141428] border border-[#2A2A4A] rounded-2xl p-6',
        hover && 'hover:border-[#0055FF]/50 hover:shadow-lg hover:shadow-[#00500]/5 transition-all cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ===== Badge =====
interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'simulated' | 'real';
  children: ReactNode;
  className?: string;
}

const badgeVariants = {
  success: 'bg-[#00CC88]/10 text-[#00CC88] border-[#00CC88]/30',
  warning: 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30',
  error: 'bg-[#FF3355]/10 text-[#FF3355] border-[#FF3355]/30',
  info: 'bg-[#0088FF]/10 text-[#0088FF] border-[#0088FF]/30',
  default: 'bg-[#2A2A4A]/50 text-[#A0A0B8] border-[#2A2A4A]',
  simulated: 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30',
  real: 'bg-[#00CC88]/10 text-[#00CC88] border-[#00CC88]/30',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ===== Input =====
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-[#E8E8F0]">{label}</label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-[#0A0A1A] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF]/50 transition-all',
            error ? 'border-[#FF3355]' : 'border-[#2A2A4A]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#FF3355]">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#A0A0B8]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ===== Select =====
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-[#E8E8F0]">{label}</label>
        )}
        <select
          ref={ref}
          className={clsx(
            'w-full bg-[#0A0A1A] border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF]/50 transition-all appearance-none',
            error ? 'border-[#FF3355]' : 'border-[#2A2A4A]',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[#FF3355]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ===== Skeleton =====
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-[#141428] rounded-xl',
        className
      )}
    />
  );
}

// ===== Empty State =====
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-[#A0A0B8] mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-[#A0A0B8] max-w-md mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ===== Stat Card =====
interface StatCardProps {
  title: string;
  value: string | number;
  change?: { value: number; positive: boolean };
  icon?: ReactNode;
}

export function StatCard({ title, value, change, icon }: StatCardProps) {
  return (
    <div className="bg-[#141428] border border-[#2A2A4A] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[#A0A0B8]">{title}</span>
        {icon && <span className="text-[#0055FF]">{icon}</span>}
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-white">{value}</span>
        {change && (
          <span
            className={clsx(
              'text-sm font-medium mb-1',
              change.positive ? 'text-[#00CC88]' : 'text-[#FF3355]'
            )}
          >
            {change.positive ? '+' : ''}{change.value}%
          </span>
        )}
      </div>
    </div>
  );
}