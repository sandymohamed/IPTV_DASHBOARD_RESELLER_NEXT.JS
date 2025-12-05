import type { Metadata, Viewport } from 'next';
import { SettingsProvider } from '@/lib/contexts/SettingsContext';
import { LoadingProvider } from '@/lib/contexts/LoadingContext';
import ThemeProvider from '@/lib/theme';
import NotificationSetup from '@/components/NotificationSetup';
import ToastProvider from '@/components/ToastProvider';
import DatePickerProvider from '@/components/providers/DatePickerProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'IPTV Dashboard',
  description: 'IPTV Reseller Dashboard',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IPTV Dashboard',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3366FF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('settings');
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.themeMode === 'dark') {
                      document.documentElement.style.colorScheme = 'dark';
                    }
                  }
                } catch (e) {
                  // Ignore errors
                }
              })();
            `,
          }}
        />
      </head>
      <body>
          <SettingsProvider>
            <ThemeProvider>
              <LoadingProvider>
                <DatePickerProvider>
                  <NotificationSetup />
                  <ToastProvider />
                  {children}
                </DatePickerProvider>
              </LoadingProvider>
            </ThemeProvider>
          </SettingsProvider>
      </body>
    </html>
  );
}
