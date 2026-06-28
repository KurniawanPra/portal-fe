'use client';

import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: React.ReactNode;
  name?: string;
  deleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Hapus Data?',
  description,
  name,
  deleting = false,
}: DeleteConfirmModalProps) {
  // If 'name' is provided, we build a standard description.
  const displayDescription = name ? (
    <span>
      Data <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{name}&quot;</span> akan dihapus permanen.
    </span>
  ) : (
    description || 'Apakah Anda yakin ingin menghapus data ini?'
  );

  return (
    <ModalPortal open={isOpen}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <Trash2 className="h-5 w-5 text-rose-500 dark:text-rose-400" />
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
        </div>
      </div>
    </ModalPortal>
  );
}

