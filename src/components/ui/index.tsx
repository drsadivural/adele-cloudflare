// Comprehensive UI Components Library for ADELE
// Touch-friendly, accessible, and responsive

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, X, Loader2, Eye, EyeOff, AlertCircle, Info, CheckCircle } from 'lucide-react';

// ============================================
// BUTTON
// ============================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
      secondary: 'bg-zinc-800 text-white hover:bg-zinc-700 active:bg-zinc-600',
      outline: 'border border-zinc-700 text-white hover:bg-zinc-800 active:bg-zinc-700',
      ghost: 'text-zinc-400 hover:text-white hover:bg-zinc-800 active:bg-zinc-700',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm min-w-[44px]',
      md: 'h-11 px-4 text-sm min-w-[44px]',
      lg: 'h-12 px-6 text-base min-w-[44px]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ============================================
// INPUT
// ============================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const isPassword = type === 'password';

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-zinc-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              'w-full h-11 px-4 bg-zinc-900 border rounded-xl text-white placeholder-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors',
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              error ? 'border-red-500' : 'border-zinc-800',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-zinc-500">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ============================================
// TEXTAREA
// ============================================

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-zinc-300 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full min-h-[120px] px-4 py-3 bg-zinc-900 border rounded-xl text-white placeholder-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors resize-y',
            error ? 'border-red-500' : 'border-zinc-800',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-zinc-500">{hint}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ============================================
// SELECT
// ============================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  label,
  error,
  placeholder = 'Select...',
  disabled,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('w-full', className)} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full h-11 px-4 bg-zinc-900 border rounded-xl text-left',
            'flex items-center justify-between gap-2',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
            error ? 'border-red-500' : 'border-zinc-800',
            selectedOption ? 'text-white' : 'text-zinc-500'
          )}
          disabled={disabled}
        >
          <span className="truncate">{selectedOption?.label || placeholder}</span>
          <ChevronDown
            className={cn('w-5 h-5 text-zinc-500 transition-transform', isOpen && 'rotate-180')}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto py-1">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange?.(option.value);
                      setIsOpen(false);
                    }}
                    disabled={option.disabled}
                    className={cn(
                      'w-full px-4 py-2.5 text-left flex items-center justify-between min-h-[44px]',
                      'hover:bg-zinc-800 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      option.value === value ? 'text-blue-500' : 'text-white'
                    )}
                  >
                    <span>{option.label}</span>
                    {option.value === value && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================
// SWITCH / TOGGLE
// ============================================

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Switch({
  checked = false,
  onChange,
  label,
  description,
  disabled,
  size = 'md',
  className,
}: SwitchProps) {
  const sizes = {
    sm: { track: 'w-8 h-5', thumb: 'w-4 h-4', translate: 'translate-x-3' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
  };

  const { track, thumb, translate } = sizes[size];

  return (
    <label
      className={cn(
        'flex items-start gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        className={cn(
          'relative inline-flex flex-shrink-0 rounded-full transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950',
          track,
          checked ? 'bg-blue-600' : 'bg-zinc-700'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform',
            thumb,
            checked && translate
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && <span className="block text-sm font-medium text-white">{label}</span>}
          {description && <span className="block text-sm text-zinc-500">{description}</span>}
        </div>
      )}
    </label>
  );
}

// ============================================
// CHECKBOX
// ============================================

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  indeterminate?: boolean;
}

export function Checkbox({
  checked = false,
  onChange,
  label,
  description,
  disabled,
  indeterminate,
}: CheckboxProps) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        className={cn(
          'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950',
          'min-w-[44px] min-h-[44px] -m-2.5',
          checked || indeterminate
            ? 'bg-blue-600 border-blue-600'
            : 'bg-zinc-900 border border-zinc-700'
        )}
      >
        <div className="w-5 h-5 flex items-center justify-center">
          {checked && <Check className="w-3.5 h-3.5 text-white" />}
          {indeterminate && !checked && <div className="w-2.5 h-0.5 bg-white rounded" />}
        </div>
      </button>
      {(label || description) && (
        <div className="flex-1 min-w-0 pt-0.5">
          {label && <span className="block text-sm font-medium text-white">{label}</span>}
          {description && <span className="block text-sm text-zinc-500">{description}</span>}
        </div>
      )}
    </label>
  );
}

