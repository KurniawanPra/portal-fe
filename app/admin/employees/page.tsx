'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Users, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle,
  Phone, MapPin, Briefcase, Building2, UserCheck, UserX,
  IdCard, Loader2, ChevronDown, User, FileSpreadsheet, FileUp, FileDown, Download,
  UserPlus, UserCog, SlidersHorizontal, Calendar, KeyRound
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomDateRangePicker } from '@/components/ui/CustomDateRangePicker';
import { api, ApiRequestError } from '@/lib/api';
import FileUpload05 from '@/components/ui/file-upload-1';
import { PrimaryButton, FilterDropdown, CrudPagination, Toast, SearchInput, CrudTable, TableActions } from '@/admin/master/components/shared';
import { cn, resolveImageUrl } from '@/lib/utils';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerReveal';

// ─── Types ───────────────────────────────────────────────────────────────────
type JenisKelamin = 'L' | 'P';

interface ApiEmployee {
  id: string;
  nrk: string;
  nik: string | null;
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
  penempatanAreaId: string | null;
  agama: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined user fields
  userId?: string | null;
  userEmail?: string | null;
  userRole?: 'super_admin' | 'user' | null;
  userIsActive?: boolean | null;
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
  statusPernikahanKode: string;
  penempatanAreaId: string;
  penempatanAreaNama: string;
  fotoProfil: string;
  atasanId: string;
  agama: string;
  // Joined user fields
  userId: string | null;
  userEmail: string | null;
  userRole: 'super_admin' | 'user' | null;
  userIsActive: boolean | null;
}

// Color palettes
const STATUS_BADGE = {
  true: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20',
  false: 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20',
} as Record<string, string>;

const STATUS_DOT = {
  true: 'bg-emerald-500 dark:bg-emerald-400',
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

const inputCls = 'w-full rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-100/90 dark:bg-[#111622] px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none shadow-[inset_2px_2px_5px_rgba(15,23,42,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.55),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:border-amber-500/60 focus:bg-white dark:focus:bg-[#141a28] transition-all duration-200';

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
  penempatanAreaId: string;
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
  penempatanAreaId: '',
  atasanId: '',
  agama: '',
};

interface EmployeeImportPayload {
  nrk: string | null;
  nik: string | null;
  nama: string | null;
  jenisKelamin: JenisKelamin | null;
  jabatan: string | null;
  gradeId: string;
  unitPath: Array<{ nama: string; tipe: 'direktorat' | 'sevp' | 'bagian' | 'sub_bagian' | 'seksi' }>;
  tanggalMasuk: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  statusKaryawanId: string | null;
  pendidikanTerakhirId: string | null;
  statusPernikahanId: string | null;
  penempatanAreaId: string | null;
  nomorHp: string | null;
  alamat: string | null;
  agama: string | null;
  email: string | null;
  /** Diambil dari kolom `password` di Excel; null → backend memakai default. */
  password: string | null;
  isActive: boolean;
}

interface ImportEmployeeRow {
  rowNumber: number;
  selected: boolean;
  status: 'valid' | 'invalid' | 'imported' | 'failed';
  errors: string[];
  warnings: string[];
  missingUnitPaths: string[];
  payload: EmployeeImportPayload;
  preview: {
    nrk: string;
    nik: string;
    nama: string;
    jabatan: string;
    unit: string;
    unitWillCreate: boolean;
    grade: string;
    status: string;
    email: string;
    willCreateUser: boolean;
    passwordSource: 'excel' | 'default';
  };
}

const IMPORT_HEADERS = [
  'id', 'name', 'email', 'password', 'noHP', 'jabatan', 'Parent', 'bagian', 'sub bagian', 'seksi',
  'grade', 'nrk', 'nik', 'tgl_masuk', 'tempat_lahir', 'tgl_lahir', 'kelamin',
  'status_karyawan', 'pendidikan', 'agama', 'penempatan', 'status_perkawinan',
  'alamat_ktp', 'alamat_domisili',
];

/*
 * Password default akun yang dibuat otomatis saat import.
 * HARUS sama dengan IMPORT_DEFAULT_PASSWORD di
 * `portal-app-be/src/services/employee.service.ts` — nilai ini hanya untuk
 * ditampilkan ke admin di modal import, keputusan sebenarnya tetap di backend.
 */
const IMPORT_DEFAULT_PASSWORD = 'User@123';

/** Kebijakan password: min 8 karakter, ada huruf kapital, ada angka. */
const isStrongPassword = (value: string) =>
  value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value);

const normalizeKey = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const normalizeLookup = (value: unknown) => normalizeKey(value).replace(/[^a-z0-9]/g, '');

const cleanOptionalValue = (value: string) => {
  const trimmed = value.trim();
  return !trimmed || ['-', 'null', 'n/a', 'na'].includes(normalizeKey(trimmed)) ? '' : trimmed;
};

const normalizePhone = (value: string) => {
  const digits = cleanOptionalValue(value).replace(/\D/g, '');
  if (!digits || digits === '0') return '';
  if (digits.startsWith('8')) return `0${digits}`;
  if (digits.startsWith('62')) return `0${digits.slice(2)}`;
  return digits;
};

const getCellValue = (row: Record<string, unknown>, keys: string[]) => {
  const wanted = keys.map(normalizeKey);
  const foundKey = Object.keys(row).find(key => wanted.includes(normalizeKey(key)));
  return foundKey ? String(row[foundKey] ?? '').trim() : '';
};

const parseExcelDate = (value: string) => {
  const v = value.trim();
  if (!v) return '';
  // Format ISO dengan/atau tanpa jam: "2021-08-27" atau "2021-08-27 0:00:00".
  const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }

  const slash = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const day = slash[1].padStart(2, '0');
    const month = slash[2].padStart(2, '0');
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
    return `${year}-${month}-${day}`;
  }

  // Serial number Excel (mis. 44435) → tanggal. Basis 1899-12-30 (kompensasi bug 1900).
  if (/^\d+(\.\d+)?$/.test(v)) {
    const serial = Math.floor(Number(v));
    if (serial > 0) {
      const base = Date.UTC(1899, 11, 30);
      const d = new Date(base + serial * 86400000);
      return d.toISOString().slice(0, 10);
    }
  }

  const parsed = new Date(v);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const parseGender = (value: string): JenisKelamin | '' => {
  const v = normalizeKey(value);
  if (['l', 'lk', 'laki-laki', 'laki laki', 'pria', 'male'].includes(v)) return 'L';
  if (['p', 'pr', 'perempuan', 'wanita', 'female'].includes(v)) return 'P';
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
  const v = normalizeLookup(value);
  if (!v) return undefined;
  return list.find(item =>
    normalizeLookup(item.id) === v ||
    normalizeLookup(item.kode) === v ||
    normalizeLookup(item.label) === v ||
    normalizeLookup(item.nama) === v
  );
};

const MASTER_VALUE_ALIASES = {
  statusKaryawan: {
    karyawanpkwt: 'KONTRAK', kontrak: 'KONTRAK', kpkwt: 'KONTRAK', pkwt: 'KONTRAK',
    karyawantetap: 'TETAP', tetap: 'TETAP',
  },
  pendidikan: {
    sltama: 'SMA', d1akadem: 'D1', d4s1: 'S1', d3: 'D3', s1: 'S1', s2: 'S2',
  },
  statusPernikahan: {
    1: 'BELUM_NIKAH', 2: 'MENIKAH',
  },
  penempatan: {
    // HO_SEIMANGKEI, INL_SBY, dan RO_MEDAN memang sama dengan kode master.
    // PTI_KT (Kuala Tanjung) di file lama belum punya padanan — master memakai INL_KT.
    ptikt: 'INL_KT',
  },
} as const;

const applyMasterAlias = (group: keyof typeof MASTER_VALUE_ALIASES, value: string) => {
  const key = normalizeLookup(value);
  return (MASTER_VALUE_ALIASES[group] as Record<string, string>)[key] || value;
};

