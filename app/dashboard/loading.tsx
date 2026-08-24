import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>

      {/* Main Apps Layout Grid Skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 dark:border-slate-855 bg-slate-50/40 dark:bg-slate-900/40 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
            </div>
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-8 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
