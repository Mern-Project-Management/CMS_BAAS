'use client';

import { usePathname } from 'next/navigation';
import { LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-client';
import { useSidebar } from '@/components/context/sidebar-context';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toggle } = useSidebar();

  // Hide navbar on login route
  if (pathname.startsWith('/login')) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Toggle & Title */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary"
            title="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-primary">
            Schema Builder
          </h1>
        </div>

        {/* Right: User Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5">
              <User className="h-4 w-4 text-primary/60" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground">{user.username}</span>
                <span className="text-xs text-primary/60 capitalize">{user.role}</span>
              </div>
            </div>
            {user.email && (
              <span className="text-sm text-foreground/60 hidden lg:inline truncate">
                {user.email}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-xs sm:text-sm"
          >
            <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
