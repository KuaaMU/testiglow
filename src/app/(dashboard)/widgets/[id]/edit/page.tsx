'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Testimonial, Widget, WidgetConfig } from '@/types';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2Icon, StarIcon, SaveIcon, Trash2Icon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  WidgetPreview,
  type WidgetType,
  type Theme,
  type CardStyle,
  type FontSize,
  type PreviewOptions,
} from '@/components/dashboard/widget-preview';

export default function EditWidgetPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const widgetId = params.id as string;

  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [widgetType, setWidgetType] = useState<WidgetType>('wall');
  const [theme, setTheme] = useState<Theme>('light');
  const [columns, setColumns] = useState(3);
  const [maxItems, setMaxItems] = useState(6);
  const [showRating, setShowRating] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [cardStyle, setCardStyle] = useState<CardStyle>('bordered');
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [fontSize, setFontSize] = useState<FontSize>('base');

  // Testimonial selector
  const [approvedTestimonials, setApprovedTestimonials] = useState<Testimonial[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  // Saving / deleting state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load widget data
  useEffect(() => {
    async function loadWidget() {
      try {
        const res = await fetch(`/api/widgets/${widgetId}`);
        if (!res.ok) {
          router.push('/widgets');
          return;
        }
        const { widget } = (await res.json()) as { widget: Widget };

        setName(widget.name);
        setWidgetType(widget.type);
        setTheme(widget.config.theme);
        setColumns(widget.config.columns);
        setMaxItems(widget.config.max_items);
        setShowRating(widget.config.show_rating);
        setShowAvatar(widget.config.show_avatar);
        setShowDate(widget.config.show_date);
        setCardStyle(widget.config.card_style || 'bordered');
        setAccentColor(widget.config.accent_color || '#6366f1');
        setFontSize(widget.config.font_size || 'base');
        setSelectedIds(new Set(widget.testimonial_ids || []));
      } catch {
        router.push('/widgets');
      }
      setLoading(false);
    }
    loadWidget();
  }, [widgetId, router]);

  // Load approved testimonials
  const fetchApproved = useCallback(async () => {
    setLoadingTestimonials(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      card_style: cardStyle,
      accent_color: accentColor,
      font_size: fontSize,
    };

    try {
      const res = await fetch(`/api/widgets/${widgetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type: widgetType,
          config,
          testimonial_ids: Array.from(selectedIds),
        }),
      });

      if (res.ok) {
        toast.success('Widget updated.');
        router.push('/widgets');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update widget.');
      }
    } catch (err) {
      console.error('Failed to update widget:', err);
      toast.error('Failed to update widget.');
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/widgets/${widgetId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Widget deleted.');
        router.push('/widgets');
      } else {
        toast.error('Failed to delete widget.');
      }
    } catch {
      toast.error('Failed to delete widget.');
    }
    setDeleting(false);
  };

  // Selected testimonials for preview
  const previewTestimonials = approvedTestimonials
    .filter((t) => selectedIds.has(t.id))
    .slice(0, maxItems);

  const previewOptions: PreviewOptions = {
    theme,
    showRating,
    showAvatar,
    showDate,
    cardStyle,
    accentColor,
    fontSize,
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/widgets">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Widget</h1>
          <p className="text-muted-foreground">
            Update your widget configuration and selected testimonials.
          </p>
        </div>
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
                    <SelectItem value="carousel">Carousel (Scrollable)</SelectItem>
                    <SelectItem value="slider">Slider (One at a Time)</SelectItem>
                    <SelectItem value="marquee">Marquee (Auto-scroll)</SelectItem>
                    <SelectItem value="list">List (Vertical)</SelectItem>
                    <SelectItem value="badge">Badge (Single)</SelectItem>
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

              {/* Card Style */}
              <div className="space-y-2">
                <Label>Card Style</Label>
                <Select
                  value={cardStyle}
                  onValueChange={(v) => setCardStyle(v as CardStyle)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bordered">Bordered</SelectItem>
                    <SelectItem value="shadow">Shadow</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="glass">Glass</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    className="h-10 w-16 cursor-pointer p-1"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-32 font-mono"
                  />
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select
                  value={fontSize}
                  onValueChange={(v) => setFontSize(v as FontSize)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="base">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                  </SelectContent>
                </Select>
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
                  No approved testimonials available.
                </p>
              ) : (
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 transition-colors hover:bg-accent/50">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === approvedTestimonials.length &&
                        approvedTestimonials.length > 0
                      }
                      onChange={() => {
                        if (selectedIds.size === approvedTestimonials.length) {
                          setSelectedIds(new Set());
                        } else {
                          setSelectedIds(
                            new Set(approvedTestimonials.map((t) => t.id))
                          );
                        }
                      }}
                      className="size-4 rounded border-input accent-primary"
                    />
                    <span className="text-sm font-medium">
                      {selectedIds.size === approvedTestimonials.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </span>
                  </label>
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save & Delete buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="lg">
                  <Trash2Icon className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Widget</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete &quot;{name}&quot;? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
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
          </div>
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
              <WidgetPreview
                type={widgetType}
                testimonials={previewTestimonials}
                columns={columns}
                options={previewOptions}
              />
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
