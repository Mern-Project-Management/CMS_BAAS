'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut, User, Menu, Settings, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-client';
import { useSidebar } from '@/components/context/sidebar-context';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toggle } = useSidebar();
  const { toast } = useToast();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>('');
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string>('');

  const [form, setForm] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
  });

  const openProfile = async () => {
    setForm({
      username: user?.username ?? '',
      email: user?.email ?? '',
      currentPassword: '',
      newPassword: '',
    });
    // Fetch global settings to get logo & favicon
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data) {
        setCurrentLogoUrl(json.data.logo_url || '');
        setCurrentFaviconUrl(json.data.favicon_url || '');
      }
    } catch (e) {
      console.error(e);
    }
    setLogoFile(null);
    setFaviconFile(null);
    setIsProfileOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Upload files first if selected
      let finalLogoUrl = currentLogoUrl;
      let finalFaviconUrl = currentFaviconUrl;

      if (logoFile) {
        const fd = new FormData();
        fd.append('file', logoFile);
        fd.append('fieldType', 'Image');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.success && json.data?.url) {
          finalLogoUrl = json.data.url;
        } else {
          throw new Error(json.error || 'Failed to upload logo');
        }
      }

      if (faviconFile) {
        const fd = new FormData();
        fd.append('file', faviconFile);
        fd.append('fieldType', 'Image');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.success && json.data?.url) {
          finalFaviconUrl = json.data.url;
        } else {
          throw new Error(json.error || 'Failed to upload favicon');
        }
      }

      // 2. Save settings back if changed
      if (finalLogoUrl !== currentLogoUrl || finalFaviconUrl !== currentFaviconUrl) {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logo_url: finalLogoUrl,
            favicon_url: finalFaviconUrl
          })
        });
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Failed to update logo/favicon settings');
        }
      }

      // 3. Update standard profile info
      const payload: Record<string, string> = {};

      if (form.username.trim() && form.username.trim() !== user?.username) {
        payload.username = form.username.trim();
      }
      if (form.email.trim() && form.email.trim() !== user?.email) {
        payload.email = form.email.trim();
      }
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      if (Object.keys(payload).length > 0) {
        const res = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (!json.success) {
          toast({ title: 'Error', description: json.error, variant: 'destructive' });
          return;
        }
      }

      toast({ title: 'Profile and Settings updated', description: 'Your changes have been saved.' });
      setIsProfileOpen(false);

      // Force a reload to refresh everything (including the sidebar logo)
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (pathname.startsWith('/login')) return null;
  if (!user) return null;

  return (
    <>
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
            {/* Desktop user info */}
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

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/10">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="font-medium">{user.username}</span>
                  <span className="text-xs text-muted-foreground font-normal capitalize">{user.role}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openProfile} className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout shortcut (mobile) */}
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-xs sm:text-sm sm:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Edit Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Role badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <User className="h-4 w-4 text-primary/60" />
              <span className="text-sm font-medium capitalize">{user.role}</span>
              <span className="text-xs text-muted-foreground ml-auto">Role cannot be changed here</span>
            </div>

            {/* 2x2 Grid for Profile Info & Assets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  id="profile-username"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Enter email"
                  autoComplete="email"
                />
              </div>

              {/* Sidebar Logo */}
              <div className="space-y-1.5 border-t md:border-t-0 pt-4 md:pt-0">
                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Sidebar Logo</Label>
                <div className="flex items-center gap-3">
                  {(logoFile || currentLogoUrl) && (
                    <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={logoFile ? URL.createObjectURL(logoFile) : currentLogoUrl}
                        alt="Logo Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLogoFile(file);
                    }}
                    className="cursor-pointer text-xs h-9 py-1"
                  />
                </div>
              </div>

              {/* Site Favicon */}
              <div className="space-y-1.5 border-t md:border-t-0 pt-4 md:pt-0">
                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Site Favicon</Label>
                <div className="flex items-center gap-3">
                  {(faviconFile || currentFaviconUrl) && (
                    <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={faviconFile ? URL.createObjectURL(faviconFile) : currentFaviconUrl}
                        alt="Favicon Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFaviconFile(file);
                    }}
                    className="cursor-pointer text-xs h-9 py-1"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                Change Password (optional)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Current password */}
                <div className="space-y-1.5">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPw ? 'text' : 'password'}
                      value={form.currentPassword}
                      onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                      placeholder="Required to change password"
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPw ? 'text' : 'password'}
                      value={form.newPassword}
                      onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
