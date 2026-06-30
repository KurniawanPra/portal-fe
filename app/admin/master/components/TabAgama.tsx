'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import { api, ApiRequestError } from '@/lib/api';
import {
  inputCls, labelCls, Toast, TableCard, DeleteModal,
  CrudHeader, CrudTable, CrudPagination, FormModal
} from './shared';

interface Agama {
  id: string;
  kode: string;
  label: string;
}

export default function TabAgama() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<Agama[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Agama | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Agama | null>(null);
  const [form, setForm] = useState({ label: '', kode: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const showToast = (t: 'ok' | 'err', text: string) => {
    setToast({ type: t, text });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<Agama[]>('/master/agama');
      setData(res.data || []);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ label: '', kode: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (r: Agama) => {
    setEditTarget(r);
    setForm({ label: r.label, kode: r.kode });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.label.trim()) newErrors.label = 'Nama Agama wajib diisi.';
    if (!form.kode.trim()) newErrors.kode = 'Kode wajib diisi.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('err', 'Harap periksa form kembali.');
      return;
    }

    setSaving(true);
    try {
      const payload = { kode: form.kode.toUpperCase().replace(/\s+/g, '_'), label: form.label };
      if (editTarget) {
        await api.put(`/master/agama/${editTarget.id}`, payload);
        showToast('ok', `"${form.label}" diperbarui.`);
      } else {
        await api.post('/master/agama', payload);
        showToast('ok', `"${form.label}" ditambahkan.`);
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/master/agama/${deleteTarget.id}`);
      showToast('ok', 'Data dihapus.');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = data.filter(r =>
    r.label.toLowerCase().includes(search.toLowerCase()) ||
    r.kode.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Toast toast={toast} />
      <TableCard>
        <CrudHeader
          searchPlaceholder="Cari agama..."
          searchValue={search}
          onSearchChange={setSearch}
          addButtonText="Tambah Agama"
          onAddClick={openCreate}
        />

        <CrudTable<Agama>
          headers={['Nama Agama', 'Kode', 'Aksi']}
          loading={loading}
          loadingText="Memuat data agama..."
          data={paginatedData}
          renderRow={(r) => (
            <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                {r.label}
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                {r.kode}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEdit(r)}
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer focus:outline-none"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(r)}
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

      <FormModal
        open={modalOpen}
        title={editTarget ? 'Edit Agama' : 'Tambah Agama'}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
        icon={BookOpen}
      >
        <div>
          <label className={labelCls}>Nama Agama *</label>
          <input
            type="text"
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="cth: Islam"
            className={`${inputCls} ${errors.label ? '!border-rose-500 focus:!border-rose-500' : ''}`}
          />
          {errors.label && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.label}</span>}
        </div>
        <div>
          <label className={labelCls}>Kode *</label>
          <input
            type="text"
            value={form.kode}
            onChange={e => setForm(f => ({ ...f, kode: e.target.value }))}
            placeholder="cth: ISLAM"
            className={`${inputCls} font-mono ${errors.kode ? '!border-rose-500 focus:!border-rose-500' : ''}`}
          />
          {errors.kode && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.kode}</span>}
        </div>
      </FormModal>

      <DeleteModal
        open={!!deleteTarget}
        name={deleteTarget?.label ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </>
  );
}
