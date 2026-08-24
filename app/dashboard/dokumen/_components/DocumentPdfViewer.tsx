'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { cn } from '@/lib/utils';
import { formatFileSize } from '../_lib/document-api';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const PDF_DOCUMENT_OPTIONS = {
  withCredentials: true,
  disableRange: true,
  disableStream: true,
};

interface DocumentPdfViewerProps {
  url: string;
  title: string;
}

export function DocumentPdfViewer({ url, title }: DocumentPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [containerWidth, setContainerWidth] = useState(840);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState('1');
  const [scale, setScale] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Progress state (1-100%)
  const [progress, setProgress] = useState(15);
  const [bytesInfo, setBytesInfo] = useState<{ loaded: number; total: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setContainerWidth(Math.max(280, container.clientWidth - 48));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setInputPage('1');
    setPageCount(0);
    setLoadError(null);
    setProgress(15);
    setBytesInfo(null);

    // Smooth progress simulation while PDF binary and pages load
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 88) return prev;
        const step = Math.max(1, Math.floor((88 - prev) / 6));
        return Math.min(88, prev + step);
      });
    }, 180);

    return () => clearInterval(interval);
  }, [url]);

  useEffect(() => {
    setInputPage(String(currentPage));
  }, [currentPage]);

  const handleLoadProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const calculated = Math.min(96, Math.max(15, Math.round((loaded / total) * 95)));
      setProgress(calculated);
      setBytesInfo({ loaded, total });
    }
  };

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setProgress(100);
    setTimeout(() => {
      setPageCount(numPages);
      setCurrentPage(1);
      setLoadError(null);
    }, 250);
  };

  // Scroll to a specific page
  const scrollToPage = (targetPage: number) => {
    const clampedPage = Math.min(Math.max(1, targetPage), pageCount || 1);
    const targetElement = pageRefs.current[clampedPage];
    const scrollContainer = scrollContainerRef.current;

    if (targetElement && scrollContainer) {
      isProgrammaticScroll.current = true;
      setCurrentPage(clampedPage);
      setInputPage(String(clampedPage));

      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 700);
    }
  };

  const handlePageJump = () => {
    const p = parseInt(inputPage, 10);
    if (!isNaN(p) && p >= 1 && p <= (pageCount || 1)) {
      scrollToPage(p);
    } else {
      setInputPage(String(currentPage));
    }
  };

  // Track active page as user scrolls through the continuous document
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !pageCount) return;

    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const checkLine = containerRect.top + 160; // top offset to determine current reading page

      let activePage = 1;
      let minDistance = Infinity;

      for (let i = 1; i <= pageCount; i++) {
        const el = pageRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top - checkLine);
        if (rect.top <= checkLine && rect.bottom >= containerRect.top + 60) {
          activePage = i;
          break;
        }
        if (distance < minDistance) {
          minDistance = distance;
          activePage = i;
        }
      }

      setCurrentPage(activePage);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [pageCount]);

  // Keyboard navigation for PDF
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToPage(currentPage + 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToPage(1);
      } else if (e.key === 'End' && pageCount > 0) {
        e.preventDefault();
        scrollToPage(pageCount);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pageCount]);

  const pageWidth = Math.min(1100, containerWidth) * scale;

  const progressStatusText =
    progress < 35
      ? 'Mengunduh data berkas digital...'
      : progress < 75
        ? 'Memproses watermark & struktur halaman...'
        : progress < 100
          ? 'Menyusun render pratinjau halaman...'
          : 'Dokumen siap! Membuka halaman...';

  const bytesLabel =
    bytesInfo && bytesInfo.total > 0
      ? ` · ${formatFileSize(bytesInfo.loaded)} / ${formatFileSize(bytesInfo.total)}`
      : '';

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={`Pratinjau ${title}`}
      className="relative flex min-h-0 flex-1 flex-col bg-slate-200/80 select-none dark:bg-slate-950"
    >
      {/* Top Toolbar: Mode indicator and Zoom Controls */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-2xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {pageCount > 0 ? `Semua Halaman (${pageCount} Hal)` : 'Memuat PDF...'}
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">· Scroll untuk membaca halaman selanjutnya</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Perkecil Tampilan"
            disabled={scale <= 0.6}
            onClick={() => setScale(value => Math.max(0.6, Number((value - 0.1).toFixed(1))))}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setScale(1)}
            title="Reset Zoom ke 100%"
            className="min-w-12 rounded px-1.5 py-0.5 text-center text-xs font-bold tabular-nums text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            title="Perbesar Tampilan"
            disabled={scale >= 2.2}
            onClick={() => setScale(value => Math.min(2.2, Number((value + 0.1).toFixed(1))))}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF Continuous Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-auto p-4 pb-20 sm:p-6 sm:pb-24"
      >
        <Document
          file={url}
          options={PDF_DOCUMENT_OPTIONS}
          onLoadProgress={handleLoadProgress}
          loading={(
            <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-amber-500" />

              <div className="space-y-1 text-center">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Menyiapkan halaman PDF...
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {progressStatusText}
                </p>
              </div>

              {/* Clean Progress Bar 1-100% */}
              <div className="mt-4 w-full max-w-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">
                    Proses Memuat{bytesLabel}
                  </span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-xs">
                    {progress}%
                  </span>
                </div>

                <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 shadow-xs transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          error={(
            <div className="flex min-h-80 flex-col items-center justify-center gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {loadError || 'PDF tidak dapat dirender.'}
              </p>
            </div>
          )}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={error => setLoadError(error.message || 'PDF tidak dapat dirender.')}
        >
          {pageCount > 0 && (
            <div className="flex flex-col items-center space-y-6">
              {Array.from({ length: pageCount }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <div
                    key={`${url}-page-${pageNumber}`}
                    id={`pdf-page-${pageNumber}`}
                    ref={el => {
                      pageRefs.current[pageNumber] = el;
                    }}
                    className="relative mx-auto w-fit overflow-hidden rounded-xs bg-white shadow-xl ring-1 ring-slate-900/5 transition-all"
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={pageWidth}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      loading={(
                        <div
                          className="flex flex-col items-center justify-center gap-2 bg-white text-slate-500"
                          style={{ width: pageWidth, minHeight: Math.max(360, pageWidth * 1.35) }}
                        >
                          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                          <span className="text-xs font-semibold text-slate-400">Memuat Halaman {pageNumber}...</span>
                        </div>
                      )}
                    />
                    {/* Small page number watermark on top-left of page container */}
                    <div className="absolute top-2 left-2 pointer-events-none rounded bg-slate-900/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs opacity-75">
                      Hal {pageNumber}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Document>
      </div>

      {/* Floating Pagination Navigation Toolbar - Located at Bottom Center */}
      {pageCount > 0 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 px-3 py-1.5 shadow-xl backdrop-blur-md dark:border-slate-700/90 dark:bg-slate-900/95 transition-all">
          <button
            type="button"
            title="Halaman Pertama (Home)"
            disabled={currentPage <= 1}
            onClick={() => scrollToPage(1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Halaman Sebelumnya (Left Arrow)"
            disabled={currentPage <= 1}
            onClick={() => scrollToPage(currentPage - 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Hal</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputPage}
              onChange={e => setInputPage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handlePageJump();
              }}
              onBlur={handlePageJump}
              className="h-6 w-9 rounded border border-slate-300 bg-white px-1 text-center text-xs font-bold text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              title="Ketik nomor halaman lalu tekan Enter"
            />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ {pageCount}</span>
          </div>

          <button
            type="button"
            title="Halaman Berikutnya (Right Arrow)"
            disabled={currentPage >= pageCount}
            onClick={() => scrollToPage(currentPage + 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Halaman Terakhir (End)"
            disabled={currentPage >= pageCount}
            onClick={() => scrollToPage(pageCount)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
