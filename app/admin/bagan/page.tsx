'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GitBranch, ChevronRight, ChevronDown, ChevronUp, Loader2, Search, ZoomIn, ZoomOut, RefreshCw,
  X, Download, User, Briefcase, Building2, Maximize2, Minimize2, PanelLeft, Presentation
} from 'lucide-react';
import { api } from '@/lib/api';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { resolveImageUrl } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type TipeUnit = 'direktorat' | 'sevp' | 'bagian' | 'sub_bagian' | 'seksi';

interface UnitOrganisasi {
  id: string;
  kode: string;
  nama: string;
  tipe: TipeUnit;
  parentId: string | null;
  isActive: boolean;
}

interface TreeNode extends UnitOrganisasi {
  children: TreeNode[];
  depth: number;
  isDummy?: boolean;
}

// ─── Level Definitions ────────────────────────────────────────────────────────
const LEVEL_ORDER: TipeUnit[] = ['direktorat', 'sevp', 'bagian', 'sub_bagian'];
const LEVEL_MAP: Record<TipeUnit, number> = {
  direktorat: 0,
  sevp: 1,
  bagian: 2,
  sub_bagian: 3,
  seksi: 4
};

const UNIT_LEADER_MIN_GRADE_LEVEL: Record<TipeUnit, number> = {
  direktorat: 20, // BOD
  sevp: 15,       // BOM
  bagian: 13,     // BOM-1
  sub_bagian: 10, // BOM-2
  seksi: 8,       // BOM-3
};

const COLLAPSIBLE_PERSONNEL_UNIT_TYPES = new Set<TipeUnit>(['bagian', 'sub_bagian', 'seksi']);

// ─── Tipe Config (Standard Tailwind Color Classes Only) ────────────────────────
type TipeConfig = {
  label: string;
  borderClass: string;
  bgClass: string;
  badge: string;
  textColor: string;
  dot: string;
  exportColor: { line: string; fill: string; text: string };
};

const TIPE_CONFIG: Record<TipeUnit, TipeConfig> = {
  direktorat: {
    label: 'Direktorat',
    borderClass: 'border-purple-600 dark:border-purple-500',
    bgClass: 'bg-purple-600/10 dark:bg-purple-500/8',
    dot: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
    textColor: 'text-purple-600 dark:text-purple-400',
    exportColor: { line: '9333EA', fill: 'F4EBFD', text: '6B21A8' },
  },
  sevp: {
    label: 'SEVP',
    borderClass: 'border-blue-600 dark:border-blue-500',
    bgClass: 'bg-blue-600/10 dark:bg-blue-500/8',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
    textColor: 'text-blue-600 dark:text-blue-400',
    exportColor: { line: '2563EB', fill: 'E9EFFD', text: '1E40AF' },
  },
  bagian: {
    label: 'Bagian',
    borderClass: 'border-amber-600 dark:border-amber-500',
    bgClass: 'bg-amber-600/10 dark:bg-amber-500/8',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    textColor: 'text-amber-600 dark:text-amber-400',
    exportColor: { line: 'D97706', fill: 'FBF1E6', text: '92400E' },
  },
  sub_bagian: {
    label: 'Sub Bagian',
    borderClass: 'border-indigo-600 dark:border-indigo-500',
    bgClass: 'bg-indigo-600/10 dark:bg-indigo-500/8',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    exportColor: { line: '4F46E5', fill: 'EDECFD', text: '3730A3' },
  },
  seksi: {
    label: 'Seksi',
    borderClass: 'border-pink-600 dark:border-pink-500',
    bgClass: 'bg-pink-600/10 dark:bg-pink-500/8',
    dot: 'bg-pink-500',
    badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800/50',
    textColor: 'text-pink-600 dark:text-pink-400',
    exportColor: { line: 'DB2777', fill: 'FCE9F1', text: '9D174D' },
  },
};

