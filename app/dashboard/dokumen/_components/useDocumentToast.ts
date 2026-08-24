'use client';

import { useEffect, useState } from 'react';
import type { AppToastState } from '@/components/ui/AppToast';

export function useDocumentToast() {
  const [toast, setToast] = useState<AppToastState>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  return { toast, success: (text: string) => setToast({ type: 'ok', text }), error: (text: string) => setToast({ type: 'err', text }), info: (text: string) => setToast({ type: 'ok', text }) };
}
