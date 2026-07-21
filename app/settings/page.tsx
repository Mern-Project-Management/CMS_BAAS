'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Database, Server, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsData {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  db_uri: string;
  db_name: string;
  next_public_api_url: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<SettingsData>({
    smtp_host: '',
    smtp_port: 465,
    smtp_secure: true,
    smtp_user: '',
    smtp_pass: '',
    db_uri: '',
    db_name: '',
    next_public_api_url: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success && json.data) {
          setFormData({
            smtp_host: json.data.smtp_host || '',
            smtp_port: json.data.smtp_port || 465,
            smtp_secure: json.data.smtp_secure ?? true,
            smtp_user: json.data.smtp_user || '',
            smtp_pass: json.data.smtp_pass || '',
            db_uri: json.data.db_uri || '',
            db_name: json.data.db_name || '',
            next_public_api_url: json.data.next_public_api_url || '',
          });
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, smtp_secure: checked }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      
      if (json.success) {
        toast({ 
          title: 'Settings Saved', 
          description: json.message,
          duration: json.requiresRestart ? 10000 : 3000
        });
      } else {
        throw new Error(json.error || 'Failed to save');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Global Settings</h1>
        <p className="text-muted-foreground">Manage your database connection, environment variables, and email configuration.</p>
      </div>

      {/* Database Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Database Configuration
          </CardTitle>
          <CardDescription>
            Configure your MongoDB connection parameters. Changing these requires a server restart to load the new config.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="db_uri">MongoDB URI</Label>
              <Input 
                id="db_uri"
                name="db_uri"
                value={formData.db_uri}
                onChange={handleChange}
                placeholder="mongodb+srv://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="db_name">MongoDB Database Name</Label>
              <Input 
                id="db_name"
                name="db_name"
                value={formData.db_name}
                onChange={handleChange}
                placeholder="ostech"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Warning: Invalid connection parameters will break access to the database.</p>
        </CardContent>
      </Card>

      {/* Application Endpoint Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Application Configuration
          </CardTitle>
          <CardDescription>
            Configure the public endpoint URL used by Next.js components.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="next_public_api_url">Next Public API URL (NEXT_PUBLIC_API_URL)</Label>
            <Input 
              id="next_public_api_url"
              name="next_public_api_url"
              value={formData.next_public_api_url}
              onChange={handleChange}
              placeholder="http://localhost:3032"
            />
            <p className="text-xs text-muted-foreground mt-1">The base endpoint URL of your API server.</p>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            SMTP Email Configuration
          </CardTitle>
          <CardDescription>
            Set up the mail server used for sending inquiry notifications and other automated emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input 
                id="smtp_host"
                name="smtp_host"
                value={formData.smtp_host}
                onChange={handleChange}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_port">SMTP Port</Label>
              <Input 
                id="smtp_port"
                name="smtp_port"
                type="number"
                value={formData.smtp_port}
                onChange={handleChange}
                placeholder="465"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_user">SMTP User (Email)</Label>
              <Input 
                id="smtp_user"
                name="smtp_user"
                value={formData.smtp_user}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_pass">SMTP Password / App Password</Label>
              <Input 
                id="smtp_pass"
                name="smtp_pass"
                type="password"
                value={formData.smtp_pass}
                onChange={handleChange}
                placeholder="********"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg mt-4">
            <div className="space-y-0.5">
              <Label>Secure Connection (SSL/TLS)</Label>
              <p className="text-sm text-muted-foreground">Use secure connection for SMTP</p>
            </div>
            <Switch 
              checked={formData.smtp_secure}
              onCheckedChange={handleSwitchChange}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
