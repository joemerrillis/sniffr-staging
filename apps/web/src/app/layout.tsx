import './globals.css';
import { TenantThemeProvider } from './providers/TenantThemeProvider';
import { AppProvider } from '@/components/providers/AppProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { DEFAULT_TOKENS } from '@/lib/tenant';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sniffr - Dog Walking Management',
  description: 'Multi-tenant dog walking SaaS platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AppProvider>
            <TenantThemeProvider initial={DEFAULT_TOKENS}>
              {children}
            </TenantThemeProvider>
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
