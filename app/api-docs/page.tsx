'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Play, 
  Copy, 
  Check, 
  Loader2, 
  ChevronRight,
  Database,
  FileText,
  Globe,
  Mail,
  Settings,
  Layout,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Collection {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  fieldCount?: number;
}

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  category: string;
  source: 'Admin' | 'Website';
  collection?: string;
  collectionDisplay?: string;
  params?: string[];
  body?: string;
}

// Static non-collection APIs
const STATIC_API_ENDPOINTS: ApiEndpoint[] = [
  // Collections Management
  {
    method: 'GET',
    path: '/api/collections',
    description: 'Get all collections',
    category: 'Collections',
    source: 'Admin',
    params: []
  },
  {
    method: 'POST',
    path: '/api/collections',
    description: 'Create a new collection',
    category: 'Collections',
    source: 'Admin',
    body: '{ name, display_name, description, icon, color }'
  },
  {
    method: 'GET',
    path: '/api/collections/[id]',
    description: 'Get specific collection by ID',
    category: 'Collections',
    source: 'Admin',
    params: ['id']
  },
  {
    method: 'PATCH',
    path: '/api/collections/[id]',
    description: 'Update collection',
    category: 'Collections',
    source: 'Admin',
    params: ['id'],
    body: '{ display_name, description, icon, color, folder_id }'
  },
  {
    method: 'DELETE',
    path: '/api/collections/[id]',
    description: 'Delete collection',
    category: 'Collections',
    source: 'Admin',
    params: ['id']
  },
  // Auth
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'User login',
    category: 'Auth',
    source: 'Admin',
    body: '{ username, password }'
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    description: 'User logout',
    category: 'Auth',
    source: 'Admin'
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    description: 'Get current user info',
    category: 'Auth',
    source: 'Admin'
  },
  {
    method: 'PATCH',
    path: '/api/auth/me',
    description: 'Update user profile',
    category: 'Auth',
    source: 'Admin',
    body: '{ username, email, currentPassword, newPassword }'
  },
  // Dashboard
  {
    method: 'GET',
    path: '/api/dashboard/stats',
    description: 'Get dashboard statistics',
    category: 'Dashboard',
    source: 'Admin'
  },
  // Colors
  {
    method: 'GET',
    path: '/api/colors',
    description: 'Get color configuration',
    category: 'Settings',
    source: 'Admin'
  },
  {
    method: 'POST',
    path: '/api/colors',
    description: 'Update color configuration',
    category: 'Settings',
    source: 'Admin',
    body: '{ theme: { primary, bg, bg3, dark }, text: { body }, heading: { primary } }'
  },
  // Email Templates
  {
    method: 'GET',
    path: '/api/email-templates',
    description: 'Get all email templates',
    category: 'Email',
    source: 'Admin'
  },
  {
    method: 'POST',
    path: '/api/email-templates',
    description: 'Create email template',
    category: 'Email',
    source: 'Admin',
    body: '{ name, subject, body, variables, is_default }'
  },
  {
    method: 'POST',
    path: '/api/send-email',
    description: 'Send email',
    category: 'Email',
    source: 'Admin',
    body: '{ to, subject, templateId, variables }'
  },
  // SEO
  {
    method: 'GET',
    path: '/api/seo/settings',
    description: 'Get SEO settings',
    category: 'SEO',
    source: 'Admin'
  },
  {
    method: 'POST',
    path: '/api/seo/settings',
    description: 'Update SEO settings',
    category: 'SEO',
    source: 'Admin',
    body: '{ meta_title, meta_description, keywords }'
  },
  {
    method: 'GET',
    path: '/api/seo/redirects',
    description: 'Get all redirects',
    category: 'SEO',
    source: 'Admin'
  },
  {
    method: 'POST',
    path: '/api/seo/redirects',
    description: 'Create redirect',
    category: 'SEO',
    source: 'Admin',
    body: '{ source, destination, permanent }'
  },
  {
    method: 'DELETE',
    path: '/api/seo/redirects/[id]',
    description: 'Delete redirect',
    category: 'SEO',
    source: 'Admin',
    params: ['id']
  },
  // Page Components
  {
    method: 'GET',
    path: '/api/page-components',
    description: 'Get all page components',
    category: 'Pages',
    source: 'Admin'
  },
  {
    method: 'POST',
    path: '/api/page-components',
    description: 'Create page component',
    category: 'Pages',
    source: 'Admin',
    body: '{ page, component_type, is_active, order }'
  },
  // Calendar
  {
    method: 'GET',
    path: '/api/calendar',
    description: 'Get all calendar events',
    category: 'Calendar',
    source: 'Admin'
  },
  {
    method: 'POST',
    path: '/api/calendar',
    description: 'Create calendar event',
    category: 'Calendar',
    source: 'Admin',
    body: '{ title, description, start_date, end_date }'
  },
  {
    method: 'GET',
    path: '/api/calendar/[id]',
    description: 'Get specific event',
    category: 'Calendar',
    source: 'Admin',
    params: ['id']
  },
  // Global Presence
  {
    method: 'GET',
    path: '/api/global-presence',
    description: 'Get global presence data',
    category: 'Global',
    source: 'Admin'
  },
  {
    method: 'POST',
    path: '/api/global-presence',
    description: 'Create global presence entry',
    category: 'Global',
    source: 'Admin',
    body: '{ country, city, address, phone, email }'
  },
  // Settings
  {
    method: 'GET',
    path: '/api/settings',
    description: 'Get global settings',
    category: 'Settings',
    source: 'Admin'
  },
  {
    method: 'POST',
    path: '/api/settings',
    description: 'Update global settings',
    category: 'Settings',
    source: 'Admin',
    body: '{ site_name, site_url, contact_email }'
  },
  // Fields
  {
    method: 'GET',
    path: '/api/fields',
    description: 'Get all fields',
    category: 'Fields',
    source: 'Admin'
  },
  {
    method: 'POST',
    path: '/api/fields',
    description: 'Create field',
    category: 'Fields',
    source: 'Admin',
    body: '{ collection_id, name, field_type, options }'
  },
  {
    method: 'GET',
    path: '/api/fields/[id]',
    description: 'Get specific field',
    category: 'Fields',
    source: 'Admin',
    params: ['id']
  },
  // Upload
  {
    method: 'POST',
    path: '/api/upload',
    description: 'Upload file',
    category: 'Upload',
    source: 'Admin',
    body: 'FormData with file'
  },

  // ==================== WEBSITE SIDE APIs ====================
  // Contact
  {
    method: 'POST',
    path: '/api/contact',
    description: 'Submit contact form (Website)',
    category: 'Forms',
    source: 'Website',
    body: '{ name, email, phone, message }'
  },
  // Career Application
  {
    method: 'POST',
    path: '/api/career-application',
    description: 'Submit career application (Website)',
    category: 'Forms',
    source: 'Website',
    body: 'FormData with name, email, position, cv_file'
  },
  // Colors
  {
    method: 'GET',
    path: '/api/colors',
    description: 'Get color configuration (Website)',
    category: 'Settings',
    source: 'Website'
  },
  // Heading
  {
    method: 'GET',
    path: '/api/heading',
    description: 'Get heading data by section (Website)',
    category: 'Content',
    source: 'Website',
    body: '?section=section_name'
  },
];

