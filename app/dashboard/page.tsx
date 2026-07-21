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
  Database,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  counts: {
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
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [colors, setColors] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [installing, setInstalling] = useState(false);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch Stats, Colors, and Collections in parallel
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [statsRes, colorsRes, collectionsRes] = await Promise.all([
          fetch('/api/dashboard/stats').then(res => res.ok ? res.json() : { success: false }),
          fetch('/api/colors').then(res => res.ok ? res.json() : { success: false }),
          fetch('/api/collections').then(res => res.ok ? res.json() : { success: false })
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
        }
        if (colorsRes.success) {
          setColors(colorsRes.data.colors);
        }
        if (collectionsRes.success) {
          setCollections(collectionsRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleInstallDefaults = async () => {
    setInstalling(true);
    try {
      const res = await fetch('/api/setup/seed-defaults', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast({
          title: 'Installation Successful',
          description: 'Default collections and schemas have been successfully installed.',
          variant: 'success'
        });
        window.location.reload();
      } else {
        throw new Error(json.error || 'Failed to install defaults');
      }
    } catch (err: any) {
      toast({
        title: 'Installation Failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setInstalling(false);
    }
  };

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

  if (collections.length === 0) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-4">
        {/* Onboarding Welcome Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Clean Setup Detected
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Welcome to your Admin CMS Panel!
            </h2>
            <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
              This is a clean installation with only core configuration schemas loaded. Follow our onboarding steps below or click to install default schemas to start managing your site immediately.
            </p>
          </div>
          <Button 
            onClick={handleInstallDefaults} 
            disabled={installing} 
            className="w-full md:w-auto h-12 px-6 font-bold shadow-lg shadow-primary/20 shrink-0 gap-2 bg-primary hover:bg-primary/95 text-primary-foreground"
          >
            {installing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {installing ? 'Installing Packages...' : 'Install Default Packages'}
          </Button>
        </div>

        {/* 2-Column Onboarding Steps and Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Step-by-Step Onboarding Guide */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Setup Guide & Roadmap
            </h3>

            <div className="relative border-l border-border pl-6 ml-4 space-y-8">
              
              {/* Step 1 */}
              <div className="relative">
                <span className="absolute -left-[38px] top-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-4 ring-background">
                  1
                </span>
                <div className="bg-card border rounded-xl p-5 hover:border-primary/30 transition-colors shadow-sm">
                  <h4 className="font-bold text-sm text-foreground">Configure Sidebar Logo & Site favicon</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Set up your business identity. Upload your custom sidebar logo and favicon from the profile settings form inside the top-right navbar menu.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <span className="absolute -left-[38px] top-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-4 ring-background">
                  2
                </span>
                <div className="bg-card border rounded-xl p-5 hover:border-primary/30 transition-colors shadow-sm">
                  <h4 className="font-bold text-sm text-foreground">Establish Colors & Styles</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Align the admin theme colors with your brand guidelines. Custom colors are saved directly into the website's SCSS styles.
                  </p>
                  <Button onClick={() => router.push('/color-manager')} variant="link" size="sm" className="p-0 text-xs font-semibold gap-1 text-primary mt-3 hover:underline">
                    Go to Color Manager
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <span className="absolute -left-[38px] top-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-4 ring-background">
                  3
                </span>
                <div className="bg-card border rounded-xl p-5 hover:border-primary/30 transition-colors shadow-sm">
                  <h4 className="font-bold text-sm text-foreground">Set up Custom Database Schema Builder</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Define new Collections (tables) like Products, Services, Blogs, or Testimonials. Set fields, validation checks, and data relations.
                  </p>
                  <div className="flex gap-4 mt-3">
                    <Button onClick={() => router.push('/')} variant="link" size="sm" className="p-0 text-xs font-semibold gap-1 text-primary hover:underline">
                      Create Schema manually
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-muted-foreground/30 text-xs self-center">|</span>
                    <button onClick={handleInstallDefaults} disabled={installing} className="text-xs font-semibold text-primary hover:underline">
                      {installing ? 'Installing...' : 'Install Default Packages in 1-Click'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Features showcase */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold tracking-tight">
              Platform Features
            </h3>

            <div className="space-y-4">
              {/* Dynamic Schema Builder */}
              <div className="p-4 rounded-xl border bg-card/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-600 animate-pulse" />
                  <h5 className="text-sm font-bold text-foreground">Dynamic Schema Builder</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Design database models, specify field type attributes, and build relationships visually without writing code.
                </p>
              </div>

              {/* Page Section Manager */}
              <div className="p-4 rounded-xl border bg-card/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-blue-600" />
                  <h5 className="text-sm font-bold text-foreground">Page Section Manager</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Activate, sort, and toggle visual components and layouts displayed on your website pages dynamically.
                </p>
              </div>

              {/* Style & Theme Preset Editor */}
              <div className="p-4 rounded-xl border bg-card/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <h5 className="text-sm font-bold text-foreground">Style & Theme Preset Editor</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Modify HSL variables and save brand color presets that persist and update website stylesheets instantly.
                </p>
              </div>

              {/* SEO Auditor & Metadata */}
              <div className="p-4 rounded-xl border bg-card/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-600" />
                  <h5 className="text-sm font-bold text-foreground">SEO Auditor & Metadata</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Audit visual search optimization scores, map page meta headers, and write custom JSON-LD schemas.
                </p>
              </div>
            </div>
          </div>

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
