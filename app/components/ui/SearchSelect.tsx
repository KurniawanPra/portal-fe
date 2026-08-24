'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalPortal } from '@/components/ui/ModalPortal';

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
  direction?: 'down' | 'up' | 'auto';
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
  direction = 'auto',
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number }>({ left: 0, width: 0 });

  // Update coords when open, resized, or scrolled
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const width = Math.max(rect.width, 140);
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const popoverHeightEstimate = 280;

        let effectiveDirection = direction;
        if (direction === 'auto' || !direction) {
          if (spaceBelow < popoverHeightEstimate && spaceAbove > spaceBelow) {
            effectiveDirection = 'up';
          } else {
            effectiveDirection = 'down';
          }
        }

        const clampedLeft = Math.max(12, Math.min(rect.left, window.innerWidth - width - 16));

        if (effectiveDirection === 'up') {
          const maxH = Math.min(280, Math.max(120, spaceAbove - 20));
          setCoords({
            bottom: window.innerHeight - rect.top + 6,
            left: clampedLeft,
            width,
            maxHeight: maxH,
          });
        } else {
          const maxH = Math.min(280, Math.max(120, spaceBelow - 20));
          setCoords({
            top: rect.bottom + 6,
            left: clampedLeft,
            width,
            maxHeight: maxH,
          });
        }
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, direction]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
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
    <div className={cn("relative w-full", className)}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-[#f8fafc] dark:bg-[#111622] px-3.5 py-2.5 text-xs text-left font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-between cursor-pointer focus:outline-none transition-all duration-200 min-h-[42px]",
          "shadow-[inset_2px_2px_5px_rgba(15,23,42,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.95)]",
          "dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.55),inset_-2px_-2px_6px_rgba(255,255,255,0.03)]",
          "hover:shadow-[2px_2px_6px_rgba(15,23,42,0.08),-2px_-2px_6px_rgba(255,255,255,0.95)]",
          error && "border-rose-500 dark:border-rose-500/50 focus:border-rose-500",
          isOpen && "border-amber-500/80 ring-2 ring-amber-500/20 shadow-[inset_2px_2px_4px_rgba(245,158,11,0.12)] dark:border-amber-500/60"
        )}
      >
        <span className={cn("truncate font-bold", !selectedOption && "text-slate-400 dark:text-slate-500")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ml-1", isOpen && "rotate-180")} />
      </button>

      {/* Render Popover via ModalPortal escaping all parent clipping and stacking contexts */}
      <ModalPortal open={isOpen}>
        {/* Soft Click Backdrop */}
        <div
          className="fixed inset-0 z-[9990] bg-transparent"
          onClick={() => setIsOpen(false)}
        />

        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: coords.top !== undefined ? `${coords.top}px` : undefined,
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : undefined,
          }}
          className="rounded-2xl border border-slate-200/90 dark:border-white/[0.1] bg-white dark:bg-[#151b26] shadow-[0_20px_50px_rgba(15,23,42,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-2 z-[9999] space-y-1.5 animate-ios-popover flex flex-col"
        >
          {/* Search Box */}
          {searchable && (
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-600 dark:text-amber-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari..."
                className="w-full rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0e131d] py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none shadow-[inset_2px_2px_4px_rgba(15,23,42,0.06)] dark:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5)] focus:border-amber-500/50 transition-all duration-150"
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
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-0.5 no-scrollbar pr-0.5">
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
                      "w-full text-left rounded-xl px-3 py-2 text-xs transition-all duration-150 flex flex-col gap-0.5 cursor-pointer font-bold border",
                      isSelected
                        ? "border-amber-500/80 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold shadow-sm shadow-amber-500/10 hover:bg-amber-500/20"
                        : "border-transparent text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-amber-600 dark:hover:text-amber-400"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.subLabel && (
                      <span className={cn(
                        "text-[9px] font-semibold truncate",
                        isSelected ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {opt.subLabel}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
