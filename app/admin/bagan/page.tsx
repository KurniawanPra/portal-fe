'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GitBranch, ChevronRight, ChevronDown, ChevronUp, Loader2, Search, ZoomIn, ZoomOut, RefreshCw,
  X, Download, User, Briefcase, Building2, Maximize2, Minimize2
} from 'lucide-react';
import { api } from '@/lib/api';
import { ModalPortal } from '@/components/ui/ModalPortal';

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

// ─── Tipe Config (Standard Tailwind Color Classes Only) ────────────────────────
const TIPE_CONFIG: Record<TipeUnit, { label: string; borderClass: string; bgClass: string; badge: string; textColor: string; dot: string }> = {
  direktorat: {
    label: 'Direktorat',
    borderClass: 'border-purple-600 dark:border-purple-500',
    bgClass: 'bg-purple-600/10 dark:bg-purple-500/8',
    dot: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
  sevp: {
    label: 'SEVP',
    borderClass: 'border-blue-600 dark:border-blue-500',
    bgClass: 'bg-blue-600/10 dark:bg-blue-500/8',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  bagian: {
    label: 'Bagian',
    borderClass: 'border-amber-600 dark:border-amber-500',
    bgClass: 'bg-amber-600/10 dark:bg-amber-500/8',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  sub_bagian: {
    label: 'Sub Bagian',
    borderClass: 'border-indigo-600 dark:border-indigo-500',
    bgClass: 'bg-indigo-600/10 dark:bg-indigo-500/8',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50',
    textColor: 'text-indigo-600 dark:text-indigo-400',
  },
  seksi: {
    label: 'Seksi',
    borderClass: 'border-pink-600 dark:border-pink-500',
    bgClass: 'bg-pink-600/10 dark:bg-pink-500/8',
    dot: 'bg-pink-500',
    badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800/50',
    textColor: 'text-pink-600 dark:text-pink-400',
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
    nodes.sort((a, b) => a.nama.localeCompare(b.nama));
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
  if (!fotoProfil) return null;
  if (fotoProfil.startsWith('http')) return fotoProfil;
  return `/uploads/${fotoProfil}`;
}

function getInitials(nama: string): string {
  return nama
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

const GENDER_GRADIENT: Record<string, string> = {
  L: 'from-blue-400 to-blue-600',
  P: 'from-pink-400 to-pink-600',
  default: 'from-slate-400 to-slate-600',
};

// ─── OrgTreeNode Component ───────────────────────────────────────────────────
interface OrgTreeNodeProps {
  node: TreeNode;
  searchQuery: string;
  onClickCard: (node: TreeNode) => void;
  employees: any[];
  getGradeInfo: (gradeId: string | null) => any;
}

function OrgTreeNode({
  node,
  searchQuery,
  onClickCard,
  employees,
  getGradeInfo,
}: OrgTreeNodeProps) {
  const [showPersonnel, setShowPersonnel] = useState(false);
  const config = TIPE_CONFIG[node.tipe];
  const hasChildren = node.children.length > 0;

  const matchesSearch = searchQuery
    ? node.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.kode.toLowerCase().includes(searchQuery.toLowerCase())
    : true;
  const isHighlighted = searchQuery && matchesSearch;

  const unitEmployees = useMemo(() => {
    return employees.filter(e => e.unitOrganisasiId === node.id && e.isActive);
  }, [employees, node.id]);

  // Higher level number = higher rank (e.g. level 7 > level 6)
  const maxGradeLevel = useMemo(() => {
    if (unitEmployees.length === 0) return -Infinity;
    return Math.max(...unitEmployees.map(e => getGradeInfo(e.gradeId).level));
  }, [unitEmployees, getGradeInfo]);

  // Top employees: those sharing the highest grade level in this unit
  const topEmployees = useMemo(() => {
    return unitEmployees
      .filter(e => getGradeInfo(e.gradeId).level === maxGradeLevel)
      .sort((a, b) => {
        if (a.isPimpinan && !b.isPimpinan) return -1;
        if (!a.isPimpinan && b.isPimpinan) return 1;
        return a.nama.localeCompare(b.nama);
      });
  }, [unitEmployees, maxGradeLevel, getGradeInfo]);

  const leader = topEmployees[0] ?? null;
  const staffCount = unitEmployees.length;

  if (node.isDummy) {
    return (
      <div className="flex flex-col items-center relative animate-fade-in">
        {/* Dummy spacer containing the straight connector vertical line */}
        <div className="relative z-10 px-4 w-64 h-32 flex items-center justify-center">
          <div className="w-0.5 h-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {hasChildren && (
          <>
            <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
            <div className="flex gap-x-10 items-start relative">
              {node.children.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === node.children.length - 1;

                return (
                  <div key={child.id} className="relative flex flex-col items-center pt-6">
                    {!isFirst && (
                      <div 
                        className="absolute top-0 bg-slate-300 dark:bg-slate-700 h-0.5" 
                        style={{ left: '-20px', width: 'calc(50% + 20px)' }}
                      />
                    )}
                    {!isLast && (
                      <div 
                        className="absolute top-0 bg-slate-300 dark:bg-slate-700 h-0.5" 
                        style={{ right: '-20px', width: 'calc(50% + 20px)' }}
                      />
                    )}
                    <div className="absolute top-0 w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
                    <OrgTreeNode
                      node={child}
                      searchQuery={searchQuery}
                      onClickCard={onClickCard}
                      employees={employees}
                      getGradeInfo={getGradeInfo}
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

  // Sub-card employees: those with grade level below maxGradeLevel, grouped by grade DESC
  const subEmployeeGroups = useMemo(() => {
    const others = unitEmployees.filter(e => getGradeInfo(e.gradeId).level < maxGradeLevel);
    if (others.length === 0) return [];
    const gradeMap = new Map<string, { gradeInfo: any; employees: any[] }>();
    others.forEach(e => {
      const gi = getGradeInfo(e.gradeId);
      const key = e.gradeId || 'no-grade';
      if (!gradeMap.has(key)) gradeMap.set(key, { gradeInfo: gi, employees: [] });
      gradeMap.get(key)!.employees.push(e);
    });
    // Sort descending so highest-rank sub-group appears first (closest to main card)
    return Array.from(gradeMap.values()).sort((a, b) => b.gradeInfo.level - a.gradeInfo.level);
  }, [unitEmployees, maxGradeLevel, getGradeInfo]);

  return (
    <div className="flex flex-col items-center relative animate-fade-in">
      {/* Node Card */}
      <div className="relative z-10 px-4">
        <div
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
            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.badge}`}>
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
                return (
                  <div key={emp.id} className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
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
                          <span className="text-[8px] font-bold px-1.5 py-px bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded text-slate-650 dark:text-slate-450 font-mono shrink-0 scale-90 origin-right">
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
            {subEmployeeGroups.length > 0 && node.tipe === 'seksi' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPersonnel(!showPersonnel);
                }}
                className="text-[9px] font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer focus:outline-none"
              >
                {showPersonnel ? (
                  <>
                    Sembunyikan <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Tampilkan ({unitEmployees.length - topEmployees.length}) <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-employee cards (same unit, lower grade) rendered as vertical children */}
      {subEmployeeGroups.length > 0 && (node.tipe !== 'seksi' || showPersonnel) && (
        <div className="flex flex-col items-center">
          {subEmployeeGroups.map((group) => (
            <div key={group.gradeInfo.kode || 'no-grade'} className="flex flex-col items-center">
              {/* Connector line */}
              <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-700" />
              {/* Group card — one card per grade group showing all employees */}
              <div className="relative z-10 px-4">
                <div className={`relative w-64 p-3 shadow-sm rounded-xl border-2 border-dashed ${config.borderClass} bg-white dark:bg-[#0a0e17] select-none overflow-hidden`}>
                  {/* Grade badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.badge} opacity-70`}>
                      {group.gradeInfo.kode}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">Level {group.gradeInfo.level}</span>
                  </div>
                  {/* Employees list */}
                  <div className="space-y-1.5">
                    {group.employees.map((emp: any) => {
                      const avatarUrl = getAvatarUrl(emp.fotoProfil);
                      const initials = getInitials(emp.nama);
                      const gradient = GENDER_GRADIENT[emp.jenisKelamin] ?? GENDER_GRADIENT.default;
                      return (
                        <div key={emp.id} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          {/* Avatar */}
                          <div className="shrink-0">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={emp.nama}
                                className="h-5 w-5 rounded-full object-cover border border-slate-200 dark:border-white/[0.1]"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                <span className="text-[7px] font-black text-white">{initials}</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold truncate leading-snug">{emp.nama}</p>
                            <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 truncate">{emp.jabatan || '-'}</p>
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
      )}

      {/* Children units */}
      {hasChildren && (
        <>
          <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />

          <div className="flex gap-x-10 items-start relative">
            {node.children.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === node.children.length - 1;

              return (
                <div key={child.id} className="relative flex flex-col items-center pt-6">
                  {!isFirst && (
                    <div 
                      className="absolute top-0 bg-slate-300 dark:bg-slate-700 h-0.5" 
                      style={{ left: '-20px', width: 'calc(50% + 20px)' }}
                    />
                  )}
                  {!isLast && (
                    <div 
                      className="absolute top-0 bg-slate-300 dark:bg-slate-700 h-0.5" 
                      style={{ right: '-20px', width: 'calc(50% + 20px)' }}
                    />
                  )}
                  <div className="absolute top-0 w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />

                  <OrgTreeNode
                    node={child}
                    searchQuery={searchQuery}
                    onClickCard={onClickCard}
                    employees={employees}
                    getGradeInfo={getGradeInfo}
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

  // Find leader
  const leader = useMemo(() => {
    const unitEmployees = employees.filter(e => e.unitOrganisasiId === node.id && e.isActive);
    if (unitEmployees.length === 0) return null;
    // Higher level number = higher rank
    const sorted = [...unitEmployees]
      .map(e => ({ emp: e, level: getGradeInfo(e.gradeId).level }))
      .sort((a, b) => b.level - a.level);
    return sorted[0]?.emp || null;
  }, [employees, node.id, getGradeInfo]);

  const matchesSearch = searchQuery
    ? node.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (leader?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    : true;

  const hasChildren = node.children.length > 0;
  const isSelected = activeUnitId === node.id;

  const matchesAnyDescendant = useCallback((n: TreeNode): boolean => {
    const m = n.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
              n.kode.toLowerCase().includes(searchQuery.toLowerCase());
    if (m) return true;
    return n.children.some(matchesAnyDescendant);
  }, [searchQuery]);

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
        .filter(([t]) => t !== 'seksi')
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BaganOrganisasiPage() {
  const [units, setUnits] = useState<UnitOrganisasi[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [legendOpen, setLegendOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  
  // Canvas localized navigation root
  const [focusUnit, setFocusUnit] = useState<TreeNode | null>(null);

  const [selectedUnit, setSelectedUnit] = useState<TreeNode | null>(null);

  // Zoom & Pan Canvas state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

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
        return a.nama.localeCompare(b.nama);
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

  // Canvas visual tree: EXCLUDE 'seksi' from default views, EXCEPT:
  // - if a seksi or its parent is focused
  // - if the unit belongs to a branch whose ancestor name contains "SDM" (e.g., SDM & SISTEM)
  const tree = useMemo(() => {
    // Build map for quick parent lookup
    const unitMap = new Map<string, UnitOrganisasi>();
    units.forEach(u => unitMap.set(u.id, u));

    // Check if any ancestor of a unit has a name containing 'SDM'
    const isUnderSdm = (u: UnitOrganisasi): boolean => {
      let curr: UnitOrganisasi | undefined = u;
      while (curr) {
        if (curr.nama.toLowerCase().includes('sdm')) return true;
        curr = curr.parentId ? unitMap.get(curr.parentId) : undefined;
      }
      return false;
    };

    const activeUnits = units.filter(u => {
      if (!u.isActive) return false;
      if (u.tipe !== 'seksi') return true;
      // Always show seksi under SDM branch
      if (isUnderSdm(u)) return true;
      // Show seksi when it or its parent is the focused unit
      if (focusUnit?.id === u.id || u.parentId === focusUnit?.id) return true;
      return false;
    });

    const fullTree = buildTree(activeUnits);
    
    if (focusUnit) {
      const pruned = pruneTreeKeepAncestors(fullTree, focusUnit.id);
      return normalizeTreeLevels(pruned);
    }
      
    return normalizeTreeLevels(fullTree);
  }, [units, focusUnit]);

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
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: justify;
              border-bottom: 3px double #cbd5e1;
              padding-bottom: 20px;
              margin-bottom: 30px;
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
              grid-template-columns: 1fr 1fr 1fr;
              gap: 15px;
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
              border-left: 4px solid #d97706;
              padding-left: 10px;
              margin-bottom: 15px;
              color: #0f172a;
              text-transform: uppercase;
            }
            .members-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
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
              background: #f8fafc;
            }
            .grade-title {
              font-weight: 800;
              color: #b45309;
              font-size: 11px;
              padding: 8px 15px !important;
              border-bottom: 2px solid #e2e8f0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .emp-row td {
              background: #ffffff;
            }
            .pimpinan-row td {
              background-color: rgba(217, 119, 6, 0.04) !important;
            }
            .badge-pj {
              margin-left: 8px;
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              padding: 2px 6px;
              border-radius: 4px;
              background: rgba(217, 119, 6, 0.1);
              color: #d97706;
              border: 1px solid rgba(217, 119, 6, 0.2);
              display: inline-block;
              vertical-align: middle;
            }
            .sub-units-section {
              margin-top: 30px;
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
            }
            @media print {
              body { padding: 0; }
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
            <div class="logo-text">INL PORTAL</div>
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
            Dokumen ini digenerate secara otomatis melalui Portal INL pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
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
  }, [selectedUnit, groupedByGrade, subUnits]);

  // PDF Export for the entire Active Chart Tree
  const downloadFullChartPDF = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const renderPrintNode = (node: TreeNode): string => {
      const config = TIPE_CONFIG[node.tipe] || TIPE_CONFIG.seksi;
      const hasChildren = node.children.length > 0;
      const isFunctional = node.nama.toLowerCase().includes('marketing') || 
                           node.nama.toLowerCase().includes('sourcing') || 
                           node.nama.toLowerCase().includes('sales');

      const unitEmployees = employees.filter(e => e.unitOrganisasiId === node.id && e.isActive);
      const sortedEmps = [...unitEmployees]
        .map(e => ({ emp: e, isPimpinan: e.isPimpinan, level: getGradeInfo(e.gradeId).level }))
        .sort((a, b) => {
          if (a.isPimpinan && !b.isPimpinan) return -1;
          if (!a.isPimpinan && b.isPimpinan) return 1;
          return a.level - b.level;
        });
      const leader = sortedEmps[0]?.emp;
      const typeLabel = config.label || node.tipe.toUpperCase();
      const gradeCode = leader?.gradeId ? getGradeInfo(leader.gradeId).kode : '';

      if (node.isDummy) {
        const childrenHTML = hasChildren
          ? `
            <div class="print-children-container">
              ${node.children.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === node.children.length - 1;
                return `
                  <div class="print-child-wrapper">
                    ${!isFirst ? `<div class="print-horizontal-line left"></div>` : ''}
                    ${!isLast ? `<div class="print-horizontal-line right"></div>` : ''}
                    <div class="print-vertical-line-child"></div>
                    ${renderPrintNode(child)}
                  </div>
                `;
              }).join('')}
            </div>
          `
          : '';

        return `
          <div class="print-node-container dummy">
            <div class="print-dummy-spacer">
              <div class="print-vertical-line-dummy"></div>
            </div>
            ${hasChildren ? `
              <div class="print-vertical-line-down"></div>
              ${childrenHTML}
            ` : ''}
          </div>
        `;
      }

      const childrenHTML = hasChildren
        ? `
          <div class="print-children-container">
            ${node.children.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === node.children.length - 1;
              return `
                <div class="print-child-wrapper">
                  ${!isFirst ? `<div class="print-horizontal-line left"></div>` : ''}
                  ${!isLast ? `<div class="print-horizontal-line right"></div>` : ''}
                  <div class="print-vertical-line-child"></div>
                  ${renderPrintNode(child)}
                </div>
              `;
            }).join('')}
          </div>
        `
        : '';

      return `
        <div class="print-node-container">
          <div class="print-node-card type-${node.tipe} ${isFunctional ? 'print-functional-oval' : ''}">
            <div class="print-node-header">
              <span class="print-node-type border-${node.tipe}">${typeLabel}</span>
              <span class="print-node-code">${node.kode}</span>
            </div>
            <div class="print-node-name">${node.nama}</div>
            <div class="print-node-divider"></div>
            <div class="print-node-meta">
              ${leader 
                ? `<div class="print-leader-info">
                     <strong>PJ:</strong> ${leader.nama} ${gradeCode ? `(${gradeCode})` : ''} <br/>
                     <span class="print-leader-jabatan">${leader.jabatan}</span>
                   </div>`
                : `<span class="print-no-leader">Belum ada pimpinan</span>`
              }
              <div class="print-personnel-count">${unitEmployees.length} Personil</div>
            </div>
          </div>
          ${hasChildren ? `
            <div class="print-vertical-line-down"></div>
            ${childrenHTML}
          ` : ''}
        </div>
      `;
    };

    const treeHTML = tree.map(renderPrintNode).join('');

    const html = `
      <html>
        <head>
          <title>Bagan Organisasi - PT Industri Nabati Lestari</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
            @page {
              size: landscape;
              margin: 10mm;
            }
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 20px;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px double #cbd5e1;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            .print-header h1 {
              font-size: 18px;
              font-weight: 900;
              margin: 0;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .print-header p {
              font-size: 10px;
              color: #64748b;
              margin: 4px 0 0 0;
              font-weight: 600;
            }
            .logo-text {
              font-size: 16px;
              font-weight: 900;
              color: #d97706;
              letter-spacing: 1px;
            }
            
            .print-tree-root {
              display: flex;
              justify-content: center;
              align-items: flex-start;
              gap: 40px;
              width: 100%;
              min-width: max-content;
              padding: 20px;
            }
            .print-node-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              position: relative;
            }
            .print-dummy-spacer {
              position: relative;
              width: 240px;
              height: 128px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .print-vertical-line-dummy {
              width: 2px;
              height: 100%;
              background-color: #cbd5e1;
            }
            .print-vertical-line-down {
              width: 2px;
              height: 24px;
              background-color: #cbd5e1;
            }
            .print-children-container {
              display: flex;
              gap: 40px;
              align-items: flex-start;
              position: relative;
            }
            .print-child-wrapper {
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding-top: 24px;
            }
            .print-horizontal-line {
              position: absolute;
              top: 0;
              height: 2px;
              background-color: #cbd5e1;
            }
            .print-horizontal-line.left {
              left: -20px;
              width: calc(50% + 20px);
            }
            .print-horizontal-line.right {
              right: -20px;
              width: calc(50% + 20px);
            }
            .print-vertical-line-child {
              position: absolute;
              top: 0;
              width: 2px;
              height: 24px;
              background-color: #cbd5e1;
            }
            
            .print-node-card {
              width: 240px;
              border-radius: 12px;
              border: 2px solid transparent;
              padding: 14px;
              box-sizing: border-box;
              background-color: #ffffff;
              text-align: left;
            }
            
            .type-direktorat {
              border-color: #15803d;
              background-color: rgba(21, 128, 61, 0.08) !important;
            }
            .type-sevp {
              border-color: #15803d;
              background-color: rgba(21, 128, 61, 0.08) !important;
            }
            .type-bagian {
              border-color: #1d4ed8;
              background-color: rgba(29, 78, 216, 0.08) !important;
            }
            .type-sub_bagian {
              border-color: #7c2d12;
              background-color: rgba(124, 45, 18, 0.08) !important;
            }
            .type-seksi {
              border-color: #7c2d12;
              background-color: rgba(124, 45, 18, 0.08) !important;
            }
            
            .print-node-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            }
            .print-node-type {
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              padding: 2px 6px;
              border-radius: 6px;
              border: 1px solid transparent;
            }
            .border-direktorat {
              background-color: rgba(147, 51, 234, 0.1);
              color: #9333ea;
              border-color: rgba(147, 51, 234, 0.2);
            }
            .border-sevp {
              background-color: rgba(37, 99, 235, 0.1);
              color: #2563eb;
              border-color: rgba(37, 99, 235, 0.2);
            }
            .border-bagian {
              background-color: rgba(217, 119, 6, 0.1);
              color: #d97706;
              border-color: rgba(217, 119, 6, 0.2);
            }
            .border-sub_bagian {
              background-color: rgba(79, 70, 229, 0.1);
              color: #4f46e5;
              border-color: rgba(79, 70, 229, 0.2);
            }
            .border-seksi {
              background-color: rgba(219, 39, 119, 0.1);
              color: #db2777;
              border-color: rgba(219, 39, 119, 0.2);
            }
            
            .print-node-code {
              font-size: 9px;
              font-weight: 700;
              font-family: monospace;
              color: #475569;
            }
            .print-node-name {
              font-size: 11px;
              font-weight: 900;
              color: #0f172a;
              line-height: 1.3;
              margin-bottom: 8px;
            }
            .print-node-divider {
              height: 1px;
              background-color: rgba(203, 213, 225, 0.6);
              margin: 8px 0;
            }
            .print-node-meta {
              font-size: 9px;
              color: #334155;
            }
            .print-leader-info {
              margin-bottom: 6px;
            }
            .print-leader-jabatan {
              font-size: 8px;
              color: #64748b;
              font-weight: 600;
            }
            .print-no-leader {
              display: block;
              font-size: 9px;
              font-style: italic;
              color: #94a3b8;
              margin-bottom: 6px;
            }
            .print-personnel-count {
              font-weight: 700;
              color: #475569;
              font-size: 8px;
              text-transform: uppercase;
              margin-top: 4px;
            }
            
            .print-footer {
              margin-top: 40px;
              border-top: 1px solid #cbd5e1;
              padding-top: 10px;
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
              font-weight: 600;
            }
            
            .print-tree-wrapper {
              width: 100%;
              overflow: visible;
            }
            
            @media print {
              body { padding: 0; }
              .print-node-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div>
              <h1>Laporan Struktur Organisasi</h1>
              <p>PT Industri Nabati Lestari</p>
            </div>
            <div class="logo-text">INL PORTAL</div>
          </div>
          
          <div class="print-tree-wrapper">
            <div class="print-tree-root">
              ${treeHTML}
            </div>
          </div>
          
          <div class="print-footer">
            Bagan ini digenerate secara otomatis melalui Portal INL pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
          </div>
          
          <script>
            let printed = false;
            function doPrint() {
              if (printed) return;
              printed = true;
              
              const root = document.querySelector('.print-tree-root');
              if (root) {
                const chartWidth = root.scrollWidth + 40;
                const pageWidth = (window.innerWidth || document.documentElement.clientWidth || 1050) - 40;
                if (chartWidth > pageWidth) {
                  const scale = pageWidth / chartWidth;
                  
                  // Try applying CSS zoom first (standard and clean for page layout)
                  root.style.zoom = scale;
                  
                  // If browser doesn't support or apply zoom, fallback to transform
                  if (!root.style.zoom) {
                    root.style.transform = 'scale(' + scale + ')';
                    root.style.transformOrigin = 'top center';
                    root.style.width = chartWidth + 'px';
                    const wrapper = root.parentElement;
                    if (wrapper) {
                      const h = root.offsetHeight;
                      if (h > 0) {
                        wrapper.style.height = (h * scale) + 'px';
                        wrapper.style.overflow = 'hidden';
                      }
                    }
                  }
                }
              }
              
              // Print immediately now that layout is resolved
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }

            // Bind to onload
            window.onload = doPrint;
            
            // In document.write documents, onload might not fire, so check document state
            if (document.readyState === 'complete') {
              doPrint();
            } else {
              // Fallback timeout
              setTimeout(doPrint, 800);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
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
    if (e.ctrlKey) {
      e.preventDefault();
      const scaleFactor = 0.05;
      const direction = e.deltaY < 0 ? 1 : -1;
      setZoom(z => Math.min(Math.max(z + direction * scaleFactor, 0.3), 2.0));
    }
  };

  const renderChartLayout = () => {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] shadow-lg flex flex-col transition-all duration-200 ${isFullscreen ? 'w-screen h-screen rounded-none border-none' : 'h-[70vh]'}`}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-20" />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between flex-wrap z-20 bg-white/95 dark:bg-[#0f1623]/95 backdrop-blur-md">
          {/* Main search bar for canvas highlights */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama atau kode unit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all"
            />
          </div>
          <button
            onClick={() => setLegendOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-3.5 py-2 text-xs font-bold text-slate-650 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer focus:outline-none"
          >
            <Building2 className="h-3.5 w-3.5 text-amber-550 shrink-0" /> Legenda Nomenklatur
          </button>
        </div>

        {/* Main Body Splitter */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sub-sidebar (Scrollable tree navigation) */}
          <div
            style={{ width: `${sidebarWidth}px` }}
            className="border-r border-slate-100 dark:border-white/[0.06] bg-slate-50/40 dark:bg-[#0c121e]/40 flex flex-col h-full shrink-0 select-none relative"
          >
            {/* Hierarchy scroll view with hidden scrollbar */}
            <div
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar hide-scrollbar"
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
                    searchQuery={sidebarSearch}
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
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
            />

            {/* Breadcrumb Trail */}
            {focusUnit && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 dark:bg-[#0f1623]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.06] z-10 text-[10px] font-bold shadow-sm animate-fade-in select-none">
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
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
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
                <div className="flex gap-x-16 items-start">
                  {tree.map(root => (
                    <OrgTreeNode
                      key={root.id}
                      node={root}
                      searchQuery={search}
                      onClickCard={node => setSelectedUnit(node)}
                      employees={employees}
                      getGradeInfo={getGradeInfo}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 bg-white/70 dark:bg-[#0f1623]/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.06] pointer-events-none select-none z-10">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                🖱️ Seret untuk geser • Ctrl + Scroll untuk zoom
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
          <button onClick={downloadFullChartPDF} className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-350 dark:hover:border-slate-750 transition-colors cursor-pointer focus:outline-none">
            <Download className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Cetak PDF Bagan
          </button>
          <button onClick={fetchData} className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-350 dark:hover:border-slate-750 transition-colors cursor-pointer focus:outline-none">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-amber-650 dark:text-amber-400" />
          <span className="text-sm font-bold text-slate-850 dark:text-white">{stats.total}</span>
          <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">Total Unit</span>
        </div>
        <span className="h-4 w-px bg-slate-200 dark:bg-slate-850 shrink-0" />
        {(['direktorat', 'sevp', 'bagian', 'sub_bagian'] as TipeUnit[]).map((t, i, arr) => (
          <React.Fragment key={t}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${TIPE_CONFIG[t].dot}`} />
              <span className="text-sm font-bold text-slate-850 dark:text-white">{stats.byTipe[t]}</span>
              <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">{TIPE_CONFIG[t].label}</span>
            </div>
            {i < arr.length - 1 && <span className="h-4 w-px bg-slate-200 dark:bg-slate-850 shrink-0" />}
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
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] shrink-0">
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
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                        <div className="space-y-2 max-h-[25vh] overflow-y-auto no-scrollbar">
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
                      <div className="space-y-5 max-h-[45vh] overflow-y-auto no-scrollbar pr-1">
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
                                      src={emp.fotoProfil.startsWith('http') ? emp.fotoProfil : `/uploads/${emp.fotoProfil}`}
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
              <div className="flex items-center justify-end border-t border-slate-200 dark:border-white/[0.06] px-6 py-4 shrink-0">
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
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl flex flex-col max-h-[85vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] shrink-0">
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
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                    
                    <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-white/[0.04] bg-white dark:bg-[#070b11]">
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
              <div className="flex items-center justify-end border-t border-slate-200 dark:border-white/[0.06] px-6 py-4 shrink-0 bg-slate-50/50 dark:bg-white/[0.01]">
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
      </ModalPortal>
    </div>
  );
}
