import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PREVIEW_COOKIE = 'portal_document_preview';

function backendBaseUrl() {
  return (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const headers = new Headers({ Accept: 'application/json' });
  const authorization = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');
  if (authorization) headers.set('authorization', authorization);
  if (cookie) headers.set('cookie', cookie);

  let upstream: Response;
  try {
    upstream = await fetch(
      `${backendBaseUrl()}/api/documents/${encodeURIComponent(params.id)}/preview-session`,
      {
        method: 'POST',
        headers,
        cache: 'no-store',
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Server dokumen tidak dapat dihubungi saat membuat sesi pratinjau.',
      },
      { status: 502 },
    );
  }

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok || !payload?.success || !payload?.data?.token) {
    return NextResponse.json(
      payload || {
        success: false,
        error: 'Sesi pratinjau dokumen gagal dibuat.',
      },
      { status: upstream.status || 502 },
    );
  }

  const response = NextResponse.json({
    success: true,
    data: {
      url: '/document-preview-file',
      expiresAt: payload.data.expiresAt,
    },
  });
  response.cookies.set(PREVIEW_COOKIE, payload.data.token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 5 * 60,
    path: '/document-preview-file',
  });
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}
