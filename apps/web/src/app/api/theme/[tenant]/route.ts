import { NextResponse } from 'next/server';
// You can wire this to your backend later; here is a placeholder that echoes tenant.

export async function GET(_: Request, { params }: { params: { tenant: string } }) {
  const t = (params.tenant || '').toLowerCase();

  // TODO: replace with real fetch from your backend /tenants service
  // This example shows how you'd map DB fields -> tokens
  const tokens = {
    brand: { primary: '#1a73e8', primaryText: '#ffffff', accent: '#9333ea', logoUrl: `https://logo.clearbit.com/${t}.com` },
    surface: { bg: '#ffffff', fg: '#111111', muted: '#6b7280' },
    typography: { fontFamily: 'Inter, system-ui, Arial, sans-serif', scale: { sm: 0.875, md: 1, lg: 1.25, xl: 1.6 } },
    radius: { sm: 6, md: 12, lg: 20 },
    spacing: { sm: 8, md: 12, lg: 20 },
    flags: { betaHeader: true }
  };

  return NextResponse.json({ theme: tokens });
}
