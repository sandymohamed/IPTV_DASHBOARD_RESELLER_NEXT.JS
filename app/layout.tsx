import type { Metadata, Viewport } from 'next';
import { SettingsProvider } from '@/lib/contexts/SettingsContext';
import ThemeProvider from '@/lib/theme';
import NotificationSetup from '@/components/NotificationSetup';
import ToastProvider from '@/components/ToastProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'IPTV Dashboard ssssssssssssss',
  description: 'IPTV Reseller Dashboard',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IPTV Dashboard xxxxxxxxxxxxxxx',
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
      <body>

        <SettingsProvider>
          <ThemeProvider>
            <NotificationSetup />
            <ToastProvider />
            {children}
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
