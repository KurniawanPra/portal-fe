'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Check, X, Palette } from 'lucide-react';
import { api } from '@/lib/api';
import { Toast, TableCard } from './shared';

interface TipeUnit {
  id: string;
  kode: string;
  label: string;
  level: number;
  warna: string;
}

interface EditingCell {
  id: string;
  field: 'label' | 'warna';
}

export default function TabTipeUnit() {
  const [data, setData] = useState<TipeUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showToast = (t: 'ok' | 'err', text: string) => {
    setToast({ type: t, text });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<any[]>('/master/tipe-unit');
      setData(res.data || []);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Click-outside to cancel edit
  useEffect(() => {
    if (!editing) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (editContainerRef.current && !editContainerRef.current.contains(e.target as Node)) {
        setEditing(null);
        setEditValue('');
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editing]);

  const startEdit = (row: TipeUnit, field: 'label' | 'warna') => {
    setEditing({ id: row.id, field });
    setEditValue(row[field]);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editing) return;
    const row = data.find(r => r.id === editing.id);
    if (!row) return;

    const newValue = editValue.trim();
    if (!newValue) {
      showToast('err', `${editing.field === 'label' ? 'Label' : 'Warna'} tidak boleh kosong.`);
      return;
    }

    if (newValue === row[editing.field]) {
      cancelEdit();
      return;
    }

    setSaving(editing.id);
    try {
      const payload = {
        label: editing.field === 'label' ? newValue : row.label,
        warna: editing.field === 'warna' ? newValue : row.warna,
      };
      await api.put(`/master/tipe-unit/${editing.id}`, payload);

      setData(prev => prev.map(r =>
        r.id === editing.id ? { ...r, ...payload } : r
      ));
      showToast('ok', `"${payload.label}" berhasil diperbarui.`);
      cancelEdit();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <>
      <Toast toast={toast} />
      <TableCard>
        {/* Header info */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Kustomisasi Tipe Unit</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Double-klik pada label atau warna untuk mengedit langsung.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              <span className="text-sm font-semibold text-slate-400">Memuat data tipe unit...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-150 dark:border-white/[0.04] bg-slate-50/20 dark:bg-white/[0.01]">
                  {['#', 'Tipe Unit', 'Warna Badge', 'Preview'].map(h => (
                    <th key={h} className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ${h === '#' ? 'w-12' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 font-semibold text-slate-400 dark:text-slate-500">
                      Tidak ada tipe unit.
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => {
                    const isEditingLabel = editing?.id === row.id && editing?.field === 'label';
                    const isEditingWarna = editing?.id === row.id && editing?.field === 'warna';
                    const isSaving = saving === row.id;
                    const rank = idx + 1;

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group">
                        <td className="px-5 py-3.5 w-12">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.06] text-[10px] font-black text-slate-500 dark:text-slate-400">
                            {rank}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          {isEditingLabel ? (
                            <div ref={editContainerRef} className="flex items-center gap-2">
                              <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isSaving}
                                className="w-full max-w-[200px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-150 focus:outline-none transition-colors"
                              />
                              <button
                                onClick={saveEdit}
                                disabled={isSaving}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer focus:outline-none"
                              >
                                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={isSaving}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer focus:outline-none"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span
                              onDoubleClick={() => startEdit(row, 'label')}
                              className="font-bold text-slate-700 dark:text-slate-200 cursor-pointer rounded-lg px-2 py-1 -mx-2 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all select-none inline-block border border-transparent group-hover:border-dashed group-hover:border-slate-350 dark:group-hover:border-slate-700"
                              title="Double-klik untuk edit"
                            >
                              {row.label}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          {isEditingWarna ? (
                            <div ref={editContainerRef} className="flex items-center gap-2">
                              <input
                                type="color"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                className="h-8 w-8 cursor-pointer rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-transparent shrink-0"
                              />
                              <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isSaving}
                                className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-150 focus:outline-none transition-colors"
                              />
                              <button
                                onClick={saveEdit}
                                disabled={isSaving}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer focus:outline-none"
                              >
                                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={isSaving}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer focus:outline-none"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onDoubleClick={() => startEdit(row, 'warna')}
                              className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1 -mx-2 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all select-none border border-transparent group-hover:border-dashed group-hover:border-slate-350 dark:group-hover:border-slate-700"
                              title="Double-klik untuk edit"
                            >
                              <span
                                className="h-4 w-4 rounded-full border border-slate-200 dark:border-white/10 shrink-0 shadow-sm"
                                style={{ backgroundColor: row.warna }}
                              />
                              <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {row.warna}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm"
                            style={{
                              backgroundColor: `${row.warna}18`,
                              color: row.warna,
                              border: `1px solid ${row.warna}30`,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: row.warna }}
                            />
                            {row.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </TableCard>
    </>
  );
}
