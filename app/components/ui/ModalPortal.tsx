'use client';

/**
 * ModalPortal — renders children into document.body via React.createPortal
 * This fully escapes any parent stacking context, overflow:hidden, or transform
 * that would clip/trap modals inside their parent DOM node.
 *
 * Usage:
 *   <ModalPortal open={open}>
 *     <div>…modal content…</div>
 *   </ModalPortal>
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  open: boolean;
}

export function ModalPortal({ children, open }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] isolate">
      {children}
    </div>,
    document.body
  );
}
