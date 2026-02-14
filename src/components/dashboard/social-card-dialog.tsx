'use client';

import { useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { useT } from '@/lib/i18n/context';
import type { Testimonial } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import {
  MinimalTemplate,
  GradientTemplate,
  DarkTemplate,
  BrandTemplate,
} from './social-card-templates';

type TemplateType = 'minimal' | 'gradient' | 'dark' | 'brand';

interface SocialCardDialogProps {
  testimonial: Testimonial;
  plan: 'free' | 'pro';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandColor?: string;
}

const TEMPLATES: { id: TemplateType; label: string; preview: string }[] = [
  { id: 'minimal', label: 'Minimal', preview: 'bg-white border-2 border-gray-200' },
  { id: 'gradient', label: 'Gradient', preview: 'bg-gradient-to-br from-indigo-500 to-purple-500' },
  { id: 'dark', label: 'Dark', preview: 'bg-[#1a1a2e]' },
  { id: 'brand', label: 'Brand', preview: 'bg-indigo-600' },
];

export function SocialCardDialog({
  testimonial,
  plan,
  open,
  onOpenChange,
  brandColor,
}: SocialCardDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('minimal');
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const t = useT();

  const showWatermark = plan === 'free';

  const templateLabels: Record<TemplateType, string> = {
    minimal: t.social_card.minimal,
    gradient: t.social_card.gradient,
    dark: t.social_card.dark,
    brand: t.social_card.brand,
  };

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 1200,
        height: 675,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `testimonial-${testimonial.author_name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    }

    setIsDownloading(false);
  }, [testimonial.author_name]);

  const renderTemplate = () => {
    const props = {
      testimonial,
      showWatermark,
      brandColor,
    };

    switch (selectedTemplate) {
      case 'minimal':
        return <MinimalTemplate {...props} />;
      case 'gradient':
        return <GradientTemplate {...props} />;
      case 'dark':
        return <DarkTemplate {...props} />;
      case 'brand':
        return <BrandTemplate {...props} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t.social_card.title}</DialogTitle>
          <DialogDescription>
            {t.social_card.select_template}
          </DialogDescription>
        </DialogHeader>

        {/* Template Selector */}
        <div className="flex gap-3">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setSelectedTemplate(tmpl.id)}
              className={`flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all ${
                selectedTemplate === tmpl.id
                  ? 'ring-2 ring-indigo-600 ring-offset-2'
                  : 'hover:bg-muted'
              }`}
            >
              <div
                className={`h-12 w-20 rounded-md ${tmpl.preview}`}
              />
              <span className="text-xs font-medium">{templateLabels[tmpl.id]}</span>
            </button>
          ))}
        </div>

        {/* Preview Area - scaled to 50% */}
        <div className="overflow-hidden rounded-lg border bg-muted/50 p-4">
          <div
            style={{
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
              width: '1200px',
              height: '675px',
            }}
          >
            <div ref={cardRef}>{renderTemplate()}</div>
          </div>
        </div>

        {/* The container needs reduced height to match the scaled preview */}
        <style>{`
          .overflow-hidden.rounded-lg {
            height: calc(675px * 0.5 + 32px);
          }
        `}</style>

        {/* Download Button */}
        <div className="flex items-center justify-between">
          {showWatermark && (
            <p className="text-xs text-muted-foreground">
              Upgrade to Pro to remove the watermark.
            </p>
          )}
          <div className="ml-auto">
            <Button onClick={handleDownload} disabled={isDownloading} className="gap-1.5">
              {isDownloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {t.social_card.download_png}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
