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
import { toast } from 'sonner';
import { useT } from '@/lib/i18n/context';
import {
  WidgetPreview,
  type WidgetType,
  type Theme,
  type CardStyle,
  type FontSize,
  type PreviewOptions,
} from '@/components/dashboard/widget-preview';

export default function NewWidgetPage() {
  const supabase = createClient();
  const router = useRouter();
  const t = useT();

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
      card_style: cardStyle,
      accent_color: accentColor,
      font_size: fontSize,
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
        toast.success(t.widgets.widget_created);
        router.push('/widgets');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create widget.');
      }
    } catch (err) {
      console.error('Failed to create widget:', err);
      toast.error('Failed to create widget.');
    }

    setSaving(false);
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.widgets.create_widget}</h1>
        <p className="text-muted-foreground">
          {t.widgets.config_desc}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t.widgets.widget_settings}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t.widgets.widget_name}</Label>
                <Input
                  id="name"
                  placeholder={t.widgets.widget_name_placeholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>{t.widgets.type}</Label>
                <Select
                  value={widgetType}
                  onValueChange={(v) => setWidgetType(v as WidgetType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wall">{t.widgets.type_wall}</SelectItem>
                    <SelectItem value="carousel">{t.widgets.type_carousel}</SelectItem>
                    <SelectItem value="slider">{t.widgets.type_slider}</SelectItem>
                    <SelectItem value="marquee">{t.widgets.type_marquee}</SelectItem>
                    <SelectItem value="list">{t.widgets.type_list}</SelectItem>
                    <SelectItem value="badge">{t.widgets.type_badge}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">{t.widgets.dark_theme}</Label>
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
                <Label>{t.widgets.card_style}</Label>
                <Select
                  value={cardStyle}
                  onValueChange={(v) => setCardStyle(v as CardStyle)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bordered">{t.widgets.style_bordered}</SelectItem>
                    <SelectItem value="shadow">{t.widgets.style_shadow}</SelectItem>
                    <SelectItem value="flat">{t.widgets.style_flat}</SelectItem>
                    <SelectItem value="glass">{t.widgets.style_glass}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <Label>{t.widgets.accent_color}</Label>
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
                <Label>{t.widgets.font_size}</Label>
                <Select
                  value={fontSize}
                  onValueChange={(v) => setFontSize(v as FontSize)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">{t.widgets.font_sm}</SelectItem>
                    <SelectItem value="base">{t.widgets.font_base}</SelectItem>
                    <SelectItem value="lg">{t.widgets.font_lg}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Columns (wall only) */}
              {widgetType === 'wall' && (
                <div className="space-y-2">
                  <Label>{t.widgets.columns}</Label>
                  <Select
                    value={String(columns)}
                    onValueChange={(v) => setColumns(Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t.widgets.column_1}</SelectItem>
                      <SelectItem value="2">{t.widgets.column_2}</SelectItem>
                      <SelectItem value="3">{t.widgets.column_3}</SelectItem>
                      <SelectItem value="4">{t.widgets.column_4}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Max Items */}
              <div className="space-y-2">
                <Label>{t.widgets.max_items}</Label>
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
                        {n} {t.common.items}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle switches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showRating">{t.widgets.show_rating}</Label>
                  <Switch
                    id="showRating"
                    checked={showRating}
                    onCheckedChange={setShowRating}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showAvatar">{t.widgets.show_avatar}</Label>
                  <Switch
                    id="showAvatar"
                    checked={showAvatar}
                    onCheckedChange={setShowAvatar}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showDate">{t.widgets.show_date}</Label>
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
                {t.widgets.select_testimonials}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  ({selectedIds.size} {t.common.selected})
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
                  {t.widgets.no_approved}
                </p>
              ) : (
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 transition-colors hover:bg-accent/50">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === approvedTestimonials.length && approvedTestimonials.length > 0}
                      onChange={() => {
                        if (selectedIds.size === approvedTestimonials.length) {
                          setSelectedIds(new Set());
                        } else {
                          setSelectedIds(new Set(approvedTestimonials.map((t) => t.id)));
                        }
                      }}
                      className="size-4 rounded border-input accent-primary"
                    />
                    <span className="text-sm font-medium">
                      {selectedIds.size === approvedTestimonials.length ? t.common.deselect_all : t.common.select_all}
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
                {t.widgets.creating}
              </>
            ) : (
              <>
                <SaveIcon className="size-4" />
                {t.widgets.create_widget}
              </>
            )}
          </Button>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t.widgets.live_preview}</h2>
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
              {t.common.powered_by}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
