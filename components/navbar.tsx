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

  const [form, setForm] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    logo_url: '',
    favicon_url: '',
  });

  const openProfile = async () => {
    setForm({
      username: user?.username ?? '',
      email: user?.email ?? '',
      currentPassword: '',
      newPassword: '',
      logo_url: '',
      favicon_url: '',
    });
    setIsProfileOpen(true);

    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setForm(p => ({
            ...p,
            logo_url: json.data.logo_url || '',
            favicon_url: json.data.favicon_url || '',
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load settings in profile dialog', e);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('File upload failed');
    const json = await res.json();
    if (!json.success || !json.url) throw new Error(json.error || 'File upload failed');
    return json.url;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Upload files first if selected
      let uploadedLogo = (form as any).logo_url;
      let uploadedFavicon = (form as any).favicon_url;

      if ((form as any).logoFile) {
        uploadedLogo = await uploadFile((form as any).logoFile);
      }
      if ((form as any).faviconFile) {
        uploadedFavicon = await uploadFile((form as any).faviconFile);
      }

      // 2. Save settings brand assets if changed
      if (uploadedLogo !== (form as any).logo_url || uploadedFavicon !== (form as any).favicon_url) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logo_url: uploadedLogo,
            favicon_url: uploadedFavicon,
          }),
        });
        window.dispatchEvent(new CustomEvent('sidebar:refresh'));
      }

      // 3. Save profile attributes
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

      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
      setIsProfileOpen(false);

      // Refresh to update header logo, favicon, and username/email
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

          <div className="space-y-4 py-2">
            {/* Role badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <User className="h-4 w-4 text-primary/60" />
              <span className="text-sm font-medium capitalize">{user.role}</span>
              <span className="text-xs text-muted-foreground ml-auto">Role cannot be changed here</span>
            </div>

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

              {/* Sidebar Logo + Preview */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-logo">Sidebar Logo</Label>
                <Input
                  id="profile-logo"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const localUrl = URL.createObjectURL(file);
                      setForm((p: any) => ({ ...p, logoFile: file, logoPreview: localUrl }));
                    }
                  }}
                />
                {((form as any).logoPreview || (form as any).logo_url) && (
                  <div className="mt-2 p-2 border rounded bg-muted/30 flex items-center justify-center h-20">
                    <img
                      src={(form as any).logoPreview || (form as any).logo_url}
                      alt="Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Site Favicon + Preview */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-favicon">Site Favicon</Label>
                <Input
                  id="profile-favicon"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const localUrl = URL.createObjectURL(file);
                      setForm((p: any) => ({ ...p, faviconFile: file, faviconPreview: localUrl }));
                    }
                  }}
                />
                {((form as any).faviconPreview || (form as any).favicon_url) && (
                  <div className="mt-2 p-2 border rounded bg-muted/30 flex items-center justify-center h-20">
                    <img
                      src={(form as any).faviconPreview || (form as any).favicon_url}
                      alt="Favicon Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 space-y-3 md:col-span-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Change Password (optional)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
