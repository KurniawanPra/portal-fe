import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PREVIEW_COOKIE = 'portal_document_preview';
const PREVIEW_TTL_MS = 5 * 60 * 1000;

interface PreviewCacheEntry {
  body: ArrayBuffer;
  contentDisposition: string;
  expiresAt: number;
}

const previewCache = new Map<string, PreviewCacheEntry>();

function backendBaseUrl() {
  return (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
}

function prunePreviewCache() {
  const now = Date.now();
  previewCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) previewCache.delete(key);
  });
}

function parseRange(rangeHeader: string | null, totalSize: number) {
  if (!rangeHeader) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return { invalid: true as const };

  let start: number;
  let end: number;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return { invalid: true as const };
    start = Math.max(0, totalSize - suffixLength);
    end = totalSize - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : totalSize - 1;
  }

  if (
    !Number.isInteger(start)
    || !Number.isInteger(end)
    || start < 0
    || end < start
    || start >= totalSize
  ) {
    return { invalid: true as const };
  }

  return {
    invalid: false as const,
    start,
    end: Math.min(end, totalSize - 1),
  };
}

export async function GET(
  request: NextRequest,
) {
  const token = request.cookies.get(PREVIEW_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: 'Sesi pratinjau tidak tersedia atau telah kedaluwarsa.',
      },
      { status: 401 },
    );
  }

  prunePreviewCache();
  let preview = previewCache.get(token);

  if (!preview) {
    let upstream: Response;
    try {
      upstream = await fetch(
        `${backendBaseUrl()}/api/documents/preview-file`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/pdf',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
          cache: 'no-store',
        },
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Server dokumen tidak dapat dihubungi saat memuat pratinjau.',
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
          error: 'Server dokumen mengirim file pratinjau kosong.',
        },
        { status: 502 },
      );
    }

    preview = {
      body,
      contentDisposition: upstream.headers.get('content-disposition') || 'inline',
      expiresAt: Date.now() + PREVIEW_TTL_MS,
    };
    previewCache.set(token, preview);
  }

  const totalSize = preview.body.byteLength;
  const range = parseRange(request.headers.get('range'), totalSize);
  if (range?.invalid) {
    return new NextResponse(null, {
      status: 416,
      headers: {
        'Content-Range': `bytes */${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  }

  const responseBody = range
    ? preview.body.slice(range.start, range.end + 1)
    : preview.body;
  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Content-Length': String(responseBody.byteLength),
    'Content-Disposition': preview.contentDisposition,
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  });
  if (range) {
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${totalSize}`);
  }

  const response = new NextResponse(responseBody, {
    status: range ? 206 : 200,
    headers,
  });
  response.cookies.set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 5 * 60,
    path: '/document-preview-file',
  });
  return response;
}

export async function HEAD(request: NextRequest) {
  const response = await GET(request);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}

