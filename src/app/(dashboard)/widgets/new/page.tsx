'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Testimonial, WidgetConfig } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2Icon, StarIcon, SaveIcon } from 'lucide-react';

type WidgetType = 'wall' | 'carousel' | 'badge';
type Theme = 'light' | 'dark';

export default function NewWidgetPage() {
  const supabase = createClient();
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [widgetType, setWidgetType] = useState<WidgetType>('wall');
  const [theme, setTheme] = useState<Theme>('light');
  const [columns, setColumns] = useState(3);
  const [maxItems, setMaxItems] = useState(6);
  const [showRating, setShowRating] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showDate, setShowDate] = useState(true);

  // Testimonial selector
  const [approvedTestimonials, setApprovedTestimonials] = useState<Testimonial[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  // Saving state
  const [saving, setSaving] = useState(false);

  const fetchApproved = useCallback(async () => {
    setLoadingTestimonials(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoadingTestimonials(false);
      return;
    }

    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    setApprovedTestimonials((data ?? []) as Testimonial[]);
    setLoadingTestimonials(false);
  }, [supabase]);

  useEffect(() => {
    fetchApproved();
  }, [fetchApproved]);

  const toggleTestimonial = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const config: WidgetConfig = {
      theme,
      columns,
      max_items: maxItems,
      show_rating: showRating,
      show_avatar: showAvatar,
      show_date: showDate,
      border_radius: 8,
      background_color: theme === 'light' ? '#ffffff' : '#1a1a2e',
    };

    try {
      const res = await fetch('/api/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type: widgetType,
          config,
          testimonial_ids: Array.from(selectedIds),
        }),
      });

      if (res.ok) {
        router.push('/widgets');
      } else {
        const err = await res.json();
        console.error('Failed to create widget:', err);
      }
    } catch (err) {
      console.error('Failed to create widget:', err);
    }

    setSaving(false);
  };

  // Selected testimonials for preview
  const previewTestimonials = approvedTestimonials
    .filter((t) => selectedIds.has(t.id))
    .slice(0, maxItems);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Widget</h1>
        <p className="text-muted-foreground">
          Configure how your testimonials will appear on your website.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Widget Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My testimonial widget"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={widgetType}
                  onValueChange={(v) => setWidgetType(v as WidgetType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wall">Wall of Love (Grid)</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="badge">Badge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">Dark Theme</Label>
                <Switch
                  id="theme"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? 'dark' : 'light')
                  }
                />
              </div>

              {/* Columns (wall only) */}
              {widgetType === 'wall' && (
                <div className="space-y-2">
                  <Label>Columns</Label>
                  <Select
                    value={String(columns)}
                    onValueChange={(v) => setColumns(Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Column</SelectItem>
                      <SelectItem value="2">2 Columns</SelectItem>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Max Items */}
              <div className="space-y-2">
                <Label>Max Items</Label>
                <Select
                  value={String(maxItems)}
                  onValueChange={(v) => setMaxItems(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 6, 9, 12, 15, 18, 21, 24].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} items
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle switches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showRating">Show Rating</Label>
                  <Switch
                    id="showRating"
                    checked={showRating}
                    onCheckedChange={setShowRating}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showAvatar">Show Avatar</Label>
                  <Switch
                    id="showAvatar"
                    checked={showAvatar}
                    onCheckedChange={setShowAvatar}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showDate">Show Date</Label>
                  <Switch
                    id="showDate"
                    checked={showDate}
                    onCheckedChange={setShowDate}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial Selector */}
          <Card>
            <CardHeader>
              <CardTitle>
                Select Testimonials{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  ({selectedIds.size} selected)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTestimonials ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : approvedTestimonials.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No approved testimonials available. Approve some testimonials
                  first.
                </p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {approvedTestimonials.map((t) => (
                    <label
                      key={t.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleTestimonial(t.id)}
                        className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{t.author_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.content}
                        </p>
                      </div>
                      {t.rating !== null && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <StarIcon className="size-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{t.rating}</span>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Creating Widget...
              </>
            ) : (
              <>
                <SaveIcon className="size-4" />
                Create Widget
              </>
            )}
          </Button>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Live Preview</h2>
          <div
            className="overflow-hidden rounded-lg border"
            style={{
              backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a2e',
              color: theme === 'light' ? '#1a1a2e' : '#e2e8f0',
            }}
          >
            <div className="p-4">
              {previewTestimonials.length === 0 ? (
                <p
                  className="py-10 text-center text-sm"
                  style={{
                    color: theme === 'light' ? '#94a3b8' : '#64748b',
                  }}
                >
                  Select some testimonials to see a preview
                </p>
              ) : widgetType === 'wall' ? (
                <PreviewWall
                  testimonials={previewTestimonials}
                  columns={columns}
                  theme={theme}
                  showRating={showRating}
                  showAvatar={showAvatar}
                  showDate={showDate}
                />
              ) : widgetType === 'carousel' ? (
                <PreviewCarousel
                  testimonials={previewTestimonials}
                  theme={theme}
                  showRating={showRating}
                  showAvatar={showAvatar}
                  showDate={showDate}
                />
              ) : (
                <PreviewBadge
                  testimonial={previewTestimonials[0]}
                  theme={theme}
                  showRating={showRating}
                  showAvatar={showAvatar}
                  showDate={showDate}
                />
              )}
            </div>
            <div
              className="border-t px-4 py-2 text-center text-xs"
              style={{
                borderColor: theme === 'light' ? '#e2e8f0' : '#334155',
                color: theme === 'light' ? '#94a3b8' : '#64748b',
              }}
            >
              Powered by TestiSpark
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preview Components                                                  */
/* ------------------------------------------------------------------ */

function PreviewStars({ rating, theme }: { rating: number | null; theme: Theme }) {
  if (rating === null) return null;
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className="size-3.5"
          style={{
            fill: i < rating ? '#facc15' : 'transparent',
            color: i < rating ? '#facc15' : theme === 'light' ? '#cbd5e1' : '#475569',
          }}
        />
      ))}
    </div>
  );
}

function PreviewAvatar({
  name,
  theme,
}: {
  name: string;
  theme: Theme;
}) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 600,
        backgroundColor: theme === 'light' ? '#e0e7ff' : '#312e81',
        color: theme === 'light' ? '#4338ca' : '#a5b4fc',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

interface PreviewCardProps {
  testimonial: Testimonial;
  theme: Theme;
  showRating: boolean;
  showAvatar: boolean;
  showDate: boolean;
}

function PreviewCard({
  testimonial: t,
  theme,
  showRating,
  showAvatar,
  showDate,
}: PreviewCardProps) {
  const cardBg = theme === 'light' ? '#f8fafc' : '#0f172a';
  const borderColor = theme === 'light' ? '#e2e8f0' : '#1e293b';
  const mutedColor = theme === 'light' ? '#64748b' : '#94a3b8';

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: `1px solid ${borderColor}`,
        backgroundColor: cardBg,
      }}
    >
      {showRating && <PreviewStars rating={t.rating} theme={theme} />}
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          margin: showRating ? '8px 0 12px' : '0 0 12px',
        }}
      >
        &ldquo;{t.content.length > 120 ? `${t.content.slice(0, 120)}...` : t.content}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showAvatar && <PreviewAvatar name={t.author_name} theme={theme} />}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
            {t.author_name}
          </p>
          {t.author_company && (
            <p style={{ fontSize: 11, color: mutedColor, margin: 0 }}>
              {t.author_company}
            </p>
          )}
        </div>
      </div>
      {showDate && (
        <p style={{ fontSize: 11, color: mutedColor, marginTop: 8 }}>
          {new Date(t.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      )}
    </div>
  );
}

