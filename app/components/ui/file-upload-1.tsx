'use client';

import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface FileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  accept?: string;
  loading?: boolean;
  disabled?: boolean;
  placeholderText?: string;
  subText?: string;
  error?: string | null;
}

export default function FileUpload05({
  value,
  onChange,
  onRemove,
  accept = '.xlsx,.xls',
  loading = false,
  disabled = false,
  placeholderText = 'Pilih atau drag & drop file Excel',
  subText = 'Format .xlsx atau .xls. Kolom mengikuti template import employee.',
  error = null
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || loading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || loading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || loading) return;
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
      e.target.value = ''; // Reset input value so same file can be selected again
    }
  };

  const triggerSelectFile = () => {
    if (disabled || loading) return;
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-2" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerSelectFile}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer ${
          disabled || loading
            ? 'opacity-60 cursor-not-allowed border-slate-200 dark:border-white/[0.04] bg-slate-100/50 dark:bg-[#111622]/50'
            : isDragging
            ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 scale-[1.01] shadow-[inset_2px_2px_6px_rgba(245,158,11,0.15)]'
            : 'border-slate-200/80 hover:border-amber-500/60 bg-slate-100/80 dark:border-white/[0.06] dark:bg-[#111622] shadow-[inset_2px_2px_6px_rgba(15,23,42,0.06),inset_-2px_-2px_6px_rgba(255,255,255,0.95)] dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.55),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] hover:shadow-[2px_2px_8px_rgba(15,23,42,0.08),-2px_-2px_8px_rgba(255,255,255,0.95)]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept={accept}
          disabled={disabled || loading}
          onChange={handleFileChange}
          className="sr-only"
        />

        {value ? (
          <div className="flex flex-col items-center gap-2.5 w-full max-w-md pointer-events-none">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {value.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-450 dark:text-slate-500">
                {formatFileSize(value.size)}
              </p>
            </div>
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                disabled={disabled || loading}
                className="mt-2 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 pointer-events-auto dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-450 dark:hover:text-slate-200"
              >
                Ganti File
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {loading && (
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-700 dark:text-slate-250">
                {placeholderText}
              </p>
              <p className="text-xs text-slate-450 dark:text-slate-500">
                {subText}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/15 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-350 animate-fade-in">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
