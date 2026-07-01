'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Music, Play, Pause, Trash2, Pencil, Plus, Check } from 'lucide-react';
import { api, ApiRequestError } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import {
  inputCls, labelCls, Toast, TableCard, DeleteModal,
  CrudHeader, CrudTable, Pagination, FormModal,
  PrimaryButton
} from './shared';

interface LoginSong {
  id: string;
  title: string;
  filename: string | null;
  isActive: boolean;
}

export default function TabLaguLogin() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<LoginSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LoginSong | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoginSong | null>(null);

  const [form, setForm] = useState({ title: '' });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const showToast = (t: 'ok' | 'err', text: string) => {
    setToast({ type: t, text });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<LoginSong[]>('/login-songs');
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

  // Audio Preview Lifecycle
  useEffect(() => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    const handleEnded = () => setPlayingSongId(null);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioEnhancer = () => {
    if (!previewAudioRef.current || audioContextRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(previewAudioRef.current);

      // Bass Booster: Lowshelf filter to boost bass below 100Hz
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 100;
      bassFilter.gain.value = 6; // Boost bass cleanly by 6dB

      // Limiter/Compressor: dynamics compressor to prevent clipping distortion
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      // Master Gain: scale back overall gain slightly to avoid physical speaker rattle
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.65; // 65% volume ceiling

      source.connect(bassFilter);
      bassFilter.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(ctx.destination);
    } catch (e) {
      console.log('Web Audio API preview enhancer failed:', e);
    }
  };

  const togglePreview = (song: LoginSong) => {
    if (!song.filename) {
      showToast('err', 'File lagu belum diunggah.');
      return;
    }
    const audio = previewAudioRef.current;
    if (!audio) return;

    initAudioEnhancer();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => { });
    }

    if (playingSongId === song.id) {
      audio.pause();
      setPlayingSongId(null);
    } else {
      audio.src = `/audio/${song.filename}`;
      audio.play()
        .then(() => setPlayingSongId(song.id))
        .catch((err) => showToast('err', 'Gagal memutar audio: ' + err.message));
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: '' });
    setAudioFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (s: LoginSong) => {
    setEditTarget(s);
    setForm({ title: s.title });
    setAudioFile(null);
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Judul lagu wajib diisi.';
    if (!editTarget && !audioFile) newErrors.file = 'File musik .mp3 wajib diunggah.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('err', 'Harap periksa form kembali.');
      return;
    }

    setSaving(true);
    try {
      let songId = '';
      if (editTarget) {
        await api.put(`/login-songs/${editTarget.id}`, { title: form.title });
        songId = editTarget.id;
        showToast('ok', `Judul lagu "${form.title}" berhasil diperbarui.`);
      } else {
        const res = await api.post<any>('/login-songs', { title: form.title });
        songId = res.data.id;
      }

      // Upload file if selected
      if (audioFile && songId) {
        const fd = new FormData();
        fd.append('file', audioFile);
        const token = getAccessToken();
        const uploadRes = await fetch(`/api/login-songs/${songId}/file`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: fd,
        });
        if (!uploadRes.ok) {
          throw new Error('Gagal mengunggah file musik .mp3.');
        }
        showToast('ok', `Lagu "${form.title}" berhasil disimpan.`);
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
        showToast('err', err.message || 'Gagal menyimpan.');
      } else {
        showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (song: LoginSong) => {
    try {
      await api.post(`/login-songs/${song.id}/activate`, {});
      showToast('ok', `Lagu "${song.title}" diaktifkan sebagai lagu login.`);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal mengaktifkan lagu.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (playingSongId === deleteTarget.id) {
        previewAudioRef.current?.pause();
        setPlayingSongId(null);
      }
      await api.delete(`/login-songs/${deleteTarget.id}`);
      showToast('ok', `Lagu "${deleteTarget.title}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus lagu.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter
  const filtered = data.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    (d.filename && d.filename.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Hidden audio element for preview */}
      <audio ref={previewAudioRef} preload="none" />

      {toast && <Toast toast={toast} />}

      <TableCard>
        <CrudHeader
          searchPlaceholder="Cari lagu..."
          searchValue={search}
          onSearchChange={setSearch}
          addButtonText="Tambah Lagu Login"
          onAddClick={openCreate}
        />

        <CrudTable
          headers={['No', 'Judul Lagu', 'Nama File', 'Status', 'Preview', 'Aksi']}
          loading={loading}
          data={paginatedData}
          renderRow={(item, index) => {
            const no = (currentPage - 1) * itemsPerPage + index + 1;
            const isPlaying = playingSongId === item.id;
            return (
              <tr key={item.id} className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200">
                <td className="px-5 py-4 font-mono text-[11px] text-slate-400">{no}</td>
                <td className="px-5 py-4">{item.title}</td>
                <td className="px-5 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {item.filename || '— Belum diunggah —'}
                </td>
                <td className="px-5 py-4">
                  {item.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Check className="h-3 w-3 stroke-[3]" /> Aktif
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivate(item)}
                      disabled={!item.filename}
                      className="cursor-pointer text-[10px] font-bold text-amber-500 hover:text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      Aktifkan
                    </button>
                  )}
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => togglePreview(item)}
                    disabled={!item.filename}
                    className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-500 dark:hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isPlaying ? 'Pause' : 'Play Preview'}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 pl-0.5" />}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-555 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Judul"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-555 dark:hover:text-rose-400 dark:hover:bg-rose-950/20 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </TableCard>

      {/* Add / Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editTarget ? 'Edit Lagu Login' : 'Tambah Lagu Login'}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
        isEdit={!!editTarget}
        icon={Music}
      >
        <div className="space-y-3.5">
          <div>
            <label className={labelCls}>Judul Lagu *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Masukkan judul lagu"
              className={inputCls}
            />
            {errors.title && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.title}</span>}
          </div>

          {!editTarget && (
            <div>
              <label className={labelCls}>File Audio (.mp3) *</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/mpeg, audio/mp3"
                onChange={e => setAudioFile(e.target.files?.[0] || null)}
                className="w-full text-xs font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300 dark:hover:file:bg-slate-750 file:cursor-pointer cursor-pointer text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-slate-200 dark:border-white/[0.08] p-2"
              />
              {errors.file && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.file}</span>}
            </div>
          )}
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          open={!!deleteTarget}
          name={deleteTarget.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}
