export type JenisKelamin = 'L' | 'P';

export interface EmployeeData {
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
  penempatanAreaId: string;
  fotoProfil: string;
  agama?: string | null;
  atasanId?: string;
  atasanNama?: string;
}

export interface UnitOrganisasi {
  id: string;
  kode: string;
  nama: string;
  tipe: string;
  parentId: string | null;
  isActive: boolean;
}

export interface FormDataState {
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