// Generate collection-based APIs dynamically
function generateCollectionAPIs(collections: Collection[]): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];

  collections.forEach(collection => {
    const collectionName = collection.name;
    const collectionId = collection.id;
    const displayName = collection.display_name;

    // GET all records
    endpoints.push({
      method: 'GET',
      path: `/api/data/${collectionName}`,
      description: `Get all ${displayName} records`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      body: '?limit=100&offset=0&fields=field1,field2'
    });

    // GET by ID
    endpoints.push({
      method: 'GET',
      path: `/api/data/${collectionName}?id=[recordId]`,
      description: `Get ${displayName} record by ID`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      params: ['recordId']
    });

    // GET by slug (if collection has slug field)
    endpoints.push({
      method: 'GET',
      path: `/api/data/${collectionName}?slug=[slug]`,
      description: `Get ${displayName} record by slug`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      params: ['slug']
    });

    // GET with specific fields
    endpoints.push({
      method: 'GET',
      path: `/api/data/${collectionName}?fields=field1,field2`,
      description: `Get ${displayName} with specific fields`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      body: '?fields=field1,field2,field3'
    });

    // GET with pagination
    endpoints.push({
      method: 'GET',
      path: `/api/data/${collectionName}?limit=10&offset=0`,
      description: `Get ${displayName} with pagination`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      body: '?limit=10&offset=0'
    });

    // GET with filters
    endpoints.push({
      method: 'GET',
      path: `/api/data/${collectionName}?field=value`,
      description: `Get ${displayName} with filters`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      body: '?field1=value1&field2=value2'
    });

    // POST create record
    endpoints.push({
      method: 'POST',
      path: `/api/data/${collectionName}`,
      description: `Create ${displayName} record`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      body: '{ field1: value1, field2: value2, ... }'
    });

    // PATCH update record
    endpoints.push({
      method: 'PATCH',
      path: `/api/data/${collectionName}?id=[recordId]`,
      description: `Update ${displayName} record`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      params: ['recordId'],
      body: '{ field1: newValue, field2: newValue2 }'
    });

    // DELETE record
    endpoints.push({
      method: 'DELETE',
      path: `/api/data/${collectionName}?id=[recordId]`,
      description: `Delete ${displayName} record`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      params: ['recordId']
    });

    // GET by collection ID (alternative)
    endpoints.push({
      method: 'GET',
      path: `/api/data/${collectionId}`,
      description: `Get ${displayName} by collection ID`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      body: '?limit=100&offset=0'
    });

    // POST by collection ID
    endpoints.push({
      method: 'POST',
      path: `/api/data/${collectionId}`,
      description: `Create ${displayName} by collection ID`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      body: '{ field1: value1, field2: value2 }'
    });

    // PATCH by collection ID
    endpoints.push({
      method: 'PATCH',
      path: `/api/data/${collectionId}?id=[recordId]`,
      description: `Update ${displayName} by collection ID`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      params: ['recordId'],
      body: '{ field1: newValue }'
    });

    // DELETE by collection ID
    endpoints.push({
      method: 'DELETE',
      path: `/api/data/${collectionId}?id=[recordId]`,
      description: `Delete ${displayName} by collection ID`,
      category: 'Collections',
      source: 'Admin',
      collection: collectionName,
      collectionDisplay: displayName,
      params: ['recordId']
    });

    // Website proxy endpoints for common collections
    if (['blog', 'catalogue', 'categories', 'footer', 'resources', 'service', 'contactus'].includes(collectionName)) {
      endpoints.push({
        method: 'GET',
        path: `/api/data/${collectionName}`,
        description: `Get ${displayName} (Website proxy)`,
        category: 'Collections',
        source: 'Website',
        collection: collectionName,
        collectionDisplay: displayName,
        body: '?slug=optional'
      });
    }

    // Specialized blog endpoints
    if (collectionName === 'blog') {
      endpoints.push({
        method: 'GET',
        path: `/api/blogs/[slug]`,
        description: `Get ${displayName} by slug (Website)`,
        category: 'Collections',
        source: 'Website',
        collection: collectionName,
        collectionDisplay: displayName,
        params: ['slug']
      });
      endpoints.push({
        method: 'GET',
        path: `/api/blogs/recent/[slug]`,
        description: `Get recent ${displayName} posts (Website)`,
        category: 'Collections',
        source: 'Website',
        collection: collectionName,
        collectionDisplay: displayName,
        params: ['slug']
      });
    }

    // Specialized product endpoints
    if (collectionName === 'our_products') {
      endpoints.push({
        method: 'GET',
        path: `/api/products/[slug]`,
        description: `Get ${displayName} by slug`,
        category: 'Collections',
        source: 'Admin',
        collection: collectionName,
        collectionDisplay: displayName,
        params: ['slug']
      });
    }
  });

  return endpoints;
}

