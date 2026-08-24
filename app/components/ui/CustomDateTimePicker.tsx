'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomDateTimePickerProps {
  value: string; // Format: YYYY-MM-DDTHH:mm
  onChange: (val: string) => void;
  className?: string;
}

export function CustomDateTimePicker({
  value,
  onChange,
  className,
}: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parsedDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  // Current view month & year in calendar
  const [currentYear, setCurrentYear] = useState(parsedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(parsedDate.getMonth()); // 0-11

  // Time state
  const [hour, setHour] = useState(parsedDate.getHours());
  const [minute, setMinute] = useState(parsedDate.getMinutes());

  // Update calendar view when value changes from outside
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
        setHour(d.getHours());
        setMinute(d.getMinutes());
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

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 is Sunday

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
    const hh = String(hour).padStart(2, '0');
    const min = String(minute).padStart(2, '0');
    
    onChange(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: number) => {
    let newHour = hour;
    let newMinute = minute;

    if (type === 'hour') {
      newHour = Math.max(0, Math.min(23, val));
      setHour(newHour);
    } else {
      newMinute = Math.max(0, Math.min(59, val));
      setMinute(newMinute);
    }

    const yyyy = parsedDate.getFullYear();
    const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(parsedDate.getDate()).padStart(2, '0');
    const hh = String(newHour).padStart(2, '0');
    const min = String(newMinute).padStart(2, '0');

    onChange(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  };

  // Localized human-readable text trigger
  const displayString = useMemo(() => {
    if (!value) return '- Pilih Tanggal & Waktu -';
    const day = parsedDate.getDate();
    const month = monthNames[parsedDate.getMonth()].slice(0, 3);
    const year = parsedDate.getFullYear();
    const hh = String(parsedDate.getHours()).padStart(2, '0');
    const mm = String(parsedDate.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hh}:${mm}`;
  }, [value, parsedDate]);

  return (
    <div className={cn("relative inline-block w-full sm:w-auto", className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:border-amber-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/10"
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="font-semibold">{displayString}</span>
        </span>
        <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto left-0 sm:left-auto mt-2 w-72 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0a0f1a] shadow-xl p-3 z-50 space-y-3">
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.04] pb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-850 dark:text-slate-200">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-550">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;
              
              const isSelected = parsedDate.getDate() === date.getDate() &&
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
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time Picker Controls */}
          <div className="flex items-center justify-between border-t border-slate-105 dark:border-white/[0.04] pt-3">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Waktu</span>
            </div>
            
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={23}
                value={String(hour).padStart(2, '0')}
                onChange={e => handleTimeChange('hour', parseInt(e.target.value) || 0)}
                className="w-10 rounded border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/50 py-1 text-center text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500/50"
              />
              <span className="text-slate-400 dark:text-slate-650 font-bold">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={String(minute).padStart(2, '0')}
                onChange={e => handleTimeChange('minute', parseInt(e.target.value) || 0)}
                className="w-10 rounded border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/50 py-1 text-center text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
