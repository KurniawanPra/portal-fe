'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Building2,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Clock,
  Eye,
  ExternalLink,
  FileCheck,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  GitBranch,
  Landmark,
  Loader2,
  Network,
  SearchX,
  ShieldCheck,
  Tag,
  UploadCloud,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '../_lib/document-api';
import type { DocumentRow, DocumentTreeNode, DocumentTreeResponse, DownloadRequest } from '../_lib/types';
import { IconAction } from './DocumentUi';

const GENERAL_FOLDER_ID = '__general_documents__';

export interface ContextMenuState {
  unitId: string;
  nama: string;
  kode: string;
  x: number;
  y: number;
}

export interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  documents: DocumentRow[];
}

function groupDocumentsByCategory(documents: DocumentRow[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  for (const doc of documents) {
    const key = doc.categoryId || 'uncategorized';
    let group = map.get(key);
    if (!group) {
      group = {
        categoryId: key,
        categoryName: doc.categoryName || 'Lainnya',
        categoryCode: doc.categoryCode || 'MISC',
        documents: [],
      };
      map.set(key, group);
    }
    group.documents.push(doc);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName, 'id-ID'),
  );
}

function collectNodeIds(nodes: DocumentTreeNode[]) {
  const ids: string[] = [];
  const visit = (node: DocumentTreeNode) => {
    ids.push(node.id);
    const groups = groupDocumentsByCategory(node.documents);
    for (const group of groups) {
      ids.push(`${node.id}__cat__${group.categoryId}`);
    }
    node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return ids;
}

function findNodeById(nodes: DocumentTreeNode[], id: string): DocumentTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

function unitTypeLabel(type: string) {
  return type.replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase());
}

interface UnitStyle {
  icon: React.ElementType;
  textClass: string;
  badgeClass: string;
  lineClass: string;
  bgHoverClass: string;
}

function getUnitStyle(tipe: string): UnitStyle {
  const t = tipe.toLowerCase();
  if (t === 'direktorat') {
    return {
      icon: Landmark,
      textClass: 'text-purple-600 dark:text-purple-400',
      badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300/60',
      lineClass: 'border-purple-400 dark:border-purple-600',
      bgHoverClass: 'hover:bg-purple-50/50 dark:hover:bg-purple-950/30 bg-purple-50/20 dark:bg-purple-950/10',
    };
  }
  if (t === 'sevp') {
    return {
      icon: ShieldCheck,
      textClass: 'text-blue-600 dark:text-blue-400',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/60',
      lineClass: 'border-blue-400 dark:border-blue-600',
      bgHoverClass: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/30 bg-blue-50/20 dark:bg-blue-950/10',
    };
  }
  if (t === 'bagian') {
    return {
      icon: Network,
      textClass: 'text-amber-600 dark:text-amber-400',
      badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60',
      lineClass: 'border-amber-400 dark:border-amber-600',
      bgHoverClass: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/30 bg-amber-50/20 dark:bg-amber-950/10',
    };
  }
  if (t === 'sub_bagian') {
    return {
      icon: GitBranch,
      textClass: 'text-indigo-600 dark:text-indigo-400',
      badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300/60',
      lineClass: 'border-indigo-400 dark:border-indigo-600',
      bgHoverClass: 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 bg-indigo-50/20 dark:bg-indigo-950/10',
    };
  }
  if (t === 'seksi') {
    return {
      icon: Users,
      textClass: 'text-pink-600 dark:text-pink-400',
      badgeClass: 'bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 border border-pink-300/60',
      lineClass: 'border-pink-400 dark:border-pink-600',
      bgHoverClass: 'hover:bg-pink-50/50 dark:hover:bg-pink-950/30 bg-pink-50/20 dark:bg-pink-950/10',
    };
  }
  return {
    icon: Building2,
    textClass: 'text-slate-600 dark:text-slate-400',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    lineClass: 'border-slate-400 dark:border-slate-600',
    bgHoverClass: 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
  };
}

