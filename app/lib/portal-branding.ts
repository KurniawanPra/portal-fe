'use client';

import { useEffect, useState } from 'react';
import { api } from './api';

export interface PortalBranding {
  portalName: string;
  adminPanelName: string;
  adminHeroTitle: string;
  adminHeroDescription: string;
}

export const DEFAULT_PORTAL_BRANDING: PortalBranding = {
  portalName: 'InTes (Integrated Enterprise System)',
  adminPanelName: 'InTes Admin Panel',
  adminHeroTitle: 'Pusat Administrasi Portal SSO PT INL',
  adminHeroDescription:
    'Kelola seluruh aspek sistem portal dari satu pusat kontrol yang terintegrasi dan aman. Memastikan operasional aplikasi PT Industri Nabati Lestari (KEK Sei Mangkei) berjalan lancar.',
};

type BrandingListener = (branding: PortalBranding) => void;

let cachedBranding = DEFAULT_PORTAL_BRANDING;
let hasLoadedBranding = false;
let pendingRequest: Promise<PortalBranding> | null = null;
const listeners = new Set<BrandingListener>();

function publishBranding(branding: PortalBranding) {
  cachedBranding = branding;
  hasLoadedBranding = true;
  listeners.forEach(listener => listener(branding));

  if (typeof document !== 'undefined') {
    document.title = `${branding.portalName} — PT Industri Nabati Lestari`;
  }
}

export function cachePortalBranding(branding: PortalBranding) {
  publishBranding(branding);
}

export async function loadPortalBranding(force = false): Promise<PortalBranding> {
  if (!force && hasLoadedBranding) return cachedBranding;
  if (!force && pendingRequest) return pendingRequest;

  pendingRequest = api
    .get<PortalBranding>('/settings/branding')
    .then(response => {
      publishBranding(response.data);
      return response.data;
    })
    .catch(() => {
      publishBranding(DEFAULT_PORTAL_BRANDING);
      return DEFAULT_PORTAL_BRANDING;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}

export function usePortalBranding() {
  const [branding, setBranding] = useState<PortalBranding>(cachedBranding);
  const [isLoading, setIsLoading] = useState(!hasLoadedBranding);

  useEffect(() => {
    listeners.add(setBranding);
    loadPortalBranding().finally(() => setIsLoading(false));

    return () => {
      listeners.delete(setBranding);
    };
  }, []);

  return { branding, isLoading };
}
