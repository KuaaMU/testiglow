import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Plus,
  FileText,
  ExternalLink,
  Calendar,
  MessageSquare,
  Pencil,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyUrlButton } from '@/components/dashboard/copy-url-button';
import { getDict } from '@/lib/i18n/server';
import type { Form } from '@/types';

async function getForms(): Promise<(Form & { testimonial_count: number })[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: forms, error } = await supabase
    .from('forms')
    .select('*, testimonials(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching forms:', error);
    return [];
  }

  return (forms || []).map((form: Record<string, unknown>) => ({
    ...form,
    testimonial_count:
      (form.testimonials as { count: number }[])?.[0]?.count ?? 0,
  })) as (Form & { testimonial_count: number })[];
}

function FormatDate({ date }: { date: string }) {
  return (
    <time dateTime={date}>
      {new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </time>
  );
}

export default async function FormsPage() {
  const forms = await getForms();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const t = await getDict();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.forms.title}</h1>
          <p className="text-muted-foreground mt-1">
            {t.forms.desc}
          </p>
        </div>
        <Button asChild>
          <Link href="/forms/new">
            <Plus className="size-4" />
            {t.forms.create_new}
          </Link>
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardContent className="flex flex-col items-center text-center">
            <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
              <FileText className="text-muted-foreground size-8" />
            </div>
            <h2 className="text-xl font-semibold">{t.forms.no_forms}</h2>
            <p className="text-muted-foreground mb-6 mt-2 max-w-sm">
              {t.forms.no_forms_desc}
            </p>
            <Button asChild>
              <Link href="/forms/new">
                <Plus className="size-4" />
                {t.forms.create_first}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card
              key={form.id}
              className="group relative transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{form.name}</CardTitle>
                  <Badge
                    variant={form.is_active ? 'default' : 'secondary'}
                  >
                    {form.is_active ? t.forms.active : t.forms.inactive}
                  </Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /{form.slug}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="size-3.5" />
                    <span>
                      {form.testimonial_count}{' '}
                      {form.testimonial_count === 1
                        ? t.forms.testimonial
                        : t.forms.testimonials}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    <FormatDate date={form.created_at} />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="gap-2 border-t pt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/forms/${form.id}`}>
                    <Pencil className="size-3.5" />
                    {t.common.edit}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/collect/${form.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5" />
                    {t.common.preview}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/wall/${form.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="size-3.5" />
                    {t.forms.wall}
                  </Link>
                </Button>
                <CopyUrlButton url={`${baseUrl}/collect/${form.slug}`} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
