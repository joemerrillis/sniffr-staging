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
  if (!tokens || typeof document === 'undefined') return;
  
  const r = document.documentElement.style;
  // brand
  if (tokens.brand) {
    r.setProperty('--brand-primary', tokens.brand.primary || '#1a73e8');
    r.setProperty('--brand-primary-text', tokens.brand.primaryText || '#ffffff');
    r.setProperty('--brand-accent', tokens.brand.accent || '#9333ea');
  }
  // surface
  if (tokens.surface) {
    r.setProperty('--bg', tokens.surface.bg || '#ffffff');
    r.setProperty('--fg', tokens.surface.fg || '#111111');
    r.setProperty('--muted', tokens.surface.muted || '#6b7280');
  }
  // type
  if (tokens.typography) {
    r.setProperty('--font-family', tokens.typography.fontFamily || 'Inter, system-ui, Arial, sans-serif');
    if (tokens.typography.scale) {
      r.setProperty('--scale-sm', String(tokens.typography.scale.sm || 0.875));
      r.setProperty('--scale-md', String(tokens.typography.scale.md || 1));
      r.setProperty('--scale-lg', String(tokens.typography.scale.lg || 1.25));
      r.setProperty('--scale-xl', String(tokens.typography.scale.xl || 1.6));
    }
  }
  // radius
  if (tokens.radius) {
    r.setProperty('--radius-sm', (tokens.radius.sm || 6) + 'px');
    r.setProperty('--radius-md', (tokens.radius.md || 12) + 'px');
    r.setProperty('--radius-lg', (tokens.radius.lg || 20) + 'px');
  }
  // spacing
  if (tokens.spacing) {
    r.setProperty('--space-sm', (tokens.spacing.sm || 8) + 'px');
    r.setProperty('--space-md', (tokens.spacing.md || 12) + 'px');
    r.setProperty('--space-lg', (tokens.spacing.lg || 20) + 'px');
  }
}

export function TenantThemeProvider({ initial, children }: { initial: ThemeTokens; children: React.ReactNode }) {
  const [tokens] = useState<ThemeTokens>(initial);
  const memo = useMemo(() => tokens, [tokens]);

  useEffect(() => {
    setCssVars(tokens);
  }, [tokens]);

  return <ThemeCtx.Provider value={memo}>{children}</ThemeCtx.Provider>;
}
