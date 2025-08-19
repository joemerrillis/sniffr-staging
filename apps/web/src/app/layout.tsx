import './globals.css';
import { TenantThemeProvider } from './providers/TenantThemeProvider';
import { fetchTheme, getTenantFromHeader, DEFAULT_TOKENS } from '@/lib/tenant';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sniffr',
  description: 'Multi-tenant UI'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-side read of tenant header (set by middleware)
  const headersList = (await import('next/headers')).headers();
  const tenant = await getTenantFromHeader(headersList);
  const tokens = await fetchTheme(tenant).catch(() => DEFAULT_TOKENS);

  return (
    <html lang="en">
      <body>
        <TenantThemeProvider initial={tokens}>
          <header className="flex items-center gap-3 p-[var(--space-md)] border-b border-[color:var(--muted)]">
            {/* Example tenant logo if present */}
            {tokens.brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tokens.brand.logoUrl} alt="logo" className="h-8 w-auto" />
            ) : null}
            <span className="text-[length:calc(18px*var(--scale-md))]">Sniffr</span>
          </header>
          <main className="p-[var(--space-lg)]">{children}</main>
        </TenantThemeProvider>
      </body>
    </html>
  );
}
