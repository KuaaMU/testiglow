'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Form } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface ImportRow {
  author_name: string;
  content: string;
  rating: string;
  author_company: string;
}

interface TwitterPreview {
  author_name: string;
  content: string;
  url: string;
}

export default function ImportTestimonialsPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useT();

  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [loadingForms, setLoadingForms] = useState(true);

  // Manual import state
  const [rows, setRows] = useState<ImportRow[]>([
    { author_name: '', content: '', rating: '5', author_company: '' },
  ]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Twitter import state
  const [tweetUrl, setTweetUrl] = useState('');
  const [isFetchingTweet, setIsFetchingTweet] = useState(false);
  const [twitterPreview, setTwitterPreview] = useState<TwitterPreview | null>(null);
  const [twitterError, setTwitterError] = useState<string | null>(null);
  const [isImportingTweet, setIsImportingTweet] = useState(false);

  const fetchForms = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('forms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setForms(data as Form[]);
      if (data.length > 0) {
        setSelectedFormId(data[0].id);
      }
    }
    setLoadingForms(false);
  }, [supabase]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // Manual import handlers
  function addRow() {
    setRows((prev) => [
      ...prev,
      { author_name: '', content: '', rating: '5', author_company: '' },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof ImportRow, value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  async function handleManualImport() {
    if (!selectedFormId) return;

    const validRows = rows.filter(
      (r) => r.author_name.trim() && r.content.trim()
    );
    if (validRows.length === 0) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/testimonials/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: selectedFormId,
          testimonials: validRows.map((r) => ({
            author_name: r.author_name.trim(),
            content: r.content.trim(),
            rating: r.rating ? parseInt(r.rating, 10) : null,
            author_company: r.author_company.trim() || null,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setImportResult(`Successfully imported ${data.count} testimonial(s).`);
        setRows([{ author_name: '', content: '', rating: '5', author_company: '' }]);
      } else {
        const data = await res.json();
        setImportResult(`Error: ${data.error || 'Import failed'}`);
      }
    } catch {
      setImportResult('Error: Network request failed.');
    }
    setIsImporting(false);
  }

  // Twitter import handlers
  async function handleFetchTweet() {
    if (!tweetUrl.trim()) return;

    setIsFetchingTweet(true);
    setTwitterError(null);
    setTwitterPreview(null);

    try {
      const res = await fetch('/api/testimonials/import-twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tweetUrl.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setTwitterPreview(data);
      } else {
        const data = await res.json();
        setTwitterError(data.error || 'Failed to fetch tweet.');
      }
    } catch {
      setTwitterError('Network request failed.');
    }
    setIsFetchingTweet(false);
  }

  async function handleConfirmTwitterImport() {
    if (!twitterPreview || !selectedFormId) return;

    setIsImportingTweet(true);

    try {
      const res = await fetch('/api/testimonials/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: selectedFormId,
          testimonials: [
            {
              author_name: twitterPreview.author_name,
              content: twitterPreview.content,
            },
          ],
        }),
      });

      if (res.ok) {
        setImportResult('Successfully imported tweet as testimonial.');
        setTwitterPreview(null);
        setTweetUrl('');
      } else {
        const data = await res.json();
        setTwitterError(data.error || 'Import failed.');
      }
    } catch {
      setTwitterError('Network request failed.');
    }
    setIsImportingTweet(false);
  }

  if (loadingForms) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/testimonials">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.testimonials.import_title}</h1>
          <p className="text-muted-foreground">
            {t.testimonials.import_desc}
          </p>
        </div>
      </div>

      {/* Form Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>{t.testimonials.select_form}</Label>
            {forms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No forms found. Please{' '}
                <Link href="/forms/new" className="text-indigo-600 underline">
                  create a form
                </Link>{' '}
                first.
              </p>
            ) : (
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger>
                  <SelectValue placeholder={t.testimonials.select_form} />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Result banner */}
      {importResult && (
        <div
          className={`rounded-md border p-3 text-sm ${
            importResult.startsWith('Error')
              ? 'border-red-300 bg-red-50 text-red-800'
              : 'border-green-300 bg-green-50 text-green-800'
          }`}
        >
          {importResult.startsWith('Error') ? null : (
            <CheckCircle2 className="mr-1.5 inline size-4" />
          )}
          {importResult}
        </div>
      )}

      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="manual">{t.testimonials.manual_tab}</TabsTrigger>
          <TabsTrigger value="twitter">{t.testimonials.twitter_tab}</TabsTrigger>
        </TabsList>

        {/* Manual Import Tab */}
        <TabsContent value="manual" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.testimonials.import_title}</CardTitle>
              <CardDescription>
                Fill in the details for each testimonial you want to import. They
                will be automatically approved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-md border p-4"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    {rows.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeRow(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">{t.testimonials.author_name} *</Label>
                      <Input
                        placeholder="John Doe"
                        value={row.author_name}
                        onChange={(e) =>
                          updateRow(index, 'author_name', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t.testimonials.company}</Label>
                      <Input
                        placeholder="Acme Inc."
                        value={row.author_company}
                        onChange={(e) =>
                          updateRow(index, 'author_company', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{t.testimonials.content} *</Label>
                    <Textarea
                      placeholder="Their testimonial content..."
                      value={row.content}
                      onChange={(e) =>
                        updateRow(index, 'content', e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">{t.testimonials.rating}</Label>
                    <Select
                      value={row.rating}
                      onValueChange={(v) => updateRow(index, 'rating', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="1">1 Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addRow} className="w-full gap-1.5">
                <Plus className="size-4" />
                {t.testimonials.add_row}
              </Button>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleManualImport}
                  disabled={
                    isImporting ||
                    !selectedFormId ||
                    rows.every((r) => !r.author_name.trim() || !r.content.trim())
                  }
                >
                  {isImporting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {t.testimonials.import_btn}{' '}
                  {rows.filter((r) => r.author_name.trim() && r.content.trim()).length}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Twitter Import Tab */}
        <TabsContent value="twitter" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.testimonials.twitter_tab}</CardTitle>
              <CardDescription>
                Paste a tweet URL to import it as a testimonial. Uses the public
                oEmbed API — no API key required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://twitter.com/user/status/123..."
                  value={tweetUrl}
                  onChange={(e) => {
                    setTweetUrl(e.target.value);
                    setTwitterError(null);
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleFetchTweet}
                  disabled={!tweetUrl.trim() || isFetchingTweet}
                >
                  {isFetchingTweet ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ExternalLink className="size-4" />
                  )}
                  {t.testimonials.fetch_tweet}
                </Button>
              </div>

              {twitterError && (
                <p className="text-sm text-destructive">{twitterError}</p>
              )}

              {twitterPreview && (
                <div className="space-y-3 rounded-md border p-4">
                  <p className="text-sm font-medium">{t.common.preview}</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{twitterPreview.author_name}</p>
                    <p className="text-sm text-foreground/90">
                      {twitterPreview.content}
                    </p>
                  </div>
                  <Button
                    onClick={handleConfirmTwitterImport}
                    disabled={isImportingTweet || !selectedFormId}
                    size="sm"
                  >
                    {isImportingTweet ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    {t.testimonials.confirm_import}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
