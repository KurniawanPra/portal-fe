// ─── Place Search ─────────────────────────────────────────────────────────────
// Autocomplete tempat lewat backend (/api/geo/*): master Penempatan Area →
// cache tempat yang sering dipilih → OpenStreetMap. Tanpa API key di browser.
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from './api';

export interface GeoPlace {
  id: string;
  nama: string;
  alamat: string;
  lat: number;
  lng: number;
  kategori: string | null;
  sumber: 'master' | 'tersimpan' | 'osm';
}

export interface ReverseGeoResult {
  alamat: string;
  provinsi: string | null;
  negara: string | null;
}

export const MIN_SEARCH_CHARS = 3;
const DEBOUNCE_MS = 300;

/** "3.1319, 99.3425" → { lat, lng } */
export function parseCoordinateInput(text: string): { lat: number; lng: number } | null {
  const match = text.trim().match(/^([-+]?\d{1,3}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 ? { lat, lng } : null;
}

export function looksLikeMapLink(text: string) {
  return /^https?:\/\//i.test(text.trim()) || /(^|\.)(goo\.gl|google\.[a-z.]+)\//i.test(text.trim());
}

/** Link "Bagikan" Google Maps → koordinat (atau hanya nama tempat bila link tidak memuat koordinat). */
export async function resolveMapLink(link: string) {
  const raw = /^https?:\/\//i.test(link.trim()) ? link.trim() : `https://${link.trim()}`;
  const res = await apiFetch<{ lat: number | null; lng: number | null; nama: string | null }>(
    `/geo/resolve-link?url=${encodeURIComponent(raw)}`,
    { method: 'GET' },
  );
  return res.data;
}

/** Koordinat → alamat (Nominatim, di-cache server per koordinat). */
export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal) {
  const res = await apiFetch<ReverseGeoResult>(`/geo/reverse?lat=${lat}&lng=${lng}`, { method: 'GET', signal });
  return res.data;
}

/** Catat pilihan user agar pencarian berikutnya dilayani dari cache server. */
export function recordPlaceSelection(place: GeoPlace) {
  if (place.sumber === 'master') return;
  apiFetch('/geo/select', { method: 'POST', body: JSON.stringify({ id: place.id }) }).catch(() => undefined);
}

/**
 * Autocomplete: aktif mulai 3 karakter dengan debounce 300 ms; request lama
 * dibatalkan setiap kali user mengetik lagi. `bias` = titik peta saat ini,
 * dibaca saat mengetik saja supaya geser peta tidak memicu pencarian ulang.
 */
export function usePlaceSearch(query: string, bias: [number, number] | null, enabled: boolean) {
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [providerError, setProviderError] = useState(false);
  const biasRef = useRef(bias);
  biasRef.current = bias;

  useEffect(() => {
    const q = query.trim();
    if (!enabled || q.length < MIN_SEARCH_CHARS || parseCoordinateInput(q) || looksLikeMapLink(q)) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      setProviderError(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q });
        const center = biasRef.current;
        if (center) {
          params.set('lat', center[0].toFixed(4));
          params.set('lng', center[1].toFixed(4));
        }
        const res = await apiFetch<{ items: GeoPlace[]; providerError: boolean }>(
          `/geo/search?${params}`,
          { method: 'GET', signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setResults(res.data?.items ?? []);
        setProviderError(!!res.data?.providerError);
        setSearched(true);
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setProviderError(true);
        setSearched(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled]);

  return { results, loading, searched, providerError };
}
