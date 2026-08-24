'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomDateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  className?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function CustomDateRangePicker({
  startDate,
  endDate,
  onChange,
  className,
  placeholder = 'Pilih Rentang Tanggal',
}: CustomDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const popoverWidth = 330;

    let left: number | undefined = rect.left;
    let right: number | undefined = undefined;

    if (rect.left + popoverWidth > screenWidth - 16) {
      left = undefined;
      right = Math.max(16, screenWidth - rect.right);
    }

    setCoords({
      top: rect.bottom + 6,
      left,
      right,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, { capture: true, passive: true });
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, { capture: true });
    };
  }, [isOpen, updateCoords]);



  // Parse start and end dates
  const startD = useMemo(() => (startDate ? new Date(startDate) : null), [startDate]);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(() => (startD ? startD.getFullYear() : today.getFullYear()));
  const [currentMonth, setCurrentMonth] = useState(() => (startD ? startD.getMonth() : today.getMonth()));

  // Selecting phase: 'start' or 'end'
  const [selectingPhase, setSelectingPhase] = useState<'start' | 'end'>('start');

  // Sync month view if start date changes externally
  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [startDate]);

  // Close popup on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'SELECT' || target.tagName === 'OPTION')) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const popoverEl = document.getElementById('custom-date-range-popover');
        if (popoverEl && popoverEl.contains(e.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysGrid = useMemo(() => {
    const totalDays = daysInMonth(currentYear, currentMonth);
    const startOffset = firstDayOfMonth(currentYear, currentMonth);
    const grid: (Date | null)[] = [];

    for (let i = 0; i < startOffset; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      grid.push(new Date(currentYear, currentMonth, day));
    }
    return grid;
  }, [currentYear, currentMonth]);

  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleSelectDay = (date: Date) => {
    const clickedStr = formatDateStr(date);

    if (selectingPhase === 'start' || !startDate || (startDate && endDate)) {
      onChange(clickedStr, '');
      setSelectingPhase('end');
    } else {
      if (new Date(clickedStr) < new Date(startDate)) {
        onChange(clickedStr, '');
        setSelectingPhase('end');
      } else {
        onChange(startDate, clickedStr);
        setSelectingPhase('start');
        setIsOpen(false);
      }
    }
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isStart = (date: Date) => {
    return startDate === formatDateStr(date);
  };

  const isEnd = (date: Date) => {
    return endDate === formatDateStr(date);
  };

  const isInRange = (date: Date) => {
    if (!startDate) return false;
    const current = date.getTime();
    const startT = new Date(startDate).getTime();

    if (endDate) {
      const endT = new Date(endDate).getTime();
      return current >= startT && current <= endT;
    }

    if (hoverDate && selectingPhase === 'end') {
      const hoverT = hoverDate.getTime();
      if (hoverT > startT) {
        return current >= startT && current <= hoverT;
      }
    }

    return false;
  };

  // Quick Preset Helper
  const applyPreset = (days: number | 'thisMonth' | 'thisYear') => {
    const now = new Date();
    let start: Date;
    const end: Date = now;

    if (days === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (days === 'thisYear') {
      start = new Date(now.getFullYear(), 0, 1);
    } else {
      start = new Date();
      start.setDate(now.getDate() - days);
    }

    const startStr = formatDateStr(start);
    const endStr = formatDateStr(end);
    onChange(startStr, endStr);
    setCurrentYear(start.getFullYear());
    setCurrentMonth(start.getMonth());
    setSelectingPhase('start');
    setIsOpen(false);
  };

  const clearRange = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange('', '');
    setSelectingPhase('start');
  };

  const formatDisplayDate = (str: string) => {
    if (!str) return '';
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={cn("relative w-full sm:w-auto", className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full sm:w-auto rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-100/90 dark:bg-[#111622] px-3.5 py-2.5 text-xs text-left font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-between gap-2 cursor-pointer focus:outline-none transition-all duration-200 min-h-[42px]",
          "shadow-[inset_2px_2px_5px_rgba(15,23,42,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.95)]",
          "dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.55),inset_-2px_-2px_6px_rgba(255,255,255,0.03)]",
          "hover:shadow-[2px_2px_6px_rgba(15,23,42,0.08),-2px_-2px_6px_rgba(255,255,255,0.95)]",
          isOpen && "border-amber-500/60 shadow-[inset_2px_2px_4px_rgba(245,158,11,0.12)] dark:border-amber-500/50"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
          {startDate || endDate ? (
            <span className="truncate font-bold text-slate-800 dark:text-amber-300">
              {formatDisplayDate(startDate)}
              {endDate ? ` — ${formatDisplayDate(endDate)}` : ' — (Pilih Tgl Akhir)'}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {(startDate || endDate) && (
            <span
              onClick={clearRange}
              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
              title="Reset Tanggal"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronLeft className={cn("h-3.5 w-3.5 text-slate-400 transition-transform duration-200", isOpen ? "rotate-90" : "-rotate-90")} />
        </div>
      </button>

      {/* Popover Card rendered via Portal to Body */}
      {isOpen && mounted && createPortal(
        <>


          <div
            id="custom-date-range-popover"
            style={
              typeof window !== 'undefined' && window.innerWidth >= 640 && coords
                ? {
                    position: 'fixed',
                    top: `${coords.top}px`,
                    left: coords.left !== undefined ? `${coords.left}px` : 'auto',
                    right: coords.right !== undefined ? `${coords.right}px` : 'auto',
                  }
                : {
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }
            }
            className="z-[9999] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/98 dark:bg-[#121824]/98 shadow-[0_16px_36px_rgba(15,23,42,0.2)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.7)] p-3.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 w-[calc(100vw-2rem)] max-w-[330px] sm:w-[330px] sm:max-w-none"
          >
            {/* Header Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => applyPreset(0)}
                className="px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 transition-all cursor-pointer shrink-0"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => applyPreset(7)}
                className="px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 transition-all cursor-pointer shrink-0"
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 transition-all cursor-pointer shrink-0"
              >
                30 Hari
              </button>
              <button
                type="button"
                onClick={() => applyPreset('thisMonth')}
                className="px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 transition-all cursor-pointer shrink-0"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => applyPreset('thisYear')}
                className="px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 transition-all cursor-pointer shrink-0"
              >
                Tahun Ini
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between pt-3 pb-2">
              <button
                type="button"
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(y => y - 1);
                  } else {
                    setCurrentMonth(m => m - 1);
                  }
                }}
                className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-xs font-black tracking-wide text-slate-800 dark:text-slate-100">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(y => y + 1);
                  } else {
                    setCurrentMonth(m => m + 1);
                  }
                }}
                className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday Names */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                <span key={d} className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysGrid.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const start = isStart(date);
                const end = isEnd(date);
                const inRange = isInRange(date);
                const todayMark = isToday(date);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onMouseEnter={() => setHoverDate(date)}
                    onClick={() => handleSelectDay(date)}
                    className={cn(
                      "aspect-square w-full rounded-lg text-xs font-extrabold transition-all duration-150 relative flex items-center justify-center cursor-pointer",
                      todayMark && !start && !end && "border border-amber-500/60 text-amber-600 dark:text-amber-400 font-black",
                      inRange && !start && !end && "bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded-none",
                      start && "bg-amber-500 text-white font-black shadow-md shadow-amber-500/30 rounded-l-lg rounded-r-none z-10 scale-105",
                      end && "bg-amber-500 text-white font-black shadow-md shadow-amber-500/30 rounded-r-lg rounded-l-none z-10 scale-105",
                      start && end && "rounded-lg",
                      !inRange && !start && !end && "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer Controls */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => clearRange()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition-all cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
