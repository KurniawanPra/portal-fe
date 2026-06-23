'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import {
  LiquidButton as LiquidButtonPrimitive,
  type LiquidButtonProps as LiquidButtonPrimitiveProps,
} from '@/components/animate-ui/primitives/buttons/liquid';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[box-shadow,_color,_background-color,_border-color,_outline-color,_text-decoration-color,_fill,_stroke] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          '[--liquid-button-background-color:var(--accent)] [--liquid-button-color:var(--primary)] text-primary hover:text-primary-foreground shadow-xs',
        destructive:
          '[--liquid-button-background-color:var(--accent)] [--liquid-button-color:var(--destructive)] text-white shadow-xs focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        secondary:
          '[--liquid-button-background-color:var(--accent)] [--liquid-button-color:var(--secondary)] text-secondary hover:text-secondary-foreground shadow-xs',
        ghost:
          '[--liquid-button-background-color:var(--transparent)] [--liquid-button-color:var(--primary)] text-primary hover:text-primary-foreground shadow-xs',
        outline:
          'border border-amber-500/35 dark:border-amber-500/20 [--liquid-button-background-color:transparent] [--liquid-button-color:#d97706] dark:[--liquid-button-color:#fbbf24] text-amber-600 dark:text-amber-400 hover:text-white dark:hover:text-slate-950 shadow-sm transition-[box-shadow,_border-color,_outline-color] hover:border-transparent dark:hover:border-transparent',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        xl: 'h-12 rounded-2xl px-6 font-bold text-sm',
        login: 'h-[52px] rounded-2xl px-6 font-bold text-base',
        icon: 'size-9',
        'icon-sm': 'size-8 rounded-md',
        'icon-lg': 'size-10 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type LiquidButtonProps = LiquidButtonPrimitiveProps &
  VariantProps<typeof buttonVariants>;

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <LiquidButtonPrimitive
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
LiquidButton.displayName = 'LiquidButton';

export { LiquidButton, buttonVariants, type LiquidButtonProps };
