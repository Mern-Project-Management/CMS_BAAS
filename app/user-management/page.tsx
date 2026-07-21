'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Shield,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  UserCog,
  Search,
  RefreshCw,
} from 'lucide-react';
import type { Role } from '@/lib/types';

interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: string;
  role_id?: string;
  role_name?: string;
  created_at: string;
}

type DialogMode = 'create' | 'edit' | null;

export default function UserManagementPage() {
  const { user: currentUser, isSuperadmin } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
    role_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles'),
      ]);

      const usersJson = await usersRes.json();
      const rolesJson = await rolesRes.json();

      if (usersJson.success) setUsers(usersJson.data || []);
      if (rolesJson.success) setRoles(rolesJson.data || []);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', role: 'admin', role_id: '' });
    setShowPassword(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingUser(null);
    setDialogMode('create');
  };

  const openEditDialog = (u: UserRecord) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      email: u.email,
      password: '',
      role: u.role,
      role_id: u.role_id || '',
    });
    setShowPassword(false);
    setDialogMode('edit');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingUser(null);
    resetForm();
  };

  const handleCreate = async () => {
    if (!formData.username.trim()) {
      toast({ title: 'Validation Error', description: 'Username is required', variant: 'destructive' });
      return;
    }
    if (!formData.email.trim()) {
      toast({ title: 'Validation Error', description: 'Email is required', variant: 'destructive' });
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast({ title: 'Validation Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (!formData.role_id) {
      toast({ title: 'Validation Error', description: 'Please select a System Role', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          role_id: formData.role_id || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast({ title: 'User created successfully' });
        closeDialog();
        fetchData(true);
      } else {
        toast({ title: 'Error', description: json.error || 'Failed to create user', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create user', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      const payload: any = { id: editingUser.id };

      if (formData.username.trim() && formData.username !== editingUser.username) {
        payload.username = formData.username.trim();
      }
      if (formData.email.trim() && formData.email !== editingUser.email) {
        payload.email = formData.email.trim();
      }
      if (formData.password) {
        if (formData.password.length < 6) {
          toast({ title: 'Validation Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
          setSaving(false);
          return;
        }
        payload.password = formData.password;
      }
      if (formData.role !== editingUser.role) {
        payload.role = formData.role;
      }
      payload.role_id = formData.role_id || null;

      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast({ title: 'User updated successfully' });
        closeDialog();
        fetchData(true);
      } else {
        toast({ title: 'Error', description: json.error || 'Failed to update user', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) return;

    setDeletingId(userId);
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast({ title: `User "${username}" deleted` });
        fetchData(true);
      } else {
        toast({ title: 'Error', description: json.error || 'Failed to delete user', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.role_name || '').toLowerCase().includes(q)
    );
  });

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-amber-500/10 text-amber-600 border border-amber-500/30';
      case 'admin':
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/30';
      default:
        return 'bg-primary/10 text-primary border border-primary/20';
    }
  };

  if (!isSuperadmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Access denied. Superadmin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8" />
            User Manager
          </h1>
          <p className="text-muted-foreground mt-2">
            Create, manage and assign roles to users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by username, email or role..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No users match your search' : 'No users found'}
          </p>
          {!searchQuery && (
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add First User
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium text-sm">Username</th>
                <th className="text-left p-4 font-medium text-sm">Email</th>
                <th className="text-left p-4 font-medium text-sm">System Role</th>
                <th className="text-left p-4 font-medium text-sm">Custom Role</th>
                <th className="text-left p-4 font-medium text-sm">Created</th>
                <th className="text-right p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {u.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-sm">{u.username}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize font-medium ${getRoleBadgeStyle(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.role_name ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground border border-border font-medium">
                        {u.role_name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(u)}
                        disabled={u.role === 'superadmin'}
                        title={u.role === 'superadmin' ? 'Cannot edit superadmin' : 'Edit user'}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(u.id, u.username)}
                        disabled={u.role === 'superadmin' || deletingId === u.id || u.id === currentUser?.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title={
                          u.role === 'superadmin'
                            ? 'Cannot delete superadmin'
                            : u.id === currentUser?.id
                            ? 'Cannot delete yourself'
                            : 'Delete user'
                        }
                      >
                        {deletingId === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-muted/30 border-t px-4 py-2 text-xs text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogMode === 'create' ? (
                <>
                  <Plus className="w-5 h-5" />
                  Create New User
                </>
              ) : (
                <>
                  <UserCog className="w-5 h-5" />
                  Edit User
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="um-username">Username *</Label>
              <Input
                id="um-username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="e.g. john_doe"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="um-email">Email *</Label>
              <Input
                id="um-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="e.g. john@example.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="um-password">
                {dialogMode === 'create' ? 'Password *' : 'New Password'}
                {dialogMode === 'edit' && (
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="um-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={dialogMode === 'create' ? 'Min. 6 characters' : 'Enter new password to change'}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* System Role — dynamically linked to Custom Role */}
            <div className="space-y-2">
              <Label htmlFor="um-role">System Role *</Label>
              <select
                id="um-role"
                value={formData.role_id}
                onChange={(e) => {
                  const selectedRoleId = e.target.value;
                  const selectedRole = roles.find((r) => r.id === selectedRoleId);
                  setFormData(prev => ({
                    ...prev,
                    role_id: selectedRoleId,
                    // Keep a normalized role name for the system role field
                    role: selectedRole ? selectedRole.name.toLowerCase().replace(/\s+/g, '_') : 'admin',
                  }));
                }}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="">— Select a role —</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                    {role.description ? ` — ${role.description}` : ''}
                  </option>
                ))}
              </select>
              {roles.length === 0 && (
                <p className="text-xs text-amber-600">
                  No roles found. Create roles first in the Role Manager.
                </p>
              )}
            </div>

            {/* Permissions Preview — auto-populated from selected System Role */}
            {/* {formData.role_id && (() => {
              const selectedRole = roles.find((r) => r.id === formData.role_id);
              return selectedRole ? (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissions granted</p>
                    <span className="text-xs text-muted-foreground">{selectedRole.permissions.length} permission{selectedRole.permissions.length !== 1 ? 's' : ''}</span>
                  </div>
                  {selectedRole.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedRole.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary border border-primary/20"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No permissions assigned to this role.</p>
                  )}
                </div>
              ) : null;
            })()} */}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={dialogMode === 'create' ? handleCreate : handleUpdate}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {dialogMode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
