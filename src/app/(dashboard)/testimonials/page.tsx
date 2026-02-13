'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Testimonial } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { SocialCardDialog } from '@/components/dashboard/social-card-dialog';

const PAGE_SIZE = 12;

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function TestimonialsPage() {
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
    [supabase, statusFilter, search]
  );

  // Fetch user plan on mount
  useEffect(() => {
    async function fetchPlan() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();
      if (profile) {
        setPlan(profile.plan as 'free' | 'pro');
      }
    }
    fetchPlan();
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
      }
    } catch (err) {
      console.error('Summarize failed:', err);
    }
    setActionLoading((prev) => ({ ...prev, [`ai-${id}`]: false }));
  };

  const statusBadge = (status: Testimonial['status']) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      },
      approved: {
        label: 'Approved',
        className: 'bg-green-100 text-green-800 border-green-300',
      },
      rejected: {
        label: 'Rejected',
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

  const renderTestimonialCard = (t: Testimonial) => {
    const initial = t.author_name?.charAt(0)?.toUpperCase() || '?';
    const isLoading = actionLoading[t.id] || false;
    const displaySummary = summaries[t.id] || t.ai_summary;

    return (
      <Card key={t.id} className="relative">
        <CardContent className="space-y-3">
          {/* Header: Avatar, Name, Company, Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initial}
              </div>
              <div>
                <p className="font-medium leading-tight">{t.author_name}</p>
                {t.author_company && (
                  <p className="text-sm text-muted-foreground">
                    {t.author_company}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleFeatured(t.id, t.is_featured)}
                disabled={!!actionLoading[`feat-${t.id}`]}
                className="transition-colors hover:text-yellow-500"
                title={t.is_featured ? 'Unfeature' : 'Feature'}
              >
                <StarIcon
                  className={`size-5 ${
                    t.is_featured
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/40'
                  }`}
                />
              </button>
              {statusBadge(t.status)}
            </div>
          </div>

          {/* Rating */}
          {renderStars(t.rating)}

          {/* Content */}
          <p className="text-sm leading-relaxed text-foreground/90">
            {t.content.length > 250
              ? `${t.content.slice(0, 250)}...`
              : t.content}
          </p>

          {/* AI Summary */}
          {displaySummary && (
            <div className="rounded-md border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/30">
              <p className="mb-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                AI Summary
              </p>
              <p className="text-sm text-purple-900 dark:text-purple-100">
                {displaySummary}
              </p>
            </div>
          )}

          {/* AI Tags */}
          {t.ai_tags && t.ai_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {t.ai_tags.map((tag) => (
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
            {formatDate(t.created_at)}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            {(t.status === 'pending' || t.status === 'rejected') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus(t.id, 'approved')}
                disabled={isLoading}
                className="gap-1.5 text-green-700 hover:bg-green-50 hover:text-green-800"
              >
                <CheckCircleIcon className="size-3.5" />
                Approve
              </Button>
            )}
            {(t.status === 'pending' || t.status === 'approved') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus(t.id, 'rejected')}
                disabled={isLoading}
                className="gap-1.5 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <XCircleIcon className="size-3.5" />
                Reject
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSummarize(t.id)}
              disabled={!!actionLoading[`ai-${t.id}`]}
              className="gap-1.5"
            >
              {actionLoading[`ai-${t.id}`] ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SparklesIcon className="size-3.5" />
              )}
              AI Summarize
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShareTarget(t)}
              className="gap-1.5"
            >
              <ShareIcon className="size-3.5" />
              Share
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteTarget(t)}
              disabled={!!actionLoading[`del-${t.id}`]}
              className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2Icon className="size-3.5" />
              Delete
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
          <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">
            Manage and review all your collected testimonials.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-1.5">
          <Link href="/testimonials/import">
            <ImportIcon className="size-4" />
            Import
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by content or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
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
                <h3 className="text-lg font-medium">No testimonials yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tab === 'all'
                    ? 'Testimonials will appear here once customers submit them through your forms.'
                    : `No ${tab} testimonials found.`}
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
                          Loading...
                        </>
                      ) : (
                        'Load More'
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
            <DialogTitle>Delete Testimonial</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the testimonial from{' '}
              <span className="font-medium">{deleteTarget?.author_name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {actionLoading[`del-${deleteTarget?.id}`] ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
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
