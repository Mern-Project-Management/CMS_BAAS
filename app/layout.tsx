import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import '../styles/globals.css'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { SidebarProvider } from '@/components/context/sidebar-context'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'jayshree_blogs BAAS',
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans h-screen overflow-hidden bg-background text-foreground`}>
        <SidebarProvider>
          <div className="flex h-full overflow-hidden flex-col md:flex-row">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 min-h-0">
              <Navbar />
              <main className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-br from-background via-secondary/30 to-muted/20 px-4 py-4 sm:px-6 sm:py-6">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}