const METHOD_COLORS = {
  GET: 'bg-green-500/10 text-green-600 border-green-500/20',
  POST: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  PATCH: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const SOURCE_COLORS = {
  Admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Website: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Collections: <Database className="w-4 h-4" />,
  Data: <FileText className="w-4 h-4" />,
  Products: <Layout className="w-4 h-4" />,
  Blogs: <FileText className="w-4 h-4" />,
  Auth: <Settings className="w-4 h-4" />,
  Dashboard: <Layout className="w-4 h-4" />,
  Settings: <Settings className="w-4 h-4" />,
  Forms: <Mail className="w-4 h-4" />,
  Email: <Mail className="w-4 h-4" />,
  SEO: <Globe className="w-4 h-4" />,
  Pages: <Layout className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
  Global: <Globe className="w-4 h-4" />,
  Fields: <FileText className="w-4 h-4" />,
  Upload: <FileText className="w-4 h-4" />,
};

export default function ApiDocsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSource, setSelectedSource] = useState<'All' | 'Admin' | 'Website'>('All');
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [requestParams, setRequestParams] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && (user.role as string) !== 'superadmin') {
      router.push('/dashboard');
      toast({
        title: 'Access Denied',
        description: 'API Documentation is only accessible to super admins',
        variant: 'destructive',
      });
    }
  }, [user, authLoading, router, toast]);

  // Fetch collections and generate APIs
  useEffect(() => {
    if (!user) return;

    const fetchCollections = async () => {
      try {
        setCollectionsLoading(true);
        const res = await fetch('/api/collections');
        const json = await res.json();
        
        if (json.success && json.data) {
          setCollections(json.data);
          
          // Generate collection-based APIs
          const collectionAPIs = generateCollectionAPIs(json.data);
          
          // Combine static and collection APIs
          const allAPIs = [...STATIC_API_ENDPOINTS, ...collectionAPIs];
          setApiEndpoints(allAPIs);
        }
      } catch (error) {
        console.error('Failed to fetch collections:', error);
        // Use static APIs only if fetch fails
        setApiEndpoints(STATIC_API_ENDPOINTS);
      } finally {
        setCollectionsLoading(false);
      }
    };

    fetchCollections();
  }, [user]);

  // Reset dependent filters when parent filter changes
  useEffect(() => {
    if (selectedSource !== 'All' && apiEndpoints.length > 0) {
      // Check if current category is still valid
      const categoryStillValid = apiEndpoints.some((e: ApiEndpoint) => 
        e.category === selectedCategory && (selectedSource === 'All' || e.source === selectedSource)
      );
      if (!categoryStillValid) {
        setSelectedCategory('All');
      }
    }
  }, [selectedSource, apiEndpoints, selectedCategory]);

  useEffect(() => {
    if ((selectedCategory !== 'All' || selectedSource !== 'All') && apiEndpoints.length > 0) {
      // Check if current collection is still valid
      const collectionStillValid = apiEndpoints.some((e: ApiEndpoint) => 
        e.collection === selectedCollection &&
        (selectedSource === 'All' || e.source === selectedSource) &&
        (selectedCategory === 'All' || e.category === selectedCategory)
      );
      if (!collectionStillValid) {
        setSelectedCollection('All');
      }
    }
  }, [selectedCategory, selectedSource, apiEndpoints, selectedCollection]);

  // Calculate available categories based on selected source
  const availableCategories = ['All', ...Array.from(new Set(
    apiEndpoints
      .filter((e: ApiEndpoint) => selectedSource === 'All' || e.source === selectedSource)
      .map((e: ApiEndpoint) => e.category)
  ))];

  // Calculate available collections based on selected source and category
  const availableCollections = collections.filter((c: Collection) => {
    const hasAPIs = apiEndpoints.some((e: ApiEndpoint) => 
      e.collection === c.name &&
      (selectedSource === 'All' || e.source === selectedSource) &&
      (selectedCategory === 'All' || e.category === selectedCategory)
    );
    return hasAPIs;
  });

  const availableCollectionNames = ['All', ...availableCollections.map((c: Collection) => c.name)];
  
  // Get API count per collection based on current filters
  const getCollectionAPICount = (collectionName: string) => {
    return apiEndpoints.filter((e: ApiEndpoint) => 
      e.collection === collectionName &&
      (selectedSource === 'All' || e.source === selectedSource) &&
      (selectedCategory === 'All' || e.category === selectedCategory)
    ).length;
  };
  
  const filteredEndpoints = apiEndpoints.filter((endpoint: ApiEndpoint) => {
    const matchesCategory = selectedCategory === 'All' || endpoint.category === selectedCategory;
    const matchesSource = selectedSource === 'All' || endpoint.source === selectedSource;
    const matchesCollection = selectedCollection === 'All' || endpoint.collection === selectedCollection;
    const matchesSearch = searchQuery === '' || 
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSource && matchesCollection && matchesSearch;
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const handleTestApi = async () => {
    if (!selectedEndpoint) return;

    setLoading(true);
    setResponse(null);

    try {
      let url = selectedEndpoint.path;
      
      // Replace path parameters
      if (selectedEndpoint.params) {
        selectedEndpoint.params.forEach(param => {
          const value = requestParams[param];
          if (value) {
            url = url.replace(`[${param}]`, value);
          }
        });
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (selectedEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const data = await res.json();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      });

      toast({
        title: 'API Call Completed',
        description: `${selectedEndpoint.method} ${url} - ${res.status}`,
      });
    } catch (error: any) {
      setResponse({
        error: error.message,
      });
      toast({
        title: 'API Call Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  const generateCurlCommand = () => {
    if (!selectedEndpoint) return '';
    
    let curl = `curl -X ${selectedEndpoint.method}`;
    
    let url = selectedEndpoint.path;
    if (selectedEndpoint.params) {
      selectedEndpoint.params.forEach(param => {
        const value = requestParams[param] || `[${param}]`;
        url = url.replace(`[${param}]`, value);
      });
    }
    curl += ` "${url}"`;
    
    if (selectedEndpoint.method !== 'GET' && requestBody) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody}'`;
    }
    
    return curl;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">API Documentation</h2>
          <p className="text-base text-muted-foreground mt-1 max-w-xl">
            Test and explore all available API endpoints from both Admin and Website sources.
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Source Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedSource === 'All' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSource('All')}
          >
            All Sources
          </Button>
          <Button
            variant={selectedSource === 'Admin' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSource('Admin')}
            className="gap-2"
          >
            <Database className="w-4 h-4" />
            Admin APIs
          </Button>
          <Button
            variant={selectedSource === 'Website' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSource('Website')}
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            Website APIs
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {availableCategories.map((category: string) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="gap-2"
            >
              {CATEGORY_ICONS[category]}
              {category}
            </Button>
          ))}
        </div>

        {/* Collection Filter */}
        {!collectionsLoading && availableCollectionNames.length > 1 && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm font-semibold text-muted-foreground">Filter by Collection:</span>
            {availableCollectionNames.map((collectionName: string) => (
              <Button
                key={collectionName}
                variant={selectedCollection === collectionName ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCollection(collectionName)}
                className="gap-2"
              >
                {collectionName === 'All' ? (
                  'All Collections'
                ) : (
                  <>
                    {collectionName}
                    <Badge variant="secondary" className="ml-1">
                      {getCollectionAPICount(collectionName)}
                    </Badge>
                  </>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API List */}
        <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredEndpoints.map((endpoint: ApiEndpoint, index: number) => (
            <Card
              key={index}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                selectedEndpoint === endpoint ? 'ring-2 ring-primary' : ''
              )}
              onClick={() => {
                setSelectedEndpoint(endpoint);
                setRequestParams({});
                setRequestBody(endpoint.body || '');
                setResponse(null);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className={METHOD_COLORS[endpoint.method as keyof typeof METHOD_COLORS]}>
                    {endpoint.method}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {endpoint.category}
                  </Badge>
                  <Badge className={cn(SOURCE_COLORS[endpoint.source as keyof typeof SOURCE_COLORS], 'text-xs')}>
                    {endpoint.source}
                  </Badge>
                  {endpoint.collectionDisplay && (
                    <Badge variant="outline" className="text-xs">
                      {endpoint.collectionDisplay}
                    </Badge>
                  )}
                </div>
                <code className="text-sm font-mono text-foreground block mb-2">
                  {endpoint.path}
                </code>
                <p className="text-xs text-muted-foreground">{endpoint.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Tester */}
        <div className="lg:col-span-2">
          {selectedEndpoint ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className={METHOD_COLORS[selectedEndpoint.method]}>
                        {selectedEndpoint.method}
                      </Badge>
                      {selectedEndpoint.path}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {selectedEndpoint.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generateCurlCommand())}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    Copy cURL
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Parameters */}
                {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                  <div className="space-y-3">
                    <Label>Path Parameters</Label>
                    {selectedEndpoint.params.map(param => (
                      <div key={param} className="space-y-1">
                        <Label htmlFor={param} className="text-sm">{param}</Label>
                        <Input
                          id={param}
                          placeholder={`Enter ${param}`}
                          value={requestParams[param] || ''}
                          onChange={(e) => setRequestParams(prev => ({
                            ...prev,
                            [param]: e.target.value
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Request Body */}
                {selectedEndpoint.body && (
                  <div className="space-y-3">
                    <Label>Request Body (JSON)</Label>
                    <textarea
                      className="w-full min-h-[150px] p-3 rounded-md border border-border bg-secondary/20 font-mono text-sm"
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder={selectedEndpoint.body}
                    />
                  </div>
                )}

                {/* Test Button */}
                <Button
                  onClick={handleTestApi}
                  disabled={loading}
                  className="w-full gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Test API
                    </>
                  )}
                </Button>

                {/* Response */}
                {response && (
                  <div className="space-y-3">
                    <Label>Response</Label>
                    <div className="rounded-md border border-border bg-secondary/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}
                        >
                          {response.status} {response.statusText}
                        </Badge>
                      </div>
                      <pre className="text-sm font-mono overflow-x-auto">
                        {JSON.stringify(response.data || response.error, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-24">
                <div className="text-center">
                  <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select an API endpoint to test</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
