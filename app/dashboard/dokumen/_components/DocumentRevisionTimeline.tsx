'use client';

import { useState } from 'react';
import { Check, Eye, FileText, GitCommit, History, Loader2, Power, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadDocumentVersionFile, formatDocumentDate, formatFileSize } from '../_lib/document-api';
import type { DocumentVersion } from '../_lib/types';

interface DocumentRevisionTimelineProps {
  versions: DocumentVersion[];
  currentVersion: number;
  loading?: boolean;
  canManageVersion?: boolean;
  documentId?: string;
  documentTitle?: string;
  onActivateVersion?: (versionNumber: number) => Promise<void>;
  onError?: (message: string) => void;
}

export function DocumentRevisionTimeline({
  versions,
  currentVersion,
  loading = false,
  canManageVersion = true,
  documentId,
  documentTitle,
  onActivateVersion,
  onError,
}: DocumentRevisionTimelineProps) {
  const [activatingVersion, setActivatingVersion] = useState<number | null>(null);
  const [downloadingVersion, setDownloadingVersion] = useState<number | null>(null);

  const handleActivate = async (verNumber: number) => {
    if (!onActivateVersion || verNumber === currentVersion || activatingVersion !== null) return;
    setActivatingVersion(verNumber);
    try {
      await onActivateVersion(verNumber);
    } finally {
      setActivatingVersion(null);
    }
  };

  const handleDownloadVersion = async (verNumber: number) => {
    if (!documentId || downloadingVersion !== null) return;
    setDownloadingVersion(verNumber);
    try {
      await downloadDocumentVersionFile(documentId, verNumber, documentTitle || 'dokumen');
    } catch (err: any) {
      if (onError) onError(err?.message || 'Gagal mengunduh file revisi.');
    } finally {
      setDownloadingVersion(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <GitCommit className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Riwayat Revisi (Commit Log)</h2>
        </div>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {versions.length} Revisi
        </span>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-amber-500" />
            <span className="mt-2 block text-xs font-semibold text-slate-400">Memuat riwayat revisi...</span>
          </div>
        ) : versions.length === 0 ? (
          <div className="py-8 text-center">
            <History className="mx-auto h-5 w-5 text-slate-400" />
            <span className="mt-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
              Belum ada riwayat revisi tambahan.
            </span>
          </div>
        ) : (
          <div className="relative pl-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {versions.map(ver => {
              const isActive = ver.version === currentVersion;
              const isBusy = activatingVersion === ver.version;
              const isDownloading = downloadingVersion === ver.version;

              return (
                <div key={ver.id} className="relative pb-6 last:pb-0">
                  {/* Commit Node Marker */}
                  <span
                    className={cn(
                      'absolute -left-[19px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white transition-colors dark:bg-slate-900',
                      isActive
                        ? 'border-emerald-500 text-emerald-500 ring-4 ring-emerald-500/15 dark:border-emerald-400'
                        : 'border-slate-300 dark:border-slate-700',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isActive ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-400 dark:bg-slate-600',
                      )}
                    />
                  </span>

                  {/* Version Entry Box */}
                  <div
                    className={cn(
                      'rounded-lg border p-4 transition-all',
                      isActive
                        ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-950/70 dark:bg-emerald-950/20'
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/40 dark:hover:border-slate-800',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider',
                            isActive
                              ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                          )}
                        >
                          v{ver.version} {isActive ? '· (Aktif)' : ''}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {formatDocumentDate(ver.createdAt)}
                        </span>
                      </div>

                      {/* Action Buttons: Preview / Download File & ON/OFF Switch */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mr-1">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>{ver.mimeType.split('/').pop()?.toUpperCase()}</span>
                          <span>·</span>
                          <span>{formatFileSize(ver.fileSize)}</span>
                        </span>

                        {/* Preview / Download specific revision file button */}
                        {canManageVersion && documentId && (
                          <button
                            type="button"
                            disabled={downloadingVersion !== null}
                            onClick={() => handleDownloadVersion(ver.version)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 transition-all cursor-pointer shadow-xs"
                            title={`Preview / Unduh berkas revisi versi v${ver.version}`}
                          >
                            {isDownloading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            )}
                            <span>Lihat File (v{ver.version})</span>
                          </button>
                        )}

                        {/* ON/OFF Toggle Switch for Active Version */}
                        {canManageVersion && onActivateVersion && (
                          <button
                            type="button"
                            disabled={isActive || activatingVersion !== null}
                            onClick={() => handleActivate(ver.version)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold transition-all',
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 cursor-default ring-1 ring-emerald-500/30'
                                : 'bg-slate-200 text-slate-600 hover:bg-amber-500 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-500 dark:hover:text-white cursor-pointer shadow-xs',
                            )}
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isActive ? (
                              <>
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>ON (Aktif)</span>
                              </>
                            ) : (
                              <>
                                <Power className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
                                <span>OFF (Aktifkan Versi Ini)</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Commit Message / Changelog */}
                    <p className="mt-2.5 text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                      {ver.changelog || `Revisi versi v${ver.version}`}
                    </p>

                    {/* Uploader Author */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-100 pt-2 dark:border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>
                          Diunggah oleh: <strong className="text-slate-700 dark:text-slate-200">{ver.uploadedByName || 'Karyawan'}</strong>
                        </span>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="h-3 w-3 stroke-[3]" /> Versi Aktif untuk Karyawan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
