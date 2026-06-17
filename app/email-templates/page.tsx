'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, MailTemplate } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { TipTapEditor } from '@/components/tiptap-editor';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  variables: string[];
  is_default?: boolean;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_content: '',
    variables: ''
  });

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/email-templates');
      const json = await res.json();
      if (json.success) {
        setTemplates(json.data);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load templates', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        html_content: template.html_content,
        variables: template.variables ? template.variables.join(', ') : ''
      });
    } else {
      setEditingTemplate(null);
      setFormData({ name: '', subject: '', html_content: '', variables: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.html_content) {
      toast({ title: 'Error', description: 'Name, Subject, and Content are required.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const variablesArray = formData.variables.split(',').map(v => v.trim()).filter(v => v);

    const payload = {
      ...formData,
      variables: variablesArray,
      ...(editingTemplate ? { id: editingTemplate.id } : {})
    };

    try {
      const res = await fetch('/api/email-templates', {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        toast({ title: 'Success', description: editingTemplate ? 'Template updated' : 'Template created' });
        fetchTemplates();
        setIsDialogOpen(false);
      } else {
        throw new Error(json.error || 'Failed to save');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/email-templates?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Success', description: 'Template deleted' });
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        throw new Error(json.error || 'Failed to delete');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
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
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Email Templates</h1>
          <p className="text-muted-foreground">Manage the templates used for sending automated and manual emails.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-1" title={template.name}>{template.name}</CardTitle>
                {template.is_default && <Badge variant="secondary">Default</Badge>}
              </div>
              <CardDescription className="line-clamp-1" title={template.subject}>{template.subject}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-sm text-muted-foreground mb-2">Variables available:</div>
              <div className="flex flex-wrap gap-1">
                {template.variables?.map(v => (
                  <Badge key={v} variant="outline" className="text-xs">{'{{' + v + '}}'}</Badge>
                ))}
                {(!template.variables || template.variables.length === 0) && <span className="text-xs italic">None</span>}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => handleOpenDialog(template)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {!template.is_default && (
                <Button variant="destructive" size="sm" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Welcome Email"
                disabled={editingTemplate?.is_default}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Subject</Label>
              <Input 
                value={formData.subject} 
                onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g. Welcome {{name}}!"
              />
            </div>
            <div className="space-y-2">
              <Label>Available Variables (comma separated)</Label>
              <Input 
                value={formData.variables} 
                onChange={e => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                placeholder="e.g. name, email, link"
              />
              <p className="text-xs text-muted-foreground">Variables will be accessible using {'{{variable_name}}'} inside the subject and content.</p>
            </div>
            <div className="space-y-2">
              <Label>Email Content</Label>
              <Tabs defaultValue="visual" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="visual">Visual Editor</TabsTrigger>
                  <TabsTrigger value="code">HTML Code</TabsTrigger>
                  <TabsTrigger value="preview">Live Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="visual" className="mt-2">
                  <div className="border rounded-md min-h-[300px]">
                    <TipTapEditor
                      content={formData.html_content}
                      onChange={html => setFormData(prev => ({ ...prev, html_content: html }))}
                      placeholder="Start designing your email..."
                      minHeight="300px"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="code" className="mt-2">
                  <Textarea 
                    value={formData.html_content} 
                    onChange={e => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                    placeholder="<html>...</html>"
                    className="min-h-[300px] font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-2 border rounded-md p-4 min-h-[300px] bg-white text-black overflow-auto">
                  <div dangerouslySetInnerHTML={{ __html: formData.html_content || '<p class="text-muted-foreground text-center mt-10">No content</p>' }} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
