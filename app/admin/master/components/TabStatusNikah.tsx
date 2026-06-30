'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart, Pencil, Trash2
} from 'lucide-react';
import { api, ApiRequestError } from '@/lib/api';
import {
  inputCls, labelCls, Toast, TableCard, DeleteModal,
  CrudHeader, CrudTable, CrudPagination, FormModal
} from './shared';

interface StatusNikah {
  id: string;
  kode: string;
  nama: string;
}

interface ApiStatusPernikahan {
  id: string;
  kode: string;
  label: string;
}

export default function TabStatusNikah() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<StatusNikah[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StatusNikah | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StatusNikah | null>(null);
  const [form, setForm] = useState({ kode: '', nama: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      const res = await api.get<ApiStatusPernikahan[]>('/master/status-pernikahan');
      const mapped = (res.data || []).map(r => ({
        id: r.id,
        kode: r.kode,
        nama: r.label,
      }));
      setData(mapped);
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
    setForm({ kode: '', nama: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (r: StatusNikah) => {
    setEditTarget(r);
    setForm({ kode: r.kode || '', nama: r.nama });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.kode.trim()) { newErrors.kode = 'Kode Status wajib diisi.'; }
    if (!form.nama.trim()) { newErrors.nama = 'Nama Status wajib diisi.'; }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('err', 'Harap periksa form kembali.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kode: form.kode,
        label: form.nama,
      };
      if (editTarget) {
        await api.put(`/master/status-pernikahan/${editTarget.id}`, payload);
        showToast('ok', `"${form.nama}" diperbarui.`);
      } else {
        await api.post('/master/status-pernikahan', payload);
        showToast('ok', `"${form.nama}" ditambahkan.`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach(d => {
          let fieldName = d.field;
          if (fieldName === 'label') fieldName = 'nama';
          fieldErrors[fieldName] = d.message;
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
      await api.delete(`/master/status-pernikahan/${deleteTarget.id}`);
      showToast('ok', 'Data dihapus.');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = data.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Toast toast={toast} />
      <TableCard>
        <CrudHeader
          searchPlaceholder="Cari status pernikahan..."
          searchValue={search}
          onSearchChange={setSearch}
          addButtonText="Tambah Status"
          onAddClick={openCreate}
        />

        <CrudTable<StatusNikah>
          headers={['Kode', 'Nama Status Pernikahan', 'Aksi']}
          loading={loading}
          loadingText="Memuat data status pernikahan..."
          data={paginatedData}
          renderRow={(r) => (
            <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                {r.kode}
              </td>
              <td className="px-5 py-3.5 text-slate-650 dark:text-slate-405">
                {r.nama}
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
        title={editTarget ? 'Edit Status' : 'Tambah Status'}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
        icon={Heart}
      >
        <div>
          <label className={labelCls}>Kode Status *</label>
          <input
            type="text"
            value={form.kode}
            onChange={e => setForm(f => ({ ...f, kode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
            placeholder="cth: BELUM_NIKAH"
            className={`${inputCls} ${errors.kode ? 'border-rose-500' : ''}`}
          />
          {errors.kode && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.kode}</span>}
        </div>

        <div>
          <label className={labelCls}>Nama Status *</label>
          <input
            type="text"
            value={form.nama}
            onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
            placeholder="cth: Menikah (Anak 1)"
            className={`${inputCls} ${errors.nama ? 'border-rose-500' : ''}`}
          />
          {errors.nama && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nama}</span>}
        </div>
      </FormModal>

      <DeleteModal
        open={!!deleteTarget}
        name={deleteTarget?.nama ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </>
  );
}
