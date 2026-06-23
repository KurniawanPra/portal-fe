'use client';

import React from 'react';

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="animate-ios-page w-full h-full">
      {children}
    </div>
  );
}
