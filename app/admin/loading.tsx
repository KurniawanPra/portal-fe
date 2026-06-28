import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        ))}
      </div>

      {/* Two-column layout Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 p-5 space-y-4">
          <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 p-5 space-y-4">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-2 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
