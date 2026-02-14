'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Form, Testimonial } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  Trash2Icon,
  SearchIcon,
  Loader2Icon,
  MessageSquareIcon,
  ImportIcon,
  ShareIcon,
  DownloadIcon,
  VideoIcon,
  CheckCheck,
  XIcon,
} from 'lucide-react';
import { SocialCardDialog } from '@/components/dashboard/social-card-dialog';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n/context';

const PAGE_SIZE = 12;

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function TestimonialsPage() {
  const t = useT();
  const supabase = createClient();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  // Social card state
  const [shareTarget, setShareTarget] = useState<Testimonial | null>(null);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');

  // Form filter state
  const [forms, setForms] = useState<Form[]>([]);
  const [formFilter, setFormFilter] = useState<string>('all');

  // Bulk action state
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchTestimonials = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      let query = supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (formFilter !== 'all') {
        query = query.eq('form_id', formFilter);
      }

      if (search.trim()) {
        query = query.or(
          `content.ilike.%${search.trim()}%,author_name.ilike.%${search.trim()}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching testimonials:', error);
      } else {
        const results = data as Testimonial[];
        if (append) {
          setTestimonials((prev) => [...prev, ...results]);
        } else {
          setTestimonials(results);
        }
        setHasMore(results.length === PAGE_SIZE);
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [supabase, statusFilter, formFilter, search]
  );

  // Fetch user plan and forms on mount
  useEffect(() => {
    async function fetchMeta() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, formsRes] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
        supabase.from('forms').select('id, name').eq('user_id', user.id).order('name'),
      ]);

      if (profileRes.data) {
        setPlan(profileRes.data.plan as 'free' | 'pro');
      }
      if (formsRes.data) {
        setForms(formsRes.data as Form[]);
      }
    }
    fetchMeta();
  }, [supabase]);

  useEffect(() => {
    setPage(0);
    fetchTestimonials(0);
  }, [fetchTestimonials]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTestimonials(nextPage, true);
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    const { error } = await supabase
      .from('testimonials')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
      toast.success(`Testimonial ${status}.`);
    } else {
      toast.error('Failed to update status.');
    }
    setActionLoading((prev) => ({ ...prev, [id]: false }));
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    setActionLoading((prev) => ({ ...prev, [`feat-${id}`]: true }));
    const { error } = await supabase
      .from('testimonials')
      .update({ is_featured: !current })
      .eq('id', id);

    if (!error) {
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_featured: !current } : t))
      );
      toast.success(!current ? 'Marked as featured.' : 'Removed from featured.');
    } else {
      toast.error('Failed to update.');
    }
    setActionLoading((prev) => ({ ...prev, [`feat-${id}`]: false }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading((prev) => ({ ...prev, [`del-${deleteTarget.id}`]: true }));
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', deleteTarget.id);

    if (!error) {
      setTestimonials((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success('Testimonial deleted.');
    } else {
      toast.error('Failed to delete testimonial.');
    }
    setActionLoading((prev) => ({ ...prev, [`del-${deleteTarget.id}`]: false }));
    setDeleteTarget(null);
  };

  const handleSummarize = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [`ai-${id}`]: true }));
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testimonial_id: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummaries((prev) => ({ ...prev, [id]: data.summary }));
        setTestimonials((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, ai_summary: data.summary, ai_tags: data.tags ?? t.ai_tags }
              : t
          )
        );
        toast.success('AI summary generated.');
      } else {
        toast.error('AI summarize failed.');
      }
    } catch (err) {
      console.error('Summarize failed:', err);
      toast.error('AI summarize failed.');
    }
    setActionLoading((prev) => ({ ...prev, [`ai-${id}`]: false }));
  };

  const getFormName = (formId: string) => {
    const f = forms.find((form) => form.id === formId);
    return f?.name || '';
  };

  const pendingTestimonials = testimonials.filter((t) => t.status === 'pending');

  const handleBulkApprove = async () => {
    const ids = pendingTestimonials.map((t) => t.id);
    if (ids.length === 0) return;
    setBulkLoading(true);
    const { error } = await supabase
      .from('testimonials')
      .update({ status: 'approved' })
      .in('id', ids);

    if (!error) {
      setTestimonials((prev) =>
        prev.map((t) => (ids.includes(t.id) ? { ...t, status: 'approved' as const } : t))
      );
      toast.success(`${ids.length} testimonial${ids.length > 1 ? 's' : ''} approved.`);
    } else {
      toast.error('Bulk approve failed.');
    }
    setBulkLoading(false);
  };

  const handleBulkReject = async () => {
    const ids = pendingTestimonials.map((t) => t.id);
    if (ids.length === 0) return;
    setBulkLoading(true);
    const { error } = await supabase
      .from('testimonials')
      .update({ status: 'rejected' })
      .in('id', ids);

    if (!error) {
      setTestimonials((prev) =>
        prev.map((t) => (ids.includes(t.id) ? { ...t, status: 'rejected' as const } : t))
      );
      toast.success(`${ids.length} testimonial${ids.length > 1 ? 's' : ''} rejected.`);
    } else {
      toast.error('Bulk reject failed.');
    }
    setBulkLoading(false);
  };

  const statusBadge = (status: Testimonial['status']) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: {
        label: t.common.pending,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      },
      approved: {
        label: t.common.approved,
        className: 'bg-green-100 text-green-800 border-green-300',
      },
      rejected: {
        label: t.common.rejected,
        className: 'bg-red-100 text-red-800 border-red-300',
      },
    };
    const s = map[status];
    return (
      <Badge variant="outline" className={s.className}>
        {s.label}
      </Badge>
    );
  };

  const renderStars = (rating: number | null) => {
    if (rating === null) return null;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            className={`size-4 ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderTestimonialCard = (item: Testimonial) => {
    const initial = item.author_name?.charAt(0)?.toUpperCase() || '?';
    const isLoading = actionLoading[item.id] || false;
    const displaySummary = summaries[item.id] || item.ai_summary;
    const formName = getFormName(item.form_id);

    return (
      <Card key={item.id} className="relative">
        <CardContent className="space-y-3">
          {/* Header: Avatar, Name, Company, Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initial}
              </div>
              <div>
                <p className="font-medium leading-tight">{item.author_name}</p>
                {item.author_company && (
                  <p className="text-sm text-muted-foreground">
                    {item.author_company}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleFeatured(item.id, item.is_featured)}
                disabled={!!actionLoading[`feat-${item.id}`]}
                className="transition-colors hover:text-yellow-500"
                title={t.common.featured}
              >
                <StarIcon
                  className={`size-5 ${
                    item.is_featured
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/40'
                  }`}
                />
              </button>
              {statusBadge(item.status)}
            </div>
          </div>

          {/* Form badge */}
          {formName && formFilter === 'all' && (
            <Badge variant="secondary" className="text-xs">
              {formName}
            </Badge>
          )}

          {/* Rating */}
          {renderStars(item.rating)}

          {/* Content */}
          <p className="text-sm leading-relaxed text-foreground/90">
            {item.content.length > 250
              ? `${item.content.slice(0, 250)}...`
              : item.content}
          </p>

          {/* Video */}
          {item.video_url && (
            <a
              href={item.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              <VideoIcon className="size-3.5" />
              {t.testimonials.video_testimonial}
            </a>
          )}

          {/* AI Summary */}
          {displaySummary && (
            <div className="rounded-md border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/30">
              <p className="mb-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                {t.testimonials.ai_summary}
              </p>
              <p className="text-sm text-purple-900 dark:text-purple-100">
                {displaySummary}
              </p>
            </div>
          )}

          {/* AI Tags */}
          {item.ai_tags && item.ai_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.ai_tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Date */}
          <p className="text-xs text-muted-foreground">
            {formatDate(item.created_at)}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            {(item.status === 'pending' || item.status === 'rejected') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus(item.id, 'approved')}
                disabled={isLoading}
                className="gap-1.5 text-green-700 hover:bg-green-50 hover:text-green-800"
              >
                <CheckCircleIcon className="size-3.5" />
                {t.common.approve}
              </Button>
            )}
            {(item.status === 'pending' || item.status === 'approved') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus(item.id, 'rejected')}
                disabled={isLoading}
                className="gap-1.5 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <XCircleIcon className="size-3.5" />
                {t.common.reject}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSummarize(item.id)}
              disabled={!!actionLoading[`ai-${item.id}`]}
              className="gap-1.5"
            >
              {actionLoading[`ai-${item.id}`] ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SparklesIcon className="size-3.5" />
              )}
              {t.testimonials.ai_summarize}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShareTarget(item)}
              className="gap-1.5"
            >
              <ShareIcon className="size-3.5" />
              {t.testimonials.share}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteTarget(item)}
              disabled={!!actionLoading[`del-${item.id}`]}
              className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2Icon className="size-3.5" />
              {t.common.delete}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.testimonials.title}</h1>
          <p className="text-muted-foreground">
            {t.testimonials.desc}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/testimonials/import">
              <ImportIcon className="size-4" />
              {t.common.import}
            </Link>
          </Button>
          {plan === 'pro' && (
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={async () => {
                const params = new URLSearchParams();
                if (formFilter !== 'all') params.set('form_id', formFilter);
                if (statusFilter !== 'all') params.set('status', statusFilter);
                const qs = params.toString();
                const res = await fetch(`/api/testimonials/export${qs ? `?${qs}` : ''}`);
                if (res.ok) {
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `testimonials-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('CSV exported.');
                } else {
                  toast.error('Export failed.');
                }
              }}
            >
              <DownloadIcon className="size-4" />
              {t.testimonials.export_csv}
            </Button>
          )}
        </div>
      </div>

      {/* Filters row: Search + Form filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.testimonials.search_placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {forms.length > 1 && (
          <Select value={formFilter} onValueChange={setFormFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t.testimonials.all_forms} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.testimonials.all_forms}</SelectItem>
              {forms.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Bulk Actions */}
      {pendingTestimonials.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="flex-1 text-sm text-yellow-800">
            <span className="font-medium">{pendingTestimonials.length}</span> {t.testimonials.pending_banner_2}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkApprove}
            disabled={bulkLoading}
            className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
          >
            {bulkLoading ? <Loader2Icon className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
            {t.testimonials.approve_all}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkReject}
            disabled={bulkLoading}
            className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
          >
            {bulkLoading ? <Loader2Icon className="size-3.5 animate-spin" /> : <XIcon className="size-3.5" />}
            {t.testimonials.reject_all}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">{t.testimonials.all}</TabsTrigger>
          <TabsTrigger value="pending">{t.common.pending}</TabsTrigger>
          <TabsTrigger value="approved">{t.common.approved}</TabsTrigger>
          <TabsTrigger value="rejected">{t.common.rejected}</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'approved', 'rejected'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : testimonials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquareIcon className="mb-4 size-12 text-muted-foreground/40" />
                <h3 className="text-lg font-medium">{t.testimonials.no_testimonials}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tab === 'all'
                    ? t.testimonials.no_testimonials_desc
                    : t.testimonials.no_filtered.replace('{status}', tab)}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {testimonials.map(renderTestimonialCard)}
                </div>
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Loader2Icon className="size-4 animate-spin" />
                          {t.common.loading}
                        </>
                      ) : (
                        t.common.load_more
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.testimonials.delete_title}</DialogTitle>
            <DialogDescription>
              {t.testimonials.delete_desc_1}{' '}
              <span className="font-medium">{deleteTarget?.author_name}</span>
              {t.testimonials.delete_desc_2}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {actionLoading[`del-${deleteTarget?.id}`] ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t.testimonials.deleting}
                </>
              ) : (
                t.common.delete
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Social Card Dialog */}
      {shareTarget && (
        <SocialCardDialog
          testimonial={shareTarget}
          plan={plan}
          open={!!shareTarget}
          onOpenChange={(open) => !open && setShareTarget(null)}
        />
      )}
    </div>
  );
}
