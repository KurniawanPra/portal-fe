'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

const smoothEase = [0.22, 1, 0.36, 1] as const;

export function StaggerContainer({
  children,
  className,
  delay = 0,
  stagger = 0.08,
  ...props
}: HTMLMotionProps<'div'> & { delay?: number; stagger?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            delayChildren: delay,
            staggerChildren: stagger,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, className, ...props }: HTMLMotionProps<'section'>) {
  return (
    <motion.section
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: smoothEase } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function AnimatedCard({ children, className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.36, ease: smoothEase } },
      }}
      className={cn('will-change-transform', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedPage({ children, className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <StaggerContainer className={className} delay={0.06} stagger={0.09} {...props}>
      {children}
    </StaggerContainer>
  );
}
