import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          'inline-flex items-center justify-center font-heading font-semibold transition-colors rounded-lg',
          {
            'bg-accent text-light hover:bg-coral-dark': variant === 'primary',
            'bg-transparent text-dark border border-gray hover:bg-sand': variant === 'secondary',
            'bg-transparent text-accent hover:bg-accent/10': variant === 'ghost',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-6 py-3 text-sm': size === 'md',
            'px-8 py-4 text-base': size === 'lg',
            'opacity-50 cursor-not-allowed': disabled,
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
