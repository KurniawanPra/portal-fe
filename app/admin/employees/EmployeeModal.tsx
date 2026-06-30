'use client';

import React from 'react';
import { X, Building2, Pencil, Plus, Loader2, User } from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';
import { EmployeeData, FormDataState, UnitOrganisasi, JenisKelamin } from './types';
import { inputCls, labelCls } from '@/admin/master/components/shared';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTarget: EmployeeData | null;
  form: FormDataState;
  setForm: React.Dispatch<React.SetStateAction<FormDataState>>;
  errors: Record<string, string>;
  grades: any[];
  statusKaryawans: any[];
  pendidikans: any[];
  statusPernikahans: any[];
  penempatanAreas: any[];
  employees: EmployeeData[];
  unitOrganisasis: UnitOrganisasi[];
  saving: boolean;
  photoFile: File | null;
  setPhotoFile: (file: File | null) => void;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  handleSave: () => void;
  getLabel: (t: string) => string;
  getUnitPathStr: (unitId: string) => string;
}

export function EmployeeModal({
  isOpen,
  onClose,
  editTarget,
  form,
  setForm,
  errors,
  grades,
  statusKaryawans,
  pendidikans,
  statusPernikahans,
  penempatanAreas,
  employees,
  unitOrganisasis,
  saving,
  photoFile,
  setPhotoFile,
  isDragging,
  setIsDragging,
  handleSave,
  getLabel,
  getUnitPathStr,
}: EmployeeModalProps) {
  return (
    <ModalPortal open={isOpen}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-xl animate-fade-up">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                {editTarget ? <Pencil className="h-4 w-4 text-indigo-500 dark:text-indigo-400" /> : <Plus className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />}
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">{editTarget ? 'Edit Data Employee' : 'Tambah Employee Baru'}</h2>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-330 transition-all cursor-pointer focus:outline-none">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto hide-scrollbar">
              {/* Nama */}
              <div>
                <label className={labelCls}>Nama Lengkap *</label>
                <input type="text" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="cth: Budi Santoso, S.T." className={`${inputCls} ${errors.nama ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
              </div>
              {/* NRK & NIK */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>NRK *</label>
                  <input type="text" value={form.nrk} onChange={e => setForm(f => ({ ...f, nrk: e.target.value }))} placeholder="NRK-XXXXXX" className={`${inputCls} ${errors.nrk ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                </div>
                <div>
                  <label className={labelCls}>NIK *</label>
                  <input type="text" value={form.nik} onChange={e => setForm(f => ({ ...f, nik: e.target.value.replace(/\D/g, '').slice(0, 16) }))} placeholder="320123456789xxxx" maxLength={16} className={`${inputCls} ${errors.nik ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
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
                      { value: 'P', label: 'Perempuan' },
                    ]}
                    value={form.jenisKelamin}
                    onChange={val => setForm(f => ({ ...f, jenisKelamin: val as JenisKelamin }))}
                    placeholder="- Pilih Jenis Kelamin -"
                  />
                </div>
                <div>
                  <label className={labelCls}>Jabatan *</label>
                  <input type="text" value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))} placeholder="cth: IT Specialist" className={`${inputCls} ${errors.jabatan ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                </div>
              </div>

              {/* Searchable Unit Organisasi Dropdown */}
              <div className="space-y-3 p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01]">
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-550 dark:text-slate-400 mb-1">Unit Organisasi</div>

                {/* Selected Unit Parent Path */}
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

                {/* Searchable Unit Organisasi Dropdown */}
                <div className="relative">
                  <label className={labelCls}>Pilih Unit Kerja *</label>
                  <SearchSelect
                    options={unitOrganisasis.filter(u => u.isActive || form.unitPath[form.unitPath.length - 1] === u.id).map(u => ({
                      value: u.id,
                      label: `${u.nama} (${getLabel(u.tipe)})`,
                      subLabel: getUnitPathStr(u.id),
                    }))}
                    value={form.unitPath[form.unitPath.length - 1] ?? ''}
                    onChange={val => {
                      const path: string[] = [];
                      let curr = unitOrganisasis.find(unit => unit.id === val);
                      while (curr) {
                        path.unshift(curr.id);
                        const pId = curr.parentId;
                        curr = pId ? unitOrganisasis.find(unit => unit.id === pId) : undefined;
                      }
                      setForm(f => ({ ...f, unitPath: path }));
                    }}
                    placeholder="- Pilih Unit Kerja -"
                    error={!!errors.unitPath}
                  />
                </div>
              </div>

              {/* Tempat Lahir & Tanggal Lahir & Tanggal Masuk & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tempat Lahir</label>
                  <input type="text" value={form.tempatLahir} onChange={e => setForm(f => ({ ...f, tempatLahir: e.target.value }))} placeholder="cth: Jakarta" className={`${inputCls} ${errors.tempatLahir ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                </div>
                <div>
                  <label className={labelCls}>Tanggal Lahir</label>
                  <CustomDatePicker
                    value={form.tanggalLahir}
                    onChange={val => setForm(f => ({ ...f, tanggalLahir: val }))}
                    placeholder="- Pilih Tanggal Lahir -"
                    error={!!errors.tanggalLahir}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tanggal Masuk Kerja</label>
                  <CustomDatePicker
                    value={form.tanggalMasuk}
                    onChange={val => setForm(f => ({ ...f, tanggalMasuk: val }))}
                    placeholder="- Pilih Tanggal Masuk Kerja -"
                    error={!!errors.tanggalMasuk}
                  />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <SearchSelect
                    searchable={false}
                    options={[
                      { value: 'true', label: 'Aktif' },
                      { value: 'false', label: 'Non-Aktif' },
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
                  <label className={labelCls}>Grade / Golongan</label>
                  <SearchSelect
                    searchable={false}
                    options={[
                      { value: '', label: '- Pilih Grade -' },
                      ...grades.map(g => ({
                        value: g.id,
                        label: `${g.kode} - ${g.label}`,
                      }))
                    ]}
                    value={form.gradeId}
                    onChange={val => setForm(f => ({ ...f, gradeId: val }))}
                    placeholder="- Pilih Grade -"
                    error={!!errors.gradeId}
                  />
                </div>
                <div>
                  <label className={labelCls}>Status Karyawan</label>
                  <SearchSelect
                    searchable={false}
                    options={[
                      { value: '', label: '- Pilih Status -' },
                      ...statusKaryawans.map(s => ({
                        value: s.id,
                        label: s.label,
                      }))
                    ]}
                    value={form.statusKaryawanId}
                    onChange={val => setForm(f => ({ ...f, statusKaryawanId: val }))}
                    placeholder="- Pilih Status -"
                    error={!!errors.statusKaryawanId}
                  />
                </div>
              </div>

              {/* Pendidikan & Status Pernikahan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Pendidikan Terakhir</label>
                  <SearchSelect
                    searchable={false}
                    options={[
                      { value: '', label: '- Pilih Pendidikan -' },
                      ...pendidikans.map(p => ({
                        value: p.id,
                        label: p.label,
                      }))
                    ]}
                    value={form.pendidikanTerakhirId}
                    onChange={val => setForm(f => ({ ...f, pendidikanTerakhirId: val }))}
                    placeholder="- Pilih Pendidikan -"
                    error={!!errors.pendidikanTerakhirId}
                  />
                </div>
                <div>
                  <label className={labelCls}>Status Pernikahan</label>
                  <SearchSelect
                    searchable={false}
                    options={[
                      { value: '', label: '- Pilih Status -' },
                      ...statusPernikahans.map(m => ({
                        value: m.id,
                        label: m.label,
                      }))
                    ]}
                    value={form.statusPernikahanId}
                    onChange={val => setForm(f => ({ ...f, statusPernikahanId: val }))}
                    placeholder="- Pilih Status -"
                    error={!!errors.statusPernikahanId}
                  />
                </div>
                <div>
                  <label className={labelCls}>Penempatan Area Kerja</label>
                  <SearchSelect
                    searchable={true}
                    options={[
                      { value: '', label: '- Pilih Penempatan -' },
                      ...penempatanAreas.map(a => ({
                        value: a.id,
                        label: a.nama,
                      }))
                    ]}
                    value={form.penempatanAreaId}
                    onChange={val => setForm(f => ({ ...f, penempatanAreaId: val }))}
                    placeholder="- Pilih Penempatan -"
                    error={!!errors.penempatanAreaId}
                  />
                </div>
                <div>
                  <label className={labelCls}>Agama</label>
                  <SearchSelect
                    searchable={false}
                    options={[
                      { value: '', label: '- Pilih Agama -' },
                      { value: 'Islam', label: 'Islam' },
                      { value: 'Kristen Protestan', label: 'Kristen Protestan' },
                      { value: 'Katolik', label: 'Katolik' },
                      { value: 'Hindu', label: 'Hindu' },
                      { value: 'Buddha', label: 'Buddha' },
                      { value: 'Khonghucu', label: 'Khonghucu' }
                    ]}
                    value={form.agama}
                    onChange={val => setForm(f => ({ ...f, agama: val }))}
                    placeholder="- Pilih Agama -"
                    error={!!errors.agama}
                  />
                </div>
              </div>

              {/* Atasan Langsung */}
              <div className="space-y-1">
                <label className={labelCls}>Atasan Langsung</label>
                <SearchSelect
                  options={employees
                    .filter(emp => !editTarget || emp.id !== editTarget.id)
                    .map(emp => ({
                      value: emp.id,
                      label: `${emp.nama} (${emp.nrk})`,
                      subLabel: emp.jabatan,
                    }))}
                  value={form.atasanId}
                  onChange={val => setForm(f => ({ ...f, atasanId: val }))}
                  placeholder="- Pilih Atasan Langsung -"
                />
              </div>

              {/* Nomor HP & Alamat */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={labelCls}>Nomor HP *</label>
                  <input type="tel" value={form.nomorHp} onChange={e => setForm(f => ({ ...f, nomorHp: e.target.value }))} placeholder="08xx-xxxx-xxxx" className={`${inputCls} ${errors.nomorHp ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                </div>
                <div>
                  <label className={labelCls}>Alamat Domisili *</label>
                  <textarea value={form.alamat} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} placeholder="Alamat lengkap..." rows={3} className={`${inputCls} resize-none ${errors.alamat ? '!border-rose-500 focus:!border-rose-500 focus:ring-rose-500/10' : ''}`} />
                </div>
              </div>

              {/* Foto Profil Upload */}
              <div className="space-y-2">
                <label className={labelCls}>Foto Profil</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0] || null;
                    if (file && file.type.startsWith('image/')) {
                      setPhotoFile(file);
                    }
                  }}
                  className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-200 ${isDragging
                      ? 'border-dashed border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 scale-[1.01]'
                      : 'border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01]'
                    }`}
                >
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
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-white/[0.04] shadow-sm">
                        <User className="h-6 w-6" />
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
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      {isDragging ? 'Lepaskan gambar di sini...' : 'Format: JPG, PNG, GIF. Max 2MB. Bisa seret & lepas.'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
              <button onClick={onClose} disabled={saving} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">Batal</button>
              <LiquidButton variant="outline" size="sm" onClick={handleSave} disabled={saving} className="cursor-pointer font-bold flex items-center gap-2">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-550" />}
                {editTarget ? 'Simpan Perubahan' : 'Tambahkan'}
              </LiquidButton>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
