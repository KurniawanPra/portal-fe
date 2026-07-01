'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchSelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  searchable?: boolean;
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = '- Pilih -',
  emptyText = 'Tidak ada pilihan ditemukan',
  disabled = false,
  className,
  error = false,
  searchable = true,
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
    );
  }, [options, searchTerm]);

  // Reset search term when dropdown closes/opens
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  return (
    <div className={cn("relative w-full", isOpen ? "z-30" : "z-10", className)} ref={ref}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] px-3.5 py-2.5 text-xs text-left font-semibold text-slate-800 dark:text-white flex items-center justify-between cursor-pointer focus:outline-none focus:border-amber-500/50 dark:focus:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px]",
          error && "border-rose-500 dark:border-rose-500/50 focus:border-rose-500",
          isOpen && "border-amber-500/50 dark:focus:border-amber-500/50"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-slate-400 dark:text-slate-500")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 dark:text-slate-555 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0a0f1a] shadow-xl p-2 z-50 space-y-1.5">
          {/* Search Box */}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b12] py-2 pl-9 pr-8 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500/50 focus:bg-white dark:focus:bg-[#0a0f1a]"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 no-scrollbar pr-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left rounded-xl px-3 py-2 text-xs transition-all duration-150 flex flex-col gap-0.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer",
                      isSelected
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border-l-2 border-amber-500 pl-2.5 rounded-l-none"
                        : "text-slate-700 dark:text-white"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.subLabel && (
                      <span className={cn(
                        "text-[9px] font-semibold truncate",
                        isSelected ? "text-amber-500 dark:text-amber-500" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {opt.subLabel}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs font-semibold text-slate-400 dark:text-slate-555">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
