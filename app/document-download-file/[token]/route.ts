import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function backendBaseUrl() {
  return (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
}

export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  let upstream: Response;
  try {
    upstream = await fetch(
      `${backendBaseUrl()}/api/documents/download/${encodeURIComponent(params.token)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/pdf, application/octet-stream' },
        cache: 'no-store',
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Server dokumen tidak dapat dihubungi saat mengunduh file.',
      },
      { status: 502 },
    );
  }

  const body = await upstream.arrayBuffer();
  if (!upstream.ok) {
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (body.byteLength === 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'Server dokumen mengirim file unduhan kosong.',
      },
      { status: 502 },
    );
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/pdf',
      'Content-Length': String(body.byteLength),
      'Content-Disposition': upstream.headers.get('content-disposition') || 'attachment; filename="dokumen.pdf"',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function HEAD(request: Request, context: { params: { token: string } }) {
  const response = await GET(request, context);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}

