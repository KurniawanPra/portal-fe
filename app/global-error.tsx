'use client';

/*
 * Global error boundary — menangkap kegagalan yang terjadi di root layout,
 * yaitu kasus yang tidak tertangkap `app/error.tsx`. Wajib merender <html>/<body>
 * sendiri karena layout normal tidak ikut dipakai.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            padding: 28,
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Portal tidak dapat dimuat</h2>
          <p style={{ margin: '0 0 18px', fontSize: 14, color: '#56657a', lineHeight: 1.6 }}>
            Terjadi kesalahan yang membuat halaman gagal ditampilkan. Silakan coba lagi; bila tetap
            terjadi, hubungi administrator portal.
          </p>
          {error.digest && (
            <p style={{ margin: '0 0 18px', fontSize: 11, fontFamily: 'monospace', color: '#92a1b6' }}>
              Kode: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              cursor: 'pointer',
              border: 'none',
              borderRadius: 12,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              color: '#ffffff',
              background: '#f59e0b',
            }}
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
