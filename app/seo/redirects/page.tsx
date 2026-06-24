'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Plus, Pencil, Trash2, CheckCircle, XCircle, RefreshCw, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface RedirectItem {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  statusCode: number;
  status: 'Active' | 'Inactive';
  hits: number;
  created_at: string;
  updated_at: string;
}

export default function SeoRedirectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog States
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RedirectItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    sourceUrl: '',
    targetUrl: '',
    statusCode: '301',
    status: 'Active'
  });

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch Redirects
  const fetchRedirects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seo/redirects');
      if (!res.ok) throw new Error('Failed to load redirects');
      const json = await res.json();
      if (json.success) {
        setRedirects(json.data || []);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not fetch redirects', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRedirects();
    }
  }, [user]);

  const openCreateDialog = () => {
    setEditingItem(null);
    setForm({
      sourceUrl: '',
      targetUrl: '',
      statusCode: '301',
      status: 'Active'
    });
    setIsOpen(true);
  };

  const openEditDialog = (item: RedirectItem) => {
    setEditingItem(item);
    setForm({
      sourceUrl: item.sourceUrl,
      targetUrl: item.targetUrl,
      statusCode: String(item.statusCode),
      status: item.status
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sourceUrl.trim() || !form.targetUrl.trim()) {
      toast({ title: 'Validation Error', description: 'Source and Target URLs are required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingItem ? `/api/seo/redirects/${editingItem.id}` : '/api/seo/redirects';
      const method = editingItem ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: form.sourceUrl,
          targetUrl: form.targetUrl,
          statusCode: Number(form.statusCode),
          status: form.status
        })
      });
      
      const json = await res.json();
      if (json.success) {
        toast({ 
          title: editingItem ? 'Redirect Updated' : 'Redirect Created', 
          description: editingItem ? 'The redirect configuration has been updated.' : 'A new redirect mapping has been added.' 
        });
        setIsOpen(false);
        fetchRedirects();
      } else {
        throw new Error(json.error || 'Failed to submit redirect');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/seo/redirects/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Redirect Deleted', description: 'The redirect rule has been deleted.' });
        setDeleteConfirmId(null);
        fetchRedirects();
      } else {
        throw new Error(json.error || 'Failed to delete redirect');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filteredRedirects = redirects.filter(item => 
    item.sourceUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.targetUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || (loading && redirects.length === 0)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">URL Redirects Manager</h1>
          <p className="text-muted-foreground">Manage site URLs mapping paths (301 Permanent, 302 Temporary) with real-time hit counts tracking.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="icon" onClick={fetchRedirects} disabled={loading} title="Refresh redirects list">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" /> Add Redirect
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search redirects by source or target URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Total rules: <span className="font-semibold text-foreground">{redirects.length}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 w-[35%]">Source URL (Slug)</TableHead>
                <TableHead className="w-[35%]">Target Destination</TableHead>
                <TableHead className="w-[10%] text-center">Type</TableHead>
                <TableHead className="w-[10%] text-center">Status</TableHead>
                <TableHead className="w-[8%] text-center">Hits</TableHead>
                <TableHead className="w-[10%] text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRedirects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No redirects configured. Click "Add Redirect" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRedirects.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6 font-mono text-xs break-all">
                      <span className="text-muted-foreground font-sans text-xs select-none mr-1">/</span>
                      {item.sourceUrl.replace(/^\//, '')}
                    </TableCell>
                    <TableCell className="font-mono text-xs break-all max-w-[200px]">
                      {item.targetUrl}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {item.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={item.status === 'Active' ? 'default' : 'outline'}
                        className={
                          item.status === 'Active'
                            ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20'
                            : 'text-muted-foreground'
                        }
                      >
                        {item.status === 'Active' ? (
                          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
                        ) : (
                          <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactive</span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{item.hits}</TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 hover:text-primary">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(item.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Redirect Rule' : 'New Redirect Rule'}</DialogTitle>
            <DialogDescription>Define a route mapping. Paths will be matched relative to your domain.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sourceUrl">Source URL (Path)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">/</span>
                <Input
                  id="sourceUrl"
                  value={form.sourceUrl.replace(/^\//, '')}
                  onChange={(e) => setForm(prev => ({ ...prev, sourceUrl: e.target.value }))}
                  placeholder="old-product-slug"
                  className="pl-6 font-mono text-sm"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">The incoming request route to redirect (e.g. <code>/old-path</code>).</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetUrl">Target URL (Destination)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground"><LinkIcon className="w-3.5 h-3.5" /></span>
                <Input
                  id="targetUrl"
                  value={form.targetUrl}
                  onChange={(e) => setForm(prev => ({ ...prev, targetUrl: e.target.value }))}
                  placeholder="/new-products/details or https://external.com"
                  className="pl-9 font-mono text-sm"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Can be a relative path on your website or an absolute external link.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="statusCode">Redirect Status Code</Label>
                <Select value={form.statusCode} onValueChange={(val) => setForm(prev => ({ ...prev, statusCode: val }))}>
                  <SelectTrigger id="statusCode">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="301">301 (Permanent)</SelectItem>
                    <SelectItem value="302">302 (Found)</SelectItem>
                    <SelectItem value="307">307 (Temporary)</SelectItem>
                    <SelectItem value="308">308 (Permanent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">State</Label>
                <Select value={form.status} onValueChange={(val) => setForm(prev => ({ ...prev, status: val as any }))}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingItem ? 'Save Redirect' : 'Create Redirect'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" /> Delete Redirect Rule
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">Are you sure you want to delete this redirect rule? Requests to the source URL will no longer be intercepted.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
