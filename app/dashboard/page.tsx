'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, 
  BookOpen, 
  Briefcase, 
  Mail, 
  Palette, 
  Layout, 
  Calendar, 
  ChevronRight, 
  UserCheck,
  Send,
  Loader2,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface DashboardStats {
  counts: {
    collections: number;
    products: number;
    blogs: number;
    careerLeads: number;
    contactLeads: number;
  };
  links: {
    productsCollectionId: string | null;
    blogsCollectionId: string | null;
  };
  pages: Array<{
    name: string;
    totalComponents: number;
    activeComponents: number;
  }>;
  templates: Array<{
    id: string;
    name: string;
    subject: string;
    variables: string[];
    is_default: boolean;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isSuperadmin, hasPermission } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [colors, setColors] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch Stats and Colors in parallel
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [statsRes, colorsRes] = await Promise.all([
          fetch('/api/dashboard/stats').then(res => res.ok ? res.json() : { success: false }),
          fetch('/api/colors').then(res => res.ok ? res.json() : { success: false })
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
        }
        if (colorsRes.success) {
          setColors(colorsRes.data.colors);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-medium tracking-wide">
            Loading dashboard…
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Permission check — non-superadmins need the 'dashboard' permission
  if (!isSuperadmin && !hasPermission('dashboard')) {
    // Build a list of sections the user CAN access to guide them
    const accessibleLinks: { label: string; href: string }[] = [];
    if (hasPermission('collections')) accessibleLinks.push({ label: 'Collections', href: '/' });
    if (hasPermission('color-manager')) accessibleLinks.push({ label: 'Color Manager', href: '/color-manager' });
    if (hasPermission('page-manager')) accessibleLinks.push({ label: 'Page Manager', href: '/page-manager' });
    if (hasPermission('calendar')) accessibleLinks.push({ label: 'Calendar', href: '/calendar' });
    if (hasPermission('api-docs')) accessibleLinks.push({ label: 'API Docs', href: '/api-docs' });
    if (hasPermission('email-templates')) accessibleLinks.push({ label: 'Email Templates', href: '/email-templates' });
    if (hasPermission('send-email')) accessibleLinks.push({ label: 'Send Email', href: '/send-email' });
    if (hasPermission('settings')) accessibleLinks.push({ label: 'Global Settings', href: '/settings' });
    if (hasPermission('seo-settings')) accessibleLinks.push({ label: 'SEO Settings', href: '/seo/settings' });
    if (hasPermission('pages-metadata')) accessibleLinks.push({ label: 'Pages Metadata', href: '/seo/metadata' });
    if (hasPermission('seo-audit')) accessibleLinks.push({ label: 'SEO Audit', href: '/seo/audit' });
    if (hasPermission('redirects')) accessibleLinks.push({ label: 'Redirects', href: '/seo/redirects' });
    if (hasPermission('global-presence')) accessibleLinks.push({ label: 'Global Presence', href: '/global-presence' });

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>

          {/* Greeting */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, <span className="text-primary">{user.username}</span>!
            </h1>
            <p className="text-muted-foreground text-base">
              You&apos;re logged in as{' '}
              <span className="font-semibold capitalize text-foreground">{user.role}</span>.
              Your account doesn&apos;t have access to the main dashboard.
            </p>
          </div>

          {/* Access info */}
          {accessibleLinks.length > 0 ? (
            <div className="bg-card border border-border rounded-xl p-5 text-left space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
                Sections you have access to
              </p>
              <div className="flex flex-wrap gap-2">
                {accessibleLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5 text-center space-y-2">
              <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                You don&apos;t have access to any sections yet.<br />
                Please contact your administrator to get permissions assigned.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Format current date
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/setup/seed-defaults', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Seed failed');
      toast({ title: 'Success', description: 'Default packages and database seeded!' });
      window.dispatchEvent(new CustomEvent('sidebar:refresh'));
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Seeding Failed', description: err.message, variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  // If there are no collections in the database, show the onboarding wizard
  if (stats && stats.counts.collections === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-primary/10 text-primary rounded-xl ring-1 ring-primary/20 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Welcome to CMS Builder!</h1>
            <p className="text-muted-foreground mt-1">Let&apos;s get your workspace configured and ready.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Onboarding Checklist</CardTitle>
              <CardDescription>Follow these steps to initialize your CMS database tables.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                <div>
                  <p className="font-semibold text-sm">Database Connected</p>
                  <p className="text-xs text-muted-foreground">Your MongoDB connection is configured and active.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Install Default Packages</p>
                  <p className="text-xs text-muted-foreground mb-3">Install standard collection tables (our_products, blog, faq, and manage-meta) to populate fields instantly.</p>
                  <Button onClick={handleSeedDefaults} disabled={seeding} className="gap-2">
                    {seeding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Seeding…
                      </>
                    ) : (
                      'Install Default Packages'
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/10 opacity-60">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-semibold text-sm">Add custom schemas & records</p>
                  <p className="text-xs text-muted-foreground">Build fields dynamically and feed content via tables.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base font-bold">Workspace Highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">🎨 Color Manager</p>
                <p className="text-xs">Tailor frontend theme variables dynamically to match your branding elements.</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">🔍 Dynamic SEO Rules</p>
                <p className="text-xs">Tweak tab titles, descriptions and canonical schemas on the fly.</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">📁 Public Upload Cleanups</p>
                <p className="text-xs">Automatically unlinks and deletes local media items when deleted from collections.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Theme-Friendly Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-base text-muted-foreground mt-1 max-w-xl">
            Real-time overview of your website collections, page content, custom styling, and lead inquiries.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
            <UserCheck className="w-4 h-4" />
            {user.role}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-secondary-foreground border border-border/50">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Products */}
        <Card className="group relative flex flex-col gap-3 p-5 border bg-card hover:border-primary/30 hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] transition-all duration-200">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ring-1 bg-primary/10 text-primary ring-primary/15">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-none">
                Products
              </p>
              <p className="text-3xl font-bold text-foreground mt-2 leading-none">
                {stats?.counts?.products ?? 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/80 mt-1 flex-grow">
            Active catalog items displayed in the product section.
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
            <span className="text-xs text-muted-foreground/75 font-mono">our_products</span>
            <Button
              variant="secondary"
              size="default"
              className="h-8 text-sm font-medium gap-1 bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => {
                if (stats?.links?.productsCollectionId) {
                  router.push(`/collections/${stats.links.productsCollectionId}?collectionName=our_products`);
                } else {
                  router.push('/');
                }
              }}
            >
              Open
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* Blogs */}
        <Card className="group relative flex flex-col gap-3 p-5 border bg-card hover:border-primary/30 hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] transition-all duration-200">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ring-1 bg-primary/10 text-primary ring-primary/15">
              <BookOpen className="w-5 h-5" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-none">
                Blog Posts
              </p>
              <p className="text-3xl font-bold text-foreground mt-2 leading-none">
                {stats?.counts?.blogs ?? 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/80 mt-1 flex-grow">
            Articles and updates published to the news block.
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
            <span className="text-xs text-muted-foreground/75 font-mono">blog</span>
            <Button
              variant="secondary"
              size="default"
              className="h-8 text-sm font-medium gap-1 bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => {
                if (stats?.links?.blogsCollectionId) {
                  router.push(`/collections/${stats.links.blogsCollectionId}?collectionName=blog`);
                } else {
                  router.push('/');
                }
              }}
            >
              Open
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* Career Leads */}
        <Card className="group relative flex flex-col gap-3 p-5 border bg-card hover:border-primary/30 hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] transition-all duration-200">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ring-1 bg-primary/10 text-primary ring-primary/15">
              <Briefcase className="w-5 h-5" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-none">
                Career Leads
              </p>
              <p className="text-3xl font-bold text-foreground mt-2 leading-none">
                {stats?.counts?.careerLeads ?? 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/80 mt-1 flex-grow">
            Submissions and CVs from candidate applications.
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
            <span className="text-xs text-muted-foreground/75 font-mono">career_applications</span>
            <Button
              variant="secondary"
              size="default"
              className="h-8 text-sm font-medium gap-1 bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => router.push('/career-leads')}
            >
              Open
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* Contact Leads */}
        <Card className="group relative flex flex-col gap-3 p-5 border bg-card hover:border-primary/30 hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] transition-all duration-200">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ring-1 bg-primary/10 text-primary ring-primary/15">
              <Mail className="w-5 h-5" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-none">
                Contact Leads
              </p>
              <p className="text-3xl font-bold text-foreground mt-2 leading-none">
                {stats?.counts?.contactLeads ?? 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/80 mt-1 flex-grow">
            General client inquiries and queries captured online.
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
            <span className="text-xs text-muted-foreground/75 font-mono">contact_leads</span>
            <Button
              variant="secondary"
              size="default"
              className="h-8 text-sm font-medium gap-1 bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => router.push('/contact-leads')}
            >
              Open
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Main Core Managers Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Color Manager Section */}
        <Card className="border bg-card flex flex-col justify-between hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] transition-all duration-200">
          <div>
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center gap-2 text-primary">
                <Palette className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Color Manager</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Adjust site-wide color presets dynamically writing back to SCSS stylesheets.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-4">
              {colors ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    
                    {/* Primary swatch */}
                    <div className="flex items-center gap-2.5 bg-secondary/20 rounded-md p-2 border border-border/30">
                      <div 
                        className="w-5 h-5 rounded border border-border/50 shrink-0" 
                        style={{ backgroundColor: colors.theme?.primary || '#1e8a8a' }} 
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground font-bold leading-none uppercase">Primary</p>
                        <p className="text-xs font-mono font-bold truncate mt-1">{colors.theme?.primary || '#1e8a8a'}</p>
                      </div>
                    </div>

                    {/* Theme BG swatch */}
                    <div className="flex items-center gap-2.5 bg-secondary/20 rounded-md p-2 border border-border/30">
                      <div 
                        className="w-5 h-5 rounded border border-border/50 shrink-0" 
                        style={{ backgroundColor: colors.theme?.bg || '#d8e5e5' }} 
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground font-bold leading-none uppercase">Theme BG</p>
                        <p className="text-xs font-mono font-bold truncate mt-1">{colors.theme?.bg || '#d8e5e5'}</p>
                      </div>
                    </div>

                    {/* Dark BG swatch */}
                    <div className="flex items-center gap-2.5 bg-secondary/20 rounded-md p-2 border border-border/30">
                      <div 
                        className="w-5 h-5 rounded border border-border/50 shrink-0" 
                        style={{ backgroundColor: colors.theme?.bg3 || '#202e30' }} 
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground font-bold leading-none uppercase">BG Dark</p>
                        <p className="text-xs font-mono font-bold truncate mt-1">{colors.theme?.bg3 || '#202e30'}</p>
                      </div>
                    </div>

                    {/* Header Dark swatch */}
                    <div className="flex items-center gap-2.5 bg-secondary/20 rounded-md p-2 border border-border/30">
                      <div 
                        className="w-5 h-5 rounded border border-border/50 shrink-0" 
                        style={{ backgroundColor: colors.theme?.dark || '#0c1e21' }} 
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground font-bold leading-none uppercase">Dark Primary</p>
                        <p className="text-xs font-mono font-bold truncate mt-1">{colors.theme?.dark || '#0c1e21'}</p>
                      </div>
                    </div>

                    {/* Text Body swatch */}
                    <div className="flex items-center gap-2.5 bg-secondary/20 rounded-md p-2 border border-border/30">
                      <div 
                        className="w-5 h-5 rounded border border-border/50 shrink-0" 
                        style={{ backgroundColor: colors.text?.body || '#364e52' }} 
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground font-bold leading-none uppercase">Text Body</p>
                        <p className="text-xs font-mono font-bold truncate mt-1">{colors.text?.body || '#364e52'}</p>
                      </div>
                    </div>

                    {/* Heading swatch */}
                    <div className="flex items-center gap-2.5 bg-secondary/20 rounded-md p-2 border border-border/30">
                      <div 
                        className="w-5 h-5 rounded border border-border/50 shrink-0" 
                        style={{ backgroundColor: colors.heading?.primary || '#0c1e21' }} 
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground font-bold leading-none uppercase">Heading</p>
                        <p className="text-xs font-mono font-bold truncate mt-1">{colors.heading?.primary || '#0c1e21'}</p>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed rounded-lg bg-primary/[0.02]">
                  <span className="text-sm text-muted-foreground">Color parameters are currently loading</span>
                </div>
              )}
            </CardContent>
          </div>

          <CardContent className="pt-0 pb-4">
            <Button 
              size="default"
              className="w-full gap-1.5 text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/15 h-9" 
              onClick={() => router.push('/color-manager')}
            >
              <Palette className="w-4 h-4" />
              <span>Modify Palette configuration</span>
            </Button>
          </CardContent>
        </Card>

        {/* Page Manager Section */}
        <Card className="border bg-card flex flex-col justify-between hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] transition-all duration-200">
          <div>
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center gap-2 text-primary">
                <Layout className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Page Manager</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Activate layout sections, component rules, and configure order on frontend pages.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4">
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {stats?.pages && stats.pages.length > 0 ? (
                  stats.pages.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-md border border-border/40 bg-secondary/10">
                      <span className="text-sm font-bold text-foreground capitalize truncate max-w-[60%]">
                        {p.name.replace('-', ' ')}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {p.activeComponents}/{p.totalComponents} Active
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center border border-dashed rounded-lg bg-primary/[0.02]">
                    <span className="text-sm text-muted-foreground">No component configurations loaded.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </div>

          <CardContent className="pt-0 pb-4">
            <Button 
              size="default"
              className="w-full gap-1.5 text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/15 h-9" 
              onClick={() => router.push('/page-manager')}
            >
              <Layout className="w-4 h-4" />
              <span>Modify layout elements</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Email Templates Section */}
      <Card className="border bg-card hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] transition-all duration-200">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Mail className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Email Templates</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Manage automated system notifications, template parameters, and triggers.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                size="default" 
                variant="outline" 
                className="h-9 text-sm font-semibold border-border/80 hover:bg-secondary/40 px-3" 
                onClick={() => router.push('/send-email')}
              >
                <Send className="w-4 h-4 mr-1 text-muted-foreground" />
                <span>Send Email</span>
              </Button>
              <Button 
                size="default" 
                className="h-9 text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/15 px-3" 
                onClick={() => router.push('/email-templates')}
              >
                <span>Edit Templates</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stats?.templates && stats.templates.length > 0 ? (
              stats.templates.map((t) => (
                <div 
                  key={t.id} 
                  className="flex flex-col justify-between p-4 rounded-lg border border-border/50 bg-secondary/10 hover:border-primary/20 transition-all duration-200 group relative"
                >
                  {t.is_default && (
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted border border-border/40 px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                  
                  <div>
                    <h5 className="text-sm font-semibold text-foreground truncate max-w-[70%]">{t.name}</h5>
                    <p className="text-xs text-muted-foreground/80 font-mono truncate mt-1.5" title={t.subject}>
                      Subject: {t.subject}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40">
                    <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-wider leading-none mb-2.5">Variables</p>
                    <div className="flex flex-wrap gap-1">
                      {t.variables && t.variables.length > 0 ? (
                        t.variables.map((v, i) => (
                          <span key={i} className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary/5 text-primary/80 border border-primary/10">
                            {`{{${v}}}`}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">No variables</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center border border-dashed rounded-lg bg-primary/[0.02]">
                <span className="text-sm text-muted-foreground">No automated templates available.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