// ─── Build Tree ───────────────────────────────────────────────────────────────
function buildTree(units: UnitOrganisasi[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  units.forEach(u => {
    map.set(u.id, { ...u, children: [], depth: 0 });
  });

  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      const parent = map.get(node.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.nama ?? '').localeCompare(b.nama ?? ''));
    nodes.forEach(n => sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

// ─── Normalize Tree Levels (Dummy Nodes Insertion) ─────────────────────────────
function normalizeTreeLevels(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  
  for (const node of nodes) {
    const childrenCopy = [...node.children];
    const normalizedChildren: TreeNode[] = [];
    
    for (const child of childrenCopy) {
      const pLevel = LEVEL_MAP[node.tipe];
      const cLevel = LEVEL_MAP[child.tipe];
      
      if (cLevel > pLevel + 1) {
        let lastDummy: TreeNode | null = null;
        let topDummy: TreeNode | null = null;
        
        for (let lvl = pLevel + 1; lvl < cLevel; lvl++) {
          const dummyType = LEVEL_ORDER[lvl];
          if (!dummyType) continue;
          
          const dummyNode: TreeNode = {
            id: `${node.id}-dummy-${child.id}-${dummyType}`,
            kode: `DUMMY-${dummyType.toUpperCase()}`,
            nama: '',
            tipe: dummyType,
            parentId: lastDummy ? lastDummy.id : node.id,
            isActive: true,
            children: [],
            depth: node.depth + (lvl - pLevel),
            isDummy: true
          };
          
          if (!topDummy) {
            topDummy = dummyNode;
          }
          if (lastDummy) {
            lastDummy.children.push(dummyNode);
          }
          lastDummy = dummyNode;
        }
        
        if (topDummy && lastDummy) {
          normalizedChildren.push(topDummy);
          lastDummy.children.push(child);
        }
      } else {
        normalizedChildren.push(child);
      }
    }
    
    node.children = normalizeTreeLevels(normalizedChildren);
    result.push(node);
  }
  
  return result;
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────
function getAvatarUrl(fotoProfil: string | null | undefined): string | null {
  return resolveImageUrl(fotoProfil) || null;
}

function getInitials(nama: string): string {
  return nama
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

function escapePrintHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

const GENDER_GRADIENT: Record<string, string> = {
  L: 'from-blue-400 to-blue-600',
  P: 'from-pink-400 to-pink-600',
  default: 'from-slate-400 to-slate-600',
};

function getEligibleUnitLeaders(
  node: TreeNode,
  unitEmployees: any[],
  getGradeInfo: (gradeId: string | null) => any,
): any[] {
  const minimumLevel = UNIT_LEADER_MIN_GRADE_LEVEL[node.tipe];
  const eligible = unitEmployees.filter(
    employee => Number(getGradeInfo(employee.gradeId).level) >= minimumLevel,
  );
  if (eligible.length === 0) return [];

  const highestLevel = Math.max(
    ...eligible.map(employee => Number(getGradeInfo(employee.gradeId).level)),
  );

  return eligible
    .filter(employee => Number(getGradeInfo(employee.gradeId).level) === highestLevel)
    .sort((left, right) => {
      if (left.isPimpinan && !right.isPimpinan) return -1;
      if (!left.isPimpinan && right.isPimpinan) return 1;
      return (left.nama ?? '').localeCompare(right.nama ?? '');
    });
}

function getUnitEmployeeLayers(
  node: TreeNode,
  employees: any[],
  getGradeInfo: (gradeId: string | null) => any,
) {
  const unitEmployees = employees.filter(
    employee => employee.unitOrganisasiId === node.id && employee.isActive,
  );
  const topEmployees = getEligibleUnitLeaders(node, unitEmployees, getGradeInfo);
  const topEmployeeIds = new Set(topEmployees.map(employee => employee.id));
  const groupedByGrade = new Map<string, { gradeInfo: any; employees: any[] }>();

  unitEmployees
    .filter(employee => !topEmployeeIds.has(employee.id))
    .forEach(employee => {
      const gradeInfo = getGradeInfo(employee.gradeId);
      const key = employee.gradeId || 'no-grade';
      if (!groupedByGrade.has(key)) {
        groupedByGrade.set(key, { gradeInfo, employees: [] });
      }
      groupedByGrade.get(key)!.employees.push(employee);
    });

  const subEmployeeGroups = Array.from(groupedByGrade.values())
    .map(group => ({
      ...group,
      employees: group.employees.sort((left, right) => (left.nama ?? '').localeCompare(right.nama ?? '')),
    }))
    .sort((left, right) => right.gradeInfo.level - left.gradeInfo.level);

  return { unitEmployees, topEmployees, subEmployeeGroups };
}

// ─── Shared print/export node meta (leader, grade, personnel count) ────────────
// Dipakai bersama oleh cetak PDF bagan & export PPT agar konsisten (DRY).
function getNodePrintMeta(
  node: TreeNode,
  employees: any[],
  getGradeInfo: (gradeId: string | null) => any,
): { leader: any | null; gradeCode: string; count: number; typeLabel: string } {
  const config = TIPE_CONFIG[node.tipe] || TIPE_CONFIG.seksi;
  const { unitEmployees, topEmployees } = getUnitEmployeeLayers(node, employees, getGradeInfo);
  const leader = topEmployees[0] ?? null;
  const gradeCode = leader?.gradeId ? getGradeInfo(leader.gradeId).kode : '';
  return {
    leader,
    gradeCode,
    count: unitEmployees.length,
    typeLabel: config.label || node.tipe.toUpperCase(),
  };
}

// ─── Tidy-tree layout (px) untuk export PPT ────────────────────────────────────
interface PositionedNode { node: TreeNode; x: number; y: number; w: number; h: number; depth: number; }
interface Connector { x1: number; y1: number; x2: number; y2: number; }

const PPT_NODE_W = 264;
const PPT_NODE_H = 128;
const PPT_H_GAP = 36;
const PPT_V_GAP = 64;

function computeTreeLayout(roots: TreeNode[]): {
  nodes: PositionedNode[];
  connectors: Connector[];
  width: number;
  height: number;
} {
  const nodes: PositionedNode[] = [];
  const connectors: Connector[] = [];
  let cursor = 0;
  let maxDepth = 0;

  // Post-order: leaf ditempatkan berurutan, parent = titik tengah anak-anaknya.
  const layout = (node: TreeNode, depth: number): number => {
    maxDepth = Math.max(maxDepth, depth);
    const y = depth * (PPT_NODE_H + PPT_V_GAP);
    let centerX: number;

    if (node.children.length === 0) {
      centerX = cursor + PPT_NODE_W / 2;
      cursor += PPT_NODE_W + PPT_H_GAP;
    } else {
      const childCenters = node.children.map(c => layout(c, depth + 1));
      const first = childCenters[0];
      const last = childCenters[childCenters.length - 1];
      centerX = (first + last) / 2;

      // Konektor: turun dari parent → bus horizontal → turun ke tiap anak.
      const busY = y + PPT_NODE_H + PPT_V_GAP / 2;
      const childTopY = (depth + 1) * (PPT_NODE_H + PPT_V_GAP);
      connectors.push({ x1: centerX, y1: y + PPT_NODE_H, x2: centerX, y2: busY });
      connectors.push({ x1: first, y1: busY, x2: last, y2: busY });
      childCenters.forEach(cx => connectors.push({ x1: cx, y1: busY, x2: cx, y2: childTopY }));
    }

    nodes.push({ node, x: centerX - PPT_NODE_W / 2, y, w: PPT_NODE_W, h: PPT_NODE_H, depth });
    return centerX;
  };

  roots.forEach(r => layout(r, 0));

  const width = cursor > 0 ? cursor - PPT_H_GAP : PPT_NODE_W;
  const height = (maxDepth + 1) * PPT_NODE_H + maxDepth * PPT_V_GAP;
  return { nodes, connectors, width, height };
}

function PersonnelGradeLane({
  node,
  config,
  groups,
  searchQuery,
}: {
  node: TreeNode;
  config: typeof TIPE_CONFIG[TipeUnit];
  groups: Array<{ gradeInfo: any; employees: any[] }>;
  searchQuery?: string;
}) {
  const query = searchQuery?.trim().toLowerCase();

  return (
    <div className="flex flex-col items-center">
      <div className="org-personnel-reference w-64 border-y border-dashed border-teal-300 bg-teal-50/60 px-3 py-2 text-center dark:border-teal-800 dark:bg-teal-950/20">
        <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase text-teal-700 dark:text-teal-300">
          <GitBranch className="h-3 w-3" />
          Jalur Personel Berdasarkan Grade
        </div>
        <p className="mt-1 truncate text-[10px] font-bold text-slate-700 dark:text-slate-200">
          Merujuk ke {config.label}: {node.nama}
        </p>
      </div>
      {groups.map(group => (
        <div key={group.gradeInfo.kode || 'no-grade'} className="flex flex-col items-center">
          <div className="h-5 border-l border-dashed border-teal-500 dark:border-teal-400" />
          <div className="relative z-10 px-4">
            <div className="org-personnel-card relative w-64 overflow-hidden rounded-lg border border-slate-300 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-[#0a0e17]">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className={`org-node-type-badge text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.badge} opacity-70`}>
                  {group.gradeInfo.kode}
                </span>
                <div className="min-w-0 text-right">
                  <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Level master {group.gradeInfo.level}</p>
                  <p className="truncate text-[8px] font-semibold text-slate-400 dark:text-slate-500">
                    {group.gradeInfo.keterangan || group.gradeInfo.label || 'Tanpa keterangan grade'}
                  </p>
                </div>
              </div>

              <div className="org-origin-unit mb-2 flex items-start gap-2 border-y border-slate-200 py-2 dark:border-slate-800">
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500">Unit Organisasi Asal</p>
                  <p className="truncate text-[10px] font-bold text-slate-800 dark:text-slate-200">{node.nama}</p>
                  <p className="text-[8px] font-semibold text-slate-500 dark:text-slate-400">{config.label} · {node.kode}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {group.employees.map((employee: any) => {
                  const avatarUrl = getAvatarUrl(employee.fotoProfil);
                  const initials = getInitials(employee.nama ?? '');
                  const gradient = GENDER_GRADIENT[employee.jenisKelamin] ?? GENDER_GRADIENT.default;
                  const isEmpMatch = Boolean(
                    query && (
                      (employee.nama && employee.nama.toLowerCase().includes(query)) ||
                      (employee.jabatan && employee.jabatan.toLowerCase().includes(query))
                    )
                  );

                  return (
                    <div
                      key={employee.id}
                      className={`flex items-center gap-2 transition-all rounded p-1 ${
                        isEmpMatch
                          ? 'bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-400 dark:ring-amber-500 font-bold text-amber-900 dark:text-amber-200'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={employee.nama}
                            className="h-5 w-5 rounded-full object-cover border border-slate-200 dark:border-white/[0.1]"
                            onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                            <span className="text-[7px] font-black text-white">{initials}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold truncate leading-snug">{employee.nama}</p>
                        <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 truncate">{employee.jabatan || '-'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── OrgTreeNode Component ───────────────────────────────────────────────────
interface OrgTreeNodeProps {
  node: TreeNode;
  searchQuery: string;
  onClickCard: (node: TreeNode) => void;
  employees: any[];
  getGradeInfo: (gradeId: string | null) => any;
  expandedPersonnelIds: ReadonlySet<string>;
  onTogglePersonnel: (nodeId: string) => void;
}

function OrgTreeNode({
  node,
  searchQuery,
  onClickCard,
  employees,
  getGradeInfo,
  expandedPersonnelIds,
  onTogglePersonnel,
}: OrgTreeNodeProps) {
  const config = TIPE_CONFIG[node.tipe];
  const hasChildren = node.children.length > 0;

  const { unitEmployees, topEmployees, subEmployeeGroups } = useMemo(
    () => getUnitEmployeeLayers(node, employees, getGradeInfo),
    [node, employees, getGradeInfo],
  );

  const matchesSearch = useMemo(() => {
    if (!searchQuery) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;

    if (node.nama.toLowerCase().includes(q) || node.kode.toLowerCase().includes(q)) {
      return true;
    }

    return unitEmployees.some(
      emp =>
        (emp.nama && emp.nama.toLowerCase().includes(q)) ||
        (emp.jabatan && emp.jabatan.toLowerCase().includes(q)),
    );
  }, [searchQuery, node.nama, node.kode, unitEmployees]);

  const isHighlighted = Boolean(searchQuery && matchesSearch);

  const hasMatchingSubEmployee = useMemo(() => {
    if (!searchQuery) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;
    const topIds = new Set(topEmployees.map(e => e.id));
    return unitEmployees.some(
      e =>
        !topIds.has(e.id) &&
        ((e.nama && e.nama.toLowerCase().includes(q)) ||
          (e.jabatan && e.jabatan.toLowerCase().includes(q))),
    );
  }, [searchQuery, topEmployees, unitEmployees]);

  const staffCount = unitEmployees.length;
  const personnelExpanded =
    !COLLAPSIBLE_PERSONNEL_UNIT_TYPES.has(node.tipe) ||
    expandedPersonnelIds.has(node.id) ||
    hasMatchingSubEmployee;
  const showPersonnelLane = subEmployeeGroups.length > 0 && personnelExpanded;
  const branchCount = node.children.length + (showPersonnelLane ? 1 : 0);

  if (node.isDummy) {
    return (
      <div className="flex flex-col items-center relative animate-fade-in">
        {/* Dummy spacer containing the straight connector vertical line */}
        <div className="relative z-10 px-4 w-64 h-32 flex items-center justify-center">
          <div className="h-full w-px bg-slate-300 dark:bg-slate-700" />
        </div>

        {hasChildren && (
          <>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
            <div className="flex gap-x-10 items-start relative">
              {node.children.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === node.children.length - 1;

                return (
                  <div key={child.id} className="relative flex flex-col items-center pt-6">
                    {!isFirst && (
                      <div
                        className="absolute top-0 h-px bg-slate-300 dark:bg-slate-700"
                        style={{ left: '-20px', width: 'calc(50% + 20px)' }}
                      />
                    )}
                    {!isLast && (
                      <div
                        className="absolute top-0 h-px bg-slate-300 dark:bg-slate-700"
                        style={{ right: '-20px', width: 'calc(50% + 20px)' }}
                      />
                    )}
                    <div className="absolute top-0 h-6 w-px bg-slate-300 dark:bg-slate-700" />
                    <OrgTreeNode
                      node={child}
                      searchQuery={searchQuery}
                      onClickCard={onClickCard}
                      employees={employees}
                      getGradeInfo={getGradeInfo}
                      expandedPersonnelIds={expandedPersonnelIds}
                      onTogglePersonnel={onTogglePersonnel}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  const isFunctional = node.nama.toLowerCase().includes('marketing') || 
                       node.nama.toLowerCase().includes('sourcing') || 
                       node.nama.toLowerCase().includes('sales');

  return (
    <div className="flex flex-col items-center relative animate-fade-in">
      {/* Node Card */}
      <div className="relative z-10 px-4">
        <div
          data-unit-type={node.tipe}
          data-org-node-id={node.id}
          className={`org-node-card-interactive relative group w-64 p-3.5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer select-none overflow-hidden
            ${config.borderClass} ${config.bgClass}
            ${isFunctional ? 'rounded-[2.5rem] border-3 px-6 py-4' : 'rounded-xl border-2'}
            ${isHighlighted
              ? 'ring-4 ring-yellow-400 dark:ring-yellow-500 shadow-xl scale-[1.03] z-20'
              : ''
            }
          `}
          onClick={() => onClickCard(node)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className={`org-node-type-badge text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.badge}`}>
              {config.label}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-350">
              {node.kode}
            </span>
          </div>

          {/* Unit Name */}
          <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2">
            {node.nama}
          </p>

          {/* Divider */}
          <div className="my-2 h-px bg-slate-200 dark:bg-white/[0.08]" />

          {/* Top-grade employees (can be multiple if same grade) */}
          <div className="space-y-1.5">
            {topEmployees.length > 0 ? (
              topEmployees.map(emp => {
                const avatarUrl = getAvatarUrl(emp.fotoProfil);
                const initials = getInitials(emp.nama);
                const gradient = GENDER_GRADIENT[emp.jenisKelamin] ?? GENDER_GRADIENT.default;
                const query = searchQuery?.trim().toLowerCase();
                const isEmpMatch = Boolean(
                  query && (
                    (emp.nama && emp.nama.toLowerCase().includes(query)) ||
                    (emp.jabatan && emp.jabatan.toLowerCase().includes(query))
                  )
                );

                return (
                  <div
                    key={emp.id}
                    className={`flex items-center gap-2 transition-all rounded p-0.5 ${
                      isEmpMatch
                        ? 'bg-amber-100/90 dark:bg-amber-900/40 ring-1 ring-amber-400 dark:ring-amber-500 font-bold text-amber-900 dark:text-amber-200'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={emp.nama}
                          className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-white/[0.1]"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800/85 text-slate-400 dark:text-slate-500 border border-slate-205/50 dark:border-white/[0.04] flex items-center justify-center shadow-sm">
                          <User className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[10px] font-black truncate leading-snug">{emp.nama}</p>
                        {emp.gradeId && (
                          <span className="org-node-grade-badge text-[8px] font-bold px-1.5 py-px bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded text-slate-650 dark:text-slate-450 font-mono shrink-0 scale-90 origin-right">
                            {getGradeInfo(emp.gradeId).kode}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate">{emp.jabatan}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[10px] font-semibold italic">Belum ada personil</span>
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-350 flex items-center gap-1">
              <Briefcase className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              {staffCount} Personil
            </span>
            {subEmployeeGroups.length > 0 && COLLAPSIBLE_PERSONNEL_UNIT_TYPES.has(node.tipe) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePersonnel(node.id);
                }}
                className="org-personnel-toggle text-[9px] font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer focus:outline-none"
              >
                {personnelExpanded ? (
                  <>
                    Sembunyikan <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Tampilkan personel ({unitEmployees.length - topEmployees.length}) <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unit children and personnel lane share one connector bus from this parent. */}
      {branchCount > 0 && (
        <>
          <div className={node.children.length > 0
            ? 'h-6 w-px bg-slate-300 dark:bg-slate-700'
            : 'h-6 border-l border-dashed border-teal-500 dark:border-teal-400'}
          />

          <div className="flex gap-x-10 items-start relative">
            {node.children.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === branchCount - 1;

              return (
                <div key={child.id} className="relative flex flex-col items-center pt-6">
                  {!isFirst && (
                    <div
                      className="absolute top-0 h-px bg-slate-300 dark:bg-slate-700"
                      style={{ left: '-20px', width: 'calc(50% + 20px)' }}
                    />
                  )}
                  {!isLast && (
                    <div
                      className="absolute top-0 h-px bg-slate-300 dark:bg-slate-700"
                      style={{ right: '-20px', width: 'calc(50% + 20px)' }}
                    />
                  )}
                  <div className="absolute top-0 h-6 w-px bg-slate-300 dark:bg-slate-700" />

                  <OrgTreeNode
                    node={child}
                    searchQuery={searchQuery}
                    onClickCard={onClickCard}
                    employees={employees}
                    getGradeInfo={getGradeInfo}
                    expandedPersonnelIds={expandedPersonnelIds}
                    onTogglePersonnel={onTogglePersonnel}
                  />
                </div>
              );
            })}

            {showPersonnelLane && (
              <div className="relative flex flex-col items-center pt-6">
                {node.children.length > 0 && (
                  <div
                    className="absolute top-0 h-0 border-t border-dashed border-teal-500 dark:border-teal-400"
                    style={{ left: '-20px', width: 'calc(50% + 20px)' }}
                  />
                )}
                <div className="absolute top-0 h-6 border-l border-dashed border-teal-500 dark:border-teal-400" />
                <PersonnelGradeLane node={node} config={config} groups={subEmployeeGroups} searchQuery={searchQuery} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── SidebarNode Component (VS Code Explorer Style) ───────────────────────────
interface SidebarNodeProps {
  node: TreeNode;
  employees: any[];
  getGradeInfo: (gradeId: string | null) => any;
  onSelectUnit: (node: TreeNode) => void;
  activeUnitId: string | null;
  searchQuery: string;
}

function SidebarNode({
  node,
  employees,
  getGradeInfo,
  onSelectUnit,
  activeUnitId,
  searchQuery,
}: SidebarNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Find leader & unit employees
  const unitEmployees = useMemo(() => {
    return employees.filter(e => e.unitOrganisasiId === node.id && e.isActive);
  }, [employees, node.id]);

  const leader = useMemo(() => {
    return getEligibleUnitLeaders(node, unitEmployees, getGradeInfo)[0] ?? null;
  }, [node, unitEmployees, getGradeInfo]);

  const matchesSearch = useMemo(() => {
    if (!searchQuery) return true;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    if (node.nama.toLowerCase().includes(q) || node.kode.toLowerCase().includes(q)) {
      return true;
    }

    return unitEmployees.some(
      e =>
        (e.nama && e.nama.toLowerCase().includes(q)) ||
        (e.jabatan && e.jabatan.toLowerCase().includes(q)),
    );
  }, [searchQuery, node.nama, node.kode, unitEmployees]);

  const hasChildren = node.children.length > 0;
  const isSelected = activeUnitId === node.id;

  const matchesAnyDescendant = useCallback(
    (n: TreeNode): boolean => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return false;

      const m =
        n.nama.toLowerCase().includes(q) ||
        n.kode.toLowerCase().includes(q) ||
        employees.some(
          e =>
            e.unitOrganisasiId === n.id &&
            e.isActive &&
            ((e.nama && e.nama.toLowerCase().includes(q)) ||
              (e.jabatan && e.jabatan.toLowerCase().includes(q))),
        );

      if (m) return true;
      return n.children.some(matchesAnyDescendant);
    },
    [searchQuery, employees],
  );

  useEffect(() => {
    if (searchQuery && matchesAnyDescendant(node)) {
      setIsExpanded(true);
    }
  }, [searchQuery, node, matchesAnyDescendant]);

  const shouldRender = searchQuery ? matchesSearch || matchesAnyDescendant(node) : true;

  if (!shouldRender) return null;

  const config = TIPE_CONFIG[node.tipe] || { dot: 'bg-slate-400', label: node.tipe.toUpperCase() };

  return (
    <div className="flex flex-col">
      <div
        className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all border select-none my-0.5
          ${isSelected
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
            : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.03] text-slate-700 dark:text-slate-300'
          }
        `}
        onClick={() => onSelectUnit(node)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(v => !v);
            }}
            className="mt-0.5 shrink-0 flex items-center justify-center h-4 w-4 rounded hover:bg-slate-200 dark:hover:bg-white/[0.08]"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dot}`} />
            <p className="text-[11px] font-semibold truncate leading-tight">{node.nama}</p>
          </div>
          
          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-medium text-slate-400 dark:text-slate-500">
            <span>{node.kode}</span>
            <span>•</span>
            <span className="uppercase text-[8px] font-bold">{config.label}</span>
          </div>

          {leader ? (
            <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500 mt-0.5 truncate leading-tight">
              PJ: {leader.nama} ({leader.jabatan})
            </p>
          ) : (
            <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 italic leading-tight">
              Belum ada pimpinan
            </p>
          )}
        </div>
      </div>

      {/* Children folder container drawing vertical folder tree border lines */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col pl-3.5 ml-4 border-l border-slate-200 dark:border-white/[0.06] mt-0.5">
          {node.children.map(child => (
            <SidebarNode
              key={child.id}
              node={child}
              employees={employees}
              getGradeInfo={getGradeInfo}
              onSelectUnit={onSelectUnit}
              activeUnitId={activeUnitId}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {(Object.entries(TIPE_CONFIG) as [TipeUnit, typeof TIPE_CONFIG[TipeUnit]][])
        .map(([tipe, cfg]) => (
          <div key={tipe} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dot}`} />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{cfg.label}</span>
          </div>
        ))}
    </div>
  );
}

// Helper to prune the tree keeping ancestors and descendants of the focused node
function pruneTreeKeepAncestors(nodes: TreeNode[], focusId: string): TreeNode[] {
  const isAncestor = (n: TreeNode): boolean => {
    if (n.id === focusId) return true;
    if (!n.children) return false;
    return n.children.some(isAncestor);
  };

  const checkAndPrune = (n: TreeNode, isDescendantOfFocus: boolean): TreeNode | null => {
    const isCurrentFocus = n.id === focusId;
    const isNowDescendant = isDescendantOfFocus || isCurrentFocus;
    const isAnc = isAncestor(n);

    if (!isNowDescendant && !isAnc) {
      return null;
    }

    const keptChildren: TreeNode[] = [];
    if (n.children) {
      n.children.forEach(child => {
        const processed = checkAndPrune(child, isNowDescendant);
        if (processed) {
          keptChildren.push(processed);
        }
      });
    }

    return {
      ...n,
      children: keptChildren
    };
  };

  const result: TreeNode[] = [];
  nodes.forEach(n => {
    const processed = checkAndPrune(n, false);
    if (processed) {
      result.push(processed);
    }
  });
  return result;
}

function findTreeNode(nodes: TreeNode[], query: string, employees: any[]): TreeNode | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return null;

  for (const node of nodes) {
    const unitMatch =
      node.nama.toLowerCase().includes(normalizedQuery) ||
      node.kode.toLowerCase().includes(normalizedQuery);

    const empMatch = employees.some(
      e =>
        e.unitOrganisasiId === node.id &&
        e.isActive &&
        ((e.nama && e.nama.toLowerCase().includes(normalizedQuery)) ||
          (e.jabatan && e.jabatan.toLowerCase().includes(normalizedQuery))),
    );

    if (unitMatch || empMatch) {
      return node;
    }

    const descendant = findTreeNode(node.children, normalizedQuery, employees);
    if (descendant) return descendant;
  }
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BaganOrganisasiPage() {
  const [units, setUnits] = useState<UnitOrganisasi[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [mobileSidebarExpanded, setMobileSidebarExpanded] = useState(false);
  const [mobileSidebarZoom, setMobileSidebarZoom] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);
  const [expandedPersonnelIds, setExpandedPersonnelIds] = useState<Set<string>>(() => new Set());
  const diagramPrintRef = useRef<HTMLDivElement>(null);

  const togglePersonnelNode = useCallback((nodeId: string) => {
    setExpandedPersonnelIds(current => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  
  // Canvas localized navigation root
  const [focusUnit, setFocusUnit] = useState<TreeNode | null>(null);

  const [selectedUnit, setSelectedUnit] = useState<TreeNode | null>(null);

  // Zoom & Pan Canvas state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const touchGestureRef = useRef<{
    mode: 'pan' | 'pinch';
    startPan: { x: number; y: number };
    startPoint?: { x: number; y: number };
    startDistance?: number;
    startZoom?: number;
    modelPoint?: { x: number; y: number };
  } | null>(null);

  // Resizing sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth >= 240 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Reset zoom & pan when focus unit or fullscreen state changes to ensure the chart is visible and centered
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [focusUnit, isFullscreen]);

  // Helper to map and sort employees in the selected unit
  const getGradeInfo = useCallback((gradeId: string | null) => {
    const g = grades.find(x => x.id === gradeId);
    return g ? { kode: g.kode, label: g.label, level: g.level, keterangan: g.keterangan } : { kode: '-', label: 'Unknown Grade', level: -1, keterangan: '-' };
  }, [grades]);

  const directEmployees = useMemo(() => {
    if (!selectedUnit) return [];
    return employees.filter(e => e.unitOrganisasiId === selectedUnit.id);
  }, [selectedUnit, employees]);

  const groupedByGrade = useMemo(() => {
    const groups: Record<string, { grade: any; list: any[] }> = {};
    directEmployees.forEach(e => {
      const gInfo = getGradeInfo(e.gradeId);
      const gKey = e.gradeId || 'no-grade';
      if (!groups[gKey]) {
        groups[gKey] = {
          grade: gInfo,
          list: []
        };
      }
      groups[gKey].list.push(e);
    });

    // Sort employees inside each grade group: pimpinan first, then by name
    Object.values(groups).forEach(group => {
      group.list.sort((a, b) => {
        if (a.isPimpinan && !b.isPimpinan) return -1;
        if (!a.isPimpinan && b.isPimpinan) return 1;
        return (a.nama ?? '').localeCompare(b.nama ?? '');
      });
    });

    return Object.values(groups).sort((a, b) => b.grade.level - a.grade.level);
  }, [directEmployees, getGradeInfo]);

  const subUnits = useMemo(() => {
    if (!selectedUnit) return [];
    return units.filter(u => u.parentId === selectedUnit.id);
  }, [selectedUnit, units]);

  // Sidebar tree contains ALL levels including 'seksi'
  const sidebarTree = useMemo(() => {
    const activeUnits = units.filter(u => u.isActive);
    return buildTree(activeUnits);
  }, [units]);

  // Canvas visual tree always contains every active organizational unit. Employee
  // occupancy must not determine whether a child unit is visible in the hierarchy.
  const tree = useMemo(() => {
    const activeUnits = units.filter(u => u.isActive);
    const fullTree = buildTree(activeUnits);
    
    if (focusUnit) {
      const pruned = pruneTreeKeepAncestors(fullTree, focusUnit.id);
      return normalizeTreeLevels(pruned);
    }
      
    return normalizeTreeLevels(fullTree);
  }, [units, focusUnit]);

  useEffect(() => {
    const match = findTreeNode(tree, search, employees);
    if (!match || !canvasRef.current) return;

    const timeout = window.setTimeout(() => {
      const canvas = canvasRef.current;
      const nodeElement = canvas?.querySelector<HTMLElement>(`[data-org-node-id="${match.id}"]`);
      if (!canvas || !nodeElement) return;

      const canvasRect = canvas.getBoundingClientRect();
      const nodeRect = nodeElement.getBoundingClientRect();
      const targetZoom = Math.min(Math.max(zoom, 1), 1.25);
      const modelX = (nodeRect.left + nodeRect.width / 2 - canvasRect.left - pan.x) / zoom;
      const modelY = (nodeRect.top + nodeRect.height / 2 - canvasRect.top - pan.y) / zoom;

      setZoom(targetZoom);
      setPan({
        x: canvasRect.width / 2 - modelX * targetZoom,
        y: canvasRect.height / 2 - modelY * targetZoom,
      });
    }, 280);

    return () => window.clearTimeout(timeout);
    // Navigation intentionally reacts to a new query/tree, not to its own pan/zoom update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tree, employees]);

  // Focused Unit Breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    if (!focusUnit) return [];
    const path: UnitOrganisasi[] = [];
    let current: UnitOrganisasi | undefined = focusUnit;
    while (current) {
      path.unshift(current);
      const parentId: string | null = current.parentId;
      current = parentId ? units.find(u => u.id === parentId) : undefined;
    }
    return path;
  }, [focusUnit, units]);

  // Single Unit detailed Modal PDF Export
  const downloadPDF = useCallback(() => {
    if (!selectedUnit) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const employeeRows = groupedByGrade.map(group => {
      return `
        <tr class="grade-header-row">
          <td colspan="5" class="grade-title">
            Grade: ${group.grade.kode} - ${group.grade.label} (${group.grade.keterangan || ''})
          </td>
        </tr>
        ${group.list.map((emp: any, index: number) => `
          <tr class="emp-row ${emp.isPimpinan ? 'pimpinan-row' : ''}">
            <td style="text-align: center;">${index + 1}</td>
            <td>
              <div class="emp-name-cell">
                <strong>${emp.nama}</strong>
                ${emp.isPimpinan ? `<span class="badge-pj">Pimpinan / PJ</span>` : ''}
              </div>
            </td>
            <td>${emp.nrk || '-'}</td>
            <td>${emp.nik || '-'}</td>
            <td>${emp.jabatan || '-'}</td>
          </tr>
        `).join('')}
      `;
    }).join('');

    const subUnitsList = subUnits.length > 0
      ? `
        <div class="sub-units-section">
          <h3>Sub-Unit Kerja</h3>
          <table class="sub-units-table">
            <thead>
              <tr>
                <th style="width: 80px;">Kode</th>
                <th>Nama Unit</th>
                <th>Tipe</th>
              </tr>
            </thead>
            <tbody>
              ${subUnits.map(su => `
                <tr>
                  <td><strong>${su.kode}</strong></td>
                  <td>${su.nama}</td>
                  <td style="text-transform: uppercase;">${su.tipe}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `
      : '';

    const html = `
      <html>
        <head>
          <title>Struktur & Personnel - ${selectedUnit.nama}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
            @page {
              size: portrait;
              margin: 15mm;
            }
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              padding: 40px;
              background: #ffffff;
              margin: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px double #cbd5e1;
              padding-bottom: 20px;
              margin-bottom: 30px;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .header-title h1 {
              font-size: 20px;
              font-weight: 900;
              margin: 0;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .header-title p {
              font-size: 11px;
              color: #64748b;
              margin: 5px 0 0 0;
              font-weight: 600;
            }
            .logo-text {
              font-size: 18px;
              font-weight: 900;
              color: #d97706;
              letter-spacing: 1px;
              margin-left: auto;
            }
            .meta-info {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px 20px;
              margin-bottom: 30px;
              display: grid;
              grid-template-columns: 2fr 1fr 1fr 1fr;
              gap: 15px;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .meta-item {
              font-size: 12px;
            }
            .meta-item label {
              display: block;
              text-transform: uppercase;
              font-weight: 800;
              color: #64748b;
              font-size: 9px;
              letter-spacing: 1px;
              margin-bottom: 3px;
            }
            .meta-item span {
              font-weight: 600;
              color: #0f172a;
            }
            h2, h3 {
              font-size: 14px;
              font-weight: 850;
              border-left: 4px solid #2563eb;
              padding-left: 10px;
              margin-bottom: 15px;
              color: #0f172a;
              text-transform: uppercase;
              break-after: avoid;
              page-break-after: avoid;
            }
            .members-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .members-table thead {
              display: table-header-group;
            }
            .members-table tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .members-table th {
              background: #f1f5f9;
              color: #475569;
              font-weight: 800;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 10px 15px;
              border: 1px solid #e2e8f0;
              text-align: left;
            }
            .members-table td {
              padding: 10px 15px;
              border: 1px solid #e2e8f0;
              font-size: 12px;
            }
            .grade-header-row {
              background: #f1f5f9;
              break-inside: avoid;
              page-break-inside: avoid;
              break-after: avoid;
              page-break-after: avoid;
            }
            .grade-title {
              font-weight: 800;
              color: #1e40af;
              font-size: 11px;
              padding: 8px 15px !important;
              border-bottom: 2px solid #cbd5e1;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .emp-row {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .emp-row td {
              background: #ffffff;
            }
            .emp-row:nth-child(even) td {
              background: #f8fafc;
            }
            .pimpinan-row td {
              background-color: rgba(37, 99, 235, 0.06) !important;
            }
            .badge-pj {
              margin-left: 8px;
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              padding: 2px 6px;
              border-radius: 4px;
              background: rgba(37, 99, 235, 0.1);
              color: #2563eb;
              border: 1px solid rgba(37, 99, 235, 0.2);
              display: inline-block;
              vertical-align: middle;
            }
            .sub-units-section {
              margin-top: 30px;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .sub-units-table {
              width: 100%;
              border-collapse: collapse;
            }
            .sub-units-table th {
              background: #f1f5f9;
              color: #475569;
              font-weight: 800;
              font-size: 10px;
              text-transform: uppercase;
              padding: 8px 12px;
              border: 1px solid #e2e8f0;
              text-align: left;
            }
            .sub-units-table td {
              padding: 8px 12px;
              border: 1px solid #e2e8f0;
              font-size: 12px;
            }
            .footer-note {
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              font-weight: 600;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            @media print {
              @page { margin: 10mm; }
              body { 
                padding: 10mm 10mm !important; 
                box-sizing: border-box; 
              }
              .print-node-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-title">
              <h1>Laporan Personil & Struktur Organisasi</h1>
              <p>PT Industri Nabati Lestari</p>
            </div>
            <div class="logo-text">InTes</div>
          </div>

          <div class="meta-info">
            <div class="meta-item">
              <label>Unit Organisasi</label>
              <span>${selectedUnit.nama}</span>
            </div>
            <div class="meta-item">
              <label>Kode Unit</label>
              <span>${selectedUnit.kode}</span>
            </div>
            <div class="meta-item">
              <label>Tipe Unit</label>
              <span style="text-transform: uppercase;">${selectedUnit.tipe}</span>
            </div>
            <div class="meta-item">
              <label>Total Personil</label>
              <span>${directEmployees.length} Orang</span>
            </div>
          </div>

          <h2>Daftar Anggota / Personnel</h2>
          ${groupedByGrade.length === 0 ? `
            <p style="font-size: 12px; color: #64748b; font-style: italic; margin-bottom: 30px;">Tidak ada anggota personil yang terdaftar langsung di unit ini.</p>
          ` : `
            <table class="members-table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">No</th>
                  <th>Nama Karyawan</th>
                  <th style="width: 120px;">NRK</th>
                  <th style="width: 150px;">NIK</th>
                  <th>Jabatan</th>
                </tr>
              </thead>
              <tbody>
                ${employeeRows}
              </tbody>
            </table>
          `}

          ${subUnitsList}

          <div class="footer-note">
            Dokumen ini digenerate secara otomatis melalui InTes pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }, [selectedUnit, groupedByGrade, subUnits, directEmployees]);

  // Print the live diagram DOM so PDF and on-screen nodes always share one renderer.
  const downloadVisualChartPDF = useCallback(() => {
    const sourceDiagram = diagramPrintRef.current;
    if (!sourceDiagram) {
      alert('Diagram belum siap untuk dicetak.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const stylesheetMarkup = Array.from(
      document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"], style'),
    ).map(element => element.outerHTML).join('\n');
    const baseHref = escapePrintHtml(document.baseURI);
    const printUnitColorRules = (Object.entries(TIPE_CONFIG) as Array<[TipeUnit, TipeConfig]>)
      .map(([type, config]) => `
        .diagram-print-clone [data-unit-type="${type}"] {
          border-color: #${config.exportColor.line} !important;
          background-color: #${config.exportColor.fill} !important;
        }
      `)
      .join('\n');
    const generatedAt = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const printScope = focusUnit
      ? `${TIPE_CONFIG[focusUnit.tipe]?.label || focusUnit.tipe.toUpperCase()} · ${focusUnit.nama} (${focusUnit.kode})`
      : 'Seluruh Struktur Organisasi';

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <base href="${baseHref}" />
          <title>Bagan Organisasi - PT Industri Nabati Lestari</title>
          ${stylesheetMarkup}
          <style>
            @page { size: A4 landscape; margin: 0; }
            html {
              width: 296mm;
              height: 208mm;
              min-width: 0 !important;
              min-height: 0 !important;
              max-width: 296mm !important;
              max-height: 208mm !important;
              margin: 0;
              padding: 0;
              overflow: hidden !important;
              background: #ffffff !important;
              color-scheme: light only;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              position: relative;
              width: 296mm;
              height: 208mm;
              min-width: 0 !important;
              min-height: 0 !important;
              max-width: 296mm !important;
              max-height: 208mm !important;
              margin: 0;
              padding: 0;
              overflow: hidden !important;
              background: #ffffff !important;
            }
            html::before,
            html::after,
            body::before,
            body::after,
            body > :not(.diagram-print-page) {
              display: none !important;
              content: none !important;
            }
            .diagram-print-page {
              position: absolute;
              inset: 0;
              width: 296mm;
              height: 208mm;
              box-sizing: border-box;
              overflow: hidden;
              background: #ffffff;
            }
            .diagram-print-header {
              position: absolute;
              top: 3mm;
              left: 5mm;
              right: 5mm;
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
            }
            .diagram-print-header h1 {
              margin: 0;
              color: #0f172a;
              font-size: 16px;
              font-weight: 900;
              letter-spacing: 0;
            }
            .diagram-print-header p,
            .diagram-print-header time {
              margin: 3px 0 0;
              color: #64748b;
              font-size: 8px;
              font-weight: 600;
            }
            .diagram-print-header .diagram-print-scope {
              margin-top: 5px;
              color: #334155;
              font-size: 9px;
              font-weight: 800;
            }
            .diagram-print-header .diagram-print-scope-label {
              margin-right: 5px;
              color: #94a3b8;
              font-size: 7px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .diagram-print-viewport {
              position: absolute;
              top: 24mm;
              right: 10mm;
              bottom: 13mm;
              left: 10mm;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              overflow: visible;
            }
            .diagram-print-stage {
              position: relative;
              flex: none;
              overflow: visible;
            }
            .diagram-print-clone {
              width: max-content;
              padding: 8px;
              overflow: visible !important;
              transform-origin: top left;
              color-scheme: light only;
            }
            .diagram-print-clone *,
            .diagram-print-clone *::before,
            .diagram-print-clone *::after {
              animation: none !important;
              transition: none !important;
            }
            .diagram-print-clone .animate-fade-in,
            .diagram-print-clone .org-node-card-interactive {
              transform: none !important;
              rotate: 0deg !important;
              transform-style: flat !important;
              backface-visibility: visible !important;
            }
            .diagram-print-clone .org-personnel-toggle {
              display: none !important;
            }
            .diagram-print-footer {
              position: absolute;
              right: 10mm;
              bottom: 4mm;
              left: 10mm;
              color: #94a3b8;
              font-size: 7px;
              font-weight: 600;
              text-align: center;
            }
            @media print {
              @page { size: A4 landscape; margin: 0; }
              html {
                width: 0 !important;
                height: 0 !important;
                min-width: 0 !important;
                min-height: 0 !important;
                max-width: 0 !important;
                max-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
                overflow: visible !important;
                background: #ffffff !important;
              }
              body {
                position: static !important;
                width: 0 !important;
                height: 0 !important;
                min-width: 0 !important;
                min-height: 0 !important;
                max-width: 0 !important;
                max-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
                overflow: visible !important;
                background: #ffffff !important;
              }
              html::before,
              html::after,
              body::before,
              body::after,
              body > :not(.diagram-print-page) {
                display: none !important;
                content: none !important;
              }
              .diagram-print-page {
                position: absolute !important;
                top: 12mm !important;
                left: 12mm !important;
                right: auto !important;
                bottom: auto !important;
                width: 273mm !important;
                height: 186mm !important;
                margin: 0 !important;
                overflow: hidden !important;
              }
              .diagram-print-header {
                position: absolute !important;
                top: 3mm !important;
                right: 5mm !important;
                left: 5mm !important;
              }
              .diagram-print-viewport {
                position: absolute !important;
                top: 24mm !important;
                right: 10mm !important;
                bottom: 13mm !important;
                left: 10mm !important;
                display: flex !important;
                align-items: flex-start !important;
                justify-content: center !important;
                overflow: visible !important;
              }
              .diagram-print-clone,
              .diagram-print-clone * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .diagram-print-clone .org-node-card-interactive {
                border-width: 1px !important;
                box-shadow: none !important;
              }
              .diagram-print-clone .org-personnel-card,
              .diagram-print-clone .org-node-type-badge,
              .diagram-print-clone .org-node-grade-badge {
                border-width: 1px !important;
              }
              .diagram-print-clone .org-personnel-reference,
              .diagram-print-clone .org-origin-unit {
                border-top-width: 1px !important;
                border-bottom-width: 1px !important;
              }
              ${printUnitColorRules}
              .diagram-print-footer {
                position: absolute !important;
                right: 10mm !important;
                bottom: 4mm !important;
                left: 10mm !important;
                display: block !important;
              }
            }
          </style>
        </head>
        <body>
          <main class="diagram-print-page">
            <header class="diagram-print-header">
              <div>
                <h1>Bagan Organisasi</h1>
                <p>PT Industri Nabati Lestari</p>
                <p class="diagram-print-scope">
                  <span class="diagram-print-scope-label">Cakupan</span>${escapePrintHtml(printScope)}
                </p>
              </div>
              <time>${escapePrintHtml(generatedAt)}</time>
            </header>
            <section class="diagram-print-viewport">
              <div class="diagram-print-stage">
                <div class="diagram-print-clone">${sourceDiagram.outerHTML}</div>
              </div>
            </section>
            <footer class="diagram-print-footer">Dicetak dari tampilan Visualisasi Diagram Portal INL · Halaman 1</footer>
          </main>
          <script>
            (function () {
              var printRequested = false;
              function waitForImages() {
                return Promise.all(Array.prototype.map.call(document.images, function (image) {
                  if (image.complete) return Promise.resolve();
                  return new Promise(function (resolve) {
                    image.addEventListener('load', resolve, { once: true });
                    image.addEventListener('error', resolve, { once: true });
                  });
                }));
              }
              function fitDiagram() {
                var viewport = document.querySelector('.diagram-print-viewport');
                var stage = document.querySelector('.diagram-print-stage');
                var root = document.querySelector('.diagram-print-clone');
                if (!viewport || !stage || !root) return;

                stage.style.width = '';
                stage.style.height = '';
                root.style.position = 'static';
                root.style.top = '';
                root.style.left = '';
                root.style.transform = '';
                root.style.transformOrigin = 'top left';

                root.style.display = 'inline-flex';
                root.style.maxWidth = 'none';
                root.style.maxHeight = 'none';

                var rootBounds = root.getBoundingClientRect();
                var minLeft = rootBounds.left;
                var minTop = rootBounds.top;
                var maxRight = rootBounds.right;
                var maxBottom = rootBounds.bottom;

                Array.prototype.forEach.call(root.querySelectorAll('*'), function (element) {
                  var style = window.getComputedStyle(element);
                  if (style.display === 'none' || style.visibility === 'hidden') return;
                  var rect = element.getBoundingClientRect();
                  if (!rect.width && !rect.height) return;
                  minLeft = Math.min(minLeft, rect.left);
                  minTop = Math.min(minTop, rect.top);
                  maxRight = Math.max(maxRight, rect.right);
                  maxBottom = Math.max(maxBottom, rect.bottom);
                });

                // Include connector strokes and printer rounding outside the measured boxes.
                var sourceBleed = 12;
                var minX = minLeft - rootBounds.left - sourceBleed;
                var minY = minTop - rootBounds.top - sourceBleed;
                var contentWidth = Math.ceil(maxRight - minLeft + sourceBleed * 2);
                var contentHeight = Math.ceil(maxBottom - minTop + sourceBleed * 2);
                if (!contentWidth || !contentHeight) return;

                // Width is the primary constraint; height only caps it to preserve one A4 page.
                var viewportInset = 24;
                var availableWidth = Math.max(1, viewport.clientWidth - viewportInset * 2);
                var availableHeight = Math.max(1, viewport.clientHeight - viewportInset * 2);
                var fitWidthScale = availableWidth / contentWidth;
                var fitHeightScale = availableHeight / contentHeight;
                var scale = Math.min(fitWidthScale, fitHeightScale, 1) * 0.98;
                stage.style.width = Math.ceil(contentWidth * scale) + 'px';
                stage.style.height = Math.ceil(contentHeight * scale) + 'px';
                root.style.position = 'absolute';
                root.style.top = Math.round(-minY * scale) + 'px';
                root.style.left = Math.round(-minX * scale) + 'px';
                root.style.transform = 'scale(' + scale + ')';
              }
              function requestPrint() {
                if (printRequested) return;
                fitDiagram();
                printRequested = true;
                window.print();
              }
              window.addEventListener('beforeprint', fitDiagram);
              window.addEventListener('load', function () {
                var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
                Promise.all([fontsReady, waitForImages()]).then(function () {
                  requestAnimationFrame(function () { requestAnimationFrame(requestPrint); });
                });
              });
            }());
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [focusUnit]);


  // ─── Export bagan sebagai PowerPoint (editable, skala bebas, tak terpotong) ───
  const downloadFullChartPPTX = useCallback(async () => {
    if (tree.length === 0) return;
    setExportingPptx(true);
    try {
      const pptxModule = await import('pptxgenjs');
      const PptxGenJS = (pptxModule as any).default || pptxModule;
      const pptx = new PptxGenJS();

      const { nodes, connectors, width, height } = computeTreeLayout(tree);

      // Konversi px → inci (96px/inci) + margin & ruang untuk kop/footer.
      const PX = 96;
      const MARGIN = 0.4;
      const HEADER_H = 0.9;
      const FOOTER_H = 0.35;
      // PowerPoint membatasi dimensi slide maks 56 inci — pakai 54 sebagai batas aman.
      // Skala seluruh geometri + font agar bagan besar tetap menghasilkan file valid.
      const MAX_SLIDE = 54;
      const contentWin = width / PX;
      const contentHin = height / PX;
      const scale = Math.min(
        1,
        (MAX_SLIDE - MARGIN * 2) / contentWin,
        (MAX_SLIDE - MARGIN * 2 - HEADER_H - FOOTER_H) / contentHin,
      );
      const fs = (n: number) => Math.max(1, +(n * scale).toFixed(2));

      const slideW = contentWin * scale + MARGIN * 2;
      const slideH = contentHin * scale + MARGIN * 2 + HEADER_H + FOOTER_H;

      pptx.defineLayout({ name: 'INL_ORG', width: slideW, height: slideH });
      pptx.layout = 'INL_ORG';
      pptx.author = 'Portal INL';
      pptx.company = 'PT Industri Nabati Lestari';
      pptx.title = 'Struktur Organisasi';

      const slide = pptx.addSlide();
      slide.background = { color: 'FFFFFF' };

      // Kop
      slide.addText(
        [
          { text: 'Laporan Struktur Organisasi\n', options: { fontSize: 18, bold: true, color: '0F172A' } },
          { text: 'PT Industri Nabati Lestari', options: { fontSize: 10, color: '64748B' } },
        ],
        { x: MARGIN, y: 0.25, w: slideW - MARGIN * 2 - 1.6, h: 0.7, align: 'left', valign: 'top', fontFace: 'Inter' },
      );
      slide.addText('INL PORTAL', {
        x: slideW - MARGIN - 1.6, y: 0.32, w: 1.6, h: 0.4,
        align: 'right', fontSize: 14, bold: true, color: 'F59E0B', fontFace: 'Inter',
      });
      slide.addShape(pptx.ShapeType.line, {
        x: MARGIN, y: HEADER_H, w: slideW - MARGIN * 2, h: 0,
        line: { color: 'CBD5E1', width: 1.5 },
      });

      const ox = MARGIN;
      const oy = MARGIN + HEADER_H;
      const toIn = (v: number) => (v / PX) * scale;

      // Konektor
      connectors.forEach(c => {
        slide.addShape(pptx.ShapeType.line, {
          x: ox + toIn(c.x1), y: oy + toIn(c.y1),
          w: toIn(c.x2 - c.x1), h: toIn(c.y2 - c.y1),
          line: { color: 'CBD5E1', width: 1 },
        });
      });

      // Node (lewati dummy — hanya penerus garis)
      nodes.forEach(pn => {
        if (pn.node.isDummy) return;
        const colors = (TIPE_CONFIG[pn.node.tipe] || TIPE_CONFIG.seksi).exportColor;
        const { leader, gradeCode, count, typeLabel } = getNodePrintMeta(pn.node, employees, getGradeInfo);

        const x = ox + toIn(pn.x);
        const y = oy + toIn(pn.y);
        const w = toIn(pn.w);
        const h = toIn(pn.h);
        const pad = 0.08 * scale;
        const vPad = 0.08 * scale;

        slide.addShape(pptx.ShapeType.roundRect, {
          x, y, w, h, rectRadius: 0.05 * scale,
          fill: { color: colors.fill },
          line: { color: colors.line, width: Math.max(0.5, 1.25 * scale) },
        });

        const leaderLine = leader
          ? `PJ: ${leader.nama}${gradeCode ? ` (${gradeCode})` : ''}\n${leader.jabatan || ''}`
          : 'Belum ada pimpinan';

        slide.addText(
          [
            { text: `${typeLabel}  ·  ${pn.node.kode}\n`, options: { fontSize: fs(7.2), bold: true, color: colors.text } },
            { text: `${pn.node.nama}\n`, options: { fontSize: fs(9.5), bold: true, color: '0F172A' } },
            { text: `${leaderLine}\n`, options: { fontSize: fs(7.2), color: leader ? '334155' : '94A3B8', italic: !leader } },
            { text: `${count} Personil`, options: { fontSize: fs(6.8), bold: true, color: '475569' } },
          ],
          { x: x + pad, y: y + vPad, w: w - pad * 2, h: h - vPad * 2, align: 'left', valign: 'top', fontFace: 'Inter', margin: 0, lineSpacingMultiple: 1.05 },
        );
      });

      slide.addText(
        `Bagan ini digenerate secara otomatis melalui Portal INL pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
        { x: MARGIN, y: slideH - FOOTER_H, w: slideW - MARGIN * 2, h: FOOTER_H, align: 'center', fontSize: 8, color: '94A3B8', fontFace: 'Inter' },
      );

      await pptx.writeFile({ fileName: 'Struktur-Organisasi-INL.pptx' });
    } catch (err) {
      console.error('Gagal membuat PPT:', err);
      alert('Gagal membuat file PPT: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExportingPptx(false);
    }
  }, [tree, employees, getGradeInfo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [orgRes, empRes, gradeRes] = await Promise.all([
        api.get<UnitOrganisasi[]>('/org/unit?limit=1000'),
        api.get<any[]>('/employees?limit=1000'),
        api.get<any[]>('/master/grade'),
      ]);
      setUnits(orgRes.data || []);
      setEmployees(empRes.data || []);
      setGrades(gradeRes.data || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => ({
    total: units.length,
    active: units.filter(u => u.isActive).length,
    byTipe: Object.fromEntries(
      (['direktorat', 'sevp', 'bagian', 'sub_bagian', 'seksi'] as TipeUnit[])
        .map(t => [t, units.filter(u => u.tipe === t).length])
    ) as Record<TipeUnit, number>,
  }), [units]);

  // Zoom & Pan Action handlers
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2.0));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only allow left-click drag

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.org-node-card-interactive')) {
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const targetZoom = Math.min(Math.max(zoom * Math.exp(-e.deltaY * 0.0015), 0.3), 2.5);
    const ratio = targetZoom / zoom;

    setPan({
      x: pointer.x - (pointer.x - pan.x) * ratio,
      y: pointer.y - (pointer.y - pan.y) * ratio,
    });
    setZoom(targetZoom);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length >= 2) {
      const first = e.touches[0];
      const second = e.touches[1];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const center = {
        x: (first.clientX + second.clientX) / 2 - rect.left,
        y: (first.clientY + second.clientY) / 2 - rect.top,
      };
      touchGestureRef.current = {
        mode: 'pinch',
        startPan: pan,
        startDistance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY),
        startZoom: zoom,
        modelPoint: {
          x: (center.x - pan.x) / zoom,
          y: (center.y - pan.y) / zoom,
        },
      };
      setIsDragging(true);
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.org-node-card-interactive')) {
      return;
    }

    touchGestureRef.current = {
      mode: 'pan',
      startPan: pan,
      startPoint: { x: touch.clientX, y: touch.clientY },
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const gesture = touchGestureRef.current;
    if (!gesture) return;
    e.preventDefault();

    if (gesture.mode === 'pinch' && e.touches.length >= 2) {
      const first = e.touches[0];
      const second = e.touches[1];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !gesture.startDistance || !gesture.startZoom || !gesture.modelPoint) return;

      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      const targetZoom = Math.min(Math.max(gesture.startZoom * (distance / gesture.startDistance), 0.3), 2.5);
      const center = {
        x: (first.clientX + second.clientX) / 2 - rect.left,
        y: (first.clientY + second.clientY) / 2 - rect.top,
      };
      setZoom(targetZoom);
      setPan({
        x: center.x - gesture.modelPoint.x * targetZoom,
        y: center.y - gesture.modelPoint.y * targetZoom,
      });
      return;
    }

    const touch = e.touches[0];
    if (!touch || !gesture.startPoint) return;
    setPan({
      x: gesture.startPan.x + touch.clientX - gesture.startPoint.x,
      y: gesture.startPan.y + touch.clientY - gesture.startPoint.y,
    });
  };

  const handleTouchEnd = () => {
    touchGestureRef.current = null;
    setIsDragging(false);
  };

  const renderChartLayout = () => {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] shadow-lg flex flex-col transition-all duration-200 ${isFullscreen ? 'w-screen h-screen rounded-none border-none' : 'h-[70vh]'}`}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-20" />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between flex-wrap z-20 bg-white/95 dark:bg-[#0f1623]/95 backdrop-blur-md">
          {/* Main search bar for canvas highlights */}
          <div className="order-2 sm:order-1 flex items-center gap-3 w-full sm:w-auto">
            {/* Desktop Sidebar Collapse Toggle */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(v => !v)}
              className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none"
              title={sidebarCollapsed ? "Tampilkan Penjelajah Hierarki" : "Sembunyikan Penjelajah Hierarki"}
            >
              <PanelLeft className={`h-4.5 w-4.5 transition-transform duration-250 ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            </button>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari unit, kode, nama karyawan, atau jabatan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all"
              />
            </div>
          </div>
          <div className="order-1 sm:order-2 flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
            <button
              onClick={() => setLegendOpen(true)}
              className="w-full justify-center sm:w-auto flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-3.5 py-2.5 sm:py-2 text-xs font-bold text-slate-650 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer focus:outline-none"
            >
              <Building2 className="h-3.5 w-3.5 text-amber-550 shrink-0" /> Legenda Nomenklatur
            </button>
          </div>
        </div>

        {/* Main Body Splitter */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sub-sidebar (Scrollable tree navigation) - hidden on mobile, shown on desktop */}
          <div
            style={{ width: `${sidebarCollapsed ? 0 : sidebarWidth}px` }}
            className={`hidden md:flex border-r border-slate-100 dark:border-white/[0.06] bg-slate-50/40 dark:bg-[#0c121e]/40 flex-col h-full shrink-0 select-none relative transition-all duration-300 ${sidebarCollapsed ? 'border-none overflow-hidden' : ''}`}
          >
            {/* Hierarchy scroll view with hidden scrollbar */}
            <div
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 no-scrollbar hide-scrollbar"
            >
              {loading ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  <span className="text-xs font-semibold text-slate-400">Loading sidebar...</span>
                </div>
              ) : sidebarTree.length === 0 ? (
                <p className="text-xs italic text-slate-400 dark:text-slate-500 text-center py-10">Unit tidak ditemukan</p>
              ) : (
                sidebarTree.map(root => (
                  <SidebarNode
                    key={root.id}
                    node={root}
                    employees={employees}
                    getGradeInfo={getGradeInfo}
                    onSelectUnit={node => setFocusUnit(node)}
                    activeUnitId={focusUnit?.id || null}
                    searchQuery={search}
                  />
                ))
              )}
            </div>

            {/* Col-Resize Drag Handle */}
            <div
              onMouseDown={startResizing}
              className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-amber-500/30 active:bg-amber-500 transition-all z-30"
            />
          </div>

          {/* Right canvas area */}
          <div
            ref={canvasRef}
            className="flex-1 relative overflow-hidden select-none cursor-grab active:cursor-grabbing bg-slate-50/30 dark:bg-[#080c14]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#8b5cf6 0.8px, transparent 0.8px)',
                backgroundSize: '24px 24px',
                opacity: 0.12,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />

            {/* Breadcrumb Trail */}
            {focusUnit && (
              <div className="absolute left-3 right-3 top-3 z-10 flex max-w-max items-center gap-1.5 overflow-x-auto hide-scrollbar rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] font-bold shadow-sm backdrop-blur-md animate-fade-in select-none hide-scrollbar sm:left-4 sm:right-auto sm:top-4 dark:border-white/[0.06] dark:bg-[#0f1623]/90">
                <button 
                  onClick={() => setFocusUnit(null)} 
                  className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-black cursor-pointer hover:underline uppercase tracking-wider"
                >
                  Seluruh Bagan
                </button>
                {breadcrumbs.map((b, idx) => (
                  <React.Fragment key={b.id}>
                    <span className="text-slate-400 font-black">/</span>
                    <button
                      onClick={() => setFocusUnit(b as TreeNode)}
                      className={`cursor-pointer hover:underline uppercase tracking-wider ${
                        idx === breadcrumbs.length - 1 
                          ? 'text-slate-800 dark:text-slate-200 font-black' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      disabled={idx === breadcrumbs.length - 1}
                    >
                      {b.nama}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Zoomable tree wrapper */}
            <div
              className="absolute origin-top-left p-24 min-w-max flex justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-3 min-w-[50vw]">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  <span className="text-sm font-semibold text-slate-400">Memuat struktur organisasi...</span>
                </div>
              ) : tree.length === 0 ? (
                <div className="py-20 text-center text-sm font-semibold text-slate-400 dark:text-slate-500 min-w-[50vw]">
                  Tidak ada unit yang sesuai filter.
                </div>
              ) : (
                <div ref={diagramPrintRef} className="flex gap-x-16 items-start">
                  {tree.map(root => (
                    <OrgTreeNode
                      key={root.id}
                      node={root}
                      searchQuery={search}
                      onClickCard={node => setSelectedUnit(node)}
                      employees={employees}
                      getGradeInfo={getGradeInfo}
                      expandedPersonnelIds={expandedPersonnelIds}
                      onTogglePersonnel={togglePersonnelNode}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 hidden bg-white/70 dark:bg-[#0f1623]/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.06] pointer-events-none select-none z-10 sm:block">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                Seret untuk geser &bull; Scroll atau cubit untuk zoom
              </p>
            </div>

            {/* Zoom controls HUD */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/80 dark:bg-[#0f1623]/80 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] p-1.5 rounded-xl shadow-md z-10">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer focus:outline-none"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-500 w-12 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer focus:outline-none"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.08] mx-1" />
              <button
                onClick={handleResetView}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer text-[10px] font-black px-2.5 uppercase tracking-wider"
                title="Reset View"
              >
                Reset
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.08] mx-1" />
              <button
                onClick={() => setIsFullscreen(f => !f)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer focus:outline-none"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Legend / Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between flex-wrap gap-3 z-10 bg-white dark:bg-[#0f1623]">
          <Legend />
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            Klik unit untuk melihat detail anggota & cetak
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Bagan Organisasi
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Visualisasi hierarki struktur organisasi PT Industri Nabati Lestari.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadVisualChartPDF} className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-350 dark:hover:border-slate-750 transition-colors cursor-pointer focus:outline-none">
            <Download className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Cetak PDF Bagan
          </button>
          <button
            onClick={downloadFullChartPPTX}
            disabled={loading || exportingPptx || tree.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-350 dark:hover:border-slate-750 transition-colors cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingPptx ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 shrink-0" />
            ) : (
              <Presentation className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            )}
            {exportingPptx ? 'Membuat PPT...' : 'Export PPT'}
          </button>
          <button onClick={fetchData} className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-350 dark:hover:border-slate-750 transition-colors cursor-pointer focus:outline-none">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:gap-x-6 sm:gap-y-2 sm:flex sm:items-center bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {[
          { key: 'total', label: 'Total Unit', value: stats.total, isTotal: true },
          { key: 'direktorat', label: TIPE_CONFIG['direktorat'].label, value: stats.byTipe['direktorat'], dot: TIPE_CONFIG['direktorat'].dot },
          { key: 'sevp', label: TIPE_CONFIG['sevp'].label, value: stats.byTipe['sevp'], dot: TIPE_CONFIG['sevp'].dot },
          { key: 'bagian', label: TIPE_CONFIG['bagian'].label, value: stats.byTipe['bagian'], dot: TIPE_CONFIG['bagian'].dot },
          { key: 'sub_bagian', label: TIPE_CONFIG['sub_bagian'].label, value: stats.byTipe['sub_bagian'], dot: TIPE_CONFIG['sub_bagian'].dot, colSpan: true },
        ].map((item, i, arr) => (
          <React.Fragment key={item.key}>
            <div className={`flex items-center justify-center sm:justify-start gap-2 ${item.colSpan ? 'col-span-2 sm:col-span-1' : ''}`}>
              {item.isTotal ? (
                <GitBranch className="h-4 w-4 text-amber-650 dark:text-amber-400 shrink-0" />
              ) : (
                <span className={`h-2 w-2 rounded-full ${item.dot} shrink-0`} />
              )}
              <span className="text-sm font-bold text-slate-850 dark:text-white">{item.value}</span>
              <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">{item.label}</span>
            </div>
            {i < arr.length - 1 && <span className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-850 shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Interactive Layout: Left Sidebar + Canvas */}
      {isFullscreen ? (
        <ModalPortal open={true}>
          {renderChartLayout()}
        </ModalPortal>
      ) : (
        renderChartLayout()
      )}

      {/* ── Details & Member Modal */}
      <ModalPortal open={!!selectedUnit}>
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-[999]" onClick={() => setSelectedUnit(null)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-[1000]">
          <div className="pointer-events-auto w-full max-w-4xl animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl shadow-slate-900/10 flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 dark:border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">
                      Detail Unit Organisasi
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{selectedUnit ? TIPE_CONFIG[selectedUnit.tipe].label : ''} • {selectedUnit?.kode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadPDF}
                    className="flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer focus:outline-none"
                  >
                    <Download className="h-3.5 w-3.5" /> Cetak PDF
                  </button>
                  <button
                    onClick={() => setSelectedUnit(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300 transition-all cursor-pointer focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Metadata & Sub-Units */}
                  <div className="md:col-span-1 space-y-6">
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Informasi Unit</div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500">Nama Unit</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedUnit?.nama}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500">Kode Unit</div>
                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{selectedUnit?.kode}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500">Tipe Unit</div>
                        <span className={`inline-block text-[9px] font-black uppercase tracking-widest border rounded-full px-2 py-0.5 mt-1 ${selectedUnit ? TIPE_CONFIG[selectedUnit.tipe].badge : ''}`}>
                          {selectedUnit ? TIPE_CONFIG[selectedUnit.tipe].label : ''}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sub-Unit Kerja ({subUnits.length})</div>
                      {subUnits.length === 0 ? (
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 italic">Tidak ada sub-unit di bawah unit ini.</p>
                      ) : (
                        <div className="space-y-2 max-h-[25vh] overflow-y-auto overflow-x-hidden no-scrollbar">
                          {subUnits.map(su => (
                            <div key={su.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{su.nama}</p>
                                <p className="text-[9px] font-mono font-bold text-slate-500">{su.kode}</p>
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-widest border rounded-full px-1.5 py-px shrink-0 ${TIPE_CONFIG[su.tipe]?.badge || 'bg-slate-200 border-slate-300'}`}>
                                {TIPE_CONFIG[su.tipe]?.label || su.tipe.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Personnel List Grouped by Grade */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Daftar Personil ({directEmployees.length})</div>
                    </div>

                    {directEmployees.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-10 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl text-center">
                        <User className="h-8 w-8 text-slate-400 dark:text-slate-500 mb-2" />
                        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 italic">Tidak ada personil terdaftar langsung di unit ini.</p>
                      </div>
                    ) : (
                      <div className="space-y-5 max-h-[45vh] overflow-y-auto overflow-x-hidden no-scrollbar pr-1">
                        {groupedByGrade.map(group => (
                          <div key={group.grade.kode} className="space-y-2">
                            {/* Grade group Header */}
                            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.04] pb-1.5">
                              <span className="text-xs font-black text-amber-600 dark:text-amber-500">{group.grade.kode}</span>
                              <span className="h-3 w-px bg-slate-200 dark:bg-white/10" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{group.grade.label}</span>
                              {group.grade.keterangan && (
                                <>
                                  <span className="h-3 w-px bg-slate-200 dark:bg-white/10" />
                                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{group.grade.keterangan}</span>
                                </>
                              )}
                              <span className="ml-auto rounded-full bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-black text-slate-500 dark:text-slate-400">{group.list.length} Orang</span>
                            </div>

                            {/* Group list */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {group.list.map(emp => (
                                <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-white dark:bg-white/[0.01] hover:border-slate-250 dark:hover:border-white/[0.08] transition-all">
                                  {emp.fotoProfil ? (
                                    <img
                                      src={resolveImageUrl(emp.fotoProfil)}
                                      alt={emp.nama}
                                      className="h-10 w-10 rounded-full object-cover shrink-0 border border-slate-100 dark:border-white/[0.08]"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/85 text-slate-400 dark:text-slate-500 border border-slate-205/50 dark:border-white/[0.04] shadow-sm">
                                      <User className="h-5 w-5" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{emp.nama}</p>
                                      {emp.isPimpinan && (
                                        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-550/20">
                                          Pimpinan / PJ
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{emp.jabatan}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                                      <span>NRK: {emp.nrk || '-'}</span>
                                      <span>•</span>
                                      <span>NIK: {emp.nik || '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end border-t border-slate-300 dark:border-white/[0.06] px-6 py-4 shrink-0">
                <button
                  onClick={() => setSelectedUnit(null)}
                  className="rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ── Nomenklatur & Legend Modal */}
      <ModalPortal open={legendOpen}>
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-[999]" onClick={() => setLegendOpen(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-[1000]">
          <div className="pointer-events-auto w-full max-w-4xl animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl shadow-slate-900/10 flex flex-col max-h-[85vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 dark:border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">
                      Nomenklatur & Legenda Bagan
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">PT Industri Nabati Lestari</p>
                  </div>
                </div>
                <button
                  onClick={() => setLegendOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300 transition-all cursor-pointer focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Grade Badges + Garis */}
                  <div className="md:col-span-1 space-y-6">
                    {/* Dynamic Grade Symbols */}
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Grade / Golongan</div>
                      {[...grades].sort((a, b) => b.level - a.level).map((g, idx) => {
                        const colors = [
                          'border-emerald-700 dark:border-emerald-600 bg-emerald-700/10 text-emerald-700 dark:text-emerald-400',
                          'border-blue-700 dark:border-blue-600 bg-blue-700/10 text-blue-700 dark:text-blue-400',
                          'border-amber-700 dark:border-amber-600 bg-amber-700/10 text-amber-700 dark:text-amber-400',
                          'border-violet-700 dark:border-violet-600 bg-violet-700/10 text-violet-700 dark:text-violet-400',
                          'border-rose-700 dark:border-rose-600 bg-rose-700/10 text-rose-700 dark:text-rose-400',
                          'border-cyan-700 dark:border-cyan-600 bg-cyan-700/10 text-cyan-700 dark:text-cyan-400',
                          'border-slate-500 dark:border-slate-500 bg-slate-500/10 text-slate-600 dark:text-slate-400',
                        ];
                        const cls = colors[idx % colors.length];
                        return (
                          <div key={g.id} className="flex items-center gap-3">
                            <div className={`w-14 h-8 shrink-0 rounded border-2 ${cls} flex items-center justify-center font-black text-[9px] uppercase`}>
                              {g.kode}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-750 dark:text-slate-200 leading-tight">{g.label}</div>
                              {g.keterangan && (
                                <div className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-tight">{g.keterangan}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {grades.length === 0 && (
                        <p className="text-[11px] text-slate-400 italic">Belum ada data grade.</p>
                      )}
                    </div>

                    {/* Lines Legend */}
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] space-y-4">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Garis Hubungan</div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-12 flex justify-center">
                          <div className="w-full h-0.5 bg-slate-400 dark:bg-slate-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-750 dark:text-slate-200">Garis Komando</div>
                          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Garis instruksi vertikal padat</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 flex justify-center">
                          <div className="w-full h-0.5 border-t-2 border-dashed border-slate-400 dark:border-slate-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-750 dark:text-slate-200">Garis Koordinasi</div>
                          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Garis putus-putus horizontal</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Grade Table */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Tabel Grade / Golongan Jabatan</div>
                    
                    <div className="overflow-x-auto hide-scrollbar rounded-xl border border-slate-100 dark:border-white/[0.04] bg-white dark:bg-[#070b11]">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] font-black text-slate-500 uppercase text-[9px] tracking-wider">
                            <th className="px-4 py-3 w-8">No</th>
                            <th className="px-4 py-3">Level</th>
                            <th className="px-4 py-3">Kode</th>
                            <th className="px-4 py-3">Nama Grade</th>
                            <th className="px-4 py-3">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03] text-slate-700 dark:text-slate-300 font-semibold">
                          {grades.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic font-medium">
                                Belum ada data grade. Tambahkan melalui Master Data.
                              </td>
                            </tr>
                          ) : (
                            [...grades].sort((a, b) => b.level - a.level).map((g, idx) => (
                              <tr key={g.id} className="hover:bg-slate-50/20 dark:hover:bg-white/[0.01]">
                                <td className="px-4 py-3 text-slate-400 dark:text-slate-600">{idx + 1}</td>
                                <td className="px-4 py-3 font-black text-slate-500 dark:text-slate-400">{g.level}</td>
                                <td className="px-4 py-3">
                                  <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase">{g.kode}</span>
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{g.label}</td>
                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">{g.keterangan || <span className="text-slate-300 dark:text-slate-600">-</span>}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end border-t border-slate-300 dark:border-white/[0.06] px-6 py-4 shrink-0 bg-slate-50/50 dark:bg-white/[0.01]">
                <button
                  onClick={() => setLegendOpen(false)}
                  className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        </div>
        {/* ── Mobile Hierarchy Sidebar Drawer ── */}
        {showMobileSidebar && (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm md:hidden animate-fade-in"
              onClick={() => setShowMobileSidebar(false)}
            />
            <div
              className="fixed inset-y-0 left-0 bg-white dark:bg-[#0f1623] border-r border-slate-200 dark:border-white/[0.06] z-50 md:hidden flex flex-col p-3 shadow-2xl animate-in slide-in-from-left duration-200 transition-[width] overflow-hidden"
              style={{ width: mobileSidebarExpanded ? '100vw' : 'min(88vw, 360px)' }}
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex min-w-0 items-center gap-2">
                  <GitBranch className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="truncate text-sm font-bold text-slate-800 dark:text-white">Hierarki Organisasi</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMobileSidebarExpanded(v => !v)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 transition-colors"
                    title={mobileSidebarExpanded ? 'Perkecil panel' : 'Perbesar panel'}
                  >
                    {mobileSidebarExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 transition-colors"
                    title="Collapse panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 py-3">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={sidebarSearch}
                    onChange={e => setSidebarSearch(e.target.value)}
                    placeholder="Cari unit..."
                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>
                <div className="flex shrink-0 items-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] p-1">
                  <button
                    onClick={() => setMobileSidebarZoom(z => Math.max(0.85, Number((z - 0.1).toFixed(2))))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
                    title="Perkecil isi"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-[10px] font-black text-slate-500 dark:text-slate-400">
                    {Math.round(mobileSidebarZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setMobileSidebarZoom(z => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
                    title="Perbesar isi"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Hierarchy Explorer in Mobile Drawer */}
              <div className="flex-1 overflow-auto no-scrollbar hide-scrollbar">
                <div
                  className="space-y-1 pb-6"
                  style={{
                    transform: `scale(${mobileSidebarZoom})`,
                    transformOrigin: 'top left',
                    width: `${100 / mobileSidebarZoom}%`,
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center py-10 gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                      <span className="text-xs font-semibold text-slate-400">Loading hierarchy...</span>
                    </div>
                  ) : sidebarTree.length === 0 ? (
                    <p className="text-xs italic text-slate-400 dark:text-slate-500 text-center py-10">Unit tidak ditemukan</p>
                  ) : (
                    sidebarTree.map(root => (
                      <SidebarNode
                        key={root.id}
                        node={root}
                        employees={employees}
                        getGradeInfo={getGradeInfo}
                        onSelectUnit={node => setFocusUnit(node)}
                        activeUnitId={focusUnit?.id || null}
                        searchQuery={sidebarSearch}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </ModalPortal>
    </div>
  );
}
