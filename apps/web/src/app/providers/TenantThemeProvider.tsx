'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemeTokens } from '@/lib/tenant';

const ThemeCtx = createContext<ThemeTokens | null>(null);
export const useThemeTokens = () => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('ThemeProvider missing');
  return ctx;
};

function setCssVars(tokens: ThemeTokens) {
  const r = document.documentElement.style;
  // brand
  r.setProperty('--brand-primary', tokens.brand.primary);
  r.setProperty('--brand-primary-text', tokens.brand.primaryText);
  r.setProperty('--brand-accent', tokens.brand.accent);
  // surface
  r.setProperty('--bg', tokens.surface.bg);
  r.setProperty('--fg', tokens.surface.fg);
  r.setProperty('--muted', tokens.surface.muted);
  // type
  r.setProperty('--font-family', tokens.typography.fontFamily);
  r.setProperty('--scale-sm', String(tokens.typography.scale.sm));
  r.setProperty('--scale-md', String(tokens.typography.scale.md));
  r.setProperty('--scale-lg', String(tokens.typography.scale.lg));
  r.setProperty('--scale-xl', String(tokens.typography.scale.xl));
  // radius
  r.setProperty('--radius-sm', tokens.radius.sm + 'px');
  r.setProperty('--radius-md', tokens.radius.md + 'px');
  r.setProperty('--radius-lg', tokens.radius.lg + 'px');
  // spacing
  r.setProperty('--space-sm', tokens.spacing.sm + 'px');
  r.setProperty('--space-md', tokens.spacing.md + 'px');
  r.setProperty('--space-lg', tokens.spacing.lg + 'px');
}

export function TenantThemeProvider({ initial, children }: { initial: ThemeTokens; children: React.ReactNode }) {
  const [tokens, setTokens] = useState<ThemeTokens>(initial);
  const memo = useMemo(() => tokens, [tokens]);

  useEffect(() => {
    setCssVars(tokens);
  }, [tokens]);

  return <ThemeCtx.Provider value={memo}>{children}</ThemeCtx.Provider>;
}