export default function ManajemenEmployeePage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [employeeLookup, setEmployeeLookup] = useState<ApiEmployee[]>([]);
  const [unitOrganisasis, setUnitOrganisasis] = useState<UnitOrganisasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Aktif' | 'Non-Aktif'>('Semua');
  const [filterGender, setFilterGender] = useState<'Semua' | 'L' | 'P'>('Semua');
  const [filterUnit, setFilterUnit] = useState<string>('Semua');
  const [filterPenempatan, setFilterPenempatan] = useState<string>('Semua');
  const [filterStatusKaryawan, setFilterStatusKaryawan] = useState<string>('Semua');
  const [filterStatusPernikahan, setFilterStatusPernikahan] = useState<string>('Semua');
  const [filterAkunLogin, setFilterAkunLogin] = useState<'Semua' | 'Ada' | 'Tidak Ada'>('Semua');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [openDatePicker, setOpenDatePicker] = useState<'from' | 'to' | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const importItemsPerPage = 8;

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, search, filterStatus, filterGender, filterUnit, filterPenempatan, filterStatusKaryawan, filterStatusPernikahan, filterAkunLogin, filterDateFrom, filterDateTo]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EmployeeData | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [unitSearch, setUnitSearch] = useState('');
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRows, setImportRows] = useState<ImportEmployeeRow[]>([]);
  const [importPage, setImportPage] = useState(1);
  const [importLoading, setImportLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importDragging, setImportDragging] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [grades, setGrades] = useState<any[]>([]);
  const [statusKaryawans, setStatusKaryawans] = useState<any[]>([]);
  const [pendidikans, setPendidikans] = useState<any[]>([]);
  const [statusPernikahans, setStatusPernikahans] = useState<any[]>([]);
  const [agamas, setAgamas] = useState<any[]>([]);
  const [penempatanAreas, setPenempatanAreas] = useState<any[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // States for User account creation/edit modal
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'Admin' | 'User'>('User');
  const [userStatus, setUserStatus] = useState<'Aktif' | 'Suspended'>('Aktif');

  // User Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalEmployee, setUserModalEmployee] = useState<EmployeeData | null>(null);
  const [userModalEditMode, setUserModalEditMode] = useState(false);
  const [userErrors, setUserErrors] = useState<Record<string, string>>({});
  const [userSaving, setUserSaving] = useState(false);

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
    const candidates = employeeLookup.length > 0 ? employeeLookup : employees;
    return candidates.filter(emp => {
      if (editTarget && emp.id === editTarget.id) return false;
      const empGrade = grades.find(g => g.id === emp.gradeId);
      return empGrade && empGrade.level > selectedGradeLevel;
    });
  }, [form.gradeId, employeeLookup, employees, grades, editTarget, selectedGradeLevel]);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeData | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showToast = (type: 'ok' | 'err', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 3200); };

  // ─── Fetch Data ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterStatus !== 'Semua') params.set('isActive', String(filterStatus === 'Aktif'));
      if (filterGender !== 'Semua') params.set('jenisKelamin', filterGender);
      if (filterUnit !== 'Semua') params.set('unitOrganisasiId', filterUnit);
      if (filterPenempatan !== 'Semua') params.set('penempatanAreaId', filterPenempatan);
      if (filterStatusKaryawan !== 'Semua') params.set('statusKaryawanId', filterStatusKaryawan);
      if (filterStatusPernikahan !== 'Semua') params.set('statusPernikahanId', filterStatusPernikahan);
      if (filterAkunLogin !== 'Semua') params.set('hasUser', String(filterAkunLogin === 'Ada'));
      if (filterDateFrom) params.set('tanggalMasukFrom', filterDateFrom);
      if (filterDateTo) params.set('tanggalMasukTo', filterDateTo);

      const [empRes, orgRes, gradeRes, statusRes, eduRes, marRes, agamaRes, penempatanRes] = await Promise.all([
        api.get<ApiEmployee[]>(`/employees?${params.toString()}`),
        api.get<UnitOrganisasi[]>('/org/unit?limit=1000'),
        api.get<any[]>('/master/grade'),
        api.get<any[]>('/master/status-karyawan'),
        api.get<any[]>('/master/pendidikan'),
        api.get<any[]>('/master/status-pernikahan'),
        api.get<any[]>('/master/agama'),
        api.get<any[]>('/master/penempatan-area'),
      ]);

      const orgMap = new Map<string, string>();
      (orgRes.data || []).forEach(o => orgMap.set(o.id, o.nama));
      setUnitOrganisasis(orgRes.data || []);
      setGrades(gradeRes.data || []);
      setStatusKaryawans(statusRes.data || []);
      setPendidikans(eduRes.data || []);
      setStatusPernikahans(marRes.data || []);
      setAgamas(agamaRes.data || []);
      setPenempatanAreas(penempatanRes.data || []);

      const penempatanMap = new Map<string, string>();
      (penempatanRes.data || []).forEach(p => penempatanMap.set(p.id, p.nama));

      const pernikahanMap = new Map<string, string>();
      (marRes.data || []).forEach(m => pernikahanMap.set(m.id, m.kode));

      const mapped: EmployeeData[] = (empRes.data || []).map(e => ({
        id: e.id,
        nrk: e.nrk,
        nik: e.nik || '',
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
        statusPernikahanKode: e.statusPernikahanId ? (pernikahanMap.get(e.statusPernikahanId) || '-') : '-',
        penempatanAreaId: e.penempatanAreaId || '',
        penempatanAreaNama: e.penempatanAreaId ? (penempatanMap.get(e.penempatanAreaId) || '-') : '-',
        fotoProfil: e.fotoProfil || '',
        atasanId: e.atasanId || '',
        agama: e.agama || '',
        userId: e.userId || null,
        userEmail: e.userEmail || null,
        userRole: e.userRole || null,
        userIsActive: e.userIsActive !== undefined ? e.userIsActive : null,
      }));

      setEmployees(mapped);
      setTotalPages(Math.max(1, empRes.meta?.totalPages || 1));
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearch,
    filterAkunLogin,
    filterDateFrom,
    filterDateTo,
    filterGender,
    filterPenempatan,
    filterStatus,
    filterStatusKaryawan,
    filterStatusPernikahan,
    filterUnit,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!modalOpen) return;
    let active = true;
    api.get<ApiEmployee[]>('/employees?limit=1000')
      .then((response) => {
        if (active) setEmployeeLookup(response.data || []);
      })
      .catch(() => {
        // Tabel utama tetap dapat digunakan saat daftar atasan gagal dimuat.
      });
    return () => {
      active = false;
    };
  }, [modalOpen]);


  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterGender !== 'Semua') count++;
    if (filterUnit !== 'Semua') count++;
    if (filterPenempatan !== 'Semua') count++;
    if (filterStatusKaryawan !== 'Semua') count++;
    if (filterStatusPernikahan !== 'Semua') count++;
    if (filterAkunLogin !== 'Semua') count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    return count;
  }, [filterGender, filterUnit, filterPenempatan, filterStatusKaryawan, filterStatusPernikahan, filterAkunLogin, filterDateFrom, filterDateTo]);

  const resetAdvancedFilters = useCallback(() => {
    setFilterGender('Semua');
    setFilterUnit('Semua');
    setFilterPenempatan('Semua');
    setFilterStatusKaryawan('Semua');
    setFilterStatusPernikahan('Semua');
    setFilterAkunLogin('Semua');
    setFilterDateFrom('');
    setFilterDateTo('');
  }, []);

  // ─── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return employees.filter(e => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (e.nama || '').toLowerCase().includes(q) ||
        (e.nrk || '').toLowerCase().includes(q) ||
        (e.nik || '').toLowerCase().includes(q) ||
        (e.jabatan || '').toLowerCase().includes(q);
      const matchStatus = filterStatus === 'Semua' || (filterStatus === 'Aktif' ? e.isActive : !e.isActive);
      const matchGender = filterGender === 'Semua' || e.jenisKelamin === filterGender;
      const matchUnit = filterUnit === 'Semua' || e.unitOrganisasiId === filterUnit;
      const matchPenempatan = filterPenempatan === 'Semua' || e.penempatanAreaId === filterPenempatan;
      const matchStatusKaryawan = filterStatusKaryawan === 'Semua' || e.statusKaryawanId === filterStatusKaryawan;
      const matchStatusPernikahan = filterStatusPernikahan === 'Semua' || e.statusPernikahanId === filterStatusPernikahan;
      const matchAkunLogin =
        filterAkunLogin === 'Semua' ||
        (filterAkunLogin === 'Ada' ? !!e.userId : !e.userId);
      const tgl = e.tanggalMasuk ? e.tanggalMasuk.slice(0, 10) : '';
      const matchDateFrom = !filterDateFrom || (tgl >= filterDateFrom);
      const matchDateTo = !filterDateTo || (tgl <= filterDateTo);
      return matchSearch && matchStatus && matchGender && matchUnit && matchPenempatan && matchStatusKaryawan && matchStatusPernikahan && matchAkunLogin && matchDateFrom && matchDateTo;
    });
  }, [employees, search, filterStatus, filterGender, filterUnit, filterPenempatan, filterStatusKaryawan, filterStatusPernikahan, filterAkunLogin, filterDateFrom, filterDateTo]);

  const paginatedData = filtered;

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
        nrk: normalizeKey(cleanOptionalValue(getCellValue(row, ['NRK']))),
        nik: normalizeKey(cleanOptionalValue(getCellValue(row, ['NIK']))),
      }));
      const nrkCounts = new Map<string, number>();
      const nikCounts = new Map<string, number>();
      rowIdentifiers.forEach(({ nrk, nik }) => {
        if (nrk) nrkCounts.set(nrk, (nrkCounts.get(nrk) || 0) + 1);
        if (nik) nikCounts.set(nik, (nikCounts.get(nik) || 0) + 1);
      });

      /*
       * Pemeriksaan duplikat WAJIB memakai seluruh data karyawan.
       * Sebelumnya sumbernya state `employees`, yang hanya berisi satu halaman
       * tabel (default 10 baris) — akibatnya pratinjau menandai ratusan baris
       * sebagai "valid" padahal NRK/NIK-nya sudah ada, dan kegagalan baru muncul
       * satu per satu saat POST ke server.
       */
      let duplicateSource: Array<{ nrk?: string | null; nik?: string | null; userEmail?: string | null }> = employees;
      try {
        const allEmployees = await api.get<ApiEmployee[]>('/employees?limit=1000');
        if (Array.isArray(allEmployees.data) && allEmployees.data.length > 0) {
          duplicateSource = allEmployees.data;
        }
      } catch {
        setImportError(
          'Tidak dapat memuat seluruh data karyawan untuk pemeriksaan duplikat. Pratinjau tetap dibuat, ' +
          'tetapi baris yang NRK/NIK-nya sudah terdaftar baru akan ditolak saat proses import.',
        );
      }

      const existingNrks = new Set(duplicateSource.map(e => normalizeKey(e.nrk)).filter(Boolean));
      const existingNiks = new Set(duplicateSource.map(e => normalizeKey(e.nik)).filter(Boolean));
      const existingEmails = new Set(duplicateSource.map(e => normalizeKey(e.userEmail || '')).filter(Boolean));

      const parentByBagian = new Map<string, string>();
      const knownParentNames = new Map<string, string>();
      rawRows.forEach(row => {
        const parent = cleanOptionalValue(getCellValue(row, ['Parent']));
        const bagian = cleanOptionalValue(getCellValue(row, ['bagian', 'Bagian']));
        if (parent) knownParentNames.set(normalizeLookup(parent), parent);
        if (parent && bagian && !parentByBagian.has(normalizeLookup(bagian))) {
          parentByBagian.set(normalizeLookup(bagian), parent);
        }
      });

      const unitById = new Map(unitOrganisasis.map(unit => [unit.id, unit]));
      const signatureCache = new Map<string, string>();
      const getUnitSignature = (unit: UnitOrganisasi): string => {
        const cached = signatureCache.get(unit.id);
        if (cached) return cached;
        const parent = unit.parentId ? unitById.get(unit.parentId) : undefined;
        const signature = `${parent ? `${getUnitSignature(parent)}>` : ''}${normalizeLookup(unit.nama)}`;
        signatureCache.set(unit.id, signature);
        return signature;
      };
      const existingUnitSignatures = new Set(unitOrganisasis.map(getUnitSignature));

      const buildLegacyUnitPath = (unit: UnitOrganisasi) => {
        const path: EmployeeImportPayload['unitPath'] = [];
        let current: UnitOrganisasi | undefined = unit;
        while (current) {
          path.unshift({ nama: current.nama, tipe: current.tipe as EmployeeImportPayload['unitPath'][number]['tipe'] });
          current = current.parentId ? unitById.get(current.parentId) : undefined;
        }
        return path;
      };

      const buildOrganizationPath = (row: Record<string, unknown>) => {
        const bagian = cleanOptionalValue(getCellValue(row, ['bagian', 'Bagian']));
        const subBagian = cleanOptionalValue(getCellValue(row, ['sub bagian', 'sub_bagian', 'Sub Bagian']));
        const seksi = cleanOptionalValue(getCellValue(row, ['seksi', 'Seksi']));
        const explicitParent = cleanOptionalValue(getCellValue(row, ['Parent']));
        const parent = explicitParent || parentByBagian.get(normalizeLookup(bagian)) || '';
        const path: EmployeeImportPayload['unitPath'] = [];
        const addUnit = (nama: string, tipe: EmployeeImportPayload['unitPath'][number]['tipe']) => {
          if (!nama || normalizeLookup(path[path.length - 1]?.nama) === normalizeLookup(nama)) return;
          path.push({ nama: nama.trim(), tipe });
        };

        if (parent && normalizeLookup(parent) !== normalizeLookup(bagian)) {
          addUnit(parent, normalizeLookup(parent) === 'direktur' ? 'direktorat' : 'sevp');
        }
        if (bagian) {
          const parentLevelName = knownParentNames.get(normalizeLookup(bagian));
          addUnit(bagian, parentLevelName
            ? (normalizeLookup(bagian) === 'direktur' ? 'direktorat' : 'sevp')
            : 'bagian');
        }
        addUnit(subBagian, 'sub_bagian');
        addUnit(seksi, 'seksi');

        if (!path.length) {
          const legacyInput = cleanOptionalValue(getCellValue(row, ['Unit_Organisasi', 'Kode Unit', 'Unit Organisasi', 'Unit Kerja']));
          const legacyUnit = findByCodeOrLabel(unitOrganisasis, legacyInput);
          if (legacyUnit) return buildLegacyUnitPath(legacyUnit);
        }
        return path;
      };

      const mappedRows: ImportEmployeeRow[] = rawRows.map((row, index) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const nama = cleanOptionalValue(getCellValue(row, ['name', 'Nama_Lengkap', 'Nama Lengkap', 'Nama']));
        const nrk = cleanOptionalValue(getCellValue(row, ['NRK']));
        const nik = cleanOptionalValue(getCellValue(row, ['NIK']));
        const email = cleanOptionalValue(getCellValue(row, ['email', 'Email']));
        // Kolom password opsional. Bila ada isinya, dipakai sebagai password akun;
        // bila kosong/kolomnya tidak ada, backend memakai IMPORT_DEFAULT_PASSWORD.
        const passwordInput = getCellValue(row, ['password', 'Password', 'kata sandi', 'Kata Sandi']).trim();
        const genderInput = cleanOptionalValue(getCellValue(row, ['kelamin', 'Jenis_Kelamin', 'Jenis Kelamin', 'Gender']));
        const jenisKelamin = parseGender(genderInput);
        const jabatan = cleanOptionalValue(getCellValue(row, ['jabatan', 'Jabatan']));
        const unitPath = buildOrganizationPath(row);
        const tempatLahir = cleanOptionalValue(getCellValue(row, ['tempat_lahir', 'Tempat_Lahir', 'Tempat Lahir']));
        const tanggalLahir = parseExcelDate(cleanOptionalValue(getCellValue(row, ['tgl_lahir', 'Tanggal_Lahir', 'Tanggal Lahir'])));
        const tanggalMasuk = parseExcelDate(cleanOptionalValue(getCellValue(row, ['tgl_masuk', 'Tanggal_Masuk', 'Tanggal Masuk', 'Tanggal Masuk Kerja'])));
        const activeInput = getCellValue(row, ['Status', 'Status Aktif']);
        const gradeInput = cleanOptionalValue(getCellValue(row, ['grade', 'Grade', 'Kode Grade', 'Grade / Golongan']));
        const statusKaryawanInput = cleanOptionalValue(getCellValue(row, ['status_karyawan', 'Status Karyawan', 'Status_Karyawan']));
        const pendidikanInput = cleanOptionalValue(getCellValue(row, ['pendidikan', 'Pendidikan', 'Pendidikan Terakhir']));
        const statusPernikahanInput = cleanOptionalValue(getCellValue(row, ['status_perkawinan', 'Status_Pernikahan', 'Status Pernikahan']));
        const agamaInput = cleanOptionalValue(getCellValue(row, ['agama', 'Agama']));
        const penempatanInput = cleanOptionalValue(getCellValue(row, ['penempatan', 'Penempatan']));
        const nomorHp = normalizePhone(getCellValue(row, ['noHP', 'Nomor_Hp', 'Nomor HP', 'No HP', 'No. HP', 'HP']));
        const alamatDomisili = cleanOptionalValue(getCellValue(row, ['alamat_domisili', 'Alamat Domisili']));
        const alamatKtp = cleanOptionalValue(getCellValue(row, ['alamat_ktp', 'Alamat KTP', 'Alamat']));
        const alamat = alamatDomisili || alamatKtp;

        // NIK hanya valid bila tepat 16 digit; selain itu disimpan sebagai NULL.
        const nikValid = /^\d{16}$/.test(nik);
        const nikValue = nikValid ? nik : '';

        const grade = findByCodeOrLabel(grades, gradeInput);
        const statusKaryawan = findByCodeOrLabel(statusKaryawans, applyMasterAlias('statusKaryawan', statusKaryawanInput));
        const pendidikan = findByCodeOrLabel(pendidikans, applyMasterAlias('pendidikan', pendidikanInput));
        const statusPernikahan = findByCodeOrLabel(statusPernikahans, applyMasterAlias('statusPernikahan', statusPernikahanInput));
        const agama = findByCodeOrLabel(agamas, agamaInput);
        const penempatan = findByCodeOrLabel(penempatanAreas, applyMasterAlias('penempatan', penempatanInput));

        let signature = '';
        const missingUnitPaths: string[] = [];
        unitPath.forEach(item => {
          signature = `${signature ? `${signature}>` : ''}${normalizeLookup(item.nama)}`;
          if (!existingUnitSignatures.has(signature)) missingUnitPaths.push(unitPath.slice(0, unitPath.indexOf(item) + 1).map(part => part.nama).join(' > '));
        });

        // Baris tanpa data pengenal apa pun (nama/NRK/jabatan/email) dianggap kosong → dilewati.
        const isBlankRow = !nama && !nrk && !jabatan && !email;

        // Field wajib DB (nrk/nama/jabatan/jenisKelamin) boleh NULL bila memang kosong.
        // Yang benar-benar wajib untuk import hanyalah grade + unit organisasi.
        if (isBlankRow) {
          errors.push('Baris kosong tanpa data karyawan (dilewati).');
        } else {
          if (!gradeInput || !grade) errors.push('Grade tidak ditemukan.');
          if (!unitPath.length) errors.push('Bagian atau unit organisasi wajib diisi.');
        }
        if (nik && !nikValid) warnings.push('NIK bukan 16 digit dan akan disimpan sebagai kosong (NULL).');
        if (!nrk) warnings.push('NRK kosong dan akan disimpan NULL.');
        if (!nama) warnings.push('Nama kosong dan akan disimpan NULL.');
        if (!jabatan) warnings.push('Jabatan kosong dan akan disimpan NULL.');
        if (genderInput && !jenisKelamin) warnings.push('Jenis kelamin tidak dikenali dan akan disimpan NULL.');
        if (!genderInput) warnings.push('Jenis kelamin kosong dan akan disimpan NULL.');
        if (statusKaryawanInput && !statusKaryawan) warnings.push('Status karyawan tidak dikenali dan akan dikosongkan.');
        if (pendidikanInput && !pendidikan) warnings.push('Pendidikan tidak dikenali dan akan dikosongkan.');
        if (statusPernikahanInput && !statusPernikahan) warnings.push('Status perkawinan tidak dikenali dan akan dikosongkan.');
        if (penempatanInput && !penempatan) warnings.push('Penempatan tidak ditemukan di master dan akan dikosongkan.');
        if (passwordInput && !email) {
          warnings.push('Kolom password diisi tapi email kosong — akun tidak dibuat, password diabaikan.');
        }
        if (passwordInput && email && !isStrongPassword(passwordInput)) {
          errors.push('Password di file tidak memenuhi syarat (min 8 karakter, ada huruf kapital dan angka).');
        }
        if (email && existingEmails.has(normalizeKey(email))) {
          warnings.push('Email sudah dipakai akun lain — data karyawan tetap masuk, akun login tidak dibuat.');
        } else if (email) {
          warnings.push(
            passwordInput && isStrongPassword(passwordInput)
              ? 'Akun user akan dibuat otomatis dengan password dari kolom `password`.'
              : `Akun user akan dibuat otomatis (password default ${IMPORT_DEFAULT_PASSWORD}).`,
          );
        }
        if (nrk && existingNrks.has(normalizeKey(nrk))) errors.push('NRK sudah ada di sistem.');
        if (nikValue && existingNiks.has(normalizeKey(nikValue))) errors.push('NIK sudah ada di sistem.');
        if (nrk && (nrkCounts.get(normalizeKey(nrk)) || 0) > 1) errors.push('NRK duplikat di file.');
        if (nikValue && (nikCounts.get(normalizeKey(nikValue)) || 0) > 1) errors.push('NIK duplikat di file.');

        const payload: EmployeeImportPayload = {
          nrk: nrk || null,
          nik: nikValue || null,
          nama: nama || null,
          jenisKelamin: jenisKelamin || null,
          jabatan: jabatan || null,
          gradeId: grade?.id || '',
          unitPath,
          tanggalMasuk: tanggalMasuk || null,
          tempatLahir: tempatLahir || null,
          tanggalLahir: tanggalLahir || null,
          statusKaryawanId: statusKaryawan?.id || null,
          pendidikanTerakhirId: pendidikan?.id || null,
          statusPernikahanId: statusPernikahan?.id || null,
          penempatanAreaId: penempatan?.id || null,
          nomorHp: nomorHp || null,
          alamat: alamat || null,
          agama: agama?.label || agamaInput || null,
          email: email || null,
          password: passwordInput && isStrongPassword(passwordInput) ? passwordInput : null,
          isActive: parseActive(activeInput),
        };

        return {
          rowNumber: index + 2,
          selected: errors.length === 0,
          status: errors.length ? 'invalid' : 'valid',
          errors,
          warnings,
          missingUnitPaths,
          payload,
          preview: {
            nrk,
            nik: nikValue,
            nama,
            jabatan,
            unit: unitPath.map(item => item.nama).join(' > ') || '-',
            unitWillCreate: missingUnitPaths.length > 0,
            grade: grade ? `${grade.kode} - ${grade.label}` : gradeInput || '-',
            status: parseActive(activeInput) ? 'Aktif' : 'Non-Aktif',
            email,
            willCreateUser: !!email && !existingEmails.has(normalizeKey(email)),
            passwordSource: passwordInput && isStrongPassword(passwordInput) ? 'excel' : 'default',
          },
        };
      });

      setImportRows(mappedRows);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Gagal membaca file Excel.');
    } finally {
      setImportLoading(false);
    }
  }, [agamas, employees, grades, pendidikans, penempatanAreas, statusKaryawans, statusPernikahans, unitOrganisasis]);

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
    let createdUserCount = 0;
    const createdUnitNames = new Set<string>();

    for (const row of rowsToImport) {
      try {
        const result = await api.post<{ createdUnits: Array<{ nama: string }>; createdUser: { email: string } | null }>('/employees/import', row.payload);
        result.data.createdUnits.forEach(unit => createdUnitNames.add(unit.nama));
        if (result.data.createdUser) createdUserCount += 1;
        successCount += 1;
        setImportRows(prev => prev.map(item =>
          item.rowNumber === row.rowNumber
            ? { ...item, selected: false, status: 'imported', errors: [], missingUnitPaths: [], preview: { ...item.preview, unitWillCreate: false } }
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
      const unitMessage = createdUnitNames.size > 0 ? ` ${createdUnitNames.size} unit organisasi baru dibuat.` : '';
      const userMessage = createdUserCount > 0 ? ` ${createdUserCount} akun user dibuat.` : '';
      showToast('ok', `${successCount} employee berhasil diimport.${unitMessage}${userMessage}`);
      setImportModalOpen(false);
    } else {
      showToast('err', `${successCount} berhasil, ${failedCount} gagal. Cek catatan di preview.`);
    }
  }, [fetchData, importRows]);

  const downloadTemplate = useCallback(async () => {
    const XLSX = await import('xlsx');
    const sampleGrade = grades.find(g => g.kode === 'BOM-4') || grades[0];
    const samplePendidikan = pendidikans.find(p => p.kode === 'S1') || pendidikans[0];
    const sampleAgama = agamas.find(a => a.kode === 'ISLAM') || agamas[0];
    const samplePenempatan = penempatanAreas.find(p => p.kode === 'HO_SEIMANGKEI') || penempatanAreas[0];

    const templateRows = [
      {
        id: 1,
        name: 'Budi Santoso',
        email: 'budi.santoso@inl.co.id',
        password: '',
        noHP: '081234567890',
        jabatan: 'Operator Produksi',
        Parent: '',
        bagian: 'Production',
        'sub bagian': 'Production PMG 1',
        seksi: 'Refinery & Fractionation PMG 1',
        grade: sampleGrade?.kode || 'BOM-4',
        nrk: '121080261',
        nik: '3201234567890001',
        tgl_masuk: '2021-08-27',
        tempat_lahir: 'Medan',
        tgl_lahir: '1998-05-20',
        kelamin: 'Pria',
        status_karyawan: 'KPKWT',
        pendidikan: samplePendidikan?.kode || 'S1',
        agama: sampleAgama?.kode || 'ISLAM',
        penempatan: samplePenempatan?.kode || 'HO_SEIMANGKEI',
        status_perkawinan: '1',
        alamat_ktp: 'Alamat sesuai KTP',
        alamat_domisili: 'Alamat domisili saat ini',
      },
    ];

    const referenceRows = [
      ...unitOrganisasis.map(item => ({ Tipe: 'Unit Organisasi', Kode: item.kode, Label: item.nama })),
      ...grades.map(item => ({ Tipe: 'Grade', Kode: item.kode, Label: item.label })),
      ...statusKaryawans.map(item => ({ Tipe: 'Status Karyawan', Kode: item.kode, Label: item.label })),
      ...pendidikans.map(item => ({ Tipe: 'Pendidikan', Kode: item.kode, Label: item.label })),
      ...statusPernikahans.map(item => ({ Tipe: 'Status Pernikahan', Kode: item.kode, Label: item.label })),
      ...agamas.map(item => ({ Tipe: 'Agama', Kode: item.kode, Label: item.label })),
      ...penempatanAreas.map(item => ({ Tipe: 'Penempatan', Kode: item.kode, Label: item.nama })),
      { Tipe: 'Status Perkawinan (kode angka)', Kode: '1', Label: 'Belum Menikah' },
      { Tipe: 'Status Perkawinan (kode angka)', Kode: '2', Label: 'Menikah' },
      { Tipe: 'Password akun', Kode: '(kosong)', Label: `Default: ${IMPORT_DEFAULT_PASSWORD}` },
    ];

    const petunjukRows = [
      { Kolom: 'nrk / nama / jabatan / kelamin', Keterangan: 'Boleh dikosongkan — akan disimpan NULL bila kosong.' },
      { Kolom: 'grade', Keterangan: 'WAJIB. Isi dengan Kode Grade (mis. BOM-4, BOM-3, BOM-2, BOM-1, BOM, BOD).' },
      { Kolom: 'bagian / sub bagian / seksi', Keterangan: 'Minimal salah satu diisi sebagai unit organisasi. Unit baru dibuat otomatis.' },
      { Kolom: 'email', Keterangan: 'Bila diisi, akun user dibuat otomatis (role user). Bila email sudah dipakai, akun tidak dibuat ulang.' },
      { Kolom: 'password', Keterangan: 'OPSIONAL. Bila diisi, dipakai sebagai password akun (min 8 karakter, ada huruf kapital dan angka). Bila kosong/kolom tidak ada, dipakai default ' + IMPORT_DEFAULT_PASSWORD + '.' },
      { Kolom: 'nik', Keterangan: 'Harus 16 digit. Jika tidak, disimpan NULL.' },
      { Kolom: 'kelamin', Keterangan: 'Pria/Wanita, L/P, atau LK/PR.' },
      { Kolom: 'penempatan', Keterangan: 'Isi dengan Kode Penempatan (HO_SEIMANGKEI, INL_KT, INL_SBY, RO_MEDAN). Kode lama PTI_KT otomatis dipetakan ke INL_KT.' },
      { Kolom: 'status_karyawan', Keterangan: 'Kode: TETAP, KONTRAK/KPKWT, dst.' },
      { Kolom: 'status_perkawinan', Keterangan: 'Kode angka: 1 = Belum Menikah, 2 = Menikah.' },
      { Kolom: 'tgl_masuk / tgl_lahir', Keterangan: 'Format YYYY-MM-DD atau tanggal Excel.' },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(templateRows, { header: IMPORT_HEADERS }), 'Template Employee');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(referenceRows), 'Referensi');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(petunjukRows), 'Petunjuk');
    XLSX.writeFile(workbook, 'template-import-employee.xlsx');
  }, [agamas, grades, pendidikans, penempatanAreas, statusKaryawans, statusPernikahans, unitOrganisasis]);

  const exportEmployees = useCallback(async () => {
    if (!filtered.length) {
      showToast('err', 'Tidak ada data employee untuk diexport.');
      return;
    }

    const XLSX = await import('xlsx');
    const rows = filtered.map(emp => ({
      NRK: emp.nrk || '',
      NIK: emp.nik || '',
      Nama: emp.nama,
      Email: emp.userEmail || '',
      'Akun Login': emp.userId ? (emp.userIsActive ? 'Aktif' : 'Suspended') : 'Belum Ada',
      'Role Akun': emp.userRole === 'super_admin' ? 'Admin' : (emp.userRole === 'user' ? 'User' : ''),
      'Jenis Kelamin': emp.jenisKelamin === 'L' ? 'Laki-laki' : (emp.jenisKelamin === 'P' ? 'Perempuan' : ''),
      Jabatan: emp.jabatan,
      'Unit Organisasi': emp.unitOrganisasiNama,
      Grade: grades.find(g => g.id === emp.gradeId)?.label || '',
      'Kode Grade': grades.find(g => g.id === emp.gradeId)?.kode || '',
      'Status Karyawan': statusKaryawans.find(s => s.id === emp.statusKaryawanId)?.label || '',
      'Pendidikan Terakhir': pendidikans.find(p => p.id === emp.pendidikanTerakhirId)?.label || '',
      'Status Pernikahan': statusPernikahans.find(s => s.id === emp.statusPernikahanId)?.label || '',
      Agama: emp.agama || '',
      Penempatan: emp.penempatanAreaNama,
      'Nomor HP': emp.nomorHp || '',
      'Tempat Lahir': emp.tempatLahir || '',
      'Tanggal Lahir': emp.tanggalLahir || '',
      'Tanggal Masuk': emp.tanggalMasuk || '',
      Alamat: emp.alamat || '',
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
  const warningImportCount = importRows.filter(row => row.status === 'valid' && row.warnings.length > 0).length;
  const plannedUnitCount = new Set(importRows.flatMap(row => row.missingUnitPaths)).size;
  const plannedUserCount = importRows.filter(row => row.status === 'valid' && row.preview.willCreateUser).length;
  const plannedCustomPasswordCount = importRows.filter(
    row => row.status === 'valid' && row.preview.willCreateUser && row.preview.passwordSource === 'excel',
  ).length;
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

  const openEdit = useCallback((e: EmployeeData) => {
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
      penempatanAreaId: e.penempatanAreaId || '',
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
        penempatanAreaId: form.penempatanAreaId || null,
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
        // api.post ikut auto-refresh 401 dan memakai proxy /api — tanpa fallback host.
        await api.post(`/employees/${employeeId}/photo`, fd);
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

  // ─── User Modal Actions ────────────────────────────────────────────────────
  const openUserModal = useCallback((e: EmployeeData, editMode: boolean) => {
    setUserModalEmployee(e);
    setUserModalEditMode(editMode);
    setUserErrors({});
    
    if (editMode) {
      setUserEmail(e.userEmail || '');
      setUserPassword('');
      setUserRole(e.userRole === 'super_admin' ? 'Admin' : 'User');
      setUserStatus(e.userIsActive ? 'Aktif' : 'Suspended');
    } else {
      setUserEmail('');
      setUserPassword('');
      setUserRole('User');
      setUserStatus('Aktif');
    }
    setUserModalOpen(true);
  }, []);

  const handleUserSave = useCallback(async () => {
    setUserErrors({});
    if (!userModalEmployee) return;

    const errorsMap: Record<string, string> = {};
    if (!userEmail.trim()) {
      errorsMap.userEmail = 'Email wajib diisi.';
    } else if (!userEmail.includes('@')) {
      errorsMap.userEmail = 'Format email tidak valid.';
    }

    if (!userModalEditMode) {
      if (!userPassword.trim()) {
        errorsMap.userPassword = 'Password wajib diisi.';
      } else {
        if (userPassword.length < 8) {
          errorsMap.userPassword = 'Password minimal 8 karakter.';
        }
        if (!/[A-Z]/.test(userPassword)) {
          errorsMap.userPassword = 'Password harus mengandung huruf kapital.';
        }
        if (!/[0-9]/.test(userPassword)) {
          errorsMap.userPassword = 'Password harus mengandung angka.';
        }
      }
    } else {
      if (userPassword.trim()) {
        if (userPassword.length < 8) {
          errorsMap.userPassword = 'Password minimal 8 karakter.';
        }
        if (!/[A-Z]/.test(userPassword)) {
          errorsMap.userPassword = 'Password harus mengandung huruf kapital.';
        }
        if (!/[0-9]/.test(userPassword)) {
          errorsMap.userPassword = 'Password harus mengandung angka.';
        }
      }
    }

    if (Object.keys(errorsMap).length > 0) {
      setUserErrors(errorsMap);
      showToast('err', Object.values(errorsMap)[0]);
      return;
    }

    setUserSaving(true);
    try {
      const roleApi = userRole === 'Admin' ? 'super_admin' : 'user';
      const isActiveApi = userRole === 'Admin' ? true : userStatus === 'Aktif';

      if (userModalEditMode && userModalEmployee.userId) {
        // Edit User
        const payload: any = {
          email: userEmail,
          role: roleApi,
          isActive: isActiveApi,
        };
        if (userPassword.trim()) {
          payload.password = userPassword;
        }
        await api.put(`/users/${userModalEmployee.userId}`, payload);
        showToast('ok', `Akun user "${userEmail}" berhasil diperbarui.`);
      } else {
        // Tambah User
        await api.post('/users', {
          email: userEmail,
          password: userPassword,
          role: roleApi,
          isActive: isActiveApi,
          employeeId: userModalEmployee.id,
        });
        showToast('ok', `Akun user "${userEmail}" berhasil dibuat.`);
      }

      setUserModalOpen(false);
      await fetchData();
    } catch (err: any) {
      if (err instanceof ApiRequestError && err.details && Array.isArray(err.details)) {
        const apiErrors: Record<string, string> = {};
        err.details.forEach((d: any) => {
          let field = d.field;
          if (field === 'isActive') field = 'userStatus';
          apiErrors[field] = d.message;
        });
        setUserErrors(apiErrors);
        showToast('err', err.message || 'Gagal menyimpan akun user.');
      } else {
        showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan akun user.');
      }
    } finally {
      setUserSaving(false);
    }
  }, [userModalEmployee, userModalEditMode, userEmail, userPassword, userRole, userStatus, fetchData]);

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

  const activeCount = employees.filter(e => e.isActive).length;
  const inactiveCount = employees.filter(e => !e.isActive).length;
  const maleCount = employees.filter(e => e.jenisKelamin === 'L').length;
  const femaleCount = employees.filter(e => e.jenisKelamin === 'P').length;

  return (
    <StaggerContainer className="space-y-6" stagger={0.08} delay={0.04}>

      {/* Toast */}
      <Toast toast={toast} />

      {/* Header */}
      <StaggerItem>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Manajemen Employee
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Kelola data karyawan PT Industri Nabati Lestari.</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full sm:w-auto sm:flex sm:items-center">
          <button
            type="button"
            onClick={openImportModal}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-auto text-center"
          >
            <FileUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">Import Excel</span>
          </button>
          <button
            type="button"
            onClick={exportEmployees}
            disabled={loading || filtered.length === 0}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg border border-slate-200 bg-white px-2 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold text-slate-650 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.06] cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400/20 w-full sm:w-auto text-center"
          >
            <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">Export Excel</span>
          </button>
          <PrimaryButton
            onClick={openCreate}
            className="w-full sm:w-auto justify-center px-2 sm:px-3.5 text-[11px] sm:text-xs text-center"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">Tambah Employee</span>
          </PrimaryButton>
        </div>
      </div>
      </StaggerItem>

      {/* Stats — flat inline */}
      <StaggerItem>
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-x-6 sm:gap-y-2 bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {[
          { label: 'Total', value: employees.length, icon: Users, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Aktif', value: activeCount, icon: UserCheck, color: 'text-emerald-650 dark:text-emerald-450' },
          { label: 'Non-Aktif', value: inactiveCount, icon: UserX, color: 'text-rose-650 dark:text-rose-455' },
          { label: 'Laki-laki', value: maleCount, icon: Users, color: 'text-blue-650 dark:text-blue-400' },
          { label: 'Perempuan', value: femaleCount, icon: Users, color: 'text-pink-650 dark:text-pink-400' },
        ].map((s, i, arr) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={s.label}>
              <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                <span className="text-sm font-bold text-slate-850 dark:text-white">{s.value}</span>
                <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">{s.label}</span>
              </div>
              {i < arr.length - 1 && <span className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-850 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>
      </StaggerItem>

      {/* Table Card */}
      <StaggerItem>
      <div className="relative rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] shadow-lg">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        {/* ── Toolbar Row 1: Search + Quick Filters ── */}
        <div className="flex flex-col gap-3 px-5 pt-4 pb-3 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between flex-wrap">
          <SearchInput
            placeholder="Cari nama, NRK, NIK, jabatan..."
            value={search}
            onChange={setSearch}
            className="sm:w-96"
          />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Status Keaktifan */}
            <FilterDropdown<'Semua' | 'Aktif' | 'Non-Aktif'>
              className="w-full sm:w-40"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { label: 'Semua Status', value: 'Semua' },
                { label: 'Aktif', value: 'Aktif' },
                { label: 'Non-Aktif', value: 'Non-Aktif' },
              ]}
            />
            {/* Unit Kerja */}
            <FilterDropdown<string>
              value={filterUnit}
              onChange={setFilterUnit}
              searchable={true}
              className="w-full sm:w-52"
              options={[
                { label: 'Semua Unit', value: 'Semua' },
                ...unitOrganisasis
                  .filter(u => u.isActive)
                  .sort((a, b) => a.nama.localeCompare(b.nama))
                  .map(u => ({ label: u.nama, value: u.id })),
              ]}
            />
            <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-white/[0.08]" />
            {/* Advanced Filters toggle + inline reset */}
            <div className="flex items-center w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowAdvancedFilter(v => !v)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold tracking-tight transition-all duration-200 cursor-pointer focus:outline-none w-full sm:w-auto min-h-[42px] ${
                  showAdvancedFilter
                    ? 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-[inset_2px_2px_4px_rgba(245,158,11,0.12),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] dark:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6)]'
                    : activeFiltersCount > 0
                      ? 'border-amber-400/80 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-300 shadow-[inset_2px_2px_4px_rgba(245,158,11,0.1)]'
                      : 'border-slate-200/80 bg-slate-100/90 text-slate-700 shadow-[inset_2px_2px_5px_rgba(15,23,42,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] hover:text-slate-900 dark:border-white/[0.06] dark:bg-[#111622] dark:text-slate-300 dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.55)] dark:hover:text-white'
                } ${activeFiltersCount > 0 ? 'rounded-r-none border-r-0' : ''}`}
              >
                <SlidersHorizontal className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Filter Lanjutan
                {activeFiltersCount > 0 && (
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-extrabold text-white shadow-xs">{activeFiltersCount}</span>
                )}
              </button>
              {/* Inline reset — only visible when filters are active */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); resetAdvancedFilters(); }}
                  title="Reset semua filter lanjutan"
                  className="inline-flex h-full min-h-[42px] items-center justify-center rounded-r-xl border border-amber-400/50 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/10 px-2.5 py-2 text-amber-600 dark:text-amber-400 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/30 dark:hover:text-rose-400 transition-all cursor-pointer focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Advanced Filter Panel (collapsible) ── */}
        {showAdvancedFilter && (
          <div 
            className="relative z-30 overflow-visible border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-100/70 dark:bg-[#0c1018] px-5 py-6 backdrop-blur-sm"
          >
            {/* Panel header */}
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Filter Lanjutan</span>
              <div className="flex-1 h-px bg-slate-200/80 dark:bg-white/[0.06] ml-1" />
              {activeFiltersCount > 0 && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{activeFiltersCount} filter aktif</span>
              )}
            </div>

            {/* Filter groups grid */}
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">

              {/* Jenis Kelamin */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Jenis Kelamin</span>
                <FilterDropdown<'Semua' | 'L' | 'P'>
                  value={filterGender}
                  onChange={setFilterGender}
                  className="w-full"
                  options={[
                    { label: 'Semua Gender', value: 'Semua' },
                    { label: 'Laki-laki', value: 'L' },
                    { label: 'Perempuan', value: 'P' },
                  ]}
                />
              </div>

              {/* Status Karyawan */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Tipe Karyawan</span>
                <FilterDropdown<string>
                  value={filterStatusKaryawan}
                  onChange={setFilterStatusKaryawan}
                  className="w-full"
                  options={[
                    { label: 'Semua Tipe', value: 'Semua' },
                    ...statusKaryawans.map(s => ({ label: s.label, value: s.id })),
                  ]}
                />
              </div>

              {/* Penempatan Area */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Penempatan Area</span>
                <FilterDropdown<string>
                  value={filterPenempatan}
                  onChange={setFilterPenempatan}
                  className="w-full"
                  options={[
                    { label: 'Semua Area', value: 'Semua' },
                    ...penempatanAreas.map(p => ({ label: p.nama, value: p.id })),
                  ]}
                />
              </div>

              {/* Status Pernikahan */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Status Pernikahan</span>
                <FilterDropdown<string>
                  value={filterStatusPernikahan}
                  onChange={setFilterStatusPernikahan}
                  className="w-full"
                  options={[
                    { label: 'Semua Status', value: 'Semua' },
                    ...statusPernikahans.map(s => ({ label: s.label, value: s.id })),
                  ]}
                />
              </div>

              {/* Akun Login */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Akun SSO</span>
                <FilterDropdown<'Semua' | 'Ada' | 'Tidak Ada'>
                  value={filterAkunLogin}
                  onChange={setFilterAkunLogin}
                  className="w-full"
                  options={[
                    { label: 'Semua', value: 'Semua' },
                    { label: 'Sudah Punya Akun', value: 'Ada' },
                    { label: 'Belum Punya Akun', value: 'Tidak Ada' },
                  ]}
                />
              </div>

              {/* Tanggal Masuk range */}
              <div className="space-y-1.5 col-span-2 md:col-span-1 xl:col-span-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Rentang Tanggal Masuk</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <CustomDatePicker
                      value={filterDateFrom}
                      onChange={setFilterDateFrom}
                      placeholder="Dari Tanggal..."
                      maxDate={filterDateTo || undefined}
                      isOpen={openDatePicker === 'from'}
                      onOpenChange={(open) => setOpenDatePicker(open ? 'from' : null)}
                    />
                  </div>
                  <span className="text-slate-400 dark:text-slate-600 text-xs font-bold shrink-0">—</span>
                  <div className="flex-1">
                    <CustomDatePicker
                      value={filterDateTo}
                      onChange={setFilterDateTo}
                      placeholder="Sampai Tanggal..."
                      minDate={filterDateFrom || undefined}
                      isOpen={openDatePicker === 'to'}
                      onOpenChange={(open) => setOpenDatePicker(open ? 'to' : null)}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Table */}
        <CrudTable<EmployeeData>
          headers={['No', 'Employee', 'NIK', 'Jabatan / Unit', 'Jenis Kelamin', 'Penempatan', 'Status Pernikahan', 'Status', 'Tgl Masuk', 'Akun Login', 'Aksi']}
          loading={loading}
          loadingText="Memuat data employee..."
          emptyText="Tidak ada employee yang sesuai."
          data={paginatedData}
          containerClassName="hide-scrollbar"
          renderRow={(e, idx) => {
            const rowNo = (currentPage - 1) * itemsPerPage + idx + 1;
            return (
              <tr key={e.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150">
                {/* No */}
                <td className="px-5 py-3.5 text-xs font-bold text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
                  {rowNo}
                </td>
                {/* Employee */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  {e.fotoProfil ? (
                    <img
                      src={resolveImageUrl(e.fotoProfil)}
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
              <td className="px-5 py-3.5 whitespace-nowrap">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{e.nik || '-'}</p>
              </td>
              {/* Jabatan / Unit */}
              <td className="px-5 py-3.5 whitespace-nowrap min-w-[220px]">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{e.jabatan}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{e.unitOrganisasiNama}</p>
                </div>
              </td>
              {/* Jenis Kelamin */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${GENDER_BADGE[e.jenisKelamin]}`}>
                  {e.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </td>
              {/* Penempatan */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{e.penempatanAreaNama}</p>
              </td>
              {/* Status Pernikahan */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className="rounded bg-slate-100 dark:bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  {e.statusPernikahanKode}
                </span>
              </td>
              {/* Status */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${STATUS_BADGE[String(e.isActive)]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[String(e.isActive)]}`} />
                  {e.isActive ? 'Aktif' : 'Non-Aktif'}
                </span>
              </td>
              {/* Tgl Masuk */}
              <td className="px-5 py-3.5 text-xs font-bold text-slate-550 dark:text-slate-500 whitespace-nowrap">{fmtDate(e.tanggalMasuk)}</td>
              {/* Akun Login */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                {e.userId ? (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${e.userIsActive ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20' : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-455'}`}>
                      {e.userIsActive ? 'Aktif' : 'Suspended'}
                    </span>
                    <button title="Edit User" onClick={() => openUserModal(e, true)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-500 transition-all cursor-pointer focus:outline-none shrink-0">
                      <UserCog className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">Belum Ada</span>
                    <button title="Tambah User" onClick={() => openUserModal(e, false)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all cursor-pointer focus:outline-none shrink-0">
                      <UserPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </td>
              {/* Actions */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <div className="flex items-center justify-start gap-1 flex-nowrap">
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
          ); }}
        />
        <CrudPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(limit) => {
            setItemsPerPage(limit);
            setCurrentPage(1);
          }}
        />
      </div>
      </StaggerItem>

      {/* Import Excel Modal */}
      <ModalPortal open={importModalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={closeImportModal} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-6xl animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl shadow-slate-900/10">
              <div className="flex flex-col gap-3 border-b border-slate-300 px-5 py-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Import Employee dari Excel</h2>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-450 dark:text-slate-500">Mendukung struktur Parent, bagian, sub bagian, dan seksi. Unit yang belum ada dibuat otomatis.</p>
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

              <div className="max-h-[72vh] space-y-4 overflow-y-auto overflow-x-hidden px-5 py-5 hide-scrollbar">
                {/* Aturan pembuatan akun & password — ditampilkan sebelum admin memilih file. */}
                <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/[0.07] sm:flex-row sm:items-start sm:gap-3">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Akun login &amp; password
                    </p>
                    <ul className="space-y-0.5 text-[11px] font-semibold leading-relaxed text-amber-800 dark:text-amber-200/90">
                      <li>
                        • Baris yang punya <span className="font-mono">email</span> otomatis dibuatkan akun login (role <span className="font-mono">user</span>).
                      </li>
                      <li>
                        • Password default:{' '}
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(IMPORT_DEFAULT_PASSWORD);
                            showToast('ok', 'Password default disalin ke clipboard.');
                          }}
                          className="rounded-md border border-amber-300 bg-white/70 px-1.5 py-0.5 font-mono text-[11px] font-black text-amber-900 transition-colors hover:bg-white dark:border-amber-500/30 dark:bg-black/20 dark:text-amber-200 cursor-pointer focus:outline-none"
                          title="Klik untuk menyalin"
                        >
                          {IMPORT_DEFAULT_PASSWORD}
                        </button>{' '}
                        — dipakai bila kolom <span className="font-mono">password</span> kosong atau tidak ada di file.
                      </li>
                      <li>
                        • Isi kolom <span className="font-mono">password</span> untuk menentukan sendiri (min 8 karakter, ada huruf kapital dan angka).
                      </li>
                      <li>• Email yang sudah dipakai akun lain tidak dibuatkan akun baru — data karyawannya tetap masuk.</li>
                    </ul>
                  </div>
                </div>

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
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100">{importRows.length} total baris</span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{validImportCount} siap diimpor</span>
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{invalidImportCount} tidak dapat diimpor</span>
                          {importedCount > 0 && <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{importedCount} sudah diimpor</span>}
                          {plannedUnitCount > 0 && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{plannedUnitCount} unit organisasi akan dibuat</span>}
                          {plannedUserCount > 0 && <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{plannedUserCount} akun user akan dibuat</span>}
                          {plannedCustomPasswordCount > 0 && <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{plannedCustomPasswordCount} pakai password dari file</span>}
                          {plannedUserCount > plannedCustomPasswordCount && (
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              {plannedUserCount - plannedCustomPasswordCount} pakai password default ({IMPORT_DEFAULT_PASSWORD})
                            </span>
                          )}
                        </div>
                        {warningImportCount > 0 && (
                          <p className="mt-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            {warningImportCount} dari {validImportCount} baris siap diimpor memiliki data opsional kosong. Baris tersebut tetap dapat diimpor.
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={toggleSelectAllImportRows}
                        disabled={validImportCount === 0 || importing}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-650 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.04] cursor-pointer focus:outline-none"
                      >
                        <span className={`flex h-4 w-4 items-center justify-center rounded border ${allValidSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                          {allValidSelected && <CheckCircle2 className="h-3 w-3" />}
                        </span>
                        {allValidSelected ? 'Batalkan Semua' : 'Select All Data Valid'}
                      </button>
                    </div>

                    <div className="overflow-x-auto hide-scrollbar">
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
                                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all disabled:cursor-not-allowed disabled:opacity-40 ${row.selected
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
                                  {row.preview.email && (
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                      <p className="truncate text-[11px] font-semibold text-slate-450 dark:text-slate-500">{row.preview.email}</p>
                                      {row.preview.willCreateUser && (
                                        <span
                                          className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${row.preview.passwordSource === 'excel'
                                            ? 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                            : 'border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                                            }`}
                                          title={row.preview.passwordSource === 'excel'
                                            ? 'Akun dibuat dengan password dari kolom password di Excel'
                                            : `Akun dibuat dengan password default ${IMPORT_DEFAULT_PASSWORD}`}
                                        >
                                          + Akun · {row.preview.passwordSource === 'excel' ? 'pwd file' : 'pwd default'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-650 dark:text-slate-300">{row.preview.nik || '-'}</td>
                                <td className="px-4 py-3">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.preview.jabatan || '-'}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{row.preview.unit}</p>
                                    {row.preview.unitWillCreate && (
                                      <span className="rounded border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Unit baru</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs font-bold text-slate-650 dark:text-slate-300">{row.preview.grade}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${row.status === 'valid'
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
                                  ) : row.warnings.length > 0 ? (
                                    <p className="text-[11px] font-semibold leading-relaxed text-amber-600 dark:text-amber-400">{row.warnings.join(' ')}</p>
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

              <div className="flex flex-col gap-3 border-t border-slate-300 px-5 py-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-slate-450 dark:text-slate-500">
                  {selectedImportCount > 0 ? `${selectedImportCount} data valid dipilih untuk import.` : 'Pilih data valid dari preview sebelum import.'}
                </p>
                <div className="flex items-center justify-end gap-2 flex-wrap">
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
                    {importing ? 'Mengimport...' : `Import ${selectedImportCount || ''} Data`}
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
            <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl shadow-slate-900/10">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-300 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  {editTarget ? <Pencil className="h-4 w-4 text-indigo-500 dark:text-indigo-400" /> : <Plus className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />}
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">{editTarget ? 'Edit Data Employee' : 'Tambah Employee Baru'}</h2>
                </div>
                <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300 transition-all cursor-pointer focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto overflow-x-hidden hide-scrollbar">

                {/* Nama */}
                <div>
                  <label className={labelCls}>Nama Lengkap *</label>
                  <input type="text" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="cth: Budi Santoso, S.T."
                    className={`${inputCls} ${errors.nama ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                  {errors.nama && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nama}</span>}
                </div>
                {/* NRK & NIK */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>NRK *</label>
                    <input type="text" value={form.nrk} onChange={e => setForm(f => ({ ...f, nrk: e.target.value }))} placeholder="NRK-XXXXXX"
                      className={`${inputCls} ${errors.nrk ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                    {errors.nrk && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nrk}</span>}
                  </div>
                  <div>
                    <label className={labelCls}>NIK (16 digit) *</label>
                    <input type="text" value={form.nik} onChange={e => setForm(f => ({ ...f, nik: e.target.value.replace(/\D/g, '').slice(0, 16) }))} placeholder="320123456789xxxx" maxLength={16}
                      className={`${inputCls} ${errors.nik ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                    {errors.nik && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nik}</span>}
                  </div>
                </div>
                {/* Jenis Kelamin & Jabatan */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    <input type="text" value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))} placeholder="cth: IT Specialist"
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
                        className={`${inputCls} pl-10 pr-10 cursor-pointer flex items-center justify-between min-h-[42px] ${errors.unitPath ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''
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
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                            <input
                              type="text"
                              value={unitSearch}
                              placeholder="Cari nama atau kode unit..."
                              className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all"
                              onChange={(e) => setUnitSearch(e.target.value)}
                              autoFocus
                            />
                          </div>

                          {/* Options List */}
                          <style dangerouslySetInnerHTML={{
                            __html: `
                            .no-scrollbar::-webkit-scrollbar {
                              display: none;
                            }
                          ` }} />
                          <div
                            className="max-h-48 overflow-y-auto overflow-x-hidden space-y-0.5 pr-1 no-scrollbar"
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
                                    className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150 flex flex-col gap-0.5 hover:bg-slate-100 dark:hover:bg-white/[0.03] ${isSelected
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Tempat Lahir *</label>
                    <input type="text" value={form.tempatLahir} onChange={e => setForm(f => ({ ...f, tempatLahir: e.target.value }))} placeholder="cth: Jakarta"
                      className={`${inputCls} ${errors.tempatLahir ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                    {errors.tempatLahir && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.tempatLahir}</span>}
                  </div>
                  <div>
                    <label className={labelCls}>Tanggal Lahir *</label>
                    <CustomDatePicker
                      value={form.tanggalLahir}
                      onChange={val => setForm(f => ({ ...f, tanggalLahir: val }))}
                      placeholder="- Pilih Tanggal Lahir -"
                      error={!!errors.tanggalLahir}
                    />
                    {errors.tanggalLahir && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.tanggalLahir}</span>}
                  </div>
                </div>
                {/* Tanggal Masuk & Status */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Tanggal Masuk *</label>
                    <CustomDatePicker
                      value={form.tanggalMasuk}
                      onChange={val => setForm(f => ({ ...f, tanggalMasuk: val }))}
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      options={statusPernikahans.map(m => ({ value: m.id, label: `${m.kode} - ${m.label}` }))}
                      value={form.statusPernikahanId}
                      onChange={val => setForm(f => ({ ...f, statusPernikahanId: val }))}
                      placeholder="- Pilih Status -"
                      error={!!errors.statusPernikahanId}
                    />
                    {errors.statusPernikahanId && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.statusPernikahanId}</span>}
                  </div>
                </div>

                {/* Penempatan Area & Agama */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Penempatan Area Kerja</label>
                    <SearchSelect
                      searchable={true}
                      options={penempatanAreas.map(a => ({ value: a.id, label: a.nama }))}
                      value={form.penempatanAreaId}
                      onChange={val => setForm(f => ({ ...f, penempatanAreaId: val }))}
                      placeholder="- Pilih Penempatan -"
                      error={!!errors.penempatanAreaId}
                    />
                    {errors.penempatanAreaId && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.penempatanAreaId}</span>}
                  </div>
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
                          src={resolveImageUrl(editTarget.fotoProfil)}
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
                    <input type="tel" value={form.nomorHp} onChange={e => setForm(f => ({ ...f, nomorHp: e.target.value }))} placeholder="08xx-xxxx-xxxx"
                      className={`${inputCls} pl-10 ${errors.nomorHp ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                  </div>
                  {errors.nomorHp && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nomorHp}</span>}
                </div>

                {/* Alamat */}
                <div>
                  <label className={labelCls}>Alamat *</label>
                  <div className="relative z-0">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <textarea value={form.alamat} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} placeholder="Alamat lengkap..." rows={4}
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
                          src={resolveImageUrl(editTarget.fotoProfil)}
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
              <div className="flex items-center justify-end gap-3 border-t border-slate-300 dark:border-white/[0.06] px-5 py-4 flex-wrap">
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

      {/* User Form Modal via Portal */}
      <ModalPortal open={userModalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setUserModalOpen(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-lg animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl shadow-slate-900/10">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-300 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  {userModalEditMode ? <UserCog className="h-4 w-4 text-indigo-500 dark:text-indigo-400" /> : <UserPlus className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />}
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {userModalEditMode ? `Edit Akun User: ${userModalEmployee?.nama}` : `Buat Akun User: ${userModalEmployee?.nama}`}
                  </h2>
                </div>
                <button onClick={() => setUserModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300 transition-all cursor-pointer focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Email User *</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="nama@inl.co.id"
                      className={`${inputCls} ${userErrors.userEmail ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`}
                    />
                    {userErrors.userEmail && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{userErrors.userEmail}</span>}
                  </div>
                  <div>
                    <label className={labelCls}>
                      {userModalEditMode ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password User *'}
                    </label>
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder={userModalEditMode ? '••••••••' : 'Min 8 karakter, huruf + angka'}
                      className={`${inputCls} ${userErrors.userPassword ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`}
                    />
                    {userErrors.userPassword && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{userErrors.userPassword}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Role Akses *</label>
                    <SearchSelect
                      searchable={false}
                      options={[
                        { value: 'Admin', label: 'Admin' },
                        { value: 'User', label: 'User' },
                      ]}
                      value={userRole}
                      onChange={(val) => {
                        const nextRole = val as 'Admin' | 'User';
                        setUserRole(nextRole);
                      }}
                      placeholder="- Pilih Role -"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Status Akun *</label>
                    <SearchSelect
                      searchable={false}
                      disabled={userRole === 'Admin'}
                      options={[
                        { value: 'Aktif', label: 'Aktif' },
                        { value: 'Suspended', label: 'Suspended' },
                      ]}
                      value={userRole === 'Admin' ? 'Aktif' : userStatus}
                      onChange={(val) => setUserStatus(val as 'Aktif' | 'Suspended')}
                      placeholder="- Pilih Status -"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-300 dark:border-white/[0.06] px-5 py-4 flex-wrap">
                <button onClick={() => setUserModalOpen(false)} disabled={userSaving} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">Batal</button>
                <PrimaryButton onClick={handleUserSave} disabled={userSaving} className="flex items-center gap-2">
                  {userSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {userModalEditMode ? 'Simpan Perubahan' : 'Buat Akun'}
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
            <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl shadow-slate-900/10 p-6 text-center">
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

    </StaggerContainer>
  );
}
