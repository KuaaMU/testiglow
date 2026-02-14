import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Widget } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusIcon, LayoutGridIcon, GalleryHorizontalIcon, AwardIcon, SlidersHorizontalIcon, ArrowRightLeftIcon, ListIcon } from 'lucide-react';
import { CopyEmbedCodeButton } from './copy-embed-button';

const widgetTypeIcons: Record<Widget['type'], React.ReactNode> = {
  wall: <LayoutGridIcon className="size-5" />,
  carousel: <GalleryHorizontalIcon className="size-5" />,
  badge: <AwardIcon className="size-5" />,
  slider: <SlidersHorizontalIcon className="size-5" />,
  marquee: <ArrowRightLeftIcon className="size-5" />,
  list: <ListIcon className="size-5" />,
};

const widgetTypeLabels: Record<Widget['type'], string> = {
  wall: 'Wall of Love',
  carousel: 'Carousel',
  badge: 'Badge',
  slider: 'Slider',
  marquee: 'Marquee',
  list: 'List',
};

export default async function WidgetsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: widgets } = await supabase
    .from('widgets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const widgetList = (widgets ?? []) as Widget[];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Widgets</h1>
          <p className="text-muted-foreground">
            Create embeddable widgets to showcase testimonials on your website.
          </p>
        </div>
        <Button asChild>
          <Link href="/widgets/new">
            <PlusIcon className="size-4" />
            Create Widget
          </Link>
        </Button>
      </div>

      {/* Widget Grid */}
      {widgetList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <LayoutGridIcon className="mb-4 size-12 text-muted-foreground/40" />
          <h3 className="text-lg font-medium">No widgets yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first widget to embed testimonials on your website. Choose
            from Wall of Love, Carousel, or Badge layouts.
          </p>
          <Button asChild className="mt-6">
            <Link href="/widgets/new">
              <PlusIcon className="size-4" />
              Create Your First Widget
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {widgetList.map((widget) => {
            const testimonialCount = widget.testimonial_ids?.length ?? 0;
            const embedCode = `<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/embed.js" data-widget-id="${widget.id}"></script>\n<div id="testiSpark-widget"></div>`;

            return (
              <Card key={widget.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {widgetTypeIcons[widget.type]}
                      </div>
                      <div>
                        <CardTitle className="text-base">{widget.name}</CardTitle>
                        <CardDescription>
                          {widgetTypeLabels[widget.type]}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">{widget.config.theme}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Testimonials</span>
                    <span className="font-medium">{testimonialCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {new Date(widget.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex gap-2 border-t pt-4">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/widgets/${widget.id}/edit`}>Edit</Link>
                    </Button>
                    <CopyEmbedCodeButton embedCode={embedCode} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
