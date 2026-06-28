'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Pencil, Trash2
} from 'lucide-react';
import { api, ApiRequestError } from '@/lib/api';
import {
  inputCls, labelCls, Toast, TableCard, DeleteModal,
  CrudHeader, CrudTable, CrudPagination, FormModal
} from './shared';

interface StatusKary {
  id: string;
  kode: string;
  nama: string;
}

interface ApiStatusKaryawan {
  id: string;
  kode: string;
  label: string;
}

export default function TabStatusKaryawan() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<StatusKary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StatusKary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StatusKary | null>(null);
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
      const res = await api.get<ApiStatusKaryawan[]>('/master/status-karyawan');
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

  const openEdit = (r: StatusKary) => {
    setEditTarget(r);
    setForm({ kode: r.kode, nama: r.nama });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.kode.trim()) { newErrors.kode = 'Kode wajib diisi.'; }
    if (!form.nama.trim()) { newErrors.nama = 'Nama Status wajib diisi.'; }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('err', 'Harap periksa form kembali.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kode: form.kode.toUpperCase(),
        label: form.nama,
      };
      if (editTarget) {
        await api.put(`/master/status-karyawan/${editTarget.id}`, payload);
        showToast('ok', `"${form.nama}" diperbarui.`);
      } else {
        await api.post('/master/status-karyawan', payload);
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
      await api.delete(`/master/status-karyawan/${deleteTarget.id}`);
      showToast('ok', `"${deleteTarget.nama}" dihapus.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = data.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()) || r.kode.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Toast toast={toast} />
      <TableCard>
        <CrudHeader
          searchPlaceholder="Cari status karyawan..."
          searchValue={search}
          onSearchChange={setSearch}
          addButtonText="Tambah Status"
          onAddClick={openCreate}
        />
        
        <CrudTable<StatusKary>
          headers={['Kode Status', 'Nama Status', 'Aksi']}
          loading={loading}
          loadingText="Memuat data status..."
          data={paginatedData}
          renderRow={(r) => (
            <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-3.5">
                <span className="rounded-lg bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
                  {r.kode}
                </span>
              </td>
              <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
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
        title={editTarget ? 'Edit Status Karyawan' : 'Tambah Status Karyawan'}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
        icon={Briefcase}
      >
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Kode Status *</label>
            <input
              type="text"
              value={form.kode}
              onChange={e => setForm(f => ({ ...f, kode: e.target.value.toUpperCase() }))}
              placeholder="TETAP"
              className={`${inputCls} ${errors.kode ? 'border-rose-500' : ''}`}
              maxLength={20}
            />
            {errors.kode && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.kode}</span>}
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Nama Status *</label>
            <input
              type="text"
              value={form.nama}
              onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              placeholder="cth: Karyawan Tetap"
              className={`${inputCls} ${errors.nama ? 'border-rose-500' : ''}`}
            />
            {errors.nama && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nama}</span>}
          </div>
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
