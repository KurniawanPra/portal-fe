'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

import { Slot, type WithAsChild } from '@/components/animate-ui/primitives/animate/slot';

type ButtonProps = WithAsChild<
  HTMLMotionProps<'button'> & {
    hoverScale?: number;
    tapScale?: number;
  }
>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { hoverScale = 1.05, tapScale = 0.95, asChild = false, ...props },
    ref
  ) => {
    const Component = asChild ? Slot : motion.button;

    return (
      <Component
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        whileTap={{ scale: tapScale }}
        whileHover={{ scale: hoverScale }}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, type ButtonProps };
