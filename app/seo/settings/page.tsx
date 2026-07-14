'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Globe, Building, FileText, Bot, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Location {
  locationName: string;
  phone: string;
  hours: string;
  address: string;
  city: string;
  zip: string;
}

interface SocialLink {
  platformName: string;
  url: string;
}

interface SeoGlobalData {
  siteName: string;
  siteUrl: string;
  googleAnalyticsId: string;
  searchConsoleVerification: string;
  twitterHandle: string;
  defaultOgImage: string;
  socialLinks: SocialLink[];
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  locations: Location[];
  robotsTxt: string;
  llmTxt: string;
}

export default function SeoSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SeoGlobalData>({
    siteName: '',
    siteUrl: '',
    googleAnalyticsId: '',
    searchConsoleVerification: '',
    twitterHandle: '',
    defaultOgImage: '',
    socialLinks: [],
    businessName: '',
    businessPhone: '',
    businessEmail: '',
    locations: [],
    robotsTxt: '',
    llmTxt: ''
  });

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/seo/settings');
        if (!res.ok) throw new Error('Failed to load SEO settings');
        const json = await res.json();
        if (json.success && json.data) {
          setFormData({
            siteName: json.data.siteName || '',
            siteUrl: json.data.siteUrl || '',
            googleAnalyticsId: json.data.googleAnalyticsId || '',
            searchConsoleVerification: json.data.searchConsoleVerification || '',
            twitterHandle: json.data.twitterHandle || '',
            defaultOgImage: json.data.defaultOgImage || '',
            socialLinks: json.data.socialLinks || [],
            businessName: json.data.businessName || '',
            businessPhone: json.data.businessPhone || '',
            businessEmail: json.data.businessEmail || '',
            locations: json.data.locations || [],
            robotsTxt: json.data.robotsTxt || '',
            llmTxt: json.data.llmTxt || ''
          });
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to load SEO settings', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchSettings();
    }
  }, [user, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Location management helpers
  const handleLocationChange = (index: number, field: keyof Location, value: string) => {
    setFormData(prev => {
      const updated = [...prev.locations];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, locations: updated };
    });
  };

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [
        ...prev.locations,
        { locationName: '', phone: '', hours: '', address: '', city: '', zip: '' }
      ]
    }));
  };

  const removeLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  // Social link helpers
  const handleSocialChange = (index: number, value: string) => {
    setFormData(prev => {
      const updated = [...prev.socialLinks];
      updated[index] = { ...updated[index], url: value };
      return { ...prev, socialLinks: updated };
    });
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platformName: 'LinkedIn', url: '' }]
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const handleSocialPlatformChange = (index: number, value: string) => {
    setFormData(prev => {
      const updated = [...prev.socialLinks];
      updated[index] = { ...updated[index], platformName: value };
      return { ...prev, socialLinks: updated };
    });
  };

  const validateIdentity = (data: SeoGlobalData): string | null => {
    const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
    const twitterRegex = /^@[a-zA-Z0-9_]{1,15}$/;

    if (data.siteUrl && data.siteUrl.trim()) {
      if (!urlRegex.test(data.siteUrl.trim())) {
        return 'Site URL must be a valid URL (starting with http:// or https://).';
      }
    }
    if (data.googleAnalyticsId && data.googleAnalyticsId.trim()) {
      const ga = data.googleAnalyticsId.trim().toUpperCase();
      if (!/^(G-[A-Z0-9]+|UA-\d+-\d+)$/.test(ga)) {
        return 'Google Analytics ID format should be G-XXXXXXXXXX or UA-XXXXXX-X.';
      }
    }
    if (data.twitterHandle && data.twitterHandle.trim()) {
      if (!twitterRegex.test(data.twitterHandle.trim())) {
        return 'Twitter Creator Handle must start with @ and be alphanumeric (max 15 chars).';
      }
    }
    if (data.defaultOgImage && data.defaultOgImage.trim()) {
      if (!urlRegex.test(data.defaultOgImage.trim())) {
        return 'Default Open Graph Image must be a valid URL (starting with http:// or https://).';
      }
    }

    // Social Links
    if (data.socialLinks && Array.isArray(data.socialLinks)) {
      for (let i = 0; i < data.socialLinks.length; i++) {
        const link = data.socialLinks[i];
        const hasPlatform = link.platformName && link.platformName.trim();
        const hasUrl = link.url && link.url.trim();

        if (hasPlatform || hasUrl) {
          if (!hasPlatform) {
            return `Social Profile #${i + 1}: Platform Name is required when URL is provided.`;
          }
          if (!hasUrl) {
            return `Social Profile #${i + 1}: URL is required when Platform Name is provided.`;
          }
          if (!urlRegex.test(link.url.trim())) {
            return `Social Profile #${i + 1}: URL must be a valid URL (starting with http:// or https://).`;
          }
        }
      }
    }
    return null;
  };

  const validateLocalSeo = (data: SeoGlobalData): string | null => {
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

    if (data.businessPhone && data.businessPhone.trim()) {
      if (!phoneRegex.test(data.businessPhone.trim())) {
        return 'Main Contact Phone must be a valid phone number format.';
      }
    }
    if (data.businessEmail && data.businessEmail.trim()) {
      if (!emailRegex.test(data.businessEmail.trim())) {
        return 'Main Inquiry Email must be a valid email format.';
      }
    }

    // Locations
    if (data.locations && Array.isArray(data.locations)) {
      for (let i = 0; i < data.locations.length; i++) {
        const loc = data.locations[i];
        const prefix = `Location #${i + 1}:`;
        const hasAnyField = 
          (loc.locationName && loc.locationName.trim()) ||
          (loc.phone && loc.phone.trim()) ||
          (loc.hours && loc.hours.trim()) ||
          (loc.address && loc.address.trim()) ||
          (loc.city && loc.city.trim()) ||
          (loc.zip && loc.zip.trim());

        if (hasAnyField) {
          if (!loc.locationName || !loc.locationName.trim()) {
            return `${prefix} Location Tag Name is required.`;
          }
          if (loc.phone && loc.phone.trim() && !phoneRegex.test(loc.phone.trim())) {
            return `${prefix} Phone must be a valid phone number format.`;
          }
          if (!loc.address || !loc.address.trim()) {
            return `${prefix} Street Address is required.`;
          }
          if (!loc.city || !loc.city.trim()) {
            return `${prefix} City is required.`;
          }
          if (!loc.zip || !loc.zip.trim()) {
            return `${prefix} Postal Code is required.`;
          }
        }
      }
    }
    return null;
  };

  const saveSection = async (sectionName: string, payload: Partial<SeoGlobalData>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/seo/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: `${sectionName} Settings Saved`, description: `${sectionName} parameters have been updated.` });
      } else {
        throw new Error(json.error || 'Failed to save settings');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIdentity = () => {
    const errorMsg = validateIdentity(formData);
    if (errorMsg) {
      toast({ title: 'Validation Error', description: errorMsg, variant: 'destructive' });
      return;
    }
    const cleanedSocialLinks = formData.socialLinks.filter(
      link => link.platformName.trim() || link.url.trim()
    );
    saveSection('Identity', {
      siteName: formData.siteName,
      siteUrl: formData.siteUrl,
      googleAnalyticsId: formData.googleAnalyticsId,
      searchConsoleVerification: formData.searchConsoleVerification,
      twitterHandle: formData.twitterHandle,
      defaultOgImage: formData.defaultOgImage,
      socialLinks: cleanedSocialLinks
    });
  };

  const handleSaveLocalSeo = () => {
    const errorMsg = validateLocalSeo(formData);
    if (errorMsg) {
      toast({ title: 'Validation Error', description: errorMsg, variant: 'destructive' });
      return;
    }
    const cleanedLocations = formData.locations.filter(
      loc => 
        loc.locationName.trim() ||
        loc.phone.trim() ||
        loc.hours.trim() ||
        loc.address.trim() ||
        loc.city.trim() ||
        loc.zip.trim()
    );
    saveSection('Local SEO', {
      businessName: formData.businessName,
      businessPhone: formData.businessPhone,
      businessEmail: formData.businessEmail,
      locations: cleanedLocations
    });
  };

  const handleSaveRobots = () => {
    saveSection('robots.txt', {
      robotsTxt: formData.robotsTxt
    });
  };

  const handleSaveLlm = () => {
    saveSection('llm.txt', {
      llmTxt: formData.llmTxt
    });
  };


  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">SEO Settings</h1>
          <p className="text-muted-foreground">Manage global search optimization configuration, social connections, robots rules, and AI parameters.</p>
        </div>
      </div>

      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-muted p-1">
          <TabsTrigger value="identity" className="flex items-center gap-2">
            <Globe className="w-4 h-4" /> Identity
          </TabsTrigger>
          <TabsTrigger value="local" className="flex items-center gap-2">
            <Building className="w-4 h-4" /> Local SEO
          </TabsTrigger>
          <TabsTrigger value="robots" className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> robots.txt
          </TabsTrigger>
          <TabsTrigger value="llm" className="flex items-center gap-2">
            <Bot className="w-4 h-4" /> llm.txt
          </TabsTrigger>
        </TabsList>

        {/* IDENTITY TAB */}
        <TabsContent value="identity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Identity & Search Console</CardTitle>
              <CardDescription>Setup metadata headers and tracking codes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input 
                    id="siteName" 
                    name="siteName" 
                    value={formData.siteName} 
                    onChange={handleChange} 
                    placeholder="e.g. Wiretex Ltd." 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input 
                    id="siteUrl" 
                    name="siteUrl" 
                    value={formData.siteUrl} 
                    onChange={handleChange} 
                    placeholder="https://www.example.com" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="googleAnalyticsId">Google Analytics Measurement ID</Label>
                  <Input 
                    id="googleAnalyticsId" 
                    name="googleAnalyticsId" 
                    value={formData.googleAnalyticsId} 
                    onChange={handleChange} 
                    placeholder="G-XXXXXXXXXX" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchConsoleVerification">Google Search Console Verification Token</Label>
                  <Input 
                    id="searchConsoleVerification" 
                    name="searchConsoleVerification" 
                    value={formData.searchConsoleVerification} 
                    onChange={handleChange} 
                    placeholder="google-site-verification-token" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitterHandle">Twitter Creator Handle</Label>
                  <Input 
                    id="twitterHandle" 
                    name="twitterHandle" 
                    value={formData.twitterHandle} 
                    onChange={handleChange} 
                    placeholder="@companyname" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultOgImage">Default Open Graph Image (URL)</Label>
                  <Input 
                    id="defaultOgImage" 
                    name="defaultOgImage" 
                    value={formData.defaultOgImage} 
                    onChange={handleChange} 
                    placeholder="https://example.com/og-banner.jpg" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Social Sharing Profiles</CardTitle>
                <CardDescription>Configure external profiles to boost domain rank authority.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Profile
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.socialLinks.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">No social sharing profiles configured.</div>
              ) : (
                <div className="space-y-3">
                  {formData.socialLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Input
                        value={link.platformName}
                        onChange={(e) => handleSocialPlatformChange(idx, e.target.value)}
                        placeholder="Platform (e.g. LinkedIn)"
                        className="w-1/3"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => handleSocialChange(idx, e.target.value)}
                        placeholder="Profile URL"
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeSocialLink(idx)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveIdentity} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Identity Settings
            </Button>
          </div>
        </TabsContent>

        {/* LOCAL SEO */}
        <TabsContent value="local" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Local Schema Business Profile</CardTitle>
              <CardDescription>Setup schema metadata for Google Maps and local queries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Corporate Name</Label>
                <Input 
                  id="businessName" 
                  name="businessName" 
                  value={formData.businessName} 
                  onChange={handleChange} 
                  placeholder="Official registered name" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Main Contact Phone</Label>
                  <Input 
                    id="businessPhone" 
                    name="businessPhone" 
                    value={formData.businessPhone} 
                    onChange={handleChange} 
                    placeholder="+1 (555) 019-9234" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Main Inquiry Email</Label>
                  <Input 
                    id="businessEmail" 
                    name="businessEmail" 
                    value={formData.businessEmail} 
                    onChange={handleChange} 
                    placeholder="sales@company.com" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Physical Branches & Operating Hours</CardTitle>
                <CardDescription>Google Maps location addresses list.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLocation} className="gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Location
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.locations.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">No business locations configured.</div>
              ) : (
                <div className="space-y-6 divide-y divide-border">
                  {formData.locations.map((loc, idx) => (
                    <div key={idx} className="space-y-4 pt-4 first:pt-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-primary">Location #{idx + 1}</h4>
                        <Button variant="ghost" size="sm" onClick={() => removeLocation(idx)} className="text-destructive h-8 px-2 hover:bg-destructive/10">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Location Tag Name</Label>
                          <Input
                            value={loc.locationName}
                            onChange={(e) => handleLocationChange(idx, 'locationName', e.target.value)}
                            placeholder="e.g. London Office"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Location Phone</Label>
                          <Input
                            value={loc.phone}
                            onChange={(e) => handleLocationChange(idx, 'phone', e.target.value)}
                            placeholder="+44 20 7946 0958"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Operating Hours</Label>
                          <Input
                            value={loc.hours}
                            onChange={(e) => handleLocationChange(idx, 'hours', e.target.value)}
                            placeholder="e.g. 9 AM - 6 PM"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label className="text-xs">Street Address</Label>
                          <Input
                            value={loc.address}
                            onChange={(e) => handleLocationChange(idx, 'address', e.target.value)}
                            placeholder="123 High Street"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">City</Label>
                            <Input
                              value={loc.city}
                              onChange={(e) => handleLocationChange(idx, 'city', e.target.value)}
                              placeholder="London"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Postal Code</Label>
                            <Input
                              value={loc.zip}
                              onChange={(e) => handleLocationChange(idx, 'zip', e.target.value)}
                              placeholder="EC1A 1BB"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveLocalSeo} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Local SEO Settings
            </Button>
          </div>
        </TabsContent>

        {/* ROBOTS.TXT */}
        <TabsContent value="robots">
          <Card>
            <CardHeader>
              <CardTitle>robots.txt Directives</CardTitle>
              <CardDescription>Controls search engine crawling indexing parameters on your pages.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                id="robotsTxt" 
                name="robotsTxt" 
                value={formData.robotsTxt} 
                onChange={handleChange} 
                rows={10} 
                className="font-mono text-sm"
                placeholder="User-agent: *&#10;Disallow: /api/"
              />
            </CardContent>
          </Card>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveRobots} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save robots.txt Directives
            </Button>
          </div>
        </TabsContent>

        {/* LLM.TXT */}
        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <CardTitle>llm.txt Context Directives</CardTitle>
              <CardDescription>Provides specific company context and index directories formatted for AI search agents and LLM indexes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                id="llmTxt" 
                name="llmTxt" 
                value={formData.llmTxt} 
                onChange={handleChange} 
                rows={12} 
                className="font-mono text-sm"
                placeholder="# Company Info&#10;&#10;## About us&#10;..."
              />
            </CardContent>
          </Card>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveLlm} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save llm.txt Directives
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
