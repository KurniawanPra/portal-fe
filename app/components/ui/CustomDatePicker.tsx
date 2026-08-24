'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalPortal } from '@/components/ui/ModalPortal';

interface CustomDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  error?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  maxDate?: string;
  minDate?: string;
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
  isOpen: externalIsOpen,
  onOpenChange,
  maxDate,
  minDate,
}: CustomDatePickerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const setIsOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(next);
    }
    if (onOpenChange) {
      onOpenChange(next);
    }
  };

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Update popover position when isOpen changes or window resizes
  useEffect(() => {
    if (!isOpen) return;

    const updateCoords = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const popoverWidth = 288; // 72 * 4
        const popoverHeight = 310;

        let top = rect.bottom + 6;
        if (top + popoverHeight > window.innerHeight) {
          top = Math.max(10, rect.top - popoverHeight - 6);
        }

        let left = rect.left;
        if (left + popoverWidth > window.innerWidth - 10) {
          left = Math.max(10, window.innerWidth - popoverWidth - 10);
        }

        setCoords({ top, left });
      }
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  // Parse current value
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(parsedDate ? parsedDate.getFullYear() : today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(parsedDate ? parsedDate.getMonth() : today.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysGrid = useMemo(() => {
    const totalDays = daysInMonth(currentYear, currentMonth);
    const startOffset = firstDayOfMonth(currentYear, currentMonth);
    const grid = [];

    for (let i = 0; i < startOffset; i++) {
      grid.push(null);
    }
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

  const displayString = useMemo(() => {
    if (!parsedDate) return placeholder;
    const day = parsedDate.getDate();
    const month = MONTH_NAMES[parsedDate.getMonth()].slice(0, 3);
    const year = parsedDate.getFullYear();
    return `${day} ${month} ${year}`;
  }, [parsedDate, placeholder]);

  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    const years = [];
    for (let y = cy - 80; y <= cy + 10; y++) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#111622] px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 hover:border-amber-500/60 dark:hover:border-amber-500/50 transition-all duration-200 cursor-pointer focus:outline-none min-h-[42px]",
          "shadow-[inset_2px_2px_5px_rgba(15,23,42,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.95)]",
          "dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.55),inset_-2px_-2px_6px_rgba(255,255,255,0.03)]",
          error && "border-rose-500 dark:border-rose-500/50 focus:border-rose-500",
          !parsedDate && "text-slate-400 dark:text-slate-500",
          isOpen && "border-amber-500 ring-2 ring-amber-500/20"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="font-bold truncate">{displayString}</span>
        </span>

        {value && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
            title="Hapus tanggal"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
          </span>
        )}
      </button>

      {/* Render via ModalPortal so it escapes ALL parent containers, overflows, and filters */}
      <ModalPortal open={isOpen}>
        {/* Full-Screen Backdrop Overlay Blur */}
        <div
          className="fixed inset-0 z-[9998] bg-slate-950/30 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />

        {/* Floating Solid Popover Card */}
        <div
          style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
          className="fixed w-72 rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#151b26] shadow-[0_25px_60px_rgba(15,23,42,0.35)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-3.5 z-[9999] space-y-3 animate-ios-popover"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.06] pb-2.5 gap-1.5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all duration-150"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              <select
                value={currentMonth}
                onChange={e => setCurrentMonth(parseInt(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 border-none outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i} className="bg-white dark:bg-[#151b26] text-slate-900 dark:text-slate-100">{name}</option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={e => setCurrentYear(parseInt(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 border-none outline-none cursor-pointer"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y} className="bg-white dark:bg-[#151b26] text-slate-900 dark:text-slate-100">{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all duration-150"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
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

              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const isDisabledMax = maxDate ? dateStr > maxDate : false;
              const isDisabledMin = minDate ? dateStr < minDate : false;
              const isDisabled = isDisabledMax || isDisabledMin;

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(date)}
                  className={cn(
                    "h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-150 cursor-pointer",
                    isDisabled && "opacity-25 pointer-events-none",
                    isSelected
                      ? "bg-amber-500 text-white font-black shadow-[2px_2px_6px_rgba(245,158,11,0.4)]"
                      : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
