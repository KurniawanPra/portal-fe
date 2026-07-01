'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GraduationCap, Pencil, Trash2
} from 'lucide-react';
import { api, ApiRequestError } from '@/lib/api';
import {
  inputCls, labelCls, Toast, TableCard, DeleteModal,
  CrudHeader, CrudTable, Pagination, FormModal
} from './shared';

interface Pendidikan {
  id: string;
  singkatan: string;
  nama_lengkap: string;
  jenjang: number;
}

interface ApiPendidikan {
  id: string;
  kode: string;
  label: string;
  urutan: number;
}

export default function TabPendidikan() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<Pendidikan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pendidikan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pendidikan | null>(null);
  const [form, setForm] = useState({ singkatan: '', nama_lengkap: '', jenjang: 1 });
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
      const res = await api.get<ApiPendidikan[]>('/master/pendidikan');
      const mapped = (res.data || []).map(r => ({
        id: r.id,
        singkatan: r.kode,
        nama_lengkap: r.label,
        jenjang: r.urutan,
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
    setForm({ singkatan: '', nama_lengkap: '', jenjang: data.length + 1 });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (r: Pendidikan) => {
    setEditTarget(r);
    setForm({ singkatan: r.singkatan, nama_lengkap: r.nama_lengkap, jenjang: r.jenjang });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.singkatan.trim()) { newErrors.singkatan = 'Singkatan wajib diisi.'; }
    if (!form.nama_lengkap.trim()) { newErrors.nama_lengkap = 'Nama lengkap wajib diisi.'; }
    if (form.jenjang <= 0) { newErrors.jenjang = 'Jenjang tidak valid.'; }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('err', 'Harap periksa form kembali.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kode: form.singkatan.toUpperCase(),
        label: form.nama_lengkap,
        urutan: form.jenjang,
      };
      if (editTarget) {
        await api.put(`/master/pendidikan/${editTarget.id}`, payload);
        showToast('ok', `"${form.nama_lengkap}" diperbarui.`);
      } else {
        await api.post('/master/pendidikan', payload);
        showToast('ok', `"${form.nama_lengkap}" ditambahkan.`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach(d => {
          let fieldName = d.field;
          if (fieldName === 'kode') fieldName = 'singkatan';
          if (fieldName === 'label') fieldName = 'nama_lengkap';
          if (fieldName === 'urutan') fieldName = 'jenjang';
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
      await api.delete(`/master/pendidikan/${deleteTarget.id}`);
      showToast('ok', `"${deleteTarget.nama_lengkap}" dihapus.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = data.filter(r => r.nama_lengkap.toLowerCase().includes(search.toLowerCase()) || r.singkatan.toLowerCase().includes(search.toLowerCase()));

  const sortedData = useMemo(() => {
    return [...filtered].sort((a, b) => a.jenjang - b.jenjang);
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    return sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedData, currentPage]);

  return (
    <>
      <Toast toast={toast} />
      <TableCard>
        <CrudHeader
          searchPlaceholder="Cari jenjang pendidikan..."
          searchValue={search}
          onSearchChange={setSearch}
          addButtonText="Tambah Jenjang"
          onAddClick={openCreate}
        />

        <CrudTable<Pendidikan>
          headers={['Jenjang', 'Singkatan', 'Nama Lengkap', 'Aksi']}
          loading={loading}
          loadingText="Memuat data pendidikan..."
          data={paginatedData}
          renderRow={(r) => (
            <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-3.5 text-xs font-semibold text-slate-550 dark:text-slate-400">
                {r.jenjang}
              </td>
              <td className="px-5 py-3.5">
                <span className="rounded-lg bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-black text-slate-700 dark:text-slate-300">
                  {r.singkatan}
                </span>
              </td>
              <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                {r.nama_lengkap}
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </TableCard>

      <FormModal
        open={modalOpen}
        title={editTarget ? 'Edit Jenjang Pendidikan' : 'Tambah Jenjang Pendidikan'}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
        isEdit={!!editTarget}
        icon={GraduationCap}
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Singkatan *</label>
            <input
              type="text"
              value={form.singkatan}
              onChange={e => setForm(f => ({ ...f, singkatan: e.target.value.toUpperCase() }))}
              placeholder="cth: S1"
              className={`${inputCls} ${errors.singkatan ? 'border-rose-500' : ''}`}
            />
            {errors.singkatan && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.singkatan}</span>}
          </div>
          <div>
            <label className={labelCls}>Jenjang (Angka) *</label>
            <input
              type="number"
              value={form.jenjang}
              onChange={e => setForm(f => ({ ...f, jenjang: parseInt(e.target.value) || 0 }))}
              placeholder="5"
              className={`${inputCls} ${errors.jenjang ? 'border-rose-500' : ''}`}
            />
            {errors.jenjang && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.jenjang}</span>}
          </div>
        </div>
        <div>
          <label className={labelCls}>Nama Lengkap *</label>
          <input
            type="text"
            value={form.nama_lengkap}
            onChange={e => setForm(f => ({ ...f, nama_lengkap: e.target.value }))}
            placeholder="cth: Sarjana (S1)"
            className={`${inputCls} ${errors.nama_lengkap ? 'border-rose-500' : ''}`}
          />
          {errors.nama_lengkap && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nama_lengkap}</span>}
        </div>
      </FormModal>

      <DeleteModal
        open={!!deleteTarget}
        name={deleteTarget?.nama_lengkap ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </>
  );
}
