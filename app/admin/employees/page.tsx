'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Users, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle,
  Phone, MapPin, Briefcase, Building2, UserCheck, UserX,
  IdCard, Loader2, ChevronDown, User, FileSpreadsheet, FileUp, FileDown, Download
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { api, ApiRequestError } from '@/lib/api';
import FileUpload05 from '@/components/ui/file-upload-1';
import { getAccessToken } from '@/lib/auth';
import { PrimaryButton, FilterDropdown, CrudPagination, Toast, SearchInput, CrudTable, TableActions } from '@/admin/master/components/shared';

// ─── Types ───────────────────────────────────────────────────────────────────
type JenisKelamin = 'L' | 'P';

interface ApiEmployee {
  id: string;
  nrk: string;
  nik: string;
  nama: string;
  jenisKelamin: JenisKelamin;
  jabatan: string;
  gradeId: string | null;
  atasanId: string | null;
  unitOrganisasiId: string | null;
  tanggalMasuk: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  nomorHp: string | null;
  alamat: string | null;
  isActive: boolean;
  fotoProfil: string | null;
  statusKaryawanId: string | null;
  pendidikanTerakhirId: string | null;
  statusPernikahanId: string | null;
  agama: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UnitOrganisasi {
  id: string;
  nama: string;
  kode: string;
  tipe: string;
  isActive: boolean;
  parentId: string | null;
}

interface EmployeeData {
  id: string;
  nrk: string;
  nik: string;
  nama: string;
  jenisKelamin: JenisKelamin;
  jabatan: string;
  unitOrganisasiId: string;
  unitOrganisasiNama: string;
  tanggalMasuk: string;
  tempatLahir: string;
  tanggalLahir: string;
  nomorHp: string;
  alamat: string;
  isActive: boolean;
  createdAt: string;
  gradeId: string;
  statusKaryawanId: string;
  pendidikanTerakhirId: string;
  statusPernikahanId: string;
  fotoProfil: string;
  atasanId: string;
  agama: string;
}

// Color palettes
const STATUS_BADGE = {
  true:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20',
  false: 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20',
} as Record<string, string>;

const STATUS_DOT = {
  true:  'bg-emerald-500 dark:bg-emerald-400',
  false: 'bg-rose-500 dark:bg-rose-400',
} as Record<string, string>;

const GENDER_BADGE: Record<JenisKelamin, string> = {
  L: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  P: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
};

const GENDER_AVATAR: Record<JenisKelamin, string> = {
  L: 'from-blue-400 to-blue-600',
  P: 'from-pink-400 to-pink-600',
};

const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200';

const labelCls = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400';

const getLabel = (t: string) => {
  if (t === 'direktorat') return 'Direktorat';
  if (t === 'sevp') return 'SEVP';
  if (t === 'bagian') return 'Bagian';
  if (t === 'sub_bagian') return 'Sub Bagian';
  if (t === 'seksi') return 'Seksi';
  return t;
};

interface FormData {
  nrk: string;
  nik: string;
  nama: string;
  jenisKelamin: JenisKelamin;
  jabatan: string;
  tanggalMasuk: string;
  tempatLahir: string;
  tanggalLahir: string;
  nomorHp: string;
  alamat: string;
  isActive: boolean;
  unitPath: string[];
  gradeId: string;
  statusKaryawanId: string;
  pendidikanTerakhirId: string;
  statusPernikahanId: string;
  atasanId: string;
  agama: string;
}
const emptyForm: FormData = {
  nrk: '', nik: '', nama: '', jenisKelamin: 'L', jabatan: '',
  tanggalMasuk: '', tempatLahir: '', tanggalLahir: '', nomorHp: '', alamat: '', isActive: true,
  unitPath: [],
  gradeId: '',
  statusKaryawanId: '',
  pendidikanTerakhirId: '',
  statusPernikahanId: '',
  atasanId: '',
  agama: '',
};

interface EmployeeImportPayload {
  nrk: string;
  nik: string;
  nama: string;
  jenisKelamin: JenisKelamin;
  jabatan: string;
  gradeId: string;
  atasanId: string | null;
  unitOrganisasiId: string;
  tanggalMasuk: string;
  tempatLahir: string;
  tanggalLahir: string;
  statusKaryawanId: string;
  pendidikanTerakhirId: string;
  statusPernikahanId: string;
  nomorHp: string;
  alamat: string;
  agama: string;
  isActive: boolean;
}

interface ImportEmployeeRow {
  rowNumber: number;
  selected: boolean;
  status: 'valid' | 'invalid' | 'imported' | 'failed';
  errors: string[];
  payload: EmployeeImportPayload;
  preview: {
    nrk: string;
    nik: string;
    nama: string;
    jabatan: string;
    unit: string;
    grade: string;
    status: string;
  };
}

const IMPORT_HEADERS = [
  'NRK',
  'NIK',
  'Nama',
  'Jenis Kelamin',
  'Jabatan',
  'Kode Unit',
  'Tanggal Masuk',
  'Tempat Lahir',
  'Tanggal Lahir',
  'Kode Grade',
  'Status Karyawan',
  'Pendidikan Terakhir',
  'Status Pernikahan',
  'Agama',
  'Nomor HP',
  'Alamat',
  'Status Aktif',
  'Atasan NRK',
];

const normalizeKey = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const getCellValue = (row: Record<string, unknown>, keys: string[]) => {
  const wanted = keys.map(normalizeKey);
  const foundKey = Object.keys(row).find(key => wanted.includes(normalizeKey(key)));
  return foundKey ? String(row[foundKey] ?? '').trim() : '';
};

const parseExcelDate = (value: string) => {
  const v = value.trim();
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  const slash = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const day = slash[1].padStart(2, '0');
    const month = slash[2].padStart(2, '0');
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(v);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const parseGender = (value: string): JenisKelamin | '' => {
  const v = normalizeKey(value);
  if (['l', 'laki-laki', 'laki laki', 'pria', 'male'].includes(v)) return 'L';
  if (['p', 'perempuan', 'wanita', 'female'].includes(v)) return 'P';
  return '';
};

const parseActive = (value: string) => {
  const v = normalizeKey(value);
  if (!v) return true;
  return ['aktif', 'active', 'ya', 'yes', 'true', '1'].includes(v);
};

const findByCodeOrLabel = <T extends { id: string; kode?: string; label?: string; nama?: string }>(
  list: T[],
  value: string,
) => {
  const v = normalizeKey(value);
  if (!v) return undefined;
  return list.find(item =>
    normalizeKey(item.id) === v ||
    normalizeKey(item.kode) === v ||
    normalizeKey(item.label) === v ||
    normalizeKey(item.nama) === v
  );
};

export default function ManajemenEmployeePage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [unitOrganisasis, setUnitOrganisasis] = useState<UnitOrganisasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Aktif' | 'Non-Aktif'>('Semua');
  const [filterGender, setFilterGender] = useState<'Semua' | 'L' | 'P'>('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const importItemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterGender]);

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<EmployeeData | null>(null);
  const [form,         setForm]         = useState<FormData>(emptyForm);
  const [unitSearch,   setUnitSearch]   = useState('');
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRows, setImportRows] = useState<ImportEmployeeRow[]>([]);
  const [importPage, setImportPage] = useState(1);
  const [importLoading, setImportLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importDragging, setImportDragging] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [grades,            setGrades]            = useState<any[]>([]);
  const [statusKaryawans,   setStatusKaryawans]   = useState<any[]>([]);
  const [pendidikans,       setPendidikans]       = useState<any[]>([]);
  const [statusPernikahans, setStatusPernikahans] = useState<any[]>([]);
  const [agamas,            setAgamas]            = useState<any[]>([]);
  const [photoFile,         setPhotoFile]         = useState<File | null>(null);
  const [errors,            setErrors]            = useState<Record<string, string>>({});

  const getUnitPathStr = useCallback((unitId: string) => {
    let curr = unitOrganisasis.find(u => u.id === unitId);
    const path: string[] = [];
    while (curr) {
      path.unshift(curr.nama);
      const pId = curr.parentId;
      curr = pId ? unitOrganisasis.find(u => u.id === pId) : undefined;
    }
    return path.join(' > ');
  }, [unitOrganisasis]);

  const filteredUnits = useMemo(() => {
    const q = unitSearch.toLowerCase();
    return unitOrganisasis.filter(u => {
      const matchSearch = u.nama.toLowerCase().includes(q) || u.kode.toLowerCase().includes(q);
      const isSelected = form.unitPath[form.unitPath.length - 1] === u.id;
      return matchSearch && (u.isActive || isSelected);
    });
  }, [unitOrganisasis, unitSearch, form.unitPath]);

  const selectedGradeLevel = useMemo(() => {
    const selectedGrade = grades.find(g => g.id === form.gradeId);
    return selectedGrade ? selectedGrade.level : 0;
  }, [form.gradeId, grades]);

  const potentialAtasans = useMemo(() => {
    if (!form.gradeId) return [];
    return employees.filter(emp => {
      if (editTarget && emp.id === editTarget.id) return false;
      const empGrade = grades.find(g => g.id === emp.gradeId);
      return empGrade && empGrade.level > selectedGradeLevel;
    });
  }, [form.gradeId, employees, grades, editTarget, selectedGradeLevel]);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeData | null>(null);
  const [toast,        setToast]        = useState<{ type:'ok'|'err'; text:string } | null>(null);

  const showToast = (type: 'ok'|'err', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 3200); };

