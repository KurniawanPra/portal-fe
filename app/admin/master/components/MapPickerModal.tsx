'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Layers, Search, Check, Locate, Plus, Minus, Loader2, Navigation, Building2, MapPinned } from 'lucide-react';
import { Map, Marker } from 'pigeon-maps';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const googleRoadProvider = (x: number, y: number, z: number) => {
  return `https://mt1.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
};

const googleSatelliteProvider = (x: number, y: number, z: number) => {
  return `https://mt1.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}`;
};

interface SearchResultItem {
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
}

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
  const [searchingMap, setSearchingMap] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [mapMode3D, setMapMode3D] = useState(true);
  const [detectingGps, setDetectingGps] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState(520);
  const reverseGeocodeAbortRef = useRef<AbortController | null>(null);

  // Mount check for client-side rendering with portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reverse geocode coordinate to get readable address via Google Maps
  const fetchAddressForCoords = useCallback(async (lat: number, lng: number) => {
    if (!GOOGLE_MAPS_KEY) {
      console.warn('[MapPicker] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY tidak tersedia.');
      return;
    }

    if (reverseGeocodeAbortRef.current) {
      reverseGeocodeAbortRef.current.abort();
    }
    const abortCtrl = new AbortController();
    reverseGeocodeAbortRef.current = abortCtrl;
    setResolvingAddress(true);

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}&language=id`;
      const res = await fetch(url, { signal: abortCtrl.signal });
      const data = await res.json();
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        setSelectedAddress(data.results[0].formatted_address);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[MapPicker] Reverse geocode error:', err);
      }
    } finally {
      setResolvingAddress(false);
    }
  }, []);

  // Sync initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setLatitude(String(initialLatitude));
      setLongitude(String(initialLongitude));
      setSearchQuery('');
      setSearchError('');
      setSearchResults([]);
      const lat = parseFloat(String(initialLatitude));
      const lng = parseFloat(String(initialLongitude));
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
        setMapZoom(15);
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

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    const [lat, lng] = latLng;
    const latStr = lat.toFixed(6);
    const lngStr = lng.toFixed(6);
    setLatitude(latStr);
    setLongitude(lngStr);
    setMapCenter([lat, lng]);
    setSearchResults([]);
    setSearchError('');
    fetchAddressForCoords(lat, lng);
  };

  const handleSelectResult = (item: SearchResultItem) => {
    setLatitude(item.lat.toFixed(6));
    setLongitude(item.lng.toFixed(6));
    setMapCenter([item.lat, item.lng]);
    setMapZoom(16);
    setSelectedAddress(item.formatted_address);
    setSearchResults([]);
    setSearchError('');
  };

  const handleSearchLocation = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setSearchingMap(true);
    setSearchError('');
    setSearchResults([]);

    // Check if query is formatted as coordinate e.g. "3.13199, 99.34257"
    const coordMatch = query.match(/^([-+]?\d+(\.\d+)?)[,\s]+([-+]?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setMapCenter([lat, lng]);
        setMapZoom(16);
        fetchAddressForCoords(lat, lng);
        setSearchingMap(false);
        return;
      }
    }

    if (!GOOGLE_MAPS_KEY) {
      setSearchError('Google Maps API Key tidak tersedia. Pastikan NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ada di .env.local dan server sudah di-restart/rebuild.');
      setSearchingMap(false);
      return;
    }

    try {
      // Direct Google Maps Geocoding API
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_KEY}&language=id`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const formattedList: SearchResultItem[] = data.results.map((r: any) => ({
          name: r.address_components?.[0]?.long_name || r.formatted_address,
          formatted_address: r.formatted_address,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        }));

        if (formattedList.length === 1) {
          handleSelectResult(formattedList[0]);
        } else {
          setSearchResults(formattedList);
          handleSelectResult(formattedList[0]);
          setSearchResults(formattedList);
        }
      } else if (data.status === 'ZERO_RESULTS') {
        if (!query.toLowerCase().includes('indonesia')) {
          const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query + ', Indonesia')}&key=${GOOGLE_MAPS_KEY}&language=id`;
          const fbRes = await fetch(fallbackUrl);
          const fbData = await fbRes.json();
          if (fbData.status === 'OK' && fbData.results?.length > 0) {
            const fbList: SearchResultItem[] = fbData.results.map((r: any) => ({
              name: r.address_components?.[0]?.long_name || r.formatted_address,
              formatted_address: r.formatted_address,
              lat: r.geometry.location.lat,
              lng: r.geometry.location.lng,
            }));
            handleSelectResult(fbList[0]);
            if (fbList.length > 1) {
              setSearchResults(fbList);
            }
          } else {
            setSearchError('Lokasi tidak ditemukan pada Google Maps. Coba gunakan kata kunci lain atau masukkan koordinat.');
          }
        } else {
          setSearchError('Lokasi tidak ditemukan pada Google Maps. Coba gunakan kata kunci lain atau masukkan koordinat.');
        }
      } else {
        setSearchError(data.error_message || `Status Google Maps: ${data.status}`);
      }
    } catch (err: any) {
      console.error('[MapPicker] Search error:', err);
      setSearchError('Gagal mencari lokasi ke Google Maps API. Silakan periksa koneksi atau klik langsung pada peta.');
    } finally {
      setSearchingMap(false);
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
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setMapCenter([lat, lng]);
        setMapZoom(16);
        fetchAddressForCoords(lat, lng);
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
                Pilih Titik Lokasi Peta (Google Maps)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Cari alamat, ketik koordinat, atau klik titik pada peta satelit / 2D
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
            provider={mapMode3D ? googleSatelliteProvider : googleRoadProvider}
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

          {/* Floating Search Bar Overlay (Top-Left) */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 max-w-sm sm:max-w-md w-full">
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-md">
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchLocation();
                    }
                  }}
                  placeholder="Cari lokasi: 'PT INL Sei Mangkei', kota, atau koordinat..."
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setSearchError('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={searchingMap}
                onClick={handleSearchLocation}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
              >
                {searchingMap ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                {searchingMap ? 'Mencari...' : 'Cari'}
              </button>
            </div>

            {/* Quick Presets Shortcuts Chips */}
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              {PRESET_LOCATIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setLatitude(preset.lat.toFixed(6));
                    setLongitude(preset.lng.toFixed(6));
                    setMapCenter([preset.lat, preset.lng]);
                    setMapZoom(16);
                    setSelectedAddress(`${preset.name} (${preset.desc})`);
                    setSearchResults([]);
                    setSearchError('');
                    fetchAddressForCoords(preset.lat, preset.lng);
                  }}
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

            {/* Multiple Search Results Dropdown List */}
            {searchResults.length > 0 && (
              <div className="mt-1.5 max-h-52 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Hasil Pencarian ({searchResults.length})
                </div>
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-slate-800/80 transition-colors flex items-start gap-2 group cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{item.formatted_address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchError && (
              <span className="mt-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 text-white text-[11px] font-bold block shadow-lg backdrop-blur-sm animate-in fade-in">
                {searchError}
              </span>
            )}
          </div>

          {/* Floating Satelit Mode & Zoom Controls (Top-Right) */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setMapMode3D(!mapMode3D)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all backdrop-blur-md cursor-pointer"
              title={mapMode3D ? "Ubah ke Peta 2D Jalan" : "Ubah ke Peta Satelit 3D"}
            >
              <Layers className={`h-4 w-4 ${mapMode3D ? 'text-indigo-500' : 'text-slate-400'}`} />
              {mapMode3D ? 'Satelit 3D' : '2D Jalan'}
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
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-20 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white shadow-2xl backdrop-blur-md flex items-start gap-2.5">
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
