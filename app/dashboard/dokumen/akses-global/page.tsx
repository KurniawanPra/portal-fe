'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, Globe, Plus, Search, Trash2, UserCheck, Users } from 'lucide-react';
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
import { EmployeeSelectSearch } from '../_components/EmployeeSelectSearch';
import { SearchSelect, SearchSelectOption } from '@/components/ui/SearchSelect';
import { useDocumentToast } from '../_components/useDocumentToast';
import { errorMessage, formatDocumentDate } from '../_lib/document-api';
import type { DocumentCapabilities, EmployeeOption, PaginationMeta } from '../_lib/types';

interface GlobalViewer {
  id: string;
  unitOrganisasiId: string | null;
  unitName: string | null;
  unitKode: string | null;
  unitTipe: string | null;
  employeeId: string | null;
  employeeName: string | null;
  employeeNrk: string | null;
  employeeJabatan: string | null;
  includeDescendants: boolean;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

interface UnitOption {
  id: string;
  nama: string;
  kode: string;
  tipe: string;
  parentId: string | null;
}

const TIPE_BADGES: Record<string, string> = {
  direktorat: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  sevp: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  bagian: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  sub_bagian: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  seksi: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

const TIPE_LABELS: Record<string, string> = {
  direktorat: 'Direktorat',
  sevp: 'SEVP',
  bagian: 'Bagian',
  sub_bagian: 'Sub Bagian',
  seksi: 'Seksi',
};

export default function DocumentGlobalAccessPage() {
  const notice = useDocumentToast();
  const [activeTab, setActiveTab] = useState<'unit' | 'employee'>('unit');
  const [viewers, setViewers] = useState<GlobalViewer[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [canManage, setCanManage] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GlobalViewer | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [includeDescendants, setIncludeDescendants] = useState(true);
  const [unitNotes, setUnitNotes] = useState('');

  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedEmpObj, setSelectedEmpObj] = useState<EmployeeOption | null>(null);
  const [empNotes, setEmpNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [viewersRes, capsRes, unitsRes] = await Promise.all([
        api.get<GlobalViewer[]>('/documents/global-viewers'),
        api.get<DocumentCapabilities>('/documents/capabilities'),
        api.get<UnitOption[]>('/org/unit?limit=1000'),
      ]);
      setViewers(viewersRes.data);
      setCanManage(capsRes.data.canManage);
      setUnits(unitsRes.data);
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search & Pagination states per tab
  const [searchUnit, setSearchUnit] = useState('');
  const [pageUnit, setPageUnit] = useState(1);
  const [limitUnit, setLimitUnit] = useState(10);

  const [searchEmp, setSearchEmp] = useState('');
  const [pageEmp, setPageEmp] = useState(1);
  const [limitEmp, setLimitEmp] = useState(10);

  // Filtered viewers per tab with real-time search
  const filteredUnitViewers = useMemo(() => {
    const list = viewers.filter(v => v.unitOrganisasiId !== null);
    const q = searchUnit.trim().toLowerCase();
    if (!q) return list;
    return list.filter(v =>
      (v.unitName || '').toLowerCase().includes(q) ||
      (v.unitKode || '').toLowerCase().includes(q) ||
      (v.notes || '').toLowerCase().includes(q)
    );
  }, [viewers, searchUnit]);

  const visibleUnitViewers = useMemo(() => {
    return filteredUnitViewers.slice((pageUnit - 1) * limitUnit, pageUnit * limitUnit);
  }, [filteredUnitViewers, pageUnit, limitUnit]);

  const unitMeta: PaginationMeta = {
    page: pageUnit,
    limit: limitUnit,
    total: filteredUnitViewers.length,
    totalPages: Math.max(1, Math.ceil(filteredUnitViewers.length / limitUnit)),
  };

  const filteredEmpViewers = useMemo(() => {
    const list = viewers.filter(v => v.employeeId !== null);
    const q = searchEmp.trim().toLowerCase();
    if (!q) return list;
    return list.filter(v =>
      (v.employeeName || '').toLowerCase().includes(q) ||
      (v.employeeNrk || '').toLowerCase().includes(q) ||
      (v.employeeJabatan || '').toLowerCase().includes(q) ||
      (v.notes || '').toLowerCase().includes(q)
    );
  }, [viewers, searchEmp]);

  const visibleEmpViewers = useMemo(() => {
    return filteredEmpViewers.slice((pageEmp - 1) * limitEmp, pageEmp * limitEmp);
  }, [filteredEmpViewers, pageEmp, limitEmp]);

  const empMeta: PaginationMeta = {
    page: pageEmp,
    limit: limitEmp,
    total: filteredEmpViewers.length,
    totalPages: Math.max(1, Math.ceil(filteredEmpViewers.length / limitEmp)),
  };

  // Options for Searchable Unit Dropdown
  const unitOptions = useMemo<SearchSelectOption[]>(
    () =>
      units.map(u => ({
        value: u.id,
        label: `[${u.kode}] ${u.nama}`,
        subLabel: TIPE_LABELS[u.tipe] || u.tipe,
      })),
    [units]
  );

  // Handle Add Unit Global Viewer
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) {
      notice.error('Pilih unit organisasi terlebih dahulu');
      return;
    }
    setSaving(true);
    try {
      await api.post('/documents/global-viewers', {
        unitOrganisasiId: selectedUnitId,
        includeDescendants,
        notes: unitNotes.trim() || null,
      });
      notice.success('Unit organisasi berhasil ditambahkan sebagai Global Viewer');
      setUnitModalOpen(false);
      setSelectedUnitId('');
      setUnitNotes('');
      setIncludeDescendants(true);
      setActiveTab('unit');
      await loadData();
    } catch (error) {
      setActiveTab('unit');
      notice.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Handle Add Employee Global Viewer
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      notice.error('Pilih karyawan terlebih dahulu');
      return;
    }
    setSaving(true);
    try {
      await api.post('/documents/global-viewers', {
        employeeId: selectedEmpId,
        notes: empNotes.trim() || null,
      });
      notice.success('Karyawan berhasil ditambahkan sebagai Global Viewer');
      setEmpModalOpen(false);
      setSelectedEmpId('');
      setSelectedEmpObj(null);
      setEmpNotes('');
      setActiveTab('employee');
      await loadData();
    } catch (error) {
      setActiveTab('employee');
      notice.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Global Viewer
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/documents/global-viewers/${deleteTarget.id}`);
      notice.success('Akses Global Viewer berhasil dihapus');
      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (canManage === false) {
    return <DocumentAccessDenied title="Hanya Administrator yang memiliki akses ke halaman Pengaturan Akses Dokumen Global." />;
  }

  return (
    <div className="space-y-4">
      <AppToast toast={notice.toast} />

      <DocumentPageHeader
        title="Pengaturan Akses Dokumen Global"
        description="Kelola Unit Organisasi atau Karyawan Spesifik yang diberikan hak melihat (view-only) seluruh dokumen di semua unit organisasi (Global Viewers)."
        action={
          activeTab === 'unit' ? (
            <LoadingButton onClick={() => setUnitModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Tambah Unit Global
            </LoadingButton>
          ) : (
            <LoadingButton onClick={() => setEmpModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Tambah Karyawan Global
            </LoadingButton>
          )
        }
      />

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1">
        <button
          onClick={() => setActiveTab('unit')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'unit'
              ? 'border-amber-500 bg-amber-50/50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Unit Organisasi
          <span className={`rounded-full px-2 py-0.5 text-xs ${
            activeTab === 'unit'
              ? 'bg-amber-500 text-white font-black'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {filteredUnitViewers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('employee')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'employee'
              ? 'border-amber-500 bg-amber-50/50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Karyawan Spesifik
          <span className={`rounded-full px-2 py-0.5 text-xs ${
            activeTab === 'employee'
              ? 'bg-amber-500 text-white font-black'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {filteredEmpViewers.length}
          </span>
        </button>
      </div>

      {/* Info Card Banner */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-50/60 p-3.5 text-xs leading-relaxed text-amber-900 dark:border-amber-500/10 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 mb-1">
          <Globe className="h-4 w-4" />
          Catatan Sistem Hak Akses:
        </div>
         secara default karyawan hanya dapat melihat dokumen milik unit organisasinya sendiri dan dokumen unit di atasnya (ancestor).
        Menambahkan unit atau karyawan di sini memberikan <strong>akses khusus lihat (view-only) ke SEMUA dokumen aktif</strong> di seluruh organisasi (misalnya untuk Auditor Internal atau Direksi).
      </div>

      {/* Tab 1: Unit Organisasi */}
      {activeTab === 'unit' && (
        <DocumentPanel>
          {/* Search Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchUnit}
                onChange={e => {
                  setSearchUnit(e.target.value);
                  setPageUnit(1);
                }}
                placeholder="Cari unit, kode, atau catatan..."
                className={`${inputClass} pl-9`}
              />
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total {filteredUnitViewers.length} unit
            </div>
          </div>

          <DocumentTable
            headers={['Unit Organisasi', 'Tipe Unit', 'Pewarisan Akses', 'Catatan / Alasan', 'Ditambahkan Pada', 'Aksi']}
            loading={loading}
            empty={filteredUnitViewers.length === 0}
            alignLastHeader="right"
          >
            {visibleUnitViewers.map(v => (
              <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-800/50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900 dark:text-white">{v.unitName || 'Unit Tidak Ditemukan'}</div>
                  <div className="text-xs text-slate-400 font-mono">{v.unitKode || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  {v.unitTipe ? (
                    <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${TIPE_BADGES[v.unitTipe] || 'bg-slate-100 text-slate-600'}`}>
                      {TIPE_LABELS[v.unitTipe] || v.unitTipe}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3">
                  {v.includeDescendants ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Ya (Diwariskan ke Sub-unit)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Hanya Unit Induk Ini
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {v.notes || <span className="italic text-slate-400">Tanpa catatan</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {formatDocumentDate(v.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <IconAction label="Hapus Akses Global" onClick={() => setDeleteTarget(v)}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </IconAction>
                </td>
              </tr>
            ))}
          </DocumentTable>

          <DocumentPagination
            meta={unitMeta}
            onChange={setPageUnit}
            limitOptions={[10, 25, 50]}
            onLimitChange={newLimit => {
              setLimitUnit(newLimit);
              setPageUnit(1);
            }}
          />
        </DocumentPanel>
      )}

      {/* Tab 2: Karyawan Spesifik */}
      {activeTab === 'employee' && (
        <DocumentPanel>
          {/* Search Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchEmp}
                onChange={e => {
                  setSearchEmp(e.target.value);
                  setPageEmp(1);
                }}
                placeholder="Cari karyawan, NRK, jabatan, atau catatan..."
                className={`${inputClass} pl-9`}
              />
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total {filteredEmpViewers.length} karyawan
            </div>
          </div>

          <DocumentTable
            headers={['Karyawan', 'NRK', 'Jabatan', 'Catatan / Alasan', 'Ditambahkan Pada', 'Aksi']}
            loading={loading}
            empty={filteredEmpViewers.length === 0}
            alignLastHeader="right"
          >
            {visibleEmpViewers.map(v => (
              <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-800/50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {v.employeeName || 'Karyawan Tidak Ditemukan'}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                  {v.employeeNrk || '-'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {v.employeeJabatan || '-'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {v.notes || <span className="italic text-slate-400">Tanpa catatan</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {formatDocumentDate(v.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <IconAction label="Hapus Akses Global" onClick={() => setDeleteTarget(v)}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </IconAction>
                </td>
              </tr>
            ))}
          </DocumentTable>

          <DocumentPagination
            meta={empMeta}
            onChange={setPageEmp}
            limitOptions={[10, 25, 50]}
            onLimitChange={newLimit => {
              setLimitEmp(newLimit);
              setPageEmp(1);
            }}
          />
        </DocumentPanel>
      )}

      {/* Modal Add Unit */}
      <DocumentModal open={unitModalOpen} title="Tambah Unit Organisasi Global Viewer" onClose={() => setUnitModalOpen(false)}>
        <form onSubmit={handleAddUnit} className="space-y-4">
          <div>
            <label className={labelClass}>Cari & Pilih Unit Organisasi</label>
            <SearchSelect
              options={unitOptions}
              value={selectedUnitId}
              onChange={setSelectedUnitId}
              placeholder="Cari berdasarkan kode atau nama unit..."
              emptyText="Unit organisasi tidak ditemukan"
            />
          </div>

          {/* Custom Toggle Switch Card */}
          <div
            onClick={() => setIncludeDescendants(!includeDescendants)}
            className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 transition-all duration-200 ${
              includeDescendants
                ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.02] to-transparent ring-1 ring-amber-500/20 dark:border-amber-500/30 dark:from-amber-500/15'
                : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Wariskan Hak Akses ke Seluruh Sub-Unit
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                      includeDescendants
                        ? 'bg-amber-100 text-amber-700 border border-amber-300/40 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {includeDescendants ? 'Aktif (Diwariskan)' : 'Non-Aktif (Hanya Unit Induk)'}
                  </span>
                </div>
                <div className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 space-y-0.5 pt-0.5">
                  <p>
                    <strong className="text-slate-700 dark:text-slate-300">• Jika Aktif:</strong> Seluruh karyawan pada sub-unit bawahan (Sub Bagian / Seksi) otomatis ikut mendapat akses global.
                  </p>
                  <p>
                    <strong className="text-slate-700 dark:text-slate-300">• Jika Non-Aktif:</strong> Hak akses global hanya berlaku khusus untuk karyawan di unit induk ini saja.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  includeDescendants ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    includeDescendants ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Catatan / Alasan Akses (Opsional)</label>
            <textarea
              value={unitNotes}
              onChange={e => setUnitNotes(e.target.value)}
              placeholder="Contoh: Unit Tim Auditor Internal - Wajib membaca semua dokumen organisasi"
              className={`${inputClass} h-20 py-2`}
              maxLength={300}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <SecondaryButton type="button" onClick={() => setUnitModalOpen(false)}>
              Batal
            </SecondaryButton>
            <LoadingButton type="submit" loading={saving}>
              Simpan Unit
            </LoadingButton>
          </div>
        </form>
      </DocumentModal>

      {/* Modal Add Employee */}
      <DocumentModal open={empModalOpen} title="Tambah Karyawan Spesifik Global Viewer" onClose={() => setEmpModalOpen(false)}>
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className={labelClass}>Cari & Pilih Karyawan</label>
            <EmployeeSelectSearch
              value={selectedEmpId}
              onChange={(empId, empObj) => {
                setSelectedEmpId(empId);
                setSelectedEmpObj(empObj || null);
              }}
              initialEmployee={selectedEmpObj}
              placeholder="Cari berdasarkan nama atau NRK karyawan..."
              emptyLabel="Pilih karyawan yang diberi akses global"
            />
          </div>

          <div>
            <label className={labelClass}>Catatan / Alasan Akses (Opsional)</label>
            <textarea
              value={empNotes}
              onChange={e => setEmpNotes(e.target.value)}
              placeholder="Contoh: Komisaris Utama - Memiliki hak pengawasan ke seluruh unit"
              className={`${inputClass} h-20 py-2`}
              maxLength={300}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <SecondaryButton type="button" onClick={() => setEmpModalOpen(false)}>
              Batal
            </SecondaryButton>
            <LoadingButton type="submit" loading={saving}>
              Simpan Karyawan
            </LoadingButton>
          </div>
        </form>
      </DocumentModal>

      {/* Delete Confirmation Modal */}
      <DocumentModal open={deleteTarget !== null} title="Hapus Akses Global Viewer" onClose={() => setDeleteTarget(null)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Apakah Anda yakin ingin menghapus hak akses Global Viewer untuk{' '}
            <strong className="text-slate-900 dark:text-white">
              {deleteTarget?.unitName || deleteTarget?.employeeName}
            </strong>
            ? Hak akses lihat otomatis ke seluruh dokumen organisasi akan dicabut.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <SecondaryButton type="button" onClick={() => setDeleteTarget(null)}>
              Batal
            </SecondaryButton>
            <LoadingButton onClick={handleDelete} loading={saving} className="bg-rose-600 hover:bg-rose-700">
              Hapus Akses
            </LoadingButton>
          </div>
        </div>
      </DocumentModal>
    </div>
  );
}
