'use client';

/**
 * AnimatedModalPortal — sama seperti ModalPortal (render ke document.body agar
 * lepas dari stacking context induk), tetapi tetap ter-mount selama animasi
 * keluar berjalan melalui AnimatePresence. Menyediakan backdrop yang memudar
 * dan panel yang naik + skala halus, konsisten dengan sistem gerak portal.
 *
 * Pemakaian:
 *   <AnimatedModalPortal open={open} onClose={close}>
 *     <div className="w-full max-w-xl">…isi modal…</div>
 *   </AnimatedModalPortal>
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

interface AnimatedModalPortalProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  /** className tambahan untuk kontainer panel (mis. lebar maksimum). */
  panelClassName?: string;
}

export function AnimatedModalPortal({ open, onClose, children, panelClassName }: AnimatedModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] isolate">
          <motion.div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className={`pointer-events-auto ${panelClassName ?? ''}`}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.26, ease: SMOOTH_EASE }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
