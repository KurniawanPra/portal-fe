'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Folder, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { inputClass } from './DocumentUi';
import type { DocumentCategory } from '../_lib/types';

interface CustomCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  categories: DocumentCategory[];
  placeholder?: string;
  className?: string;
}

export function CustomCategorySelect({
  value,
  onChange,
  categories,
  placeholder = 'Semua kategori',
  className,
}: CustomCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategory = categories.find(c => c.id === value);
  const selectedLabel = selectedCategory ? selectedCategory.name : placeholder;

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={cn('relative w-full', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          inputClass,
          'flex items-center justify-between gap-2 text-left cursor-pointer transition-all duration-200 select-none',
          isOpen && 'border-amber-500 ring-2 ring-amber-500/15'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Folder className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="truncate font-medium text-slate-800 dark:text-slate-100">
            {selectedLabel}
          </span>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
          {categories.length > 5 && (
            <div className="relative mb-1.5 p-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari kategori..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer',
              value === ''
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-bold'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
          >
            <span>{placeholder}</span>
            {value === '' && <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
          </button>

          {filteredCategories.map((cat) => {
            const isSelected = value === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => { onChange(cat.id); setIsOpen(false); setSearchTerm(''); }}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer mt-0.5',
                  isSelected
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-bold'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex flex-col truncate">
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{cat.code}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 ml-2" />}
              </button>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="p-3 text-center text-xs text-slate-400 italic">
              Kategori tidak ditemukan
            </div>
          )}
        </div>
      )}
    </div>
  );
}
