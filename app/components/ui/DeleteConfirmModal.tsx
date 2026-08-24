'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: React.ReactNode;
  name?: string;
  deleting?: boolean;
}

const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Hapus Data?',
  description,
  name,
  deleting = false,
}: DeleteConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // If 'name' is provided, we build a standard description.
  const displayDescription = name ? (
    <span>
      Data <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{name}&quot;</span> akan dihapus permanen.
    </span>
  ) : (
    description || 'Apakah Anda yakin ingin menghapus data ini?'
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
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
              className="pointer-events-auto w-full max-w-sm"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.26, ease: SMOOTH_EASE }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl shadow-slate-900/10 p-6 text-center">
                <div className="mx-auto mb-4 flex items-center justify-center">
                  <Trash2 className="h-8 w-8 text-rose-500 dark:text-rose-400" />
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{title}</h3>
                <div className="mt-2 text-sm text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                  {displayDescription}
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    disabled={deleting}
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-250 transition-all cursor-pointer focus:outline-none"
                  >
                    Batal
                  </button>
                  <button
                    disabled={deleting}
                    onClick={onConfirm}
                    className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                    {deleting ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
