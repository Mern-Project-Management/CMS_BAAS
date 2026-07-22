'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmailTemplate {
  id: string;
  name: string;
  variables: string[];
}

export default function SendEmailPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [to, setTo] = useState('');
  const [variableData, setVariableData] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
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
    fetchTemplates();
  }, [toast]);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    setVariableData({}); // Reset variable data when template changes
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariableData(prev => ({ ...prev, [key]: value }));
  };

  const handleSend = async () => {
    const toTrimmed = to.trim();
    if (!toTrimmed) {
      toast({ title: 'Error', description: 'Recipient email address is required.', variant: 'destructive' });
      return;
    }

    if (!selectedTemplateId) {
      toast({ title: 'Error', description: 'Template is required.', variant: 'destructive' });
      return;
    }

    if (toTrimmed.includes(';')) {
      toast({ title: 'Error', description: 'Use commas to separate multiple email addresses.', variant: 'destructive' });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const emails = toTrimmed.split(',').map(e => e.trim()).filter(Boolean);
    
    if (emails.length === 0) {
      toast({ title: 'Error', description: 'Recipient email address is required.', variant: 'destructive' });
      return;
    }

    const invalidEmails = emails.filter(e => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      toast({ title: 'Error', description: 'Invalid email address.', variant: 'destructive' });
      return;
    }

    if (selectedTemplate && selectedTemplate.variables) {
      const missingVariables = selectedTemplate.variables.filter(v => !variableData[v] || !variableData[v].trim());
      if (missingVariables.length > 0) {
        if (missingVariables.length === selectedTemplate.variables.length && selectedTemplate.variables.length > 1) {
           toast({ title: 'Error', description: 'All template variables are required.', variant: 'destructive' });
        } else {
           toast({ title: 'Error', description: `${missingVariables[0]} is required.`, variant: 'destructive' });
        }
        return;
      }
    }

    setSending(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          templateId: selectedTemplateId,
          variableData
        })
      });
      const json = await res.json();
      
      if (json.success) {
        toast({ title: 'Sent', description: json.message });
        setTo('');
        setVariableData({});
        setSelectedTemplateId('');
      } else {
        throw new Error(json.error || 'Failed to send');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Send Email</h1>
        <p className="text-muted-foreground">Send custom emails using your predefined templates.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
          <CardDescription>Select a template and fill in the required variables to send an email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="to">To (Email Addresses)</Label>
            <Input 
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="user1@example.com, user2@example.com"
            />
            <p className="text-xs text-muted-foreground">Separate multiple email addresses with a comma.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Select Template</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
            <div className="space-y-4 pt-4 border-t mt-4">
              <h3 className="text-sm font-semibold">Template Variables</h3>
              {selectedTemplate.variables.map(variable => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={`var-${variable}`}>{variable}</Label>
                  {variable === 'message' || variable === 'html_content' ? (
                    <Textarea 
                      id={`var-${variable}`}
                      value={variableData[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter ${variable}...`}
                    />
                  ) : (
                    <Input 
                      id={`var-${variable}`}
                      value={variableData[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter ${variable}...`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <Button 
            onClick={handleSend} 
            disabled={sending} 
            className="w-full gap-2 mt-4"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
