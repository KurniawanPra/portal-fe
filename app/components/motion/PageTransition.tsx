'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { usePageTitle } from '@/hooks/usePageTitle';

// Page Transition

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  usePageTitle();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{
          duration: 0.38,
          ease: [0.32, 0.72, 0, 1],
        }}
        className="min-h-full w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
