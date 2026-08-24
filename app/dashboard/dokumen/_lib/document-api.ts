import { apiFetch, ApiRequestError } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

export async function uploadDocument(formData: FormData) {
  return apiFetch('/documents', { method: 'POST', body: formData });
}

async function fetchDocumentBinary(
  input: RequestInfo | URL,
  init: RequestInit,
  networkErrorMessage: string,
) {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiRequestError(networkErrorMessage);
  }
}

export async function createDocumentPreviewSession(documentId: string) {
  const token = getAccessToken();
  let response: Response;

  try {
    response = await fetch(`/document-preview-session/${encodeURIComponent(documentId)}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    throw new ApiRequestError('Koneksi ke server terputus saat membuat sesi pratinjau.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new ApiRequestError(payload?.error || 'Sesi pratinjau dokumen gagal dibuat.');
  }
  return payload.data as { url: string; expiresAt: string };
}

export async function downloadDocumentToken(token: string, fallbackName = 'dokumen') {
  const authToken = getAccessToken();
  const response = await fetchDocumentBinary(
    `/document-download-file/${encodeURIComponent(token)}`,
    {
      method: 'GET',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      credentials: 'include',
      cache: 'no-store',
    },
    'Koneksi ke server terputus saat mengunduh dokumen.',
  );

  if (!response.ok) {
    let message = 'File dokumen gagal diunduh.';
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // Fallback
    }
    throw new ApiRequestError(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const headerName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const fileName = headerName || (fallbackName.toLowerCase().endsWith('.pdf') ? fallbackName : `${fallbackName}.pdf`);

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadDocumentVersionFile(documentId: string, versionNumber: number, title: string) {
  const token = (await import('@/lib/auth')).getAccessToken();
  const response = await fetchDocumentBinary(`/api/documents/${documentId}/revisions/${versionNumber}/download`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    cache: 'no-store',
  }, 'Koneksi ke server terputus saat mengunduh revisi dokumen.');
  if (!response.ok) {
    let message = 'File revisi gagal diunduh.';
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // Fallback
    }
    throw new ApiRequestError(message);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const headerName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = headerName || `${title}_v${versionNumber}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDocumentDate(value: string) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Permintaan gagal diproses.';
}
