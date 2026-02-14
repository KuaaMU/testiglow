'use client';

import { useState } from 'react';
import { StarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Testimonial } from '@/types';

export type Theme = 'light' | 'dark';
export type CardStyle = 'bordered' | 'shadow' | 'flat' | 'glass';
export type FontSize = 'sm' | 'base' | 'lg';
export type WidgetType = 'wall' | 'carousel' | 'badge' | 'slider' | 'marquee' | 'list';

export interface PreviewOptions {
  theme: Theme;
  showRating: boolean;
  showAvatar: boolean;
  showDate: boolean;
  cardStyle?: CardStyle;
  accentColor?: string;
  fontSize?: FontSize;
}

/* ------------------------------------------------------------------ */
/* Shared Base Components                                              */
/* ------------------------------------------------------------------ */

function fontSizePx(fs?: FontSize): number {
  if (fs === 'sm') return 12;
  if (fs === 'lg') return 15;
  return 13;
}

export function PreviewStars({ rating, theme }: { rating: number | null; theme: Theme }) {
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

export function PreviewAvatar({
  name,
  theme,
  accentColor,
}: {
  name: string;
  theme: Theme;
  accentColor?: string;
}) {
  const initial = name.charAt(0).toUpperCase();
  const bg = accentColor
    ? accentColor + '22'
    : theme === 'light'
      ? '#e0e7ff'
      : '#312e81';
  const fg = accentColor || (theme === 'light' ? '#4338ca' : '#a5b4fc');

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
        backgroundColor: bg,
        color: fg,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

interface PreviewCardProps {
  testimonial: Testimonial;
  options: PreviewOptions;
}

function cardStyles(theme: Theme, cardStyle?: CardStyle) {
  const borderColor = theme === 'light' ? '#e2e8f0' : '#1e293b';
  const cardBg = theme === 'light' ? '#f8fafc' : '#0f172a';

  const base: React.CSSProperties = {
    padding: 16,
    borderRadius: 8,
    backgroundColor: cardBg,
  };

  switch (cardStyle) {
    case 'shadow':
      return {
        ...base,
        boxShadow: theme === 'light'
          ? '0 4px 12px rgba(0,0,0,0.08)'
          : '0 4px 12px rgba(0,0,0,0.3)',
      };
    case 'flat':
      return base;
    case 'glass':
      return {
        ...base,
        backgroundColor: theme === 'light'
          ? 'rgba(255,255,255,0.6)'
          : 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.1)'}`,
      };
    case 'bordered':
    default:
      return {
        ...base,
        border: `1px solid ${borderColor}`,
      };
  }
}

export function PreviewCard({ testimonial: t, options }: PreviewCardProps) {
  const { theme, showRating, showAvatar, showDate, cardStyle, accentColor, fontSize } = options;
  const mutedColor = theme === 'light' ? '#64748b' : '#94a3b8';
  const fs = fontSizePx(fontSize);

  return (
    <div style={cardStyles(theme, cardStyle)}>
      {showRating && <PreviewStars rating={t.rating} theme={theme} />}
      <p
        style={{
          fontSize: fs,
          lineHeight: 1.5,
          margin: showRating ? '8px 0 12px' : '0 0 12px',
        }}
      >
        &ldquo;{t.content.length > 120 ? `${t.content.slice(0, 120)}...` : t.content}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showAvatar && <PreviewAvatar name={t.author_name} theme={theme} accentColor={accentColor} />}
        <div>
          <p style={{ fontSize: fs, fontWeight: 600, margin: 0 }}>
            {t.author_name}
          </p>
          {t.author_company && (
            <p style={{ fontSize: fs - 2, color: mutedColor, margin: 0 }}>
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

/* ------------------------------------------------------------------ */
/* Layout Previews                                                      */
/* ------------------------------------------------------------------ */

interface LayoutProps {
  testimonials: Testimonial[];
  options: PreviewOptions;
}

export function PreviewWall({
  testimonials,
  columns,
  options,
}: LayoutProps & { columns: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(columns, 2)}, 1fr)`,
        gap: 12,
      }}
    >
      {testimonials.map((t) => (
        <PreviewCard key={t.id} testimonial={t} options={options} />
      ))}
    </div>
  );
}

export function PreviewCarousel({ testimonials, options }: LayoutProps) {
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
          <PreviewCard testimonial={t} options={options} />
        </div>
      ))}
    </div>
  );
}

export function PreviewBadge({ testimonials, options }: LayoutProps) {
  const t = testimonials[0];
  if (!t) return null;
  return (
    <div style={{ maxWidth: 360 }}>
      <PreviewCard testimonial={t} options={options} />
    </div>
  );
}

export function PreviewSlider({ testimonials, options }: LayoutProps) {
  const [index, setIndex] = useState(0);
  const t = testimonials[index];
  if (!t) return null;

  const mutedColor = options.theme === 'light' ? '#94a3b8' : '#64748b';
  const accentColor = options.accentColor || (options.theme === 'light' ? '#6366f1' : '#818cf8');

  return (
    <div>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <PreviewCard testimonial={t} options={options} />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginTop: 16,
        }}
      >
        <button
          onClick={() => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: mutedColor,
            padding: 4,
          }}
        >
          <ChevronLeft className="size-5" />
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: i === index ? accentColor : mutedColor,
                opacity: i === index ? 1 : 0.4,
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: mutedColor,
            padding: 4,
          }}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}

export function PreviewMarquee({ testimonials, options }: LayoutProps) {
  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          animation: 'marquee-scroll 20s linear infinite',
          width: 'max-content',
        }}
      >
        {[...testimonials, ...testimonials].map((t, i) => (
          <div key={`${t.id}-${i}`} style={{ minWidth: 260, maxWidth: 300, flexShrink: 0 }}>
            <PreviewCard testimonial={t} options={options} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export function PreviewList({ testimonials, options }: LayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {testimonials.map((t) => (
        <PreviewCard key={t.id} testimonial={t} options={options} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

export function WidgetPreview({
  type,
  testimonials,
  columns,
  options,
}: {
  type: WidgetType;
  testimonials: Testimonial[];
  columns: number;
  options: PreviewOptions;
}) {
  if (testimonials.length === 0) {
    return (
      <p
        className="py-10 text-center text-sm"
        style={{ color: options.theme === 'light' ? '#94a3b8' : '#64748b' }}
      >
        Select some testimonials to see a preview
      </p>
    );
  }

  switch (type) {
    case 'wall':
      return <PreviewWall testimonials={testimonials} columns={columns} options={options} />;
    case 'carousel':
      return <PreviewCarousel testimonials={testimonials} options={options} />;
    case 'badge':
      return <PreviewBadge testimonials={testimonials} options={options} />;
    case 'slider':
      return <PreviewSlider testimonials={testimonials} options={options} />;
    case 'marquee':
      return <PreviewMarquee testimonials={testimonials} options={options} />;
    case 'list':
      return <PreviewList testimonials={testimonials} options={options} />;
    default:
      return <PreviewWall testimonials={testimonials} columns={columns} options={options} />;
  }
}
