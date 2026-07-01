'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MapPin, Pencil, Trash2, Layers, Search, Loader2, X, Eye, ExternalLink
} from 'lucide-react';
import { Map, Marker } from 'pigeon-maps';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { api, ApiRequestError } from '@/lib/api';
import {
  inputCls, labelCls, Toast, TableCard, DeleteModal,
  CrudHeader, CrudTable, CrudPagination, FormModal
} from './shared';

const googleRoadProvider = (x: number, y: number, z: number) => {
  return `https://mt1.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
};

const googleSatelliteProvider = (x: number, y: number, z: number) => {
  return `https://mt1.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}`;
};

interface PenempatanArea {
  id: string;
  kode: string;
  nama: string;
  longitude: string;
  latitude: string;
}

interface ApiPenempatanArea {
  id: string;
  kode: string;
  nama: string;
  longitude: string;
  latitude: string;
}

export default function TabPenempatanArea() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<PenempatanArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PenempatanArea | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PenempatanArea | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PenempatanArea | null>(null);
  const [previewMode3D, setPreviewMode3D] = useState(true);
  const [form, setForm] = useState({ kode: '', nama: '', longitude: '', latitude: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Map picker state
  const [mapCenter, setMapCenter] = useState<[number, number]>([3.1972, 99.3732]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingMap, setSearchingMap] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapMode3D, setMapMode3D] = useState(true); // Toggle 3D (Satellite) vs 2D (OSM Road Map)

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showToast = (t: 'ok' | 'err', text: string) => {
    setToast({ type: t, text });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<ApiPenempatanArea[]>('/master/penempatan-area');
      setData(res.data || []);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ kode: '', nama: '', longitude: '', latitude: '' });
    setMapCenter([3.1972, 99.3732]);
    setMapZoom(12);
    setSearchQuery('');
    setSearchingMap(false);
    setSearchError('');
    setMapModalOpen(false);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (r: PenempatanArea) => {
    setEditTarget(r);
    setForm({ kode: r.kode || '', nama: r.nama, longitude: r.longitude, latitude: r.latitude });
    const lat = parseFloat(r.latitude);
    const lng = parseFloat(r.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      setMapZoom(14);
    } else {
      setMapCenter([3.1972, 99.3732]);
      setMapZoom(12);
    }
    setSearchQuery('');
    setSearchingMap(false);
    setSearchError('');
    setMapModalOpen(false);
    setErrors({});
    setModalOpen(true);
  };

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    const [lat, lng] = latLng;
    setForm(f => ({
      ...f,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
    setMapCenter([lat, lng]);
  };

  // Sync typed/manual coordinates inside modal to map center
  useEffect(() => {
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setMapCenter([lat, lng]);
    }
  }, [form.latitude, form.longitude]);

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearchingMap(true);
    setSearchError('');
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      if (!apiKey) {
        setSearchError('Google Maps API Key tidak ditemukan di konfigurasi.');
        setSearchingMap(false);
        return;
      }
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`);
      const data = await res.json();
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const item = data.results[0];
        const lat = item.geometry.location.lat;
        const lng = item.geometry.location.lng;
        setForm(f => ({
          ...f,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        }));
        setMapCenter([lat, lng]);
        setMapZoom(14);
      } else if (data.status === 'ZERO_RESULTS') {
        setSearchError('Lokasi tidak ditemukan.');
      } else {
        setSearchError(data.error_message || `Gagal mencari lokasi (Status: ${data.status})`);
      }
    } catch (err) {
      console.error('Gagal mencari lokasi:', err);
      setSearchError('Gagal menghubungi layanan peta.');
    } finally {
      setSearchingMap(false);
    }
  };

  const latNum = parseFloat(form.latitude);
  const lngNum = parseFloat(form.longitude);
  const isValidCoords = !isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
  const anchorCoords: [number, number] = isValidCoords ? [latNum, lngNum] : [3.1972, 99.3732];

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.kode.trim()) { newErrors.kode = 'Kode area wajib diisi.'; }
    if (!form.nama.trim()) { newErrors.nama = 'Nama area wajib diisi.'; }
    if (!form.longitude.trim()) { newErrors.longitude = 'Longitude wajib diisi.'; }
    if (!form.latitude.trim()) { newErrors.latitude = 'Latitude wajib diisi.'; }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('err', 'Harap periksa form kembali.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kode: form.kode,
        nama: form.nama,
        longitude: form.longitude,
        latitude: form.latitude,
      };
      if (editTarget) {
        await api.put(`/master/penempatan-area/${editTarget.id}`, payload);
        showToast('ok', 'Data penempatan area berhasil diperbarui.');
      } else {
        await api.post('/master/penempatan-area', payload);
        showToast('ok', 'Penempatan area baru berhasil ditambahkan.');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach(d => {
          fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
      }
      showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/master/penempatan-area/${deleteTarget.id}`);
      showToast('ok', 'Data penempatan area berhasil dihapus.');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter & Pagination
  const filtered = data.filter(r =>
    r.nama.toLowerCase().includes(search.toLowerCase()) ||
    r.longitude.toLowerCase().includes(search.toLowerCase()) ||
    r.latitude.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Sync opening Map Modal -> hides Add/Edit form Modal
  const openMapPicker = () => {
    setMapModalOpen(true);
    setModalOpen(false);
  };

  // Sync closing Map Modal -> shows Add/Edit form Modal
  const closeMapPicker = () => {
    setMapModalOpen(false);
    setModalOpen(true);
  };

  return (
    <>
      <Toast toast={toast} />
      <TableCard>
        <CrudHeader
          searchPlaceholder="Cari area penempatan..."
          searchValue={search}
          onSearchChange={setSearch}
          addButtonText="Tambah Area Kerja"
          onAddClick={openCreate}
        />

        <CrudTable<PenempatanArea>
          headers={['No', 'Kode', 'Nama Area Kerja', 'Longitude', 'Latitude', 'Aksi']}
          loading={loading}
          loadingText="Memuat data area kerja..."
          data={paginatedData}
          renderRow={(row, idx) => (
            <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-3.5 text-xs font-semibold text-slate-400">
                {(currentPage - 1) * itemsPerPage + idx + 1}
              </td>
              <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                {row.kode}
              </td>
              <td className="px-5 py-3.5 text-slate-650 dark:text-slate-350">
                {row.nama}
              </td>
              <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                {row.longitude}
              </td>
              <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                {row.latitude}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => {
                      setPreviewTarget(row);
                      setPreviewMode3D(true);
                    }}
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-blue-500/10 hover:text-blue-500 transition-colors cursor-pointer focus:outline-none"
                    title="Preview Lokasi"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(row)}
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer focus:outline-none"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(row)}
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer focus:outline-none"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />

        <CrudPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </TableCard>

      {/* Main Add/Edit Form Modal */}
      <FormModal
        open={modalOpen}
        title={editTarget ? 'Edit Area Kerja' : 'Tambah Area Kerja'}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
        isEdit={!!editTarget}
        icon={MapPin}
      >
        <div>
          <label className={labelCls}>Kode Area Kerja *</label>
          <input
            type="text"
            value={form.kode}
            onChange={e => setForm(f => ({ ...f, kode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
            placeholder="cth: PKS_SEI_MANGKEI"
            className={`${inputCls} ${errors.kode ? 'border-rose-500' : ''}`}
          />
          {errors.kode && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.kode}</span>}
        </div>

        <div>
          <label className={labelCls}>Nama Area Kerja *</label>
          <input
            type="text"
            value={form.nama}
            onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
            placeholder="cth: PKS Sei Mangkei"
            className={`${inputCls} ${errors.nama ? 'border-rose-500' : ''}`}
          />
          {errors.nama && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nama}</span>}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Longitude *</label>
            <input
              type="text"
              value={form.longitude}
              onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
              placeholder="cth: 99.3732"
              className={`${inputCls} ${errors.longitude ? 'border-rose-500' : ''}`}
            />
            {errors.longitude && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.longitude}</span>}
          </div>
          <div>
            <label className={labelCls}>Latitude *</label>
            <input
              type="text"
              value={form.latitude}
              onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
              placeholder="cth: 3.1972"
              className={`${inputCls} ${errors.latitude ? 'border-rose-500' : ''}`}
            />
            {errors.latitude && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.latitude}</span>}
          </div>
          
          <div className="col-span-2 pt-1">
            <button
              type="button"
              onClick={openMapPicker}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer focus:outline-none"
            >
              <MapPin className="h-4 w-4" />
              Pilih dari Peta Satelit / Manual
            </button>
          </div>
        </div>
      </FormModal>

      {/* Map Picker Modal */}
      <ModalPortal open={mapModalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-[60]" onClick={closeMapPicker} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-[70]">
          <div className="pointer-events-auto w-full max-w-2xl animate-fade-up">
            <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <MapPin className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Pilih Lokasi dari Peta
                  </h2>
                </div>
                <button onClick={closeMapPicker} type="button" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Search Bar */}
                <div className="space-y-1.5">
                  <label className={labelCls}>Cari Lokasi / Alamat</label>
                  <div className="flex gap-2">
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
                      placeholder="Cari kota, jalan, atau area (cth: Sei Mangkei)"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      disabled={searchingMap}
                      onClick={handleSearchLocation}
                      className="rounded-lg border border-slate-200 dark:border-slate-850 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-250 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer focus:outline-none shrink-0"
                    >
                      {searchingMap ? 'Mencari...' : 'Cari'}
                    </button>
                  </div>
                  {searchError && <span className="text-[10px] text-rose-500 font-bold block">{searchError}</span>}
                </div>

                {/* Satellite Map Container */}
                <div className="w-full h-[320px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-10">
                  <Map
                    height={320}
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
                        width={32}
                        anchor={anchorCoords}
                        color="#ef4444"
                      />
                    )}
                  </Map>
                  
                  {/* Mode 3D Toggle Overlay Button */}
                  <button
                    type="button"
                    onClick={() => setMapMode3D(!mapMode3D)}
                    className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none cursor-pointer"
                    title={mapMode3D ? "Ubah ke Peta 2D Jalan" : "Ubah ke Peta Satelit 3D"}
                  >
                    <Layers className={`h-4 w-4 ${mapMode3D ? 'text-indigo-650' : 'text-slate-500'}`} />
                  </button>
                </div>
                
                {/* Coordinates Manual Form Inputs inside the Map modal */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200/50 dark:border-slate-800/50">
                  <div>
                    <label className={labelCls}>Latitude Manual</label>
                    <input
                      type="text"
                      value={form.latitude}
                      onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                      placeholder="Latitude"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Longitude Manual</label>
                    <input
                      type="text"
                      value={form.longitude}
                      onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                      placeholder="Longitude"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-150 dark:border-white/[0.06] px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/30">
                <button
                  type="button"
                  onClick={closeMapPicker}
                  className="rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 px-5 py-2 text-xs font-semibold text-white dark:text-slate-900 transition-colors cursor-pointer focus:outline-none"
                >
                  Selesai & Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Preview Map Modal */}
      <ModalPortal open={!!previewTarget}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-[60]" onClick={() => setPreviewTarget(null)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-[70]">
          <div className="pointer-events-auto w-full max-w-xl animate-fade-up">
            <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div> */}
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Preview Area: {previewTarget?.nama}
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Lat: {previewTarget?.latitude}, Lng: {previewTarget?.longitude}
                    </p>
                  </div>
                </div>
                <button onClick={() => setPreviewTarget(null)} type="button" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="w-full h-[350px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-10">
                  {previewTarget && (
                    <Map
                      height={350}
                      center={[parseFloat(previewTarget.latitude), parseFloat(previewTarget.longitude)]}
                      zoom={15}
                      provider={previewMode3D ? googleSatelliteProvider : googleRoadProvider}
                    >
                      <Marker
                        width={32}
                        anchor={[parseFloat(previewTarget.latitude), parseFloat(previewTarget.longitude)]}
                        color="#ef4444"
                      />
                    </Map>
                  )}
                  
                  {/* Mode 3D Toggle Overlay Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewMode3D(!previewMode3D)}
                    className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none cursor-pointer"
                    title={previewMode3D ? "Ubah ke Peta 2D Jalan" : "Ubah ke Peta Satelit 3D"}
                  >
                    <Layers className={`h-4 w-4 ${previewMode3D ? 'text-indigo-650' : 'text-slate-500'}`} />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-150 dark:border-white/[0.06] px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/30">
                {previewTarget && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${previewTarget.latitude},${previewTarget.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka di Google Maps
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewTarget(null)}
                  className="rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 px-5 py-2 text-xs font-semibold text-white dark:text-slate-900 transition-colors cursor-pointer focus:outline-none"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      <DeleteModal
        open={!!deleteTarget}
        name={deleteTarget?.nama || ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </>
  );
}