function PreviewWall({
  testimonials,
  columns,
  theme,
  showRating,
  showAvatar,
  showDate,
}: {
  testimonials: Testimonial[];
  columns: number;
  theme: Theme;
  showRating: boolean;
  showAvatar: boolean;
  showDate: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(columns, 2)}, 1fr)`,
        gap: 12,
      }}
    >
      {testimonials.map((t) => (
        <PreviewCard
          key={t.id}
          testimonial={t}
          theme={theme}
          showRating={showRating}
          showAvatar={showAvatar}
          showDate={showDate}
        />
      ))}
    </div>
  );
}

function PreviewCarousel({
  testimonials,
  theme,
  showRating,
  showAvatar,
  showDate,
}: {
  testimonials: Testimonial[];
  theme: Theme;
  showRating: boolean;
  showAvatar: boolean;
  showDate: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 4,
      }}
    >
      {testimonials.map((t) => (
        <div key={t.id} style={{ minWidth: 240, maxWidth: 280, flexShrink: 0 }}>
          <PreviewCard
            testimonial={t}
            theme={theme}
            showRating={showRating}
            showAvatar={showAvatar}
            showDate={showDate}
          />
        </div>
      ))}
    </div>
  );
}

function PreviewBadge({
  testimonial: t,
  theme,
  showRating,
  showAvatar,
  showDate,
}: {
  testimonial: Testimonial;
  theme: Theme;
  showRating: boolean;
  showAvatar: boolean;
  showDate: boolean;
}) {
  if (!t) return null;
  return (
    <div style={{ maxWidth: 360 }}>
      <PreviewCard
        testimonial={t}
        theme={theme}
        showRating={showRating}
        showAvatar={showAvatar}
        showDate={showDate}
      />
    </div>
  );
}
