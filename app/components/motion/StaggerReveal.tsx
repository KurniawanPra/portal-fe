'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * iOS-style stagger transition curve.
 * cubic-bezier(0.32, 0.72, 0, 1) mimics UISpringTimingParameters.
 */
const iosEase: [number, number, number, number] = [0.32, 0.72, 0, 1];

/**
 * Container that staggers its children's entrance animations.
 * Wrap any set of <StaggerItem> elements inside this.
 */
export function StaggerContainer({
  children,
  className,
  delay = 0,
  stagger = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: stagger,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Single item that fades + slides up on entrance within a StaggerContainer.
 * Use as a direct child of StaggerContainer.
 */
export function StaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'tr' | 'span' | 'li' | 'section';
}) {
  const Component = motion[as] as any;
  return (
    <Component
      variants={{
        hidden: { opacity: 0, y: 12, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.35,
            ease: iosEase,
          },
        },
      }}
      className={className}
    >
      {children}
    </Component>
  );
}

/**
 * A table row (<tr>) that staggers in with iOS-style animation.
 * Use inside a <StaggerContainer> wrapping tbody contents.
 */
export function StaggerRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.tr
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.3,
            ease: iosEase,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.tr>
  );
}
