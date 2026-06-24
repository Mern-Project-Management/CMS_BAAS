'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Play, Trash2, CheckCircle2, XCircle, AlertTriangle, Info, Clock, 
  Search, ShieldAlert, ArrowUpRight, Check, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';

interface PageReport {
  url: string;
  pageSlug: string;
  type: string;
  score: number;
  loadTime: number;
  errors: string[];
  warnings: string[];
  infos: string[];
  details?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    metaCanonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    h1Count?: number;
    h2Count?: number;
    imageAltMissingCount?: number;
    robots?: string;
  };
}

interface AuditItem {
  id: string;
  overallScore: number;
  pagesScore: number;
  blogsScore: number;
  websiteScore: number;
  totalPagesCrawled: number;
  totalBlogsCrawled: number;
  pageReports: PageReport[];
  globalChecks: {
    robots: boolean;
    sitemap: boolean;
    ssl: boolean;
    responsive: boolean;
    schemaFound: boolean;
    avgPageSpeedMs: number;
  };
  created_at: string;
}

export default function SeoAuditPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditItem | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch Audits
  const fetchAudits = async (selectLatest = false) => {
    try {
      if (selectLatest) setLoading(true);
      const res = await fetch('/api/seo/audit');
      if (!res.ok) throw new Error('Failed to load audits');
      const json = await res.json();
      if (json.success) {
        const data = json.data || [];
        setAudits(data);
        if (data.length > 0) {
          // If selectLatest or no selected audit, set the first one
          if (selectLatest || !selectedAudit) {
            setSelectedAudit(data[0]);
          } else {
            // Update currently selected audit with fresh data if present
            const updated = data.find((a: AuditItem) => a.id === selectedAudit.id);
            if (updated) setSelectedAudit(updated);
          }
        } else {
          setSelectedAudit(null);
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not fetch audit history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAudits(true);
    }
  }, [user]);

  const handleRunAudit = async () => {
    setRunningAudit(true);
    toast({ title: 'Audit Started', description: 'Crawler is scanning website pages. This will take a few moments...' });
    try {
      const res = await fetch('/api/seo/audit', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Audit Completed', description: 'Website SEO audit finished successfully.' });
        await fetchAudits(true);
      } else {
        throw new Error(json.error || 'Audit crawl failed');
      }
    } catch (err: any) {
      toast({ title: 'Audit Failed', description: err.message, variant: 'destructive' });
    } finally {
      setRunningAudit(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to delete all audit logs? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/seo/audit', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'History Cleared', description: 'SEO audit logs have been deleted.' });
        setAudits([]);
        setSelectedAudit(null);
      } else {
        throw new Error(json.error || 'Failed to clear history');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500 border-green-500/20 bg-green-500/10';
    if (score >= 70) return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10';
    return 'text-red-500 border-red-500/20 bg-red-500/10';
  };

  const getScoreStrokeColor = (score: number) => {
    if (score >= 90) return 'stroke-green-500';
    if (score >= 70) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const countIssues = (reports: PageReport[]) => {
    let errors = 0;
    let warnings = 0;
    let infos = 0;
    
    reports.forEach(r => {
      errors += r.errors?.length || 0;
      warnings += r.warnings?.length || 0;
      infos += r.infos?.length || 0;
    });

    return { errors, warnings, infos };
  };

  const filteredReports = selectedAudit?.pageReports.filter(r => 
    r.pageSlug.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.url.toLowerCase().includes(filterQuery.toLowerCase())
  ) || [];

  const issuesCount = selectedAudit ? countIssues(selectedAudit.pageReports) : { errors: 0, warnings: 0, infos: 0 };

  if (authLoading || (loading && audits.length === 0)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">SEO Audit & Crawler</h1>
          <p className="text-muted-foreground">Audit your site indexing structure, heading tags, image descriptions, canonical link overrides, and loading speeds.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {audits.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearHistory} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4 mr-2" /> Clear Logs
            </Button>
          )}
          <Button onClick={handleRunAudit} disabled={runningAudit} className="gap-2">
            {runningAudit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {runningAudit ? 'Auditing…' : 'Run SEO Audit'}
          </Button>
        </div>
      </div>

      {audits.length === 0 ? (
        <Card className="text-center py-20">
          <CardContent className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold">No audit records found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Start a scan to crawl all pages, calculate quality metrics, and review warnings or errors.</p>
            <Button onClick={handleRunAudit} disabled={runningAudit} className="mt-2">
              {runningAudit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Start First Scan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT PANEL: HISTORY */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Audit Logs</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {audits.map((audit) => {
                const date = new Date(audit.created_at);
                const isSelected = selectedAudit?.id === audit.id;
                
                return (
                  <button
                    key={audit.id}
                    onClick={() => setSelectedAudit(audit)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-150 flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'bg-card border-primary shadow-sm' 
                        : 'bg-card/50 hover:bg-card border-border/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {date.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge className={`font-semibold ${getScoreColor(audit.overallScore)}`}>
                      {audit.overallScore}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT DETAIL PANEL */}
          {selectedAudit && (
            <div className="lg:col-span-3 space-y-6">
              
              {/* SCORE GAUGE & OVERVIEW CARD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Circular Gauge */}
                <Card className="flex flex-col items-center justify-center p-6 md:col-span-1 bg-card">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="stroke-muted"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className={`${getScoreStrokeColor(selectedAudit.overallScore)} transition-all duration-500`}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 52}
                        strokeDashoffset={2 * Math.PI * 52 * (1 - selectedAudit.overallScore / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-extrabold">{selectedAudit.overallScore}</span>
                      <span className="text-xs text-muted-foreground block">/ 100</span>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <h3 className="font-semibold text-base">Overall Health Score</h3>
                    <p className="text-xs text-muted-foreground mt-1">Weighted score including page & site checks</p>
                  </div>
                </Card>
                
                {/* Summary Metrics */}
                <Card className="md:col-span-2 flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Audit Overview</CardTitle>
                    <CardDescription>Crawl executed on {new Date(selectedAudit.created_at).toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground block">Pages Scanned</span>
                      <span className="text-2xl font-bold">{selectedAudit.totalPagesCrawled + selectedAudit.totalBlogsCrawled}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground block text-red-500 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Errors
                      </span>
                      <span className="text-2xl font-bold text-red-500">{issuesCount.errors}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground block text-yellow-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Warnings
                      </span>
                      <span className="text-2xl font-bold text-yellow-500">{issuesCount.warnings}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground block">Avg Page Speed</span>
                      <span className="text-2xl font-bold font-mono text-primary">
                        {selectedAudit.globalChecks?.avgPageSpeedMs ?? 0} <span className="text-xs">ms</span>
                      </span>
                    </div>
                  </CardContent>
                  <div className="border-t border-border/50 px-6 py-3 bg-muted/20 flex gap-4 text-xs">
                    <div>Static Pages Score: <span className="font-semibold">{selectedAudit.pagesScore}</span></div>
                    <div>Blog Posts Score: <span className="font-semibold">{selectedAudit.blogsScore}</span></div>
                  </div>
                </Card>
              </div>

              {/* CORE SITE-WIDE CHECKLIST */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    Core Site-Wide Checklist
                  </CardTitle>
                  <CardDescription>Fundamental checks required for indexing and compliance.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-4">
                  
                  {/* Robots.txt Check */}
                  <div className={`p-3 border rounded-lg flex flex-col justify-between h-20 ${selectedAudit.globalChecks.robots ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <span className="text-xs font-semibold text-muted-foreground block">robots.txt</span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium">{selectedAudit.globalChecks.robots ? 'Found' : 'Missing'}</span>
                      {selectedAudit.globalChecks.robots ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>

                  {/* Sitemap Check */}
                  <div className={`p-3 border rounded-lg flex flex-col justify-between h-20 ${selectedAudit.globalChecks.sitemap ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <span className="text-xs font-semibold text-muted-foreground block">sitemap.xml</span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium">{selectedAudit.globalChecks.sitemap ? 'Found' : 'Missing'}</span>
                      {selectedAudit.globalChecks.sitemap ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>

                  {/* SSL Check */}
                  <div className={`p-3 border rounded-lg flex flex-col justify-between h-20 ${selectedAudit.globalChecks.ssl ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <span className="text-xs font-semibold text-muted-foreground block">HTTPS / SSL</span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium">{selectedAudit.globalChecks.ssl ? 'Secured' : 'No HTTPS'}</span>
                      {selectedAudit.globalChecks.ssl ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>

                  {/* Viewport Check */}
                  <div className={`p-3 border rounded-lg flex flex-col justify-between h-20 ${selectedAudit.globalChecks.responsive ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <span className="text-xs font-semibold text-muted-foreground block">Mobile Viewport</span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium">{selectedAudit.globalChecks.responsive ? 'Responsive' : 'Missing tag'}</span>
                      {selectedAudit.globalChecks.responsive ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>

                  {/* JSON-LD Schema Check */}
                  <div className={`p-3 border rounded-lg flex flex-col justify-between h-20 ${selectedAudit.globalChecks.schemaFound ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                    <span className="text-xs font-semibold text-muted-foreground block">Schema Markup</span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium">{selectedAudit.globalChecks.schemaFound ? 'JSON-LD OK' : 'No structured JSON'}</span>
                      {selectedAudit.globalChecks.schemaFound ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* INDIVIDUAL PAGE REPORTS */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-foreground">Audited Page Reports</h3>
                  <div className="w-full sm:w-64">
                    <Input
                      placeholder="Filter page reports..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {filteredReports.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground text-sm">No page reports match the filter.</Card>
                ) : (
                  <Accordion type="single" collapsible className="space-y-3">
                    {filteredReports.map((report, idx) => (
                      <AccordionItem key={idx} value={`page-${idx}`} className="bg-card border rounded-lg px-4 py-1.5 shadow-sm">
                        <AccordionTrigger className="hover:no-underline py-2.5">
                          <div className="flex items-center justify-between w-full text-left gap-4 pr-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate max-w-[280px] sm:max-w-md">{report.pageSlug === '/' ? 'Home (/) ' : report.pageSlug}</span>
                                <Badge variant="secondary" className="capitalize text-[10px] py-0 px-1.5 font-normal">
                                  {report.type}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground block font-mono truncate max-w-[320px] sm:max-w-xl mt-1">{report.url}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground/60" /> {report.loadTime}ms
                              </div>
                              <Badge className={`font-bold text-xs h-6 w-9 justify-center ${getScoreColor(report.score)}`}>
                                {report.score}
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-3 border-t border-border/40 pb-4 space-y-4">
                          
                          {/* Errors and Warnings List */}
                          {(report.errors.length > 0 || report.warnings.length > 0) ? (
                            <div className="space-y-2">
                              {report.errors.map((err, i) => (
                                <div key={`err-${i}`} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/5 p-2 rounded border border-red-500/10">
                                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                  <span>{err}</span>
                                </div>
                              ))}
                              {report.warnings.map((warn, i) => (
                                <div key={`warn-${i}`} className="flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/5 p-2 rounded border border-yellow-500/10">
                                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                  <span>{warn}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-500/5 p-2 rounded border border-green-500/10">
                              <Check className="w-4 h-4 shrink-0" />
                              <span>No critical issues found! Great job.</span>
                            </div>
                          )}

                          {/* SEO Tags Meta Details */}
                          {report.details && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border border-border/50 rounded-lg p-3 bg-muted/20">
                              <div className="space-y-2">
                                <div>
                                  <span className="font-semibold text-muted-foreground block">Meta Title:</span>
                                  <span className="font-medium text-foreground">{report.details.metaTitle || <span className="text-red-500">Missing</span>}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-muted-foreground block">Meta Description:</span>
                                  <span className="font-medium text-foreground">{report.details.metaDescription || <span className="text-red-500">Missing</span>}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-muted-foreground block">Canonical URL:</span>
                                  <span className="font-mono text-[11px] text-foreground">{report.details.metaCanonical || <span className="text-yellow-500">Auto-generated</span>}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-semibold text-muted-foreground block">H1 Count:</span>
                                    <Badge variant={report.details.h1Count === 1 ? 'default' : 'destructive'} className="font-mono text-xs">
                                      {report.details.h1Count}
                                    </Badge>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-muted-foreground block">H2 Count:</span>
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {report.details.h2Count}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <span className="font-semibold text-muted-foreground block">Missing Image Alts:</span>
                                  <Badge variant={report.details.imageAltMissingCount === 0 ? 'outline' : 'destructive'} className="font-mono text-xs">
                                    {report.details.imageAltMissingCount}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="font-semibold text-muted-foreground block">Robots Directives:</span>
                                  <span className="font-medium text-foreground font-mono text-[11px]">{report.details.robots || 'Default (index, follow)'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
              
            </div>
          )}
        </div>
      )}
    </div>
  );
}
