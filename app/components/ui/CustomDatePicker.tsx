'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  error?: boolean;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function CustomDatePicker({
  value,
  onChange,
  className,
  placeholder = '- Pilih Tanggal -',
  error = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Current view month & year in calendar
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(parsedDate ? parsedDate.getFullYear() : today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(parsedDate ? parsedDate.getMonth() : today.getMonth());

  // Update calendar view when value changes from outside
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
    const grid = [];

    // Empty cells before start of month
    for (let i = 0; i < startOffset; i++) {
      grid.push(null);
    }

    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      grid.push(new Date(currentYear, currentMonth, day));
    }

    return grid;
  }, [currentYear, currentMonth]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleSelectDay = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Localized human-readable text trigger
  const displayString = useMemo(() => {
    if (!parsedDate) return placeholder;
    const day = parsedDate.getDate();
    const month = MONTH_NAMES[parsedDate.getMonth()].slice(0, 3);
    const year = parsedDate.getFullYear();
    return `${day} ${month} ${year}`;
  }, [parsedDate, placeholder]);

  // Year options: current year minus 80 to current year plus 10
  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    const years = [];
    for (let y = cy - 80; y <= cy + 10; y++) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0d1218] px-3.5 py-2.5 text-xs text-slate-800 dark:text-white hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all duration-150 cursor-pointer focus:outline-none min-h-[42px]",
          error && "border-rose-500 dark:border-rose-500/50 focus:border-rose-500",
          !parsedDate && "text-slate-400 dark:text-slate-500"
        )}
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="font-semibold">{displayString}</span>
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0a0f1a] shadow-2xl p-3.5 z-[99] space-y-3">
          
          {/* Month/Year Selection Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.04] pb-2.5 gap-1.5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {/* Month Dropdown */}
              <select
                value={currentMonth}
                onChange={e => setCurrentMonth(parseInt(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-850 dark:text-slate-200 border-none outline-none cursor-pointer focus:ring-0"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i} className="dark:bg-[#0a0f1a]">{name}</option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={currentYear}
                onChange={e => setCurrentYear(parseInt(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-850 dark:text-slate-200 border-none outline-none cursor-pointer focus:ring-0"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y} className="dark:bg-[#0a0f1a]">{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-555">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;
              
              const isSelected = parsedDate &&
                                 parsedDate.getDate() === date.getDate() &&
                                 parsedDate.getMonth() === date.getMonth() &&
                                 parsedDate.getFullYear() === date.getFullYear();

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => handleSelectDay(date)}
                  className={cn(
                    "h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all duration-100 cursor-pointer",
                    isSelected
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                      : "text-slate-700 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-white/[0.03]"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
