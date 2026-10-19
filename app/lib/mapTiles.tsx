// ─── Map Tiles ────────────────────────────────────────────────────────────────
// Tile peta gratis untuk pigeon-maps — tanpa Google Maps & tanpa API key.
//   • Jalan   : OpenStreetMap
//   • Satelit : Esri World Imagery
// Bisa diarahkan ke tile self-host / MapTiler lewat env tanpa mengubah kode.
import React from 'react';

export type MapMode = 'jalan' | 'satelit';

const TILE_TEMPLATES: Record<MapMode, string> = {
  jalan: process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  satelit: process.env.NEXT_PUBLIC_MAP_SATELLITE_TILE_URL
    || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

const ATTRIBUTION: Record<MapMode, React.ReactElement> = {
  jalan: (
    <span>
      © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors
    </span>
  ),
  satelit: <span>Tiles © Esri — Esri, Maxar, Earthstar Geographics</span>,
};

function fromTemplate(template: string) {
  return (x: number, y: number, z: number) =>
    template.replace('{x}', String(x)).replace('{y}', String(y)).replace('{z}', String(z));
}

const PROVIDERS: Record<MapMode, (x: number, y: number, z: number) => string> = {
  jalan: fromTemplate(TILE_TEMPLATES.jalan),
  satelit: fromTemplate(TILE_TEMPLATES.satelit),
};

/** Props tile untuk <Map>: `<Map {...tileLayer('satelit')} ... />` */
export function tileLayer(mode: MapMode) {
  return {
    provider: PROVIDERS[mode],
    attribution: ATTRIBUTION[mode],
    attributionPrefix: false as const,
  };
}
