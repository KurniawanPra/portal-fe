'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Layers, Search, Check, Locate, Plus, Minus, Loader2, Building2, MapPinned, Link2, Crosshair } from 'lucide-react';
import { Map, Marker } from 'pigeon-maps';
import { tileLayer, type MapMode } from '@/lib/mapTiles';
import {
  type GeoPlace, MIN_SEARCH_CHARS, looksLikeMapLink, parseCoordinateInput,
  recordPlaceSelection, resolveMapLink, reverseGeocode, usePlaceSearch,
} from '@/lib/placeSearch';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLatitude?: string | number;
  initialLongitude?: string | number;
  onSelect: (latitude: number, longitude: number, addressName?: string) => void;
}

const PRESET_LOCATIONS = [
  { name: 'PT INL Sei Mangkei', lat: 3.1319965, lng: 99.3425704, desc: 'PKS / Pabrik Sei Mangkei' },
  { name: 'Head Office Medan', lat: 3.5859991, lng: 98.6610596, desc: 'Jl. Iskandar Muda Medan' },
  { name: 'Kantor Direksi PTPN IV', lat: 3.5803742, lng: 98.6795273, desc: 'Jl. Letjen Suprapto Medan' },
];

const SUMBER_BADGE: Record<GeoPlace['sumber'], { label: string; cls: string } | null> = {
  master: { label: 'Master Area', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  tersimpan: { label: 'Sering dipakai', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  osm: null,
};

export default function MapPickerModal({
  isOpen,
  onClose,
  initialLatitude = '',
  initialLongitude = '',
  onSelect
}: MapPickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [latitude, setLatitude] = useState(String(initialLatitude));
  const [longitude, setLongitude] = useState(String(initialLongitude));
  const [mapCenter, setMapCenter] = useState<[number, number]>([3.1319965, 99.3425704]);
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchNotice, setSearchNotice] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [resolvingLink, setResolvingLink] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('jalan');
  const [detectingGps, setDetectingGps] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState(520);
  const reverseGeocodeAbortRef = useRef<AbortController | null>(null);

  const { results, loading, searched, providerError } = usePlaceSearch(searchQuery, mapCenter, isOpen);
  const trimmedQuery = searchQuery.trim();
  const queryIsCoords = !!parseCoordinateInput(trimmedQuery);
  const queryIsLink = !queryIsCoords && looksLikeMapLink(trimmedQuery);

  // Mount check for client-side rendering with portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reverse geocode coordinate to get readable address (OpenStreetMap via backend, cached)
  const fetchAddressForCoords = useCallback(async (lat: number, lng: number) => {
    if (reverseGeocodeAbortRef.current) {
      reverseGeocodeAbortRef.current.abort();
    }
    const abortCtrl = new AbortController();
    reverseGeocodeAbortRef.current = abortCtrl;
    setResolvingAddress(true);

    try {
      const geo = await reverseGeocode(lat, lng, abortCtrl.signal);
      if (!abortCtrl.signal.aborted && geo?.alamat) {
        setSelectedAddress(geo.alamat);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('[MapPicker] Reverse geocode error:', err);
      }
    } finally {
      if (!abortCtrl.signal.aborted) setResolvingAddress(false);
    }
  }, []);

  // Sync initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setLatitude(String(initialLatitude));
      setLongitude(String(initialLongitude));
      setSearchQuery('');
      setSearchError('');
      setSearchNotice('');
      setDropdownOpen(false);
      setResolvingLink(false);
      const lat = parseFloat(String(initialLatitude));
      const lng = parseFloat(String(initialLongitude));
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
        setMapZoom(15);
        setSelectedAddress('');
        fetchAddressForCoords(lat, lng);
      } else {
        // Default center to PT INL Sei Mangkei
        setMapCenter([3.1319965, 99.3425704]);
        setMapZoom(13);
        setSelectedAddress('');
      }
    }
  }, [isOpen, initialLatitude, initialLongitude, fetchAddressForCoords]);

  // Update map height dynamically when container resizes
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const updateSize = () => {
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        const h = Math.round(rect.height || mapContainerRef.current.clientHeight);
        if (h > 100) setMapHeight(h);
      }
    };

    updateSize();
    const rafId = requestAnimationFrame(updateSize);
    const t1 = setTimeout(updateSize, 50);
    const t2 = setTimeout(updateSize, 150);
    const t3 = setTimeout(updateSize, 300);

    const observer = new ResizeObserver(updateSize);
    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }
    window.addEventListener('resize', updateSize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [isOpen, mounted]);

  // Update map center when lat/lng inputs change manually
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setMapCenter([lat, lng]);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // Pindahkan pin. Tanpa `address`, alamat dicari ulang lewat reverse geocode.
  const applyPoint = (lat: number, lng: number, address?: string, zoom = 16) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setMapCenter([lat, lng]);
    setMapZoom(zoom);
    setDropdownOpen(false);
    setSearchError('');
    setSearchNotice('');
    if (address) {
      // Batalkan reverse geocode titik sebelumnya agar tidak menimpa alamat ini.
      reverseGeocodeAbortRef.current?.abort();
      setResolvingAddress(false);
      setSelectedAddress(address);
    } else {
      setSelectedAddress('');
      fetchAddressForCoords(lat, lng);
    }
  };

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    const [lat, lng] = latLng;
    applyPoint(lat, lng, undefined, mapZoom);
  };

  const handleSelectPlace = (place: GeoPlace) => {
    applyPoint(place.lat, place.lng, place.alamat ? `${place.nama}, ${place.alamat}` : place.nama);
    recordPlaceSelection(place);
  };

  const handleSubmitSearch = async () => {
    if (!trimmedQuery) return;

    // Check if query is formatted as coordinate e.g. "3.13199, 99.34257"
    const coords = parseCoordinateInput(trimmedQuery);
    if (coords) {
      applyPoint(coords.lat, coords.lng);
      return;
    }

    if (queryIsLink) {
      setResolvingLink(true);
      setSearchError('');
      setSearchNotice('');
      try {
        const res = await resolveMapLink(trimmedQuery);
        if (res.lat != null && res.lng != null) {
          applyPoint(res.lat, res.lng, res.nama || undefined);
        } else if (res.nama) {
          setSearchQuery(res.nama);
          setDropdownOpen(true);
          setSearchNotice('Link tidak memuat koordinat, jadi dicari berdasarkan nama tempatnya.');
        }
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Gagal membaca link Google Maps.');
      } finally {
        setResolvingLink(false);
      }
      return;
    }

    if (results.length > 0) {
      handleSelectPlace(results[Math.min(activeIndex, results.length - 1)]);
    } else {
      setDropdownOpen(true);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitSearch();
    } else if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setDropdownOpen(true);
      setActiveIndex(i => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Browser Anda tidak mendukung deteksi lokasi GPS.');
      return;
    }
    setDetectingGps(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPoint(pos.coords.latitude, pos.coords.longitude);
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setSearchError('Tidak dapat mengakses GPS. Pastikan izin lokasi aktif pada browser Anda.');
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleZoom = (delta: number) => {
    setMapZoom(prev => Math.min(18, Math.max(3, prev + delta)));
  };

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);
  const isValidCoords = !isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
  const anchorCoords: [number, number] = isValidCoords ? [latNum, lngNum] : mapCenter;

  const handleSave = () => {
    if (!isValidCoords) {
      alert('Koordinat Latitude & Longitude belum valid. Klik pada peta untuk memilih titik lokasi.');
      return;
    }
    onSelect(latNum, lngNum, selectedAddress || undefined);
  };

  const showDropdown = dropdownOpen && trimmedQuery.length > 0;
  const busy = loading || resolvingLink;

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Fullscreen Style Expansive Modal Container */}
      <div className="relative w-[96vw] max-w-6xl h-[88vh] max-h-[760px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-500">
              <MapPin className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Pilih Titik Lokasi Peta
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Cari tempat, tempel link Google Maps / koordinat, atau klik titik pada peta jalan / satelit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all focus:outline-none cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Expansive Map Body */}
        <div ref={mapContainerRef} className="flex-1 w-full relative z-10 overflow-hidden bg-slate-900">
          <Map
            height={mapHeight}
            center={mapCenter}
            zoom={mapZoom}
            {...tileLayer(mapMode)}
            onClick={handleMapClick}
            onBoundsChanged={({ center, zoom }) => {
              setMapCenter(center);
              setMapZoom(zoom);
            }}
          >
            {isValidCoords && (
              <Marker
                width={38}
                anchor={anchorCoords}
                color="#ef4444"
              />
            )}
          </Map>

          {/* Floating Search Bar Overlay (Top-Left).
              pigeon-*-block: klik pada overlay tidak dianggap klik peta (pin tidak ikut pindah). */}
          <div className="pigeon-drag-block pigeon-click-block absolute top-3 left-3 sm:top-4 sm:left-4 z-20 max-w-sm sm:max-w-md w-full">
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-md">
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                    setSearchError('');
                    setSearchNotice('');
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  onBlur={() => setDropdownOpen(false)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Cari lokasi: 'Sei Mangkei', hotel, kota, koordinat, atau link Google Maps..."
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none font-medium"
                  role="combobox"
                  aria-controls="map-picker-results"
                  aria-expanded={showDropdown}
                  aria-autocomplete="list"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchError('');
                      setSearchNotice('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={resolvingLink || !trimmedQuery}
                onClick={handleSubmitSearch}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : queryIsLink ? <Link2 className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
                {queryIsLink ? 'Baca Link' : 'Cari'}
              </button>
            </div>

            {/* Autocomplete Dropdown */}
            {showDropdown && (
              <div id="map-picker-results" role="listbox" className="pigeon-drag-block pigeon-click-block mt-1.5 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                {queryIsCoords && (
                  <p className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <Crosshair className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    Tekan Enter untuk memakai koordinat ini.
                  </p>
                )}
                {queryIsLink && (
                  <p className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <Link2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    Tekan Enter untuk membaca titik lokasi dari link Google Maps.
                  </p>
                )}
                {!queryIsCoords && !queryIsLink && trimmedQuery.length < MIN_SEARCH_CHARS && (
                  <p className="px-3 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Ketik minimal {MIN_SEARCH_CHARS} huruf untuk mencari.
                  </p>
                )}
                {!queryIsCoords && !queryIsLink && trimmedQuery.length >= MIN_SEARCH_CHARS && (
                  <>
                    {loading && results.length === 0 && (
                      <p className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mencari…
                      </p>
                    )}
                    {results.map((item, idx) => {
                      const badge = SUMBER_BADGE[item.sumber];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={idx === activeIndex}
                          // Pilih saat click, bukan mousedown: dropdown harus masih ada di DOM
                          // ketika listener mousedown pigeon-maps memeriksa pigeon-drag-block.
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => handleSelectPlace(item)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`w-full text-left px-3 py-2 transition-colors flex items-start gap-2 group cursor-pointer ${idx === activeIndex ? 'bg-amber-50 dark:bg-slate-800/80' : 'hover:bg-amber-50/60 dark:hover:bg-slate-800/60'}`}
                        >
                          <MapPin className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.nama}</p>
                              {item.kategori && item.sumber !== 'master' && (
                                <span className="shrink-0 rounded px-1.5 py-px text-[9px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{item.kategori}</span>
                              )}
                              {badge && (
                                <span className={`shrink-0 rounded px-1.5 py-px text-[9px] font-bold ${badge.cls}`}>{badge.label}</span>
                              )}
                            </div>
                            {item.alamat && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{item.alamat}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {searched && !loading && results.length === 0 && (
                      <p className="px-3 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {providerError
                          ? 'Pencarian online sedang tidak tersedia.'
                          : `Tidak ada hasil untuk "${trimmedQuery}".`}
                        {' '}Klik langsung titiknya di peta, atau tempel link &quot;Bagikan&quot; dari Google Maps.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Quick Presets Shortcuts Chips */}
            {!showDropdown && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                {PRESET_LOCATIONS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPoint(preset.lat, preset.lng, `${preset.name} (${preset.desc})`)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 hover:bg-amber-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-sm transition-colors cursor-pointer"
                  >
                    <Building2 className="h-2.5 w-2.5 text-amber-500 dark:text-amber-400" />
                    {preset.name}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={detectingGps}
                  onClick={handleGetCurrentLocation}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 hover:bg-amber-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-amber-600 dark:text-amber-400 shadow-sm backdrop-blur-sm transition-colors cursor-pointer"
                >
                  <Locate className={`h-2.5 w-2.5 ${detectingGps ? 'animate-spin' : ''}`} />
                  {detectingGps ? 'GPS...' : 'Lokasi Saya'}
                </button>
              </div>
            )}

            {searchError && (
              <span className="mt-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 text-white text-[11px] font-bold block shadow-lg backdrop-blur-sm animate-in fade-in">
                {searchError}
              </span>
            )}
            {searchNotice && (
              <span className="mt-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 text-white text-[11px] font-semibold block shadow-lg backdrop-blur-sm animate-in fade-in">
                {searchNotice}
              </span>
            )}
          </div>

          {/* Floating Satelit Mode & Zoom Controls (Top-Right) */}
          <div className="pigeon-drag-block pigeon-click-block absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setMapMode(mode => (mode === 'satelit' ? 'jalan' : 'satelit'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all backdrop-blur-md cursor-pointer"
              title={mapMode === 'satelit' ? 'Ubah ke Peta Jalan' : 'Ubah ke Peta Satelit'}
            >
              <Layers className={`h-4 w-4 ${mapMode === 'satelit' ? 'text-indigo-500' : 'text-slate-400'}`} />
              {mapMode === 'satelit' ? 'Satelit' : 'Jalan'}
            </button>

            <div className="flex flex-col rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden backdrop-blur-md">
              <button
                type="button"
                onClick={() => handleZoom(1)}
                className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-colors"
                title="Zoom In (+)"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(-1)}
                className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Zoom Out (-)"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Floating Selected Location Info Card (Bottom Center/Left of map) */}
          {isValidCoords && (
            <div className="pigeon-drag-block pigeon-click-block absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-20 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white shadow-2xl backdrop-blur-md flex items-start gap-2.5">
              <MapPinned className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  Titik Terpilih
                  {resolvingAddress && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                </p>
                <p className="text-xs font-semibold text-slate-100 line-clamp-2">
                  {selectedAddress || `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`}
                </p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Lat: {latNum.toFixed(6)} | Lng: {lngNum.toFixed(6)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Inline Lat/Lng Inputs & Save Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 shrink-0">
          {/* Inline Compact Lat & Lng Inputs */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Lat</span>
              <input
                type="text"
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                placeholder="Latitude"
                className="w-24 sm:w-28 bg-transparent font-mono font-bold text-xs text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
            <div className="flex-1 sm:flex-none flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Lng</span>
              <input
                type="text"
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                placeholder="Longitude"
                className="w-24 sm:w-28 bg-transparent font-mono font-bold text-xs text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Check className="h-4 w-4" />
              Selesai & Terapkan
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
