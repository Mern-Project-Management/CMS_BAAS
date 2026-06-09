'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RecordsTable } from '@/components/records-table';
import type { Field } from '@/lib/types';

interface CareerLead {
    id: string;
    created_at?: string;
    updated_at?: string;
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
    coverLetter?: string;
    status?: string;
    applied_at?: string;
    cv_url?: string;
}

export default function CareerLeadsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const { toast } = useToast();

    const [fields, setFields] = useState<Field[]>([]);
    const [records, setRecords] = useState<CareerLead[]>([]);
    const [collectionId, setCollectionId] = useState<string>('');
    const [fetching, setFetching] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showSyncDialog, setShowSyncDialog] = useState(false);

    // ── Auth guard ────────────────────────────────────────────────────
    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    // ── Initial load ──────────────────────────────────────────────────
    useEffect(() => {
        if (user) {
            console.log('[page] fetching collections...');
            fetchCollections();
        }
    }, [user]);

    // ── Fetch collections ─────────────────────────────────────────────
    const fetchCollections = useCallback(async () => {
        try {
            const res = await fetch('/api/collections');
            const json = await res.json();
            console.log('[fetchCollections] json:', json);
            if (json.success) {
                const collection = json.data.find((c: any) => c.name === 'career_applications');
                console.log('[fetchCollections] career_applications collection:', collection);
                if (collection) {
                    setCollectionId(collection.id);
                    fetchFields(collection.id);
                    fetchRecords(collection.id);
                } else {
                    setShowSyncDialog(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch collections:', error);
        }
    }, []);

    // ── Fetch fields ──────────────────────────────────────────────────
    const fetchFields = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/fields?collection_id=${id}`);
            const json = await res.json();
            console.log("fetchFields-json", json)
            if (json.success) {
                const fieldList = json.data || [];

                setFields(fieldList);
                console.log("fields", fieldList.length, "fields", fieldList)
            }
        } catch (error) {
            console.error('Failed to fetch fields:', error);
        }
    }, []);

    // ── Fetch records ─────────────────────────────────────────────────
    const fetchRecords = useCallback(async (_id: string) => {
        setFetching(true);
        try {
            const res = await fetch(`/api/career-application`);
            const json = await res.json();
            console.log("fetchRecords-json", json)
            if (json.success) {
                const normalizedRecords = (json.data || []).map((record: any) => {
                    if (typeof record !== 'object' || record === null) return record;
                    const flatRecord: Record<string, any> = {};
                    Object.keys(record).forEach((key) => {
                        const value = record[key];
                        // Convert snake_case to camelCase for field names
                        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                        // If the value is an object with an id property, extract it
                        if (value && typeof value === 'object' && value.id !== undefined) {
                            flatRecord[camelKey] = value.id;
                        } else {
                            flatRecord[camelKey] = value;
                        }
                    });
                    return flatRecord;
                });
                console.log("normalizedRecords", normalizedRecords);
                setRecords(normalizedRecords);
            }
        } catch (error) {
            console.error('Failed to fetch records:', error);
        } finally {
            setFetching(false);
        }
    }, []);

    // ── Refresh ───────────────────────────────────────────────────────
    const refreshData = useCallback(() => {
        if (collectionId) {
            fetchFields(collectionId);
            fetchRecords(collectionId);
        }
    }, [collectionId, fetchFields, fetchRecords]);

    // ── Create collection + fields ────────────────────────────────────
    const handleCreateCollection = useCallback(async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'career_leads',
                    display_name: 'Career Leads',
                    description: 'Collected career applications from the website',
                    icon: 'briefcase',
                    color: 'blue',
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Failed to create collection');

            const newId = json.data.id;
            setCollectionId(newId);
            toast({ title: 'Collection created successfully' });

            // Create fields
            const fieldsToCreate = [
                { name: 'name', display_name: 'Name', field_type: 'Text', is_required: true },
                { name: 'email', display_name: 'Email', field_type: 'Text', is_required: true, is_unique: true },
                { name: 'phone', display_name: 'Phone', field_type: 'Text' },
                { name: 'position', display_name: 'Position Applied', field_type: 'Text', is_required: true },
                { name: 'coverLetter', display_name: 'Cover Letter', field_type: 'Textarea' },
                { name: 'cv_url', display_name: 'Resume/CV', field_type: 'File' },
                {
                    name: 'status', display_name: 'Status', field_type: 'Dropdown',
                    dropdown_options: ['New', 'Under Review', 'Interview', 'Offered', 'Rejected', 'Hired'],
                },
                { name: 'applied_at', display_name: 'Applied At', field_type: 'DateTime' },
            ];

            for (const field of fieldsToCreate) {
                await fetch('/api/fields', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ collection_id: newId, ...field }),
                });
            }

            toast({ title: 'Fields created successfully' });
            fetchFields(newId);
            fetchRecords(newId);
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSyncing(false);
            setShowSyncDialog(false);
        }
    }, [toast, fetchFields, fetchRecords]);

    // ── Loading state ─────────────────────────────────────────────────
    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 sm:py-12 space-y-6 max-w-7xl">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Plus className="w-5 h-5" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Career Leads</h2>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Manage and track all career applications received through your website.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={fetching}
                    className="gap-2 text-muted-foreground"
                >
                    <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                    {fetching ? 'Refreshing...' : 'Refresh'}
                </Button>
            </div>

            {/* Collection missing */}
            {!collectionId && (
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                    <CardHeader>
                        <CardTitle className="text-amber-700 dark:text-amber-400">Collection Not Found</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            The <code>career_applications</code> collection does not exist yet.
                        </p>
                        <Button onClick={handleCreateCollection} disabled={syncing} className="gap-2">
                            {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {syncing ? 'Creating...' : 'Create career_applications Collection'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Records + stats */}
            {collectionId && (
                <>
                    <RecordsTable
                        collectionId={collectionId}
                        fields={fields}
                        records={records}
                        title="Career Applications"
                        hiddenFieldNames={['coverLetter']}
                        onDelete={refreshData}
                        onUpdate={refreshData}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Leads', value: records.length, color: '' },
                            { label: 'New', value: records.filter(r => r.status === 'New' || !r.status).length, color: 'text-blue-600' },
                            { label: 'Under Review', value: records.filter(r => r.status === 'Under Review').length, color: 'text-yellow-600' },
                            { label: 'Hired', value: records.filter(r => r.status === 'Hired').length, color: 'text-green-600' },
                        ].map(({ label, value, color }) => (
                            <Card key={label}>
                                <CardContent className="pt-6">
                                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                                    <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Setup dialog */}
            <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Collection</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-4">
                        <Label>Collection Setup</Label>
                        <p className="text-sm text-muted-foreground">
                            Creates <code>career_applications</code> with fields: name, email, phone, position, cover_letter, status, applied_at.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSyncDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateCollection} disabled={syncing}>
                            {syncing ? 'Creating...' : 'Create Collection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}