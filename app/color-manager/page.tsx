'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Save, Undo2, Check, Palette, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// ── Default color palette (matching the frontend) ──────────────────────────
const defaultColors = {
  common: {
    white: '#ffffff',
    black: '#000000',
  },
  heading: {
    primary: '#0c1e21',
  },
  text: {
    body: '#364e52',
    body2: '#a9b8b8',
    body3: '#67787a',
    body4: '#18292c',
    body5: '#ffffffcc',
  },
  theme: {
    primary: '#1e8a8a',
    bg: '#d8e5e5',
    bg2: '#cee0e0',
    bg3: '#202e30',
    dark: '#0c1e21',
    dark2: '#18292c',
    dark3: '#364e52',
    dark4: '#67787a',
    dark5: '#676e7a',
  },
  grey: {
    1: '#ecf0f0',
    2: '#a9b8b8',
    3: '#ffffff1a',
  },
  border: {
    1: '#c9d1d1',
    2: '#313d3d',
    3: '#ffffff26',
    4: '#ffffff33',
    5: '#1e8a8a26',
  },
};

// ── CSS Variable Mappings ──────────────────────────────────────────────────
const cssVariableMap: Record<string, string> = {
  'common-white': '--tj-color-common-white',
  'common-black': '--tj-color-common-black',
  'heading-primary': '--tj-color-heading-primary',
  'text-body': '--tj-color-text-body',
  'text-body-2': '--tj-color-text-body-2',
  'text-body-3': '--tj-color-text-body-3',
  'text-body-4': '--tj-color-text-body-4',
  'text-body-5': '--tj-color-text-body-5',
  'theme-primary': '--tj-color-theme-primary',
  'theme-bg': '--tj-color-theme-bg',
  'theme-bg-2': '--tj-color-theme-bg-2',
  'theme-bg-3': '--tj-color-theme-bg-3',
  'theme-dark': '--tj-color-theme-dark',
  'theme-dark-2': '--tj-color-theme-dark-2',
  'theme-dark-3': '--tj-color-theme-dark-3',
  'theme-dark-4': '--tj-color-theme-dark-4',
  'theme-dark-5': '--tj-color-theme-dark-5',
  'grey-1': '--tj-color-grey-1',
  'grey-2': '--tj-color-grey-2',
  'grey-3': '--tj-color-grey-3',
  'border-1': '--tj-color-border-1',
  'border-2': '--tj-color-border-2',
  'border-3': '--tj-color-border-3',
  'border-4': '--tj-color-border-4',
  'border-5': '--tj-color-border-5',
};

// ── Color Categories ───────────────────────────────────────────────────────
const colorCategories = {
  theme: ['primary', 'bg', 'bg2', 'bg3', 'dark', 'dark2', 'dark3', 'dark4', 'dark5'],
  text: ['body', 'body2', 'body3', 'body4', 'body5'],
  border: ['1', '2', '3', '4', '5'],
  common: ['white', 'black'],
  heading: ['primary'],
  grey: ['1', '2', '3'],
};

const categoryLabels: Record<string, string> = {
  theme: 'Theme Colors',
  text: 'Text Colors',
  border: 'Border Colors',
  common: 'Common Colors',
  heading: 'Heading Colors',
  grey: 'Grey Colors',
};

// ── Component ──────────────────────────────────────────────────────────────
export default function ColorManagerPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [colors, setColors] = useState(defaultColors);
  const [savedColors, setSavedColors] = useState(defaultColors);
  const [activeTab, setActiveTab] = useState('theme');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [dirty, setDirty] = useState(false);

  // ── Load saved colors from API on mount ────────────────────────────────
  useEffect(() => {
    const loadColors = async () => {
      try {
        const response = await fetch('/api/colors');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.colors) {
            setColors(data.data.colors);
            setSavedColors(data.data.colors);
            applyColors(data.data.colors);
            return;
          }
        }
        // Fallback to localStorage if API fails
        const saved = localStorage.getItem('bexon-colors');
        if (saved) {
          const parsed = JSON.parse(saved);
          setColors(parsed);
          setSavedColors(parsed);
          applyColors(parsed);
        }
      } catch (e) {
        console.error('Failed to load colors:', e);
        // Fallback to localStorage
        const saved = localStorage.getItem('bexon-colors');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setColors(parsed);
            setSavedColors(parsed);
            applyColors(parsed);
          } catch (err) {
            console.error('Failed to load saved colors from localStorage:', err);
          }
        }
      }
    };
    loadColors();
  }, []);

  // ── Apply colors to CSS variables ──────────────────────────────────────
  const applyColors = (colorObj: typeof defaultColors) => {
    const root = document.documentElement;
    
    // Common colors
    root.style.setProperty('--tj-color-common-white', colorObj.common.white);
    root.style.setProperty('--tj-color-common-black', colorObj.common.black);
    
    // Heading colors
    root.style.setProperty('--tj-color-heading-primary', colorObj.heading.primary);
    
    // Text colors
    root.style.setProperty('--tj-color-text-body', colorObj.text.body);
    root.style.setProperty('--tj-color-text-body-2', colorObj.text.body2);
    root.style.setProperty('--tj-color-text-body-3', colorObj.text.body3);
    root.style.setProperty('--tj-color-text-body-4', colorObj.text.body4);
    root.style.setProperty('--tj-color-text-body-5', colorObj.text.body5);
    
    // Theme colors
    root.style.setProperty('--tj-color-theme-primary', colorObj.theme.primary);
    root.style.setProperty('--tj-color-theme-bg', colorObj.theme.bg);
    root.style.setProperty('--tj-color-theme-bg-2', colorObj.theme.bg2);
    root.style.setProperty('--tj-color-theme-bg-3', colorObj.theme.bg3);
    root.style.setProperty('--tj-color-theme-dark', colorObj.theme.dark);
    root.style.setProperty('--tj-color-theme-dark-2', colorObj.theme.dark2);
    root.style.setProperty('--tj-color-theme-dark-3', colorObj.theme.dark3);
    root.style.setProperty('--tj-color-theme-dark-4', colorObj.theme.dark4);
    root.style.setProperty('--tj-color-theme-dark-5', colorObj.theme.dark5);
    
    // Grey colors
    root.style.setProperty('--tj-color-grey-1', colorObj.grey[1]);
    root.style.setProperty('--tj-color-grey-2', colorObj.grey[2]);
    root.style.setProperty('--tj-color-grey-3', colorObj.grey[3]);
    
    // Border colors
    root.style.setProperty('--tj-color-border-1', colorObj.border[1]);
    root.style.setProperty('--tj-color-border-2', colorObj.border[2]);
    root.style.setProperty('--tj-color-border-3', colorObj.border[3]);
    root.style.setProperty('--tj-color-border-4', colorObj.border[4]);
    root.style.setProperty('--tj-color-border-5', colorObj.border[5]);
  };

  // ── Update a specific color ────────────────────────────────────────────
  const updateColor = (category: string, key: string, value: string) => {
    setColors((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setDirty(true);
  };

  // ── Save colors to API and localStorage ───────────────────────────────
  const saveColors = async () => {
    try {
      // Save to API (updates SCSS file)
      const response = await fetch('/api/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Also save to localStorage for frontend preview
          localStorage.setItem('bexon-colors', JSON.stringify(colors));
          setSavedColors(colors);
          applyColors(colors);
          setDirty(false);
          toast({
            title: 'Colors saved',
            description: 'Color changes have been saved permanently to the SCSS file.',
          });
          return;
        }
      }

      // Fallback to localStorage if API fails
      localStorage.setItem('bexon-colors', JSON.stringify(colors));
      setSavedColors(colors);
      applyColors(colors);
      setDirty(false);
      toast({
        title: 'Colors saved (fallback)',
        description: 'Changes saved to localStorage (SCSS update failed).',
      });
    } catch (err) {
      console.error('Save error:', err);
      // Fallback to localStorage
      localStorage.setItem('bexon-colors', JSON.stringify(colors));
      setSavedColors(colors);
      applyColors(colors);
      setDirty(false);
      toast({
        title: 'Colors saved (fallback)',
        description: 'Changes saved to localStorage due to API error.',
      });
    }
  };

  // ── Reset to default colors ────────────────────────────────────────────
  const resetColors = async () => {
    try {
      // Reset to defaults
      setColors(defaultColors);
      setSavedColors(defaultColors);
      applyColors(defaultColors);
      
      // Save defaults to API
      const response = await fetch('/api/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors: defaultColors }),
      });

      if (response.ok) {
        localStorage.removeItem('bexon-colors');
        setDirty(false);
        toast({
          title: 'Colors reset',
          description: 'Colors have been reset to default values permanently.',
        });
      } else {
        // Fallback
        localStorage.removeItem('bexon-colors');
        setDirty(false);
        toast({
          title: 'Colors reset (fallback)',
          description: 'Defaults applied (SCSS reset failed).',
        });
      }
    } catch (err) {
      console.error('Reset error:', err);
      localStorage.removeItem('bexon-colors');
      setDirty(false);
      toast({
        title: 'Colors reset (fallback)',
        description: 'Defaults applied due to API error.',
      });
    }
  };

  // ── Auth guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // ── Render ────────────────────────────────────────────────────────────
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Color Manager</h2>
          </div>
          <p className="text-muted-foreground mt-1">
            Customize the website's color scheme. Changes are applied instantly and saved to localStorage.
          </p>
        </div>
        {dirty && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetColors} className="gap-2">
              <Undo2 className="w-4 h-4" />
              Reset
            </Button>
            <Button onClick={saveColors} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-600 dark:text-blue-400">How it works</AlertTitle>
        <AlertDescription className="text-blue-600/80 dark:text-blue-400/80 text-sm mt-1">
          <p className="mb-2">
            This tool allows you to customize the website's color scheme. Changes are applied instantly
            to the frontend via CSS variables and saved permanently to the SCSS file.
          </p>
          <p>
            <strong>Note:</strong> Colors are saved directly to the SCSS file at
            <code className="mx-1 bg-blue-100 dark:bg-blue-900 px-1 rounded">_colors.scss</code>
            making them permanent across all users and sessions.
          </p>
        </AlertDescription>
      </Alert>

      {/* Color Manager Panel */}
      <Card className="border-border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Color Configuration</CardTitle>
          <CardDescription>Adjust colors by category below</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 gap-1 m-4">
              {Object.keys(colorCategories).map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="text-xs sm:text-sm py-2"
                >
                  {categoryLabels[category]}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(colorCategories).map(([category, keys]) => (
              <TabsContent key={category} value={category} className="m-0 p-4">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {keys.map((key) => {
                      const colorValue = colors[category]?.[key] || '#000000';
                      const variableName = `${category}-${key}`.replace(/([A-Z])/g, '-$1').toLowerCase();
                      const cssVar = cssVariableMap[variableName] || `--tj-color-${variableName}`;
                      
                      return (
                        <div
                          key={key}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                        >
                          {/* Color Preview */}
                          <div
                            className="w-12 h-12 rounded-md border-2 border-border shadow-inner shrink-0"
                            style={{ backgroundColor: colorValue }}
                            title={colorValue}
                          />
                          
                          <div className="flex-1 space-y-2 w-full">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                              <span className="text-xs font-mono text-muted-foreground">
                                {cssVar}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Input
                                type="color"
                                value={colorValue}
                                onChange={(e) => updateColor(category, key, e.target.value)}
                                className="w-20 h-10 cursor-pointer p-1"
                              />
                              <Input
                                type="text"
                                value={colorValue}
                                onChange={(e) => updateColor(category, key, e.target.value)}
                                placeholder="#000000"
                                className="flex-1 font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {dirty ? (
              <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            ) : (
              <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                All changes saved
              </span>
            )}
          </div>
          {dirty && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetColors} className="gap-2">
                <Undo2 className="w-4 h-4" />
                Reset
              </Button>
              <Button onClick={saveColors} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* CSS Variables Reference */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">CSS Variables Reference</CardTitle>
          <CardDescription>
            These variables are used throughout the frontend to apply colors dynamically
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="divide-y divide-border">
              {Object.entries(cssVariableMap).map(([key, variable]) => (
                <div key={key} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                  <code className="text-sm font-mono text-primary">{variable}</code>
                  <span className="text-xs text-muted-foreground">{key.replace(/-/g, ' ')}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