function getDocumentIcon(mimeType?: string, fileName?: string) {
  if (mimeType?.includes('pdf') || fileName?.endsWith('.pdf')) return FileText;
  if (mimeType?.includes('sheet') || mimeType?.includes('excel') || fileName?.endsWith('.xlsx') || fileName?.endsWith('.xls') || fileName?.endsWith('.csv')) return FileSpreadsheet;
  if (mimeType?.includes('word') || mimeType?.includes('document') || fileName?.endsWith('.docx') || fileName?.endsWith('.doc')) return FileCheck;
  if (mimeType?.includes('code') || mimeType?.includes('json') || mimeType?.includes('script')) return FileCode;
  return FileText;
}

function DocumentItem({
  document,
  depth,
  userRequestsMap,
  onView,
  onDownload,
}: {
  document: DocumentRow;
  depth: number;
  userRequestsMap?: Map<string, DownloadRequest>;
  onView?: (doc: DocumentRow) => void;
  onDownload?: (doc: DocumentRow) => void;
}) {
  const isInactive = !document.isActive;
  const userReq = userRequestsMap?.get(document.id);
  const isApproved = userReq?.status === 'approved' && Boolean(userReq.downloadToken);
  const isPending = userReq?.status === 'pending';
  const DocIcon = getDocumentIcon(document.mimeType, document.title);

  return (
    <div
      role="treeitem"
      aria-level={depth + 1}
      aria-selected={false}
      className={cn(
        'group relative flex min-h-11 min-w-0 items-center justify-between gap-2.5 border-t border-slate-100/80 pr-3 transition-colors focus-visible:outline-none dark:border-slate-800/60',
        isInactive
          ? 'bg-slate-100/60 opacity-60 hover:bg-slate-200/60 dark:bg-slate-900/60 dark:hover:bg-slate-800/60'
          : 'hover:bg-amber-50/55 focus-visible:bg-amber-50/55 dark:hover:bg-amber-950/15 dark:focus-visible:bg-amber-950/15',
      )}
      style={{ paddingLeft: `calc(var(--indent-base, 12px) + ${depth} * var(--indent-step, 24px))` }}
    >
      {/* Synchronized L-shaped branch line connector for Document Item */}
      {depth > 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 h-5.5 w-3.5 rounded-bl-md border-b-2 border-l-2 border-amber-400 dark:border-amber-500"
          style={{ left: `calc(var(--indent-base, 12px) + (${depth} - 1) * var(--indent-step, 24px) + 7px)` }}
        />
      )}

      <Link href={`/dashboard/dokumen/${document.id}`} className="flex min-w-0 flex-1 items-center gap-2.5 py-2">
        <DocIcon className={cn('h-4 w-4 shrink-0 transition-colors ml-0.5', isInactive ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400 group-hover:scale-110')} />
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate text-xs sm:text-sm font-bold', isInactive ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-800 group-hover:text-amber-800 dark:text-slate-100 dark:group-hover:text-amber-300')}>
            {document.title}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="shrink-0 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-extrabold text-slate-700 dark:text-slate-300">{document.categoryCode}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0 font-medium">v{document.version}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{formatFileSize(document.fileSize)}</span>
          </span>
        </span>

        {/* Indicator chevron for mobile navigation to detail page */}
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 opacity-60 transition-transform group-hover:translate-x-0.5 sm:hidden" />
      </Link>

      {/* Buttons hidden on mobile (< sm) so they don't block mobile tap/view. Tapping row on mobile opens detail page directly */}
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        {isInactive && (
          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
            NONAKTIF
          </span>
        )}

        {/* Positioning of View and Download buttons right next to the folder hierarchy items (Desktop only) */}
        <div className="ml-1 flex items-center gap-1.5">
          {onView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onView(document);
              }}
              title="Lihat / Preview Dokumen"
              className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 shadow-2xs transition hover:border-sky-300 hover:bg-sky-100 focus:outline-none dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/80"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Lihat</span>
            </button>
          )}

          {onDownload && (
            isApproved ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDownload(document);
                }}
                title="Buka halaman Dokumen Disetujui"
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 focus:outline-none"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Buka Unduhan</span>
              </button>
            ) : isPending ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDownload(document);
                }}
                title="Menunggu Persetujuan Atasan / Approver"
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 shadow-2xs transition hover:bg-amber-200 focus:outline-none dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
              >
                <Clock className="h-3.5 w-3.5 animate-pulse text-amber-600 dark:text-amber-400" />
                <span>Menunggu Persetujuan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDownload(document);
                }}
                title="Minta Persetujuan Unduh Dokumen"
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-600 active:bg-amber-700 px-2.5 py-1 text-xs font-bold text-white shadow-2xs shadow-amber-500/20 transition focus:outline-none dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950"
              >
                <FileCheck className="h-3.5 w-3.5 text-white dark:text-slate-950" />
                <span>Minta Persetujuan Unduh</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryFolderNode({
  unitId,
  categoryGroup,
  depth,
  expanded,
  userRequestsMap,
  onToggle,
  onViewDocument,
  onDownloadDocument,
}: {
  unitId: string;
  categoryGroup: CategoryGroup;
  depth: number;
  expanded: Set<string>;
  userRequestsMap?: Map<string, DownloadRequest>;
  onToggle: (id: string) => void;
  onViewDocument?: (doc: DocumentRow) => void;
  onDownloadDocument?: (doc: DocumentRow) => void;
}) {
  const folderId = `${unitId}__cat__${categoryGroup.categoryId}`;
  const isOpen = expanded.has(folderId);
  const docCount = categoryGroup.documents.length;

  return (
    <div role="none" className="relative">
      {/* Synchronized L-shaped branch line connector for Category Folder */}
      {depth > 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 h-5 w-3.5 rounded-bl-md border-b-2 border-l-2 border-amber-400 dark:border-amber-500"
          style={{ left: `calc(var(--indent-base, 12px) + (${depth} - 1) * var(--indent-step, 24px) + 7px)` }}
        />
      )}

      <button
        type="button"
        role="treeitem"
        aria-level={depth + 1}
        aria-selected={false}
        aria-expanded={isOpen}
        onClick={() => onToggle(folderId)}
        className="group relative my-0.5 flex min-h-10 w-full min-w-0 items-center gap-2.5 border-l-3 border-sky-500 bg-sky-50/70 py-1.5 pr-3 text-left transition-all hover:bg-sky-100/70 focus-visible:bg-sky-100/70 focus-visible:outline-none dark:border-sky-400 dark:bg-sky-950/40 dark:hover:bg-sky-900/50"
        style={{ paddingLeft: `calc(var(--indent-base, 12px) + ${depth} * var(--indent-step, 24px))` }}
      >
        <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 text-sky-600 transition-transform duration-200 dark:text-sky-300', isOpen && 'rotate-90')} />
        <Tag className={cn('h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300 transition-transform', isOpen && 'scale-110')} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-extrabold tracking-wide text-sky-950 dark:text-sky-100">
            {categoryGroup.categoryName}
          </span>
          <span className="block truncate text-[10px] font-bold text-sky-600/90 dark:text-sky-400">
            Kategori Dokumen · {categoryGroup.categoryCode}
          </span>
        </span>
        <span className="shrink-0 rounded-md border border-sky-300/80 bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800 shadow-2xs dark:border-sky-700 dark:bg-sky-900 dark:text-sky-200">
          {docCount} dokumen
        </span>
      </button>

      {isOpen && (
        <div role="group" className="relative">
          {/* Synchronized Vertical Guide Line connecting Category to Document Items */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2.5 top-0 border-l-2 border-dashed border-amber-400/80 dark:border-amber-600/80"
            style={{ left: `calc(var(--indent-base, 12px) + ${depth} * var(--indent-step, 24px) + 7px)` }}
          />

          {categoryGroup.documents.map(document => (
            <DocumentItem
              key={document.id}
              document={document}
              depth={depth + 1}
              userRequestsMap={userRequestsMap}
              onView={onViewDocument}
              onDownload={onDownloadDocument}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FolderNode({
  node,
  depth,
  expanded,
  userRequestsMap,
  onToggle,
  onUploadToUnit,
  onOpenContextMenu,
  onViewDocument,
  onDownloadDocument,
}: {
  node: DocumentTreeNode;
  depth: number;
  expanded: Set<string>;
  userRequestsMap?: Map<string, DownloadRequest>;
  onToggle: (id: string) => void;
  onUploadToUnit?: (unitId: string, file?: File) => void;
  onOpenContextMenu?: (data: ContextMenuState) => void;
  onViewDocument?: (doc: DocumentRow) => void;
  onDownloadDocument?: (doc: DocumentRow) => void;
}) {
  const isOpen = expanded.has(node.id);
  const hasContents = node.documents.length > 0 || node.children.length > 0;
  const [isDragOver, setIsDragOver] = useState(false);

  const categoryGroups = useMemo(
    () => groupDocumentsByCategory(node.documents),
    [node.documents],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (onUploadToUnit) {
      onUploadToUnit(node.id, droppedFile);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onUploadToUnit || !onOpenContextMenu) return;
    e.preventDefault();
    e.stopPropagation();
    onOpenContextMenu({
      unitId: node.id,
      nama: node.nama,
      kode: node.kode,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const isSubUnit = depth > 0;
  const unitStyle = getUnitStyle(node.tipe);
  const UnitIcon = unitStyle.icon;

  return (
    <div role="none" className="relative">
      {/* Synchronized L-shaped branch line connector for Sub-unit Folders */}
      {isSubUnit && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-0 h-6 w-3.5 rounded-bl-md border-b-2 border-l-2',
            unitStyle.lineClass,
          )}
          style={{ left: `calc(var(--indent-base, 12px) + (${depth} - 1) * var(--indent-step, 24px) + 7px)` }}
        />
      )}

      <button
        type="button"
        role="treeitem"
        aria-level={depth + 1}
        aria-selected={false}
        aria-expanded={hasContents ? isOpen : undefined}
        onClick={() => hasContents && onToggle(node.id)}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex min-h-12 w-full min-w-0 items-center gap-3 border-t border-slate-100 pr-3 text-left transition-all focus-visible:bg-slate-50 focus-visible:outline-none dark:border-slate-800/80 dark:focus-visible:bg-slate-800/45',
          unitStyle.bgHoverClass,
          isDragOver && 'border-amber-400 bg-amber-100/70 ring-2 ring-amber-500/40 dark:border-amber-700 dark:bg-amber-950/60 dark:ring-amber-500/30',
        )}
        style={{ paddingLeft: `calc(var(--indent-base, 12px) + ${depth} * var(--indent-step, 24px))` }}
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-200',
            unitStyle.textClass,
            isOpen && 'rotate-90',
            !hasContents && 'invisible',
          )}
        />

        <UnitIcon className={cn('h-4.5 w-4.5 shrink-0 transition-transform', unitStyle.textClass, isOpen && 'scale-110')} />

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
            {node.nama}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase">
            <span className={cn('rounded px-1.5 py-0.2', unitStyle.badgeClass)}>
              {unitTypeLabel(node.tipe)}
            </span>
            <span className="text-slate-400 font-mono">· {node.kode}</span>
          </span>
        </span>

        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-black tabular-nums',
            unitStyle.badgeClass,
          )}
        >
          {node.documentCount}
        </span>

        {isDragOver && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            <UploadCloud className="h-3 w-3" /> Drop file di sini
          </span>
        )}
      </button>

      {isOpen && hasContents && (
        <div role="group" className="relative">
          {/* Synchronized Vertical Guide Line connecting Parent Unit to Child Units/Categories */}
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute bottom-3 top-0 border-l-2',
              isSubUnit
                ? 'border-dashed border-indigo-300/80 dark:border-indigo-700/80'
                : 'border-dashed border-amber-300/90 dark:border-amber-700/90',
            )}
            style={{ left: `calc(var(--indent-base, 12px) + ${depth} * var(--indent-step, 24px) + 7px)` }}
          />

          {/* Child organizational units */}
          {node.children.map(child => (
            <FolderNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              userRequestsMap={userRequestsMap}
              onToggle={onToggle}
              onUploadToUnit={onUploadToUnit}
              onOpenContextMenu={onOpenContextMenu}
              onViewDocument={onViewDocument}
              onDownloadDocument={onDownloadDocument}
            />
          ))}

          {/* Subfolders by Document Category */}
          {categoryGroups.map(group => (
            <CategoryFolderNode
              key={group.categoryId}
              unitId={node.id}
              categoryGroup={group}
              depth={depth + 1}
              expanded={expanded}
              userRequestsMap={userRequestsMap}
              onToggle={onToggle}
              onViewDocument={onViewDocument}
              onDownloadDocument={onDownloadDocument}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GeneralFolder({
  documents,
  expanded,
  userRequestsMap,
  onToggle,
  onViewDocument,
  onDownloadDocument,
}: {
  documents: DocumentRow[];
  expanded: Set<string>;
  userRequestsMap?: Map<string, DownloadRequest>;
  onToggle: (id: string) => void;
  onViewDocument?: (doc: DocumentRow) => void;
  onDownloadDocument?: (doc: DocumentRow) => void;
}) {
  const categoryGroups = useMemo(
    () => groupDocumentsByCategory(documents),
    [documents],
  );
  if (!documents.length) return null;
  const isOpen = expanded.has(GENERAL_FOLDER_ID);

  return (
    <div role="none">
      <button
        type="button"
        role="treeitem"
        aria-level={1}
        aria-selected={false}
        aria-expanded={isOpen}
        onClick={() => onToggle(GENERAL_FOLDER_ID)}
        className="flex min-h-12 w-full min-w-0 items-center gap-3 border-t border-slate-100 px-4 pr-3 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none dark:border-slate-800/80 dark:hover:bg-slate-800/45 dark:focus-visible:bg-slate-800/45"
      >
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200', isOpen && 'rotate-90')} />
        {isOpen ? <FolderOpen className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" /> : <Boxes className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">Dokumen Umum</span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase text-slate-400">Tanpa unit pemilik</span>
        </span>
        <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">{documents.length}</span>
      </button>
      {isOpen && (
        <div role="group">
          {categoryGroups.map(group => (
            <CategoryFolderNode
              key={group.categoryId}
              unitId={GENERAL_FOLDER_ID}
              categoryGroup={group}
              depth={1}
              expanded={expanded}
              userRequestsMap={userRequestsMap}
              onToggle={onToggle}
              onViewDocument={onViewDocument}
              onDownloadDocument={onDownloadDocument}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentFolderTree({
  tree,
  loading,
  filtering,
  userRequestsMap,
  onUploadToUnit,
  onViewDocument,
  onDownloadDocument,
}: {
  tree: DocumentTreeResponse;
  loading: boolean;
  filtering: boolean;
  userRequestsMap?: Map<string, DownloadRequest>;
  onUploadToUnit?: (unitId: string, file?: File) => void;
  onViewDocument?: (document: DocumentRow) => void;
  onDownloadDocument?: (document: DocumentRow) => void;
}) {
  const allNodeIds = useMemo(() => collectNodeIds(tree.roots), [tree.roots]);
  const validIds = useMemo(() => {
    const generalCategories = groupDocumentsByCategory(tree.generalDocuments);
    const generalCatIds = generalCategories.map(c => `${GENERAL_FOLDER_ID}__cat__${c.categoryId}`);
    return new Set([
      ...allNodeIds,
      ...(tree.generalDocuments.length ? [GENERAL_FOLDER_ID, ...generalCatIds] : []),
    ]);
  }, [allNodeIds, tree.generalDocuments]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);

  useEffect(() => {
    setExpanded(current => {
      if (filtering) return new Set(validIds);
      const next = new Set(Array.from(current).filter(id => validIds.has(id)));
      if (next.size === 0) {
        tree.roots.forEach(root => {
          next.add(root.id);
          const catGroups = groupDocumentsByCategory(root.documents);
          for (const group of catGroups) {
            next.add(`${root.id}__cat__${group.categoryId}`);
          }
        });
        if (tree.generalDocuments.length) {
          next.add(GENERAL_FOLDER_ID);
          const catGroups = groupDocumentsByCategory(tree.generalDocuments);
          for (const group of catGroups) {
            next.add(`${GENERAL_FOLDER_ID}__cat__${group.categoryId}`);
          }
        }
      }
      return next;
    });
  }, [filtering, tree.roots, tree.generalDocuments, validIds]);

  const toggle = (id: string) => {
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Auto-expand category subfolders when expanding a unit node
        const unitNode = findNodeById(tree.roots, id);
        if (unitNode) {
          const catGroups = groupDocumentsByCategory(unitNode.documents);
          for (const group of catGroups) {
            next.add(`${id}__cat__${group.categoryId}`);
          }
        } else if (id === GENERAL_FOLDER_ID) {
          const catGroups = groupDocumentsByCategory(tree.generalDocuments);
          for (const group of catGroups) {
            next.add(`${GENERAL_FOLDER_ID}__cat__${group.categoryId}`);
          }
        }
      }
      return next;
    });
  };

  const hasContent = tree.roots.length > 0 || tree.generalDocuments.length > 0;

  return (
    <div>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase text-slate-600 dark:text-slate-300">Struktur Folder</p>
          <p className="text-[11px] text-slate-400">
            {tree.totals.folders} folder · {tree.totals.documents} dokumen
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconAction label="Buka semua folder" disabled={!hasContent} onClick={() => setExpanded(new Set(validIds))}>
            <ChevronsDown className="h-4 w-4" />
          </IconAction>
          <IconAction label="Tutup semua folder" disabled={!hasContent} onClick={() => setExpanded(new Set())}>
            <ChevronsUp className="h-4 w-4" />
          </IconAction>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-16 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-amber-500" />
          <span className="mt-2 block text-xs font-semibold text-slate-400">Memuat struktur dokumen...</span>
        </div>
      ) : !hasContent ? (
        <div className="px-4 py-16 text-center">
          <SearchX className="mx-auto h-5 w-5 text-slate-400" />
          <span className="mt-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">Dokumen tidak ditemukan.</span>
        </div>
      ) : (
        <div role="tree" aria-label="Struktur folder dokumen" className="overflow-x-auto custom-table-scrollbar overscroll-x-contain [--indent-base:12px] [--indent-step:24px] sm:[--indent-base:16px] sm:[--indent-step:28px]">
          {tree.roots.map(root => (
            <FolderNode
              key={root.id}
              node={root}
              depth={0}
              expanded={expanded}
              userRequestsMap={userRequestsMap}
              onToggle={toggle}
              onUploadToUnit={onUploadToUnit}
              onOpenContextMenu={setContextMenu}
              onViewDocument={onViewDocument}
              onDownloadDocument={onDownloadDocument}
            />
          ))}
          <GeneralFolder
            documents={tree.generalDocuments}
            expanded={expanded}
            userRequestsMap={userRequestsMap}
            onToggle={toggle}
            onViewDocument={onViewDocument}
            onDownloadDocument={onDownloadDocument}
          />
        </div>
      )}

      {/* Global Single Context Menu */}
      {contextMenu && (
        <div
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
          className="z-50 min-w-52 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 animate-scale-in"
        >
          <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <p className="truncate text-xs font-black text-slate-800 dark:text-slate-100">{contextMenu.nama}</p>
            <p className="text-[10px] font-bold uppercase text-slate-400">{contextMenu.kode}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const targetId = contextMenu.unitId;
              setContextMenu(null);
              if (onUploadToUnit) onUploadToUnit(targetId);
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/50"
          >
            <UploadCloud className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Upload Dokumen ke Unit Ini
          </button>
        </div>
      )}
    </div>
  );
}
