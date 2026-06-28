'use client';

import React from 'react';
import ProfileView from '@/components/shared/ProfileView';

export default function AdminProfilePage() {
  return <ProfileView isAdmin={true} />;
}
