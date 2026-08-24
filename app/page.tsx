'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from './login/page';
import { getAccessToken } from './lib/auth';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'super_admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
        return;
      } catch (e) {
        router.replace('/dashboard');
        return;
      }
    }

    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not authenticated');
      })
      .then(json => {
        if (json.success && json.data.role === 'super_admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) {
    return null;
  }

  return <LoginPage />;
}
