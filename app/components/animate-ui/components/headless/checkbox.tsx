import * as React from 'react';
import { motion } from 'motion/react';

import {
  Checkbox as CheckboxPrimitive,
  CheckboxIndicator as CheckboxIndicatorPrimitive,
  type CheckboxProps as CheckboxPrimitiveProps,
  type CheckboxContextType,
} from '@/components/animate-ui/primitives/headless/checkbox';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const checkboxVariants = cva(
  'peer shrink-0 flex items-center justify-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-500 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-background border [&[data-checked],&[data-indeterminate]]:bg-primary [&[data-checked],&[data-indeterminate]]:text-primary-foreground',
        accent: 'bg-input [&[data-checked],&[data-indeterminate]]:bg-primary [&[data-checked],&[data-indeterminate]]:text-primary-foreground',
        portal: 'bg-slate-50 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-md [&[data-checked],&[data-indeterminate]]:bg-amber-500 [&[data-checked],&[data-indeterminate]]:border-amber-500 [&[data-checked],&[data-indeterminate]]:text-white',
      },
      size: {
        default: 'size-5 rounded-md',
        sm: 'size-4.5 rounded-[5px]',
        lg: 'size-6 rounded-[7px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const checkboxIndicatorVariants = cva('', {
  variants: {
    size: {
      default: 'size-3.5',
      sm: 'size-3',
      lg: 'size-4',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

type CheckboxProps<TTag extends React.ElementType = typeof motion.button> =
  Omit<CheckboxPrimitiveProps<TTag>, 'children'> &
    VariantProps<typeof checkboxVariants> & {
      children?: React.ReactNode | ((bag: CheckboxContextType) => React.ReactNode);
    };

function Checkbox<TTag extends React.ElementType = typeof motion.button>({
  className,
  children,
  variant,
  size,
  ...props
}: CheckboxProps<TTag>) {
  return (
    <CheckboxPrimitive
      className={cn(checkboxVariants({ variant, size, className }))}
      {...props}
    >
      {(bag: CheckboxContextType) => (
        <>
          {typeof children === 'function' ? children(bag) : children}
          <CheckboxIndicatorPrimitive
            className={cn(checkboxIndicatorVariants({ size }))}
          />
        </>
      )}
    </CheckboxPrimitive>
  );
}

export { Checkbox, type CheckboxProps };
