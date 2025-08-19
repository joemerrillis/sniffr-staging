export type ThemeTokens = {
  brand: { primary: string; primaryText: string; accent: string; logoUrl?: string };
  surface: { bg: string; fg: string; muted: string };
  typography: { fontFamily: string; scale: { sm: number; md: number; lg: number; xl: number } };
  radius: { sm: number; md: number; lg: number };
  spacing: { sm: number; md: number; lg: number };
  flags?: Record<string, boolean>;
};

export const DEFAULT_TOKENS: ThemeTokens = {
  brand: { primary: '#1a73e8', primaryText: '#ffffff', accent: '#9333ea' },
  surface: { bg: '#ffffff', fg: '#111111', muted: '#6b7280' },
  typography: { fontFamily: 'Inter, system-ui, Arial, sans-serif', scale: { sm: 0.875, md: 1, lg: 1.25, xl: 1.6 } },
  radius: { sm: 6, md: 12, lg: 20 },
  spacing: { sm: 8, md: 12, lg: 20 },
  flags: {}
};

const cache = new Map<string, ThemeTokens>();

export async function getTenantFromHeader(reqHeaders: Headers): Promise<string | null> {
  return reqHeaders.get('x-tenant');
}

// Prefer a backend route that returns `{ theme: { ... } }`
export async function fetchTheme(tenant: string | null): Promise<ThemeTokens> {
  if (!tenant) return DEFAULT_TOKENS;
  const key = tenant.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  // In prod, call your API: /api/theme/:tenant → { theme: { ... } }
  // In dev, allow /api/theme?tenant=foo to simplify local testing.
  const base = process.env.NEXT_PUBLIC_API_BASE ?? '';
  const url = base
    ? `${base}/api/theme/${encodeURIComponent(key)}`
    : `/api/theme/${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`theme ${res.status}`);
    const json = await res.json();
    const tokens = (json?.theme ?? {}) as ThemeTokens;
    // very shallow merge over defaults
    const merged: ThemeTokens = {
      ...DEFAULT_TOKENS,
      ...tokens,
      brand: { ...DEFAULT_TOKENS.brand, ...tokens.brand },
      surface: { ...DEFAULT_TOKENS.surface, ...tokens.surface },
      typography: {
        ...DEFAULT_TOKENS.typography,
        ...tokens.typography,
        scale: { ...DEFAULT_TOKENS.typography.scale, ...(tokens.typography?.scale ?? {}) }
      },
      radius: { ...DEFAULT_TOKENS.radius, ...tokens.radius },
      spacing: { ...DEFAULT_TOKENS.spacing, ...tokens.spacing },
      flags: { ...DEFAULT_TOKENS.flags, ...(tokens.flags ?? {}) }
    };
    cache.set(key, merged);
    return merged;
  } catch {
    return DEFAULT_TOKENS;
  }
}