  // ─── Fetch Data ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [empRes, orgRes, gradeRes, statusRes, eduRes, marRes, agamaRes] = await Promise.all([
        api.get<ApiEmployee[]>('/employees?limit=200'),
        api.get<UnitOrganisasi[]>('/org/unit?limit=200'),
        api.get<any[]>('/master/grade'),
        api.get<any[]>('/master/status-karyawan'),
        api.get<any[]>('/master/pendidikan'),
        api.get<any[]>('/master/status-pernikahan'),
        api.get<any[]>('/master/agama'),
      ]);

      const orgMap = new Map<string, string>();
      (orgRes.data || []).forEach(o => orgMap.set(o.id, o.nama));
      setUnitOrganisasis(orgRes.data || []);
      setGrades(gradeRes.data || []);
      setStatusKaryawans(statusRes.data || []);
      setPendidikans(eduRes.data || []);
      setStatusPernikahans(marRes.data || []);
      setAgamas(agamaRes.data || []);

      const mapped: EmployeeData[] = (empRes.data || []).map(e => ({
        id: e.id,
        nrk: e.nrk,
        nik: e.nik,
        nama: e.nama,
        jenisKelamin: e.jenisKelamin,
        jabatan: e.jabatan,
        unitOrganisasiId: e.unitOrganisasiId || '',
        unitOrganisasiNama: e.unitOrganisasiId ? (orgMap.get(e.unitOrganisasiId) || '-') : '-',
        tanggalMasuk: e.tanggalMasuk || '',
        tempatLahir: e.tempatLahir || '',
        tanggalLahir: e.tanggalLahir || '',
        nomorHp: e.nomorHp || '',
        alamat: e.alamat || '',
        isActive: e.isActive,
        createdAt: e.createdAt ? e.createdAt.slice(0, 10) : '-',
        gradeId: e.gradeId || '',
        statusKaryawanId: e.statusKaryawanId || '',
        pendidikanTerakhirId: e.pendidikanTerakhirId || '',
        statusPernikahanId: e.statusPernikahanId || '',
        fotoProfil: e.fotoProfil || '',
        atasanId: e.atasanId || '',
        agama: e.agama || '',
      }));

      setEmployees(mapped);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return employees.filter(e => {
      const q = search.toLowerCase();
      const matchSearch = e.nama.toLowerCase().includes(q) || e.nrk.toLowerCase().includes(q) || e.nik.includes(q) || e.jabatan.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'Semua' || (filterStatus === 'Aktif' ? e.isActive : !e.isActive);
      const matchGender = filterGender === 'Semua' || e.jenisKelamin === filterGender;
      return matchSearch && matchStatus && matchGender;
    });
  }, [employees, search, filterStatus, filterGender]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetImportState = useCallback(() => {
    setImportFile(null);
    setImportRows([]);
    setImportPage(1);
    setImportLoading(false);
    setImporting(false);
    setImportDragging(false);
    setImportError(null);
  }, []);

  const openImportModal = useCallback(() => {
    resetImportState();
    setImportModalOpen(true);
  }, [resetImportState]);

  const closeImportModal = useCallback(() => {
    if (importLoading || importing) return;
    setImportModalOpen(false);
  }, [importLoading, importing]);

  const parseImportFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['xlsx', 'xls'].includes(ext)) {
      setImportError('File harus berformat .xlsx atau .xls.');
      return;
    }

    setImportFile(file);
    setImportLoading(true);
    setImportError(null);
    setImportRows([]);
    setImportPage(1);

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error('Workbook tidak memiliki sheet.');

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheetName], {
        defval: '',
        raw: false,
      });

      if (!rawRows.length) {
        setImportError('Sheet pertama kosong. Isi data employee terlebih dahulu.');
        return;
      }

      const rowIdentifiers = rawRows.map(row => ({
        nrk: normalizeKey(getCellValue(row, ['NRK'])),
        nik: normalizeKey(getCellValue(row, ['NIK'])),
      }));
      const nrkCounts = new Map<string, number>();
      const nikCounts = new Map<string, number>();
      rowIdentifiers.forEach(({ nrk, nik }) => {
        if (nrk) nrkCounts.set(nrk, (nrkCounts.get(nrk) || 0) + 1);
        if (nik) nikCounts.set(nik, (nikCounts.get(nik) || 0) + 1);
      });

      const existingNrks = new Set(employees.map(e => normalizeKey(e.nrk)));
      const existingNiks = new Set(employees.map(e => normalizeKey(e.nik)));

      const mappedRows: ImportEmployeeRow[] = rawRows.map((row, index) => {
        const errors: string[] = [];
        const nrk = getCellValue(row, ['NRK']);
        const nik = getCellValue(row, ['NIK']);
        const nama = getCellValue(row, ['Nama', 'Nama Lengkap']);
        const genderInput = getCellValue(row, ['Jenis Kelamin', 'Gender']);
        const jenisKelamin = parseGender(genderInput);
        const jabatan = getCellValue(row, ['Jabatan']);
        const unitInput = getCellValue(row, ['Kode Unit', 'Unit Organisasi', 'Unit Kerja']);
        const tanggalMasuk = parseExcelDate(getCellValue(row, ['Tanggal Masuk', 'Tanggal Masuk Kerja']));
        const tempatLahir = getCellValue(row, ['Tempat Lahir']);
        const tanggalLahir = parseExcelDate(getCellValue(row, ['Tanggal Lahir']));
        const gradeInput = getCellValue(row, ['Kode Grade', 'Grade', 'Grade / Golongan']);
        const statusKaryawanInput = getCellValue(row, ['Status Karyawan']);
        const pendidikanInput = getCellValue(row, ['Pendidikan Terakhir', 'Pendidikan']);
        const statusPernikahanInput = getCellValue(row, ['Status Pernikahan']);
        const agamaInput = getCellValue(row, ['Agama']);
        const nomorHp = getCellValue(row, ['Nomor HP', 'No HP', 'No. HP', 'HP']);
        const alamat = getCellValue(row, ['Alamat', 'Alamat Domisili']);
        const activeInput = getCellValue(row, ['Status Aktif', 'Status']);
        const atasanInput = getCellValue(row, ['Atasan NRK', 'NRK Atasan', 'Atasan']);

        const unit = findByCodeOrLabel(unitOrganisasis, unitInput);
        const grade = findByCodeOrLabel(grades, gradeInput);
        const statusKaryawan = findByCodeOrLabel(statusKaryawans, statusKaryawanInput);
        const pendidikan = findByCodeOrLabel(pendidikans, pendidikanInput);
        const statusPernikahan = findByCodeOrLabel(statusPernikahans, statusPernikahanInput);
        const agama = findByCodeOrLabel(agamas, agamaInput);
        const atasan = atasanInput
          ? employees.find(emp =>
              normalizeKey(emp.nrk) === normalizeKey(atasanInput) ||
              normalizeKey(emp.nik) === normalizeKey(atasanInput) ||
              normalizeKey(emp.nama) === normalizeKey(atasanInput)
            )
          : undefined;

        if (!nrk) errors.push('NRK wajib diisi.');
        if (!nik) errors.push('NIK wajib diisi.');
        if (nik && !/^\d{16}$/.test(nik)) errors.push('NIK harus 16 digit.');
        if (!nama) errors.push('Nama wajib diisi.');
        if (!jenisKelamin) errors.push('Jenis kelamin harus L/P atau Laki-laki/Perempuan.');
        if (!jabatan) errors.push('Jabatan wajib diisi.');
        if (!unitInput || !unit) errors.push('Kode/nama unit tidak ditemukan.');
        if (!tanggalMasuk) errors.push('Tanggal masuk wajib format YYYY-MM-DD atau DD/MM/YYYY.');
        if (!tempatLahir) errors.push('Tempat lahir wajib diisi.');
        if (!tanggalLahir) errors.push('Tanggal lahir wajib format YYYY-MM-DD atau DD/MM/YYYY.');
        if (!gradeInput || !grade) errors.push('Grade tidak ditemukan.');
        if (!statusKaryawanInput || !statusKaryawan) errors.push('Status karyawan tidak ditemukan.');
        if (!pendidikanInput || !pendidikan) errors.push('Pendidikan terakhir tidak ditemukan.');
        if (!statusPernikahanInput || !statusPernikahan) errors.push('Status pernikahan tidak ditemukan.');
        if (!agamaInput) errors.push('Agama wajib diisi.');
        if (!nomorHp) errors.push('Nomor HP wajib diisi.');
        if (!alamat) errors.push('Alamat wajib diisi.');
        if (atasanInput && !atasan) errors.push('Atasan tidak ditemukan di data employee saat ini.');
        if (nrk && existingNrks.has(normalizeKey(nrk))) errors.push('NRK sudah ada di sistem.');
        if (nik && existingNiks.has(normalizeKey(nik))) errors.push('NIK sudah ada di sistem.');
        if (nrk && (nrkCounts.get(normalizeKey(nrk)) || 0) > 1) errors.push('NRK duplikat di file.');
        if (nik && (nikCounts.get(normalizeKey(nik)) || 0) > 1) errors.push('NIK duplikat di file.');

        const payload: EmployeeImportPayload = {
          nrk,
          nik,
          nama,
          jenisKelamin: jenisKelamin || 'L',
          jabatan,
          gradeId: grade?.id || '',
          atasanId: atasan?.id || null,
          unitOrganisasiId: unit?.id || '',
          tanggalMasuk,
          tempatLahir,
          tanggalLahir,
          statusKaryawanId: statusKaryawan?.id || '',
          pendidikanTerakhirId: pendidikan?.id || '',
          statusPernikahanId: statusPernikahan?.id || '',
          nomorHp,
          alamat,
          agama: agama?.label || agamaInput,
          isActive: parseActive(activeInput),
        };

        return {
          rowNumber: index + 2,
          selected: errors.length === 0,
          status: errors.length ? 'invalid' : 'valid',
          errors,
          payload,
          preview: {
            nrk,
            nik,
            nama,
            jabatan,
            unit: unit?.nama || unitInput || '-',
            grade: grade ? `${grade.kode} - ${grade.label}` : gradeInput || '-',
            status: parseActive(activeInput) ? 'Aktif' : 'Non-Aktif',
          },
        };
      });

      setImportRows(mappedRows);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Gagal membaca file Excel.');
    } finally {
      setImportLoading(false);
    }
  }, [agamas, employees, grades, pendidikans, statusKaryawans, statusPernikahans, unitOrganisasis]);

  const toggleImportRow = useCallback((rowNumber: number) => {
    setImportRows(rows => rows.map(row =>
      row.rowNumber === rowNumber && row.status === 'valid'
        ? { ...row, selected: !row.selected }
        : row
    ));
  }, []);

  const toggleSelectAllImportRows = useCallback(() => {
    setImportRows(rows => {
      const validRows = rows.filter(row => row.status === 'valid');
      const shouldSelect = validRows.some(row => !row.selected);
      return rows.map(row => row.status === 'valid' ? { ...row, selected: shouldSelect } : row);
    });
  }, []);

  const handleImportSelected = useCallback(async () => {
    const rowsToImport = importRows.filter(row => row.selected && row.status === 'valid');
    if (!rowsToImport.length) {
      showToast('err', 'Pilih minimal satu data valid untuk diimport.');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failedCount = 0;

    for (const row of rowsToImport) {
      try {
        await api.post('/employees', row.payload);
        successCount += 1;
        setImportRows(prev => prev.map(item =>
          item.rowNumber === row.rowNumber
            ? { ...item, selected: false, status: 'imported', errors: [] }
            : item
        ));
      } catch (err) {
        failedCount += 1;
        const message = err instanceof Error ? err.message : 'Gagal import baris ini.';
        setImportRows(prev => prev.map(item =>
          item.rowNumber === row.rowNumber
            ? { ...item, status: 'failed', errors: [message] }
            : item
        ));
      }
    }

    setImporting(false);
    setLoading(true);
    await fetchData();

    if (failedCount === 0) {
      showToast('ok', `${successCount} employee berhasil diimport.`);
      setImportModalOpen(false);
    } else {
      showToast('err', `${successCount} berhasil, ${failedCount} gagal. Cek catatan di preview.`);
    }
  }, [fetchData, importRows]);

  const downloadTemplate = useCallback(async () => {
    const XLSX = await import('xlsx');
    const sampleUnit = unitOrganisasis[0];
    const sampleGrade = grades[0];
    const sampleStatus = statusKaryawans[0];
    const samplePendidikan = pendidikans[0];
    const samplePernikahan = statusPernikahans[0];
    const sampleAgama = agamas[0];

    const templateRows = [
      {
        NRK: 'NRK-0001',
        NIK: '3201234567890001',
        Nama: 'Budi Santoso',
        'Jenis Kelamin': 'L',
        Jabatan: 'Staff Operasional',
        'Kode Unit': sampleUnit?.kode || 'KODE_UNIT',
        'Tanggal Masuk': '2026-01-15',
        'Tempat Lahir': 'Jakarta',
        'Tanggal Lahir': '1998-05-20',
        'Kode Grade': sampleGrade?.kode || 'G1',
        'Status Karyawan': sampleStatus?.kode || sampleStatus?.label || 'TETAP',
        'Pendidikan Terakhir': samplePendidikan?.kode || samplePendidikan?.label || 'S1',
        'Status Pernikahan': samplePernikahan?.kode || samplePernikahan?.label || 'BELUM_MENIKAH',
        Agama: sampleAgama?.label || 'Islam',
        'Nomor HP': '081234567890',
        Alamat: 'Alamat lengkap karyawan',
        'Status Aktif': 'Aktif',
        'Atasan NRK': '',
      },
    ];

    const referenceRows = [
      ...unitOrganisasis.map(item => ({ Tipe: 'Unit Organisasi', Kode: item.kode, Label: item.nama })),
      ...grades.map(item => ({ Tipe: 'Grade', Kode: item.kode, Label: item.label })),
      ...statusKaryawans.map(item => ({ Tipe: 'Status Karyawan', Kode: item.kode, Label: item.label })),
      ...pendidikans.map(item => ({ Tipe: 'Pendidikan', Kode: item.kode, Label: item.label })),
      ...statusPernikahans.map(item => ({ Tipe: 'Status Pernikahan', Kode: item.kode, Label: item.label })),
      ...agamas.map(item => ({ Tipe: 'Agama', Kode: item.kode, Label: item.label })),
      ...employees.map(item => ({ Tipe: 'Atasan', Kode: item.nrk, Label: item.nama })),
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(templateRows, { header: IMPORT_HEADERS }), 'Template Employee');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(referenceRows), 'Referensi');
    XLSX.writeFile(workbook, 'template-import-employee.xlsx');
  }, [agamas, employees, grades, pendidikans, statusKaryawans, statusPernikahans, unitOrganisasis]);

  const exportEmployees = useCallback(async () => {
    if (!filtered.length) {
      showToast('err', 'Tidak ada data employee untuk diexport.');
      return;
    }

    const XLSX = await import('xlsx');
    const rows = filtered.map(emp => ({
      NRK: emp.nrk,
      NIK: emp.nik,
      Nama: emp.nama,
      'Jenis Kelamin': emp.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      Jabatan: emp.jabatan,
      'Unit Organisasi': emp.unitOrganisasiNama,
      'Tanggal Masuk': emp.tanggalMasuk,
      'Tempat Lahir': emp.tempatLahir,
      'Tanggal Lahir': emp.tanggalLahir,
      Grade: grades.find(g => g.id === emp.gradeId)?.label || '',
      'Status Karyawan': statusKaryawans.find(s => s.id === emp.statusKaryawanId)?.label || '',
      'Pendidikan Terakhir': pendidikans.find(p => p.id === emp.pendidikanTerakhirId)?.label || '',
      'Status Pernikahan': statusPernikahans.find(s => s.id === emp.statusPernikahanId)?.label || '',
      Agama: emp.agama,
      'Nomor HP': emp.nomorHp,
      Alamat: emp.alamat,
      Status: emp.isActive ? 'Aktif' : 'Non-Aktif',
      'Atasan NRK': employees.find(e => e.id === emp.atasanId)?.nrk || '',
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Employees');
    XLSX.writeFile(workbook, `employee-${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('ok', `${filtered.length} data employee diexport.`);
  }, [employees, filtered, grades, pendidikans, statusKaryawans, statusPernikahans]);

  const importTotalPages = Math.max(1, Math.ceil(importRows.length / importItemsPerPage));
  const paginatedImportRows = importRows.slice((importPage - 1) * importItemsPerPage, importPage * importItemsPerPage);
  const validImportCount = importRows.filter(row => row.status === 'valid').length;
  const selectedImportCount = importRows.filter(row => row.selected && row.status === 'valid').length;
  const invalidImportCount = importRows.filter(row => row.status === 'invalid' || row.status === 'failed').length;
  const importedCount = importRows.filter(row => row.status === 'imported').length;
  const allValidSelected = validImportCount > 0 && selectedImportCount === validImportCount;

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setForm(emptyForm);
    setUnitSearch('');
    setUnitDropdownOpen(false);
    setPhotoFile(null);
    setErrors({});
    setModalOpen(true);
  }, []);

  const openEdit   = useCallback((e: EmployeeData) => {
    setEditTarget(e);

    let unitPath: string[] = [];
    if (e.unitOrganisasiId) {
      let path: string[] = [];
      let curr = unitOrganisasis.find(u => u.id === e.unitOrganisasiId);
      while (curr) {
        path.push(curr.id);
        const pId = curr.parentId;
        curr = pId ? unitOrganisasis.find(u => u.id === pId) : undefined;
      }
      unitPath = path.reverse();
    }

    setForm({
      nrk: e.nrk,
      nik: e.nik,
      nama: e.nama,
      jenisKelamin: e.jenisKelamin,
      jabatan: e.jabatan,
      tanggalMasuk: e.tanggalMasuk,
      tempatLahir: e.tempatLahir,
      tanggalLahir: e.tanggalLahir,
      nomorHp: e.nomorHp,
      alamat: e.alamat,
      isActive: e.isActive,
      unitPath,
      gradeId: e.gradeId,
      statusKaryawanId: e.statusKaryawanId,
      pendidikanTerakhirId: e.pendidikanTerakhirId,
      statusPernikahanId: e.statusPernikahanId,
      atasanId: e.atasanId || '',
      agama: e.agama || '',
    });
    setUnitSearch('');
    setUnitDropdownOpen(false);
    setPhotoFile(null);
    setErrors({});
    setModalOpen(true);
  }, [unitOrganisasis]);

  // ─── Save (Create/Update) ──────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setErrors({});

    setSaving(true);
    try {
      const unitId = form.unitPath[form.unitPath.length - 1] || null;
      const payload = {
        nrk: form.nrk,
        nik: form.nik,
        nama: form.nama,
        jenisKelamin: form.jenisKelamin,
        jabatan: form.jabatan,
        unitOrganisasiId: unitId,
        tanggalMasuk: form.tanggalMasuk || null,
        tempatLahir: form.tempatLahir || null,
        tanggalLahir: form.tanggalLahir || null,
        nomorHp: form.nomorHp || null,
        alamat: form.alamat || null,
        isActive: form.isActive,
        gradeId: form.gradeId || null,
        statusKaryawanId: form.statusKaryawanId || null,
        pendidikanTerakhirId: form.pendidikanTerakhirId || null,
        statusPernikahanId: form.statusPernikahanId || null,
        atasanId: form.atasanId || null,
        agama: form.agama || null,
      };

      let employeeId = '';
      if (editTarget) {
        await api.put(`/employees/${editTarget.id}`, payload);
        employeeId = editTarget.id;
        showToast('ok', `"${form.nama}" berhasil diperbarui.`);
      } else {
        const res = await api.post<any>('/employees', payload);
        employeeId = res.data.id;
        showToast('ok', `"${form.nama}" berhasil ditambahkan.`);
      }

      // Photo upload if selected
      if (photoFile && employeeId) {
        const fd = new FormData();
        fd.append('foto', photoFile);
        const token = getAccessToken();
        const uploadRes = await fetch(`/api/employees/${employeeId}/photo`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: fd,
        });
        if (!uploadRes.ok) {
          throw new Error('Gagal mengunggah foto profil.');
        }
      }

      setModalOpen(false);
      setLoading(true);
      await fetchData();
    } catch (err: any) {
      if (err instanceof ApiRequestError) {
        if (err.details && Array.isArray(err.details)) {
          const apiErrors: Record<string, string> = {};
          err.details.forEach((d: any) => {
            const fieldName = d.field === 'unitOrganisasiId' ? 'unitPath' : d.field;
            apiErrors[fieldName] = d.message;
          });
          setErrors(apiErrors);
          showToast('err', err.message || 'Validasi gagal.');
        } else {
          // General API error (like "NIK sudah terdaftar" or "NRK sudah terdaftar")
          const msg = err.message || 'Gagal menyimpan.';
          const newErrors: Record<string, string> = {};
          if (msg.toLowerCase().includes('nrk')) {
            newErrors.nrk = msg;
          } else if (msg.toLowerCase().includes('nik')) {
            newErrors.nik = msg;
          }
          setErrors(newErrors);
          showToast('err', msg);
        }
      } else {
        showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan.');
      }
    } finally {
      setSaving(false);
    }
  }, [form, editTarget, photoFile, fetchData]);

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/employees/${deleteTarget.id}`);
      showToast('ok', `"${deleteTarget.nama}" dihapus.`);
      setDeleteTarget(null);
      setLoading(true);
      await fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchData]);

  // ─── Toggle Status ─────────────────────────────────────────────────────────
  const toggleStatus = useCallback(async (e: EmployeeData) => {
    try {
      await api.put(`/employees/${e.id}`, { isActive: !e.isActive });
      showToast('ok', `Status "${e.nama}" diperbarui.`);
      await fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memperbarui status.');
    }
  }, [fetchData]);

  const fmtDate = (s: string) => {
    if (!s || s === '-') return '-';
    try { return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return s; }
  };

  const activeCount   = employees.filter(e => e.isActive).length;
  const inactiveCount = employees.filter(e => !e.isActive).length;
  const maleCount     = employees.filter(e => e.jenisKelamin === 'L').length;
  const femaleCount   = employees.filter(e => e.jenisKelamin === 'P').length;

  return (
    <div className="space-y-6">

      {/* Toast */}
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Manajemen Employee
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Kelola data karyawan PT Industri Nabati Lestari.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openImportModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <FileUp className="h-4 w-4" />
            Import Excel
          </button>
          <button
            type="button"
            onClick={exportEmployees}
            disabled={loading || filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-650 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.06] cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400/20"
          >
            <FileDown className="h-4 w-4" />
            Export Excel
          </button>
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Employee
          </PrimaryButton>
        </div>
      </div>

      {/* Stats — flat inline */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {[
          { label: 'Total',    value: employees.length, icon: Users,     color: 'text-amber-600 dark:text-amber-400'    },
          { label: 'Aktif',    value: activeCount,      icon: UserCheck, color: 'text-emerald-650 dark:text-emerald-450' },
          { label: 'Non-Aktif',value: inactiveCount,    icon: UserX,     color: 'text-rose-650 dark:text-rose-455'      },
          { label: 'Laki-laki',value: maleCount,        icon: Users,     color: 'text-blue-650 dark:text-blue-400'      },
          { label: 'Perempuan',value: femaleCount,       icon: Users,     color: 'text-pink-650 dark:text-pink-400'      },
        ].map((s, i, arr) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={s.label}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                <span className="text-sm font-bold text-slate-850 dark:text-white">{s.value}</span>
                <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">{s.label}</span>
              </div>
              {i < arr.length - 1 && <span className="h-4 w-px bg-slate-200 dark:bg-slate-850 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] shadow-lg">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between flex-wrap">
          <SearchInput
            placeholder="Cari nama, NRK, NIK, jabatan..."
            value={search}
            onChange={setSearch}
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown<'Semua' | 'Aktif' | 'Non-Aktif'>
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { label: 'Semua Status', value: 'Semua' },
                { label: 'Aktif', value: 'Aktif' },
                { label: 'Non-Aktif', value: 'Non-Aktif' },
              ]}
            />
            <div className="h-3.5 w-px bg-slate-200 dark:bg-white/[0.08]" />
            <FilterDropdown<'Semua' | 'L' | 'P'>
              value={filterGender}
              onChange={setFilterGender}
              options={[
                { label: 'Semua Gender', value: 'Semua' },
                { label: 'Laki-laki', value: 'L' },
                { label: 'Perempuan', value: 'P' },
              ]}
            />
          </div>
        </div>

        {/* Table */}
        <CrudTable<EmployeeData>
          headers={['Employee', 'NIK', 'Jabatan / Unit', 'Jenis Kelamin', 'Status', 'Tgl Masuk', 'Aksi']}
          loading={loading}
          loadingText="Memuat data employee..."
          emptyText="Tidak ada employee yang sesuai."
          data={paginatedData}
          renderRow={(e) => (
            <tr key={e.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150">
              {/* Employee */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {e.fotoProfil ? (
                    <img 
                      src={e.fotoProfil.startsWith('http') ? e.fotoProfil : `/uploads/${e.fotoProfil}`} 
                      alt={e.nama} 
                      className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm border border-slate-100 dark:border-white/[0.08]" 
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/85 text-slate-400 dark:text-slate-500 border border-slate-205/50 dark:border-white/[0.04] shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{e.nama}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <IdCard className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{e.nrk}</p>
                    </div>
                  </div>
                </div>
              </td>
              {/* NIK */}
              <td className="px-5 py-3.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{e.nik}</p>
              </td>
              {/* Jabatan / Unit */}
              <td className="px-5 py-3.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{e.jabatan}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{e.unitOrganisasiNama}</p>
                </div>
              </td>
              {/* Jenis Kelamin */}
              <td className="px-5 py-3.5">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${GENDER_BADGE[e.jenisKelamin]}`}>
                  {e.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </td>
              {/* Status */}
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${STATUS_BADGE[String(e.isActive)]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[String(e.isActive)]}`} />
                  {e.isActive ? 'Aktif' : 'Non-Aktif'}
                </span>
              </td>
              {/* Tgl Masuk */}
              <td className="px-5 py-3.5 text-xs font-bold text-slate-550 dark:text-slate-500">{fmtDate(e.tanggalMasuk)}</td>
              {/* Actions */}
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  {e.isActive ? (
                    <button title="Non-Aktifkan" onClick={() => toggleStatus(e)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer focus:outline-none">
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button title="Aktifkan" onClick={() => toggleStatus(e)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all cursor-pointer focus:outline-none">
                      <UserCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <TableActions
                    onEdit={() => openEdit(e)}
                    onDelete={() => setDeleteTarget(e)}
                  />
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
      </div>

      {/* Import Excel Modal */}
      <ModalPortal open={importModalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={closeImportModal} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="flex flex-col gap-3 border-b border-slate-150 px-5 py-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Import Employee dari Excel</h2>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-450 dark:text-slate-500">Upload file, cek preview, pilih data, lalu import.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    disabled={importLoading || importing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15 cursor-pointer focus:outline-none"
                  >
                    Download Template Data
                  </button>
                  <button
                    type="button"
                    onClick={closeImportModal}
                    disabled={importLoading || importing}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-slate-300 cursor-pointer focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[72vh] space-y-4 overflow-y-auto px-5 py-5 hide-scrollbar">
                <FileUpload05
                  value={importFile}
                  onChange={(file) => {
                    if (file) void parseImportFile(file);
                  }}
                  onRemove={resetImportState}
                  loading={importLoading}
                  disabled={importing}
                  error={importError}
                />

                {importRows.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.06]">
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-white/[0.04] dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">{importRows.length} baris terbaca</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{validImportCount} valid</span>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{invalidImportCount} perlu dicek</span>
                        {importedCount > 0 && <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{importedCount} sudah diimport</span>}
                      </div>
                      <button
                        type="button"
                        onClick={toggleSelectAllImportRows}
                        disabled={validImportCount === 0 || importing}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-650 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.04] cursor-pointer focus:outline-none"
                      >
                        <span className={`flex h-4 w-4 items-center justify-center rounded border ${
                          allValidSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {allValidSelected && <CheckCircle2 className="h-3 w-3" />}
                        </span>
                        {allValidSelected ? 'Batalkan Semua' : 'Select All Data Valid'}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-150 bg-white dark:border-white/[0.04] dark:bg-[#0d1218]">
                            <th className="w-12 px-4 py-3 text-left">
                              <span className="sr-only">Pilih</span>
                            </th>
                            {['Baris', 'Employee', 'NIK', 'Jabatan / Unit', 'Grade', 'Status', 'Catatan'].map(header => (
                              <th key={header} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                          {paginatedImportRows.map(row => {
                            const canSelect = row.status === 'valid';
                            return (
                              <tr key={row.rowNumber} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                                <td className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleImportRow(row.rowNumber)}
                                    disabled={!canSelect || importing}
                                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                                      row.selected
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : 'border-slate-300 bg-white text-transparent dark:border-slate-700 dark:bg-slate-950'
                                    }`}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-xs font-black text-slate-650 dark:text-slate-300">{row.rowNumber}</td>
                                <td className="px-4 py-3">
                                  <p className="text-xs font-black text-slate-800 dark:text-slate-100">{row.preview.nama || '-'}</p>
                                  <p className="mt-0.5 font-mono text-[11px] font-semibold text-slate-400 dark:text-slate-500">{row.preview.nrk || '-'}</p>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-650 dark:text-slate-300">{row.preview.nik || '-'}</td>
                                <td className="px-4 py-3">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.preview.jabatan || '-'}</p>
                                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">{row.preview.unit}</p>
                                </td>
                                <td className="px-4 py-3 text-xs font-bold text-slate-650 dark:text-slate-300">{row.preview.grade}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                                    row.status === 'valid'
                                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : row.status === 'imported'
                                        ? 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {row.status === 'valid' ? 'Siap' : row.status === 'imported' ? 'Imported' : row.status === 'failed' ? 'Gagal' : 'Invalid'}
                                  </span>
                                </td>
                                <td className="max-w-xs px-4 py-3">
                                  {row.errors.length > 0 ? (
                                    <p className="text-[11px] font-semibold leading-relaxed text-rose-600 dark:text-rose-400">{row.errors.join(' ')}</p>
                                  ) : (
                                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{row.preview.status}</p>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <CrudPagination
                      currentPage={importPage}
                      totalPages={importTotalPages}
                      onPageChange={setImportPage}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-150 px-5 py-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-slate-450 dark:text-slate-500">
                  {selectedImportCount > 0 ? `${selectedImportCount} data valid dipilih untuk import.` : 'Pilih data valid dari preview sebelum import.'}
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeImportModal}
                    disabled={importLoading || importing}
                    className="rounded-xl border border-slate-250 px-4 py-2 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 dark:border-white/[0.08] dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-200 cursor-pointer focus:outline-none"
                  >
                    Batal
                  </button>
                   <PrimaryButton onClick={handleImportSelected} disabled={importLoading || importing || selectedImportCount === 0} className="flex items-center gap-2">
                    {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Import Data
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Create/Edit Modal via Portal */}
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-xl animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  {editTarget ? <Pencil className="h-4 w-4 text-indigo-500 dark:text-indigo-400"/> : <Plus className="h-4 w-4 text-indigo-500 dark:text-indigo-400"/>}
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">{editTarget ? 'Edit Data Employee' : 'Tambah Employee Baru'}</h2>
                </div>
                <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300 transition-all cursor-pointer focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto hide-scrollbar">
                {/* Nama */}
                <div>
                  <label className={labelCls}>Nama Lengkap *</label>
                  <input type="text" value={form.nama} onChange={e => setForm(f=>({...f, nama:e.target.value}))} placeholder="cth: Budi Santoso, S.T." 
                    className={`${inputCls} ${errors.nama ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                  {errors.nama && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nama}</span>}
                </div>
                {/* NRK & NIK */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>NRK *</label>
                    <input type="text" value={form.nrk} onChange={e => setForm(f=>({...f, nrk:e.target.value}))} placeholder="NRK-XXXXXX" 
                      className={`${inputCls} ${errors.nrk ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                    {errors.nrk && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nrk}</span>}
                  </div>
                  <div>
                    <label className={labelCls}>NIK (16 digit) *</label>
                    <input type="text" value={form.nik} onChange={e => setForm(f=>({...f, nik:e.target.value.replace(/\D/g, '').slice(0, 16)}))} placeholder="320123456789xxxx" maxLength={16} 
                      className={`${inputCls} ${errors.nik ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                    {errors.nik && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nik}</span>}
                  </div>
                </div>
                {/* Jenis Kelamin & Jabatan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Jenis Kelamin *</label>
                    <SearchSelect
                      searchable={false}
                      options={[
                        { value: 'L', label: 'Laki-laki' },
                        { value: 'P', label: 'Perempuan' }
                      ]}
                      value={form.jenisKelamin}
                      onChange={val => setForm(f => ({ ...f, jenisKelamin: val as JenisKelamin }))}
                      placeholder="- Pilih Gender -"
                      error={!!errors.jenisKelamin}
                    />
                    {errors.jenisKelamin && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.jenisKelamin}</span>}
                  </div>
                  <div>
                    <label className={labelCls}>Jabatan *</label>
                    <input type="text" value={form.jabatan} onChange={e => setForm(f=>({...f, jabatan:e.target.value}))} placeholder="cth: IT Specialist" 
                      className={`${inputCls} ${errors.jabatan ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                    {errors.jabatan && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.jabatan}</span>}
                  </div>
                </div>

                {/* Searchable Unit Organisasi Dropdown */}
                <div className="space-y-3 p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01]">
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-550 dark:text-slate-400 mb-1">Unit Organisasi</div>
                  
                  {/* Selected Unit Parent Path (Hierarki di Atasnya) */}
                  {form.unitPath.length > 0 && (
                    <div className="rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 p-2.5 space-y-1">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Struktur Parent (Atasan)</div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                        {form.unitPath.slice(0, -1).map((uid) => {
                          const unit = unitOrganisasis.find(u => u.id === uid);
                          return unit ? `${unit.nama} (${getLabel(unit.tipe)})` : '';
                        }).filter(Boolean).join(' ➔ ') || <span className="text-slate-450 italic text-[10px]">Unit ini adalah Level Utama (Root)</span>}
                      </div>
                    </div>
                  )}

                  {/* Dropdown Input / Trigger */}
                  <div className="relative">
                    <label className={labelCls}>Pilih Unit Kerja *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <div
                        onClick={() => setUnitDropdownOpen(o => !o)}
                        className={`${inputCls} pl-10 pr-10 cursor-pointer flex items-center justify-between min-h-[42px] ${
                          errors.unitPath ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''
                        }`}
                      >
                        {form.unitPath.length > 0 ? (
                          <span className="truncate text-slate-800 dark:text-slate-200">
                            {(() => {
                              const selectedId = form.unitPath[form.unitPath.length - 1];
                              const selectedUnit = unitOrganisasis.find(u => u.id === selectedId);
                              return selectedUnit ? `${selectedUnit.nama} (${getLabel(selectedUnit.tipe)})` : 'Pilih Unit Kerja';
                            })()}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-550">- Pilih Unit Kerja -</span>
                        )}
                        <ChevronDown className="h-4.5 w-4.5 text-slate-400 dark:text-slate-550 transition-transform duration-200" />
                      </div>
                      {errors.unitPath && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.unitPath}</span>}
                    </div>

                    {/* Popover list */}
                    {unitDropdownOpen && (
                      <>
                        {/* Overlay to close popover when clicking outside */}
                        <div className="fixed inset-0 z-45" onClick={() => setUnitDropdownOpen(false)} />
                        
                        <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0a0f1a] shadow-xl p-2 z-50 space-y-1.5">
                          {/* Search Input Box */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            <input
                              type="text"
                              value={unitSearch}
                              onChange={(e) => setUnitSearch(e.target.value)}
                              placeholder="Cari unit..."
                              className="w-full rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b12] py-1.5 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500/50 focus:bg-white dark:focus:bg-[#0a0f1a]"
                              autoFocus
                            />
                          </div>

                          {/* Options List */}
                          <style dangerouslySetInnerHTML={{ __html: `
                            .no-scrollbar::-webkit-scrollbar {
                              display: none;
                            }
                          ` }} />
                          <div 
                            className="max-h-48 overflow-y-auto space-y-0.5 pr-1 no-scrollbar"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                          >
                            {filteredUnits.length > 0 ? (
                              filteredUnits.map((u) => {
                                const isSelected = form.unitPath[form.unitPath.length - 1] === u.id;
                                return (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => {
                                      let path: string[] = [];
                                      let curr = unitOrganisasis.find(unit => unit.id === u.id);
                                      while (curr) {
                                        path.unshift(curr.id);
                                        const pId = curr.parentId;
                                        curr = pId ? unitOrganisasis.find(unit => unit.id === pId) : undefined;
                                      }
                                      setForm(f => ({ ...f, unitPath: path }));
                                      setUnitDropdownOpen(false);
                                      setUnitSearch('');
                                    }}
                                    className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150 flex flex-col gap-0.5 hover:bg-slate-100 dark:hover:bg-white/[0.03] ${
                                      isSelected
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border-l-2 border-amber-500 pl-2 rounded-l-none'
                                        : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span>{u.nama}</span>
                                      <span className="rounded bg-slate-200/50 dark:bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-semibold text-slate-555 dark:text-slate-400">
                                        {getLabel(u.tipe)}
                                      </span>
                                    </div>
                                    <div className="text-[9px] font-semibold text-slate-450 dark:text-slate-555 truncate">
                                      {getUnitPathStr(u.id)}
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="text-center py-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
                                Tidak ada unit ditemukan
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Tempat Lahir & Tanggal Lahir */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tempat Lahir *</label>
                    <input type="text" value={form.tempatLahir} onChange={e => setForm(f=>({...f, tempatLahir:e.target.value}))} placeholder="cth: Jakarta" 
                      className={`${inputCls} ${errors.tempatLahir ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                    {errors.tempatLahir && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.tempatLahir}</span>}
                  </div>
                  <div>
                    <label className={labelCls}>Tanggal Lahir *</label>
                    <CustomDatePicker
                      value={form.tanggalLahir}
                      onChange={val => setForm(f=>({...f, tanggalLahir:val}))}
                      placeholder="- Pilih Tanggal Lahir -"
                      error={!!errors.tanggalLahir}
                    />
                    {errors.tanggalLahir && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.tanggalLahir}</span>}
                  </div>
                </div>
                {/* Tanggal Masuk & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tanggal Masuk *</label>
                    <CustomDatePicker
                      value={form.tanggalMasuk}
                      onChange={val => setForm(f=>({...f, tanggalMasuk:val}))}
                      placeholder="- Pilih Tanggal Masuk -"
                      error={!!errors.tanggalMasuk}
                    />
                    {errors.tanggalMasuk && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.tanggalMasuk}</span>}
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <SearchSelect
                      searchable={false}
                      options={[
                        { value: 'true', label: 'Aktif' },
                        { value: 'false', label: 'Non-Aktif' }
                      ]}
                      value={form.isActive ? 'true' : 'false'}
                      onChange={val => setForm(f => ({ ...f, isActive: val === 'true' }))}
                      placeholder="- Pilih Status -"
                    />
                  </div>
                </div>

                {/* Grade & Status Karyawan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Grade / Golongan *</label>
                    <SearchSelect
                      searchable={true}
                      options={grades.map(g => ({ value: g.id, label: `${g.kode} - ${g.label}` }))}
                      value={form.gradeId}
                      onChange={val => setForm(f => ({ ...f, gradeId: val, atasanId: '' }))}
                      placeholder="- Pilih Grade -"
                      error={!!errors.gradeId}
                    />
                    {errors.gradeId && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.gradeId}</span>}
                  </div>
                  <div>
                    <label className={labelCls}>Status Karyawan *</label>
                    <SearchSelect
                      searchable={true}
                      options={statusKaryawans.map(s => ({ value: s.id, label: s.label }))}
                      value={form.statusKaryawanId}
                      onChange={val => setForm(f => ({ ...f, statusKaryawanId: val }))}
                      placeholder="- Pilih Status -"
                      error={!!errors.statusKaryawanId}
                    />
                    {errors.statusKaryawanId && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.statusKaryawanId}</span>}
                  </div>
                </div>

                {/* Pendidikan & Status Pernikahan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Pendidikan Terakhir *</label>
                    <SearchSelect
                      searchable={true}
                      options={pendidikans.map(p => ({ value: p.id, label: p.label }))}
                      value={form.pendidikanTerakhirId}
                      onChange={val => setForm(f => ({ ...f, pendidikanTerakhirId: val }))}
                      placeholder="- Pilih Pendidikan -"
                      error={!!errors.pendidikanTerakhirId}
                    />
                    {errors.pendidikanTerakhirId && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.pendidikanTerakhirId}</span>}
                  </div>
                  <div>
                    <label className={labelCls}>Status Pernikahan *</label>
                    <SearchSelect
                      searchable={true}
                      options={statusPernikahans.map(m => ({ value: m.id, label: m.label }))}
                      value={form.statusPernikahanId}
                      onChange={val => setForm(f => ({ ...f, statusPernikahanId: val }))}
                      placeholder="- Pilih Status -"
                      error={!!errors.statusPernikahanId}
                    />
                    {errors.statusPernikahanId && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.statusPernikahanId}</span>}
                  </div>
                </div>

                {/* Agama */}
                <div>
                  <label className={labelCls}>Agama *</label>
                  <SearchSelect
                    searchable={false}
                    options={agamas.map(a => ({ value: a.label, label: a.label }))}
                    value={form.agama}
                    onChange={val => setForm(f => ({ ...f, agama: val }))}
                    placeholder="- Pilih Agama -"
                    error={!!errors.agama}
                  />
                  {errors.agama && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.agama}</span>}
                </div>

                {/* Atasan Langsung */}
                {form.gradeId && (
                  <div className="animate-fade-in space-y-1 relative z-10">
                    <label className={labelCls}>Atasan Langsung</label>
                    <SearchSelect
                      searchable={true}
                      options={potentialAtasans.map(emp => ({
                        value: emp.id,
                        label: emp.nama,
                        subLabel: `${emp.jabatan} (Grade: ${grades.find(g => g.id === emp.gradeId)?.kode || '-'})`,
                      }))}
                      value={form.atasanId}
                      onChange={val => setForm(f => ({ ...f, atasanId: val }))}
                      placeholder="- Pilih Atasan -"
                      emptyText="Tidak ada karyawan dengan grade lebih tinggi"
                    />
                  </div>
                )}

                {/* Foto Profil Upload */}
                {/* <div className="space-y-2">
                  <label className={labelCls}>Foto Profil</label>
                  <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01]">
                    <div className="shrink-0">
                      {photoFile ? (
                        <img
                          src={URL.createObjectURL(photoFile)}
                          alt="Preview"
                          className="h-14 w-14 rounded-xl object-cover border-2 border-amber-500"
                        />
                      ) : editTarget && editTarget.fotoProfil ? (
                        <img
                          src={editTarget.fotoProfil.startsWith('http') ? editTarget.fotoProfil : `/uploads/${editTarget.fotoProfil}`}
                          alt="Current"
                          className="h-14 w-14 rounded-xl object-cover border border-slate-200 dark:border-white/[0.08]"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xl">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setPhotoFile(file);
                        }}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-600 dark:file:text-amber-400 hover:file:bg-amber-500/20 cursor-pointer"
                      />
                      <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Format: JPG, PNG, GIF. Max 2MB.</p>
                    </div>
                  </div>
                </div> */}

                {/* Nomor HP */}
                <div>
                  <label className={labelCls}>Nomor HP *</label>
                  <div className="relative z-0">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input type="tel" value={form.nomorHp} onChange={e => setForm(f=>({...f, nomorHp:e.target.value}))} placeholder="08xx-xxxx-xxxx" 
                      className={`${inputCls} pl-10 ${errors.nomorHp ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                  </div>
                  {errors.nomorHp && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nomorHp}</span>}
                </div>

                {/* Alamat */}
                <div>
                  <label className={labelCls}>Alamat *</label>
                  <div className="relative z-0">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <textarea value={form.alamat} onChange={e => setForm(f=>({...f, alamat:e.target.value}))} placeholder="Alamat lengkap..." rows={4}
                      className={`${inputCls} pl-10 resize-none ${errors.alamat ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                  </div>
                  {errors.alamat && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.alamat}</span>}
                </div>

                 {/* Foto Profil Upload */}
                <div className="space-y-2">
                  <label className={labelCls}>Foto Profil</label>
                  <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01]">
                    <div className="shrink-0">
                      {photoFile ? (
                        <img
                          src={URL.createObjectURL(photoFile)}
                          alt="Preview"
                          className="h-14 w-14 rounded-xl object-cover border-2 border-amber-500"
                        />
                      ) : editTarget && editTarget.fotoProfil ? (
                        <img
                          src={editTarget.fotoProfil.startsWith('http') ? editTarget.fotoProfil : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${editTarget.fotoProfil}`}
                          alt="Current"
                          className="h-14 w-14 rounded-xl object-cover border border-slate-200 dark:border-white/[0.08]"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xl">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setPhotoFile(file);
                        }}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-600 dark:file:text-amber-400 hover:file:bg-amber-500/20 cursor-pointer"
                      />
                      <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Format: JPG, PNG, GIF. Max 2MB.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">Batal</button>
                <PrimaryButton onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editTarget ? 'Simpan Perubahan' : 'Tambahkan'}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Delete Modal via Portal */}
      <ModalPortal open={!!deleteTarget}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-rose-500 dark:text-rose-400" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Hapus Employee?</h3>
              <p className="mt-2 text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
                Data karyawan <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{deleteTarget?.nama}&quot;</span> akan dihapus permanen dari sistem.
              </p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-sm font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">Batal</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:outline-none shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                  Hapus Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

    </div>
  );
}
