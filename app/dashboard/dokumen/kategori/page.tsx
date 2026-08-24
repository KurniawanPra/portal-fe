'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { AppToast } from '@/components/ui/AppToast';
import {
  DocumentAccessDenied,
  DocumentModal,
  DocumentPageHeader,
  DocumentPagination,
  DocumentPanel,
  DocumentTable,
  IconAction,
  LoadingButton,
  SecondaryButton,
  inputClass,
  labelClass,
} from '../_components/DocumentUi';
import { useDocumentToast } from '../_components/useDocumentToast';
import { errorMessage, formatDocumentDate } from '../_lib/document-api';
import type { DocumentCapabilities, DocumentCategory, PaginationMeta } from '../_lib/types';

const emptyForm = { name: '', code: '' };

export default function DocumentCategoriesPage() {
  const notice = useDocumentToast();
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [canManage, setCanManage] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [categoryResponse, capabilityResponse] = await Promise.all([
        api.get<DocumentCategory[]>('/documents/categories'),
        api.get<DocumentCapabilities>('/documents/capabilities'),
      ]);
      setCategories(categoryResponse.data);
      setCanManage(capabilityResponse.data.canManage);
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(10);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => 
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const visible = useMemo(() => {
    return filteredCategories.slice((page - 1) * limit, page * limit);
  }, [filteredCategories, page, limit]);

  const meta: PaginationMeta = {
    page,
    limit,
    total: filteredCategories.length,
    totalPages: Math.max(1, Math.ceil(filteredCategories.length / limit)),
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (item: DocumentCategory) => {
    setEditing(item);
    setForm({ name: item.name, code: item.code });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.code.trim()) return notice.error('Nama dan kode kategori wajib diisi.');
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
    };
    try {
      if (editing) await api.put(`/documents/categories/${editing.id}`, payload);
      else await api.post('/documents/categories', payload);
      notice.success(editing ? 'Kategori berhasil diperbarui.' : 'Kategori berhasil ditambahkan.');
      setFormOpen(false);
      await load();
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/documents/categories/${deleteTarget.id}`);
      notice.success('Kategori berhasil dihapus.');
      setDeleteTarget(null);
      await load();
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-8">
      <AppToast toast={notice.toast} />
      <DocumentPageHeader title="Kategori Dokumen" description="Klasifikasi dan pengelompokan jenis dokumen perusahaan." action={canManage ? <LoadingButton onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Kategori</LoadingButton> : undefined} />
      {canManage === false ? <DocumentAccessDenied /> : (
        <DocumentPanel>
          {/* Search Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari kategori atau kode dokumen..."
                className={`${inputClass} pl-9`}
              />
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total {filteredCategories.length} kategori
            </div>
          </div>

          <DocumentTable headers={['Kategori', 'Kode', 'Diperbarui', 'Aksi']} loading={loading} empty={!visible.length}>
            {visible.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/35">
                <td className="px-4 py-3.5"><div className="flex items-center gap-2.5"><Tags className="h-4 w-4 text-slate-400" /><span className="font-bold text-slate-800 dark:text-slate-100">{item.name}</span></div></td>
                <td className="px-4 py-3.5"><span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.code}</span></td>
                <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">{formatDocumentDate(item.updatedAt)}</td>
                <td className="px-4 py-3.5 text-left"><div className="inline-flex"><IconAction label="Edit kategori" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></IconAction><IconAction label="Hapus kategori" onClick={() => setDeleteTarget(item)} className="hover:text-rose-600"><Trash2 className="h-4 w-4" /></IconAction></div></td>
              </tr>
            ))}
          </DocumentTable>
          <DocumentPagination
            meta={meta}
            onChange={setPage}
            limitOptions={[10, 25, 50]}
            onLimitChange={newLimit => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </DocumentPanel>
      )}

      <DocumentModal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? 'Edit Kategori Dokumen' : 'Tambah Kategori Dokumen'}
        description="Atur nama dan kode kategori dokumen."
        width="max-w-lg"
        footer={<><SecondaryButton onClick={() => setFormOpen(false)} disabled={saving}>Batal</SecondaryButton><LoadingButton loading={saving} onClick={save}>Simpan Kategori</LoadingButton></>}
      >
        <div className="flex flex-col gap-4">
          <label className="block"><span className={labelClass}>Nama Kategori *</span><input className={inputClass} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="mis. Standard Operating Procedure" /></label>
          <label className="block"><span className={labelClass}>Kode Kategori *</span><input className={inputClass} value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="mis. SOP" /></label>
        </div>
      </DocumentModal>

      <DocumentModal open={!!deleteTarget} onClose={() => !saving && setDeleteTarget(null)} title="Hapus kategori" description={`Kategori ${deleteTarget?.name || ''} hanya dapat dihapus jika belum digunakan.`} footer={<><SecondaryButton onClick={() => setDeleteTarget(null)} disabled={saving}>Batal</SecondaryButton><LoadingButton loading={saving} onClick={remove} className="bg-rose-600 hover:bg-rose-700">Hapus</LoadingButton></>}><p className="text-sm text-slate-600 dark:text-slate-300">Konfirmasi penghapusan kategori dokumen ini.</p></DocumentModal>
    </div>
  );
}
