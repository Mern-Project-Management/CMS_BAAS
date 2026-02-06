import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { SidebarProvider } from '@/components/context/sidebar-context'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SidebarProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <Navbar />
              <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background to-muted/20">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}
