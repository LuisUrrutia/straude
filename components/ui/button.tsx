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
          'inline-flex items-center justify-center font-heading font-semibold transition-colors',
          {
            'btn-brutal btn-brutal-primary': variant === 'primary',
            'btn-brutal btn-brutal-secondary': variant === 'secondary',
            'btn-brutal btn-brutal-ghost': variant === 'ghost',
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
