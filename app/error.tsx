'use client';

/*
 * Error boundary untuk seluruh route di dalam app/.
 *
 * Sebelumnya tidak ada error.tsx sama sekali: satu exception saat render (mis.
 * `nama.split()` atas nilai null dari API) meng-unmount seluruh subtree dan
 * menghasilkan layar putih tanpa jalan pulih. Sekarang pengguna mendapat pesan
 * yang jelas dan bisa mencoba lagi tanpa reload manual.
 */
import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[portal] render error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Halaman ini gagal dimuat
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Terjadi kesalahan saat menampilkan data. Anda bisa mencoba memuat ulang bagian ini,
          data yang sudah tersimpan tidak terpengaruh.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-slate-400">Kode: {error.digest}</p>
        )}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={reset}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            Coba lagi
          </button>
          <a
            href="/login"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Kembali ke Login
          </a>
        </div>
      </div>
    </div>
  );
}