// ============================================
// BADGE
// ============================================

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const variants = {
    default: 'bg-zinc-800 text-zinc-300',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    error: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// ============================================
// ALERT
// ============================================

export interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({ children, variant = 'info', title, onClose, className }: AlertProps) {
  const variants = {
    info: {
      bg: 'bg-blue-500/10 border-blue-500/20',
      icon: <Info className="w-5 h-5 text-blue-400" />,
      title: 'text-blue-400',
    },
    success: {
      bg: 'bg-green-500/10 border-green-500/20',
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      title: 'text-green-400',
    },
    warning: {
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
      title: 'text-yellow-400',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/20',
      icon: <AlertCircle className="w-5 h-5 text-red-400" />,
      title: 'text-red-400',
    },
  };

  const { bg, icon, title: titleColor } = variants[variant];

  return (
    <div className={cn('rounded-xl border p-4', bg, className)}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          {title && <h4 className={cn('font-medium mb-1', titleColor)}>{title}</h4>}
          <div className="text-sm text-zinc-300">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// TABS
// ============================================

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills';
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = 'default', className }: TabsProps) {
  return (
    <div
      className={cn(
        'flex overflow-x-auto scrollbar-hide',
        variant === 'default' && 'border-b border-zinc-800',
        variant === 'pills' && 'gap-2 p-1 bg-zinc-900 rounded-xl',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap min-h-[44px]',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              variant === 'default' && [
                'border-b-2 -mb-px',
                isActive
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-zinc-400 hover:text-white',
              ],
              variant === 'pills' && [
                'rounded-lg',
                isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white',
              ]
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// MODAL
// ============================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl',
                sizes[size]
              )}
            >
              {/* Header */}
              {(title || showClose) && (
                <div className="flex items-start justify-between p-6 border-b border-zinc-800">
                  <div>
                    {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
                    {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
                  </div>
                  {showClose && (
                    <button
                      onClick={onClose}
                      className="p-2 -m-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// SKELETON
// ============================================

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-zinc-800',
        variants[variant],
        variant === 'text' && 'h-4',
        className
      )}
      style={{ width, height }}
    />
  );
}

// ============================================
// PROGRESS
// ============================================

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variants = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className={className}>
      <div className={cn('w-full bg-zinc-800 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-zinc-500">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// AVATAR
// ============================================

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium overflow-hidden',
        'bg-gradient-to-br from-blue-500 to-purple-600 text-white',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        initials || '?'
      )}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {icon && <div className="mb-4 text-zinc-600">{icon}</div>}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-zinc-400 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ============================================
// DIVIDER
// ============================================

export interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-sm text-zinc-500">{label}</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
    );
  }

  return <div className={cn('h-px bg-zinc-800', className)} />;
}


// ============================================
// SLIDER
// ============================================

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  disabled = false,
  className,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-zinc-300">{label}</span>}
          {showValue && <span className="text-sm text-zinc-400">{value}</span>}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={cn(
            'w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4',
            '[&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:bg-blue-600',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:w-4',
            '[&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:bg-blue-600',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:cursor-pointer'
          )}
          style={{
            background: `linear-gradient(to right, rgb(37 99 235) ${percentage}%, rgb(39 39 42) ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
}

// ============================================
// PROGRESS BAR
// ============================================

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = 'md',
  color = 'blue',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-sm text-zinc-400">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-zinc-400">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-zinc-800 rounded-full overflow-hidden', sizes[size])}>
        <motion.div
          className={cn('h-full rounded-full', colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
