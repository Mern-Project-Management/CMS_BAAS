import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import '../styles/globals.css'
import { SidebarProvider } from '@/components/context/sidebar-context'
import { Navbar } from '@/components/navbar'
import { ClientSidebar } from '@/components/client-sidebar'
import { AdminThemeLoader } from '@/components/admin-theme-loader'
import { Toaster } from '@/components/ui/toaster'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Wiretex Manufacturing BAAS',
  description: 'Dynamic Schema Builder and Content Management System',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var reloadKey = 'next_chunk_reload_ts';
                function reloadPage() {
                  var now = Date.now();
                  var lastReload = localStorage.getItem(reloadKey);
                  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
                    localStorage.setItem(reloadKey, now.toString());
                    console.warn('ChunkLoadError detected. Reloading page to fetch latest assets...');
                    window.location.reload();
                  }
                }
                function isChunkError(error) {
                  if (!error) return false;
                  return (
                    error.name === 'ChunkLoadError' ||
                    (error.message && error.message.indexOf('ChunkLoadError') !== -1) ||
                    (error.message && error.message.indexOf('Failed to load chunk') !== -1)
                  );
                }
                window.addEventListener('error', function(event) {
                  var errorMsg = event.message || '';
                  var isChunkLoad = errorMsg.indexOf('ChunkLoadError') !== -1 || 
                                     errorMsg.indexOf('Failed to load chunk') !== -1 ||
                                     isChunkError(event.error);
                  if (isChunkLoad) {
                    reloadPage();
                  }
                });
                window.addEventListener('unhandledrejection', function(event) {
                  if (isChunkError(event.reason)) {
                    reloadPage();
                  }
                });
              })();
            `
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans h-screen overflow-hidden bg-background text-foreground`}>
        <AdminThemeLoader />
        <SidebarProvider>
          <div className="flex h-full overflow-hidden flex-col md:flex-row">
            <ClientSidebar />
            <div className="flex flex-col flex-1 min-w-0 min-h-0">
              <Navbar />
              <main className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-br from-background via-secondary/30 to-muted/20 px-4 py-4 sm:px-6 sm:py-6">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  )
}


