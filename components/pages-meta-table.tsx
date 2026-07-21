'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, Loader2, Pencil, Trash2, CheckCircle2, AlertTriangle, XCircle, Search, Info, ExternalLink, Code, HelpCircle, Plus
} from 'lucide-react';
import type { Field } from '@/lib/types';
import { RecordForm } from '@/components/record-form';

type RecordRow = {
  id: string;
  slug: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  schema?: any;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

type Props = {
  collectionId: string;
  fields: Field[];
  records: RecordRow[];
  onDelete: () => void;
  onUpdate: () => void;
  onAddNewClick: () => void;
};

interface AnalysisReport {
  url: string;
  score: number;
  loadTimeMs: number;
  meta: {
    title: string;
    description: string;
    keywords: string;
    canonical: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    robots: string;
    schemaCount: number;
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  missingAltCount: number;
  checklist: {
    name: string;
    status: 'success' | 'warning' | 'error';
    message: string;
  }[];
}

export function PagesMetaTable({
  collectionId,
  fields,
  records,
  onDelete,
  onUpdate,
  onAddNewClick,
}: Props) {
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // FAQ Management Dialog States
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [selectedFaqSlug, setSelectedFaqSlug] = useState<string | null>(null);
  const [faqList, setFaqList] = useState<any[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [faqFields, setFaqFields] = useState<any[]>([]);
  const [addingFaq, setAddingFaq] = useState(false);

  const fetchFaqsForPage = async (pageName: string) => {
    setLoadingFaqs(true);
    try {
      const res = await fetch(`/api/data/6a477a863042d14bb0be8de2?page=${encodeURIComponent(pageName)}`);
      const json = await res.json();
      if (json.success) {
        setFaqList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch FAQs', err);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const handleOpenFaqs = async (slug: string) => {
    const pageVal = slug.replace(/^\/|\/$/g, "") || "home";
    setSelectedFaqSlug(pageVal);
    setFaqDialogOpen(true);
    setAddingFaq(false);
    fetchFaqsForPage(pageVal);
    
    if (faqFields.length === 0) {
      try {
        const res = await fetch('/api/fields?collection_id=6a477a863042d14bb0be8de2');
        const json = await res.json();
        if (json.success) {
          setFaqFields(json.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch FAQ fields', err);
      }
    }
  };

  // Custom Confirmation Dialog States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDescription, setConfirmDescription] = useState('');

  const triggerDeleteMeta = (id: string) => {
    setPendingDeleteAction(() => () => executeDeleteMeta(id));
    setConfirmTitle('Delete Page Metadata?');
    setConfirmDescription('Are you sure you want to permanently delete this page metadata rule? This action is irreversible.');
    setConfirmOpen(true);
  };

  const triggerDeleteFaq = (faqId: string) => {
    setPendingDeleteAction(() => () => executeDeleteFaq(faqId));
    setConfirmTitle('Delete FAQ?');
    setConfirmDescription('Are you sure you want to permanently delete this FAQ? This action is irreversible.');
    setConfirmOpen(true);
  };

  const executeDeleteFaq = async (faqId: string) => {
    try {
      const res = await fetch(`/api/data/6a477a863042d14bb0be8de2/${faqId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'FAQ deleted successfully' });
        if (selectedFaqSlug) {
          fetchFaqsForPage(selectedFaqSlug);
        }
      } else {
        throw new Error(json.error || 'Failed to delete FAQ');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };
  
  // Edit Dialog States
  const [editRecord, setEditRecord] = useState<RecordRow | null>(null);
  const [editData, setEditData] = useState({
    slug: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    schema: '',
    canonical_link: ''
  });
  const [saving, setSaving] = useState(false);

  // Live Analyzer States
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [analyzingSlug, setAnalyzingSlug] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [cachedScores, setCachedScores] = useState<Record<string, number>>({});

  // Trigger Page Scan
  const handleAnalyze = async (slug: string) => {
    setAnalyzingSlug(slug);
    setLoadingAnalysis(true);
    setAnalyzerOpen(true);
    setAnalysisReport(null);
    
    try {
      const cleanSlug = slug.startsWith('/') ? slug : `/${slug}`;
      const res = await fetch(`/api/seo/analyze?url=${encodeURIComponent(cleanSlug)}`);
      if (!res.ok) throw new Error('Live scan request failed. Make sure the website is running locally.');
      
      const json = await res.json();
      if (json.success && json.data) {
        setAnalysisReport(json.data);
        // Save score to local cache
        setCachedScores(prev => ({ ...prev, [slug]: json.data.score }));
      } else {
        throw new Error(json.error || 'Failed to complete analysis');
      }
    } catch (err: any) {
      toast({
        title: 'Scan Failed',
        description: err.message || 'Could not fetch page details',
        variant: 'destructive'
      });
      setAnalyzerOpen(false);
    } finally {
      setLoadingAnalysis(false);
      setAnalyzingSlug(null);
    }
  };

  // Open Edit Modal
  const openEdit = (record: RecordRow) => {
    setEditRecord(record);
    
    let schemaStr = '';
    if (record.schema) {
      schemaStr = typeof record.schema === 'object' 
        ? JSON.stringify(record.schema, null, 2) 
        : String(record.schema);
    }
    
    setEditData({
      slug: record.slug || '',
      meta_title: record.meta_title || '',
      meta_description: record.meta_description || '',
      keywords: record.keywords || '',
      schema: schemaStr,
      canonical_link: record.canonical_link || ''
    });
  };

  // Save Meta Record
  const handleSave = async () => {
    if (!editRecord) return;
    setSaving(true);
    
    try {
      let parsedSchema = null;
      if (editData.schema.trim()) {
        try {
          parsedSchema = JSON.parse(editData.schema);
        } catch (e) {
          throw new Error('Invalid JSON format in Schema Markup field.');
        }
      }

      const payload = {
        slug: editData.slug,
        meta_title: editData.meta_title,
        meta_description: editData.meta_description,
        keywords: editData.keywords,
        schema: parsedSchema,
        canonical_link: editData.canonical_link
      };

      const res = await fetch(`/api/data/${collectionId}/${editRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Update failed');
      
      toast({ title: 'SEO metadata updated successfully' });
      setEditRecord(null);
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Error Saving Meta', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Record
  const executeDeleteMeta = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/data/${collectionId}/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');
      toast({ title: 'Page SEO rule deleted' });
      onDelete();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter Records
  const filteredRecords = records.filter(r => 
    r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.meta_title && r.meta_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.meta_description && r.meta_description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500 text-emerald-950 dark:text-emerald-300';
    if (score >= 50) return 'bg-amber-500 text-amber-950 dark:text-amber-300';
    return 'bg-rose-500 text-rose-950 dark:text-rose-300';
  };

  const getCheckStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'error': return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Search Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by page path slug, meta title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table list */}
        <Card className="shadow-sm border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[18%]">Page Path (Slug)</TableHead>
                <TableHead className="w-[42%] font-medium">Meta Title & Description</TableHead>
                <TableHead className="w-[12%] text-center">Schema</TableHead>
                <TableHead className="w-[13%] text-center">SEO Score</TableHead>
                <TableHead className="w-[15%] text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                    No page metadata mappings found. Click "Add Page Metadata" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((r) => {
                  const hasSchema = !!r.schema && (
                    typeof r.schema === 'object' 
                      ? Object.keys(r.schema).length > 0 
                      : String(r.schema).trim() !== ''
                  );
                  const cachedScore = cachedScores[r.slug];

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs max-w-[150px] truncate">
                        <span className="text-muted-foreground font-sans font-bold select-none">/</span>
                        {r.slug.replace(/^\//, '') || '(Home)'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm line-clamp-1">{r.meta_title || <span className="text-rose-500 text-xs italic">Missing Title</span>}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{r.meta_description || <span className="text-rose-400 text-xs italic">Missing Description</span>}</p>
                          {r.keywords && (
                            <div className="flex gap-1 flex-wrap pt-0.5">
                              {r.keywords.split(',').slice(0, 3).map((kw, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 border-muted text-muted-foreground">
                                  {kw.trim()}
                                </Badge>
                              ))}
                              {r.keywords.split(',').length > 3 && (
                                <span className="text-[10px] text-muted-foreground self-center">+{r.keywords.split(',').length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {hasSchema ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10 gap-1 font-mono text-[10px]">
                            <Code className="w-3 h-3" /> JSON-LD
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground font-mono text-[10px]">
                            Missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {cachedScore !== undefined ? (
                          <Badge className={`${getScoreColorClass(cachedScore)} font-bold text-xs`}>
                            {cachedScore}/100
                          </Badge>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleAnalyze(r.slug)}
                            className="h-7 text-xs font-semibold px-2 hover:bg-primary/10 text-primary border border-primary/20"
                            title="Run live analyzer scan"
                          >
                            <Play className="w-3 h-3 mr-1 fill-current" /> Scan Page
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleAnalyze(r.slug)} 
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            title="Analyze Live Page"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenFaqs(r.slug)} 
                            className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                            title="Manage FAQs"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEdit(r)} 
                            className="h-8 w-8 hover:text-primary"
                            title="Edit Meta Info"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => triggerDeleteMeta(r.id)} 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            disabled={deletingId === r.id}
                            title="Delete SEO rule"
                          >
                            {deletingId === r.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* ══════════════════════════════════════
          LIVE ANALYZER REPORT DIALOG
      ══════════════════════════════════════ */}
      <Dialog open={analyzerOpen} onOpenChange={setAnalyzerOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Live SEO Analyzer Report</span>
              {analyzingSlug && <Badge variant="secondary" className="font-mono text-xs">{analyzingSlug}</Badge>}
            </DialogTitle>
            <DialogDescription>Scanning dynamic output elements fetched from the website.</DialogDescription>
          </DialogHeader>

          {loadingAnalysis ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Crawling & parsing page structure...</p>
            </div>
          ) : (
            analysisReport && (
              <div className="space-y-6 pt-2">
                {/* Score Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className="w-20 h-20 rounded-full border-4 border-muted flex items-center justify-center">
                      <span className="text-2xl font-black text-foreground">{analysisReport.score}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <h3 className="text-lg font-bold">SEO Audit Score</h3>
                    <p className="text-xs text-muted-foreground">Page loaded in <span className="font-semibold text-foreground">{analysisReport.loadTimeMs}ms</span>. This checklist scans raw and output HTML tags.</p>
                    <Progress value={analysisReport.score} className="h-2 w-full mt-2" />
                  </div>
                </div>

                {/* Checklist tabs */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide border-b pb-1">SEO Checklist & Recommendations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {analysisReport.checklist.map((item, idx) => (
                      <div key={idx} className="flex gap-2.5 p-2 rounded-md border bg-muted/10 text-xs items-start">
                        {getCheckStatusIcon(item.status)}
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-muted-foreground mt-0.5">{item.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inspected Tags Accordion */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide border-b pb-1">Inspected Output Tags</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-muted/20 border rounded-md space-y-1">
                      <p className="font-semibold text-primary/80">Title Tag</p>
                      <p className="font-mono text-foreground break-all">{analysisReport.meta.title || <span className="italic text-rose-500">Missing</span>}</p>
                    </div>

                    <div className="p-3 bg-muted/20 border rounded-md space-y-1">
                      <p className="font-semibold text-primary/80">Meta Description</p>
                      <p className="text-foreground break-all">{analysisReport.meta.description || <span className="italic text-rose-500">Missing</span>}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-3 bg-muted/20 border rounded-md space-y-1">
                        <p className="font-semibold text-primary/80">Headings Structure</p>
                        <p>H1: <span className="font-semibold font-mono">{analysisReport.headings.h1.length}</span> | H2: <span className="font-semibold font-mono">{analysisReport.headings.h2.length}</span> | H3: <span className="font-semibold font-mono">{analysisReport.headings.h3.length}</span></p>
                        {analysisReport.headings.h1.length > 0 && (
                          <p className="text-muted-foreground mt-1 truncate">H1 Title: "{analysisReport.headings.h1[0]}"</p>
                        )}
                      </div>

                      <div className="p-3 bg-muted/20 border rounded-md space-y-1">
                        <p className="font-semibold text-primary/80">Structured Schema</p>
                        <p>Status: <span className="font-semibold">{analysisReport.meta.schemaCount > 0 ? 'Present' : 'Missing'}</span></p>
                        <p className="text-muted-foreground mt-1">Found {analysisReport.meta.schemaCount} application/ld+json blocks.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t pt-4">
                  <Button variant="outline" onClick={() => setAnalyzerOpen(false)}>Close Report</Button>
                </DialogFooter>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════
          EDIT DIALOG MODAL
      ══════════════════════════════════════ */}
      <Dialog open={!!editRecord} onOpenChange={(o) => !o && setEditRecord(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page Metadata</DialogTitle>
            <DialogDescription>Modify the SEO rules for this page slug override.</DialogDescription>
          </DialogHeader>

          {editRecord && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary/70 uppercase tracking-wide">Page Path Slug</label>
                <Input 
                  value={editData.slug} 
                  onChange={(e) => setEditData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="/" 
                />
                <p className="text-[10px] text-muted-foreground">Use <code>/</code> for home, or paths like <code>/about-us</code>.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary/70 uppercase tracking-wide">Meta Title</label>
                <Input 
                  value={editData.meta_title} 
                  onChange={(e) => setEditData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="Optimal title tag" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary/70 uppercase tracking-wide">Meta Description</label>
                <Textarea 
                  value={editData.meta_description} 
                  onChange={(e) => setEditData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Optimal meta description length (70-160 characters)..." 
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary/70 uppercase tracking-wide">Keywords</label>
                <Input 
                  value={editData.keywords} 
                  onChange={(e) => setEditData(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="separated, by, commas" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary/70 uppercase tracking-wide">Canonical Link</label>
                <Input 
                  value={editData.canonical_link} 
                  onChange={(e) => setEditData(prev => ({ ...prev, canonical_link: e.target.value }))}
                  placeholder="https://yourwebsite.com/page-url" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary/70 uppercase tracking-wide">Schema Markup (JSON-LD)</label>
                <Textarea 
                  value={editData.schema} 
                  onChange={(e) => setEditData(prev => ({ ...prev, schema: e.target.value }))}
                  placeholder='{ "@context": "https://schema.org", "@type": "WebPage", ... }' 
                  rows={5}
                  className="font-mono text-xs"
                />
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => setEditRecord(null)} disabled={saving}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save SEO Meta
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════
          FAQ MANAGEMENT DIALOG
      ══════════════════════════════════════ */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <span>Manage FAQs</span>
                {selectedFaqSlug && (
                  <Badge variant="secondary" className="font-mono text-xs bg-primary/10 text-primary">
                    /{selectedFaqSlug}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Add, view, and remove Frequently Asked Questions for this page.
              </DialogDescription>
            </div>
            {!addingFaq && (
              <Button onClick={() => setAddingFaq(true)} size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Add FAQs
              </Button>
            )}
          </DialogHeader>

          {addingFaq ? (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Creating FAQs</h3>
                <Button variant="ghost" size="sm" onClick={() => setAddingFaq(false)}>
                  Back to List
                </Button>
              </div>
              <RecordForm
                collectionId="6a477a863042d14bb0be8de2"
                fields={faqFields}
                defaultValues={{ page: selectedFaqSlug }}
                onCreated={() => {
                  setAddingFaq(false);
                  if (selectedFaqSlug) {
                    fetchFaqsForPage(selectedFaqSlug);
                  }
                }}
              />
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {loadingFaqs ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Loading FAQs...</p>
                </div>
              ) : faqList.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-xl border-muted/50">
                  <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">No FAQs defined for this page yet.</p>
                  <p className="text-xs text-muted-foreground/75 mt-1">Click "Add FAQs" to create the first one.</p>
                  <Button onClick={() => setAddingFaq(true)} size="sm" className="mt-4 gap-1">
                    <Plus className="w-4 h-4" />
                    Create First FAQ
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {faqList.map((faq) => (
                    <div key={faq.id} className="p-4 rounded-xl border bg-card shadow-sm flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <h4 className="font-bold text-sm text-foreground">{faq.question}</h4>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{faq.ans}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => triggerDeleteFaq(faq.id)}
                        className="text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════
          CUSTOM CONFIRMATION DIALOG
      ══════════════════════════════════════ */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="flex flex-col items-center text-center pt-6">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {confirmTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2 px-2">
              {confirmDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setPendingDeleteAction(null);
              }}
              className="flex-1 max-w-[150px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDeleteAction) {
                  pendingDeleteAction();
                }
                setConfirmOpen(false);
                setPendingDeleteAction(null);
              }}
              className="flex-1 max-w-[150px] shadow-sm shadow-destructive/20"
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
