'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnitOption } from '../_lib/types';

interface UnitSelectSearchProps {
  units: UnitOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function UnitSelectSearch({
  units,
  value,
  onChange,
  placeholder = 'Cari & pilih unit...',
  emptyLabel = 'Tanpa unit khusus',
  disabled = false,
  className,
}: UnitSelectSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownId = useId();

  const selectedUnit = units.find(unit => unit.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  const filteredUnits = units.filter(unit => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      unit.nama.toLowerCase().includes(q) ||
      unit.kode.toLowerCase().includes(q) ||
      (unit.tipe && unit.tipe.toLowerCase().includes(q))
    );
  });

  const handleSelect = (unitId: string) => {
    onChange(unitId);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={dropdownId}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={event => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setOpen(!open);
          }
        }}
        className={cn(
          'flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus-visible:ring-amber-500/30',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700',
        )}
      >
        <span className="truncate">
          {selectedUnit ? (
            <span className="flex items-center gap-1.5">
              <span className="font-bold">{selectedUnit.nama}</span>
              <span className="text-[10px] text-slate-400">({selectedUnit.kode})</span>
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{emptyLabel}</span>
          )}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          {selectedUnit && !disabled && (
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                onChange('');
              }}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Hapus pilihan"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {open && (
        <div
          id={dropdownId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-100 p-2 dark:border-slate-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="max-h-44 overflow-y-auto p-1">
            <button
              type="button"
              role="option"
              aria-selected={value === ''}
              onClick={() => handleSelect('')}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs font-semibold transition-colors',
                value === ''
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60',
              )}
            >
              <span>{emptyLabel}</span>
              {value === '' && <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
            </button>

            {filteredUnits.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">Unit tidak ditemukan</div>
            ) : (
              filteredUnits.map(unit => {
                const isSelected = unit.id === value;
                return (
                  <button
                    key={unit.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(unit.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                      isSelected
                        ? 'bg-amber-50 font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{unit.nama}</span>
                      <span className="block text-[10px] text-slate-400">
                        {unit.kode} {unit.tipe ? `· ${unit.tipe.replaceAll('_', ' ')}` : ''}
                      </span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
