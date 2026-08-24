'use client';

import React from 'react';
import SecurityView from '@/components/shared/SecurityView';

export default function AdminSecurityPage() {
  return <SecurityView isAdmin={true} />;
}
