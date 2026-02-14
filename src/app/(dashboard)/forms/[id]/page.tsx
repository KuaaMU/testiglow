'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

import { useT } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form as FormComponent,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Form, Question } from '@/types';
import { EmailTemplateGenerator } from '@/components/dashboard/email-template-generator';
import { QuestionsEditor } from '@/components/dashboard/questions-editor';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase letters, numbers, and hyphens only'
    ),
  headline: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  brand_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  thank_you_message: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditFormPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [copied, setCopied] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      headline: '',
      description: '',
      brand_color: '#6366f1',
      thank_you_message: '',
    },
  });

  const loadForm = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      router.push('/forms');
      return;
    }

    setFormData(data as Form);
    setIsActive(data.is_active);
    setQuestions(data.questions || []);
    form.reset({
      name: data.name,
      slug: data.slug,
      headline: data.headline || '',
      description: data.description || '',
      brand_color: data.brand_color || '#6366f1',
      thank_you_message: data.thank_you_message || '',
    });
    setIsLoading(false);
  }, [formId, form, router]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const collectionUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/collect/${form.watch('slug')}`
      : `/collect/${form.watch('slug')}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(collectionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = collectionUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleToggleActive() {
    const supabase = createClient();
    const newActive = !isActive;
    const { error } = await supabase
      .from('forms')
      .update({ is_active: newActive })
      .eq('id', formId);

    if (!error) {
      setIsActive(newActive);
      toast.success(newActive ? t.forms.form_activated : t.forms.form_paused);
    } else {
      toast.error(t.forms.save_failed);
    }
  }

  async function onSubmit(values: FormValues) {
    setIsSaving(true);
    setSlugError(null);

    try {
      const supabase = createClient();

      // Check slug uniqueness (excluding current form)
      if (values.slug !== formData?.slug) {
        const { data: existing } = await supabase
          .from('forms')
          .select('id')
          .eq('slug', values.slug)
          .neq('id', formId)
          .maybeSingle();

        if (existing) {
          setSlugError(t.forms.slug_taken);
          setIsSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from('forms')
        .update({
          name: values.name,
          slug: values.slug,
          headline: values.headline || null,
          description: values.description || null,
          brand_color: values.brand_color,
          questions: questions,
          thank_you_message:
            values.thank_you_message ||
            'Thank you for your testimonial! We truly appreciate your feedback.',
        })
        .eq('id', formId);

      if (error) {
        if (error.code === '23505') {
          setSlugError(t.forms.slug_taken);
        } else {
          console.error('Error updating form:', error);
          toast.error(t.forms.save_failed);
        }
        setIsSaving(false);
        return;
      }

      toast.success(t.forms.form_saved);
      router.push('/forms');
      router.refresh();
    } catch (err) {
      console.error('Failed to update form:', err);
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('forms').delete().eq('id', formId);

      if (error) {
        console.error('Error deleting form:', error);
        setIsDeleting(false);
        return;
      }

      router.push('/forms');
      router.refresh();
    } catch (err) {
      console.error('Failed to delete form:', err);
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/forms">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{t.forms.edit_form}</h1>
          <p className="text-muted-foreground mt-1">
            {t.forms.edit_form_desc}
          </p>
        </div>
      </div>

      {/* Collection URL Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.forms.collection_url}</CardTitle>
          <CardDescription>
            {t.forms.collection_url_desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="bg-muted flex-1 truncate rounded-md border px-3 py-2 font-mono text-sm">
              {collectionUrl}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="Copy URL"
            >
              {copied ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link
                href={`/collect/${form.watch('slug')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open collection page"
              >
                <ExternalLink className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Public Wall URL Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.forms.public_wall}</CardTitle>
          <CardDescription>
            {t.forms.public_wall_desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="bg-muted flex-1 truncate rounded-md border px-3 py-2 font-mono text-sm">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/wall/${form.watch('slug')}`
                : `/wall/${form.watch('slug')}`}
            </div>
            <Button variant="outline" size="icon" asChild>
              <Link
                href={`/wall/${form.watch('slug')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open public wall"
              >
                <Globe className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Toggle Card */}
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div className="space-y-0.5">
            <Label htmlFor="active-toggle" className="text-base font-medium">
              {t.forms.form_active}
            </Label>
            <p className="text-muted-foreground text-sm">
              {isActive
                ? t.forms.form_active_on
                : t.forms.form_active_off}
            </p>
          </div>
          <Switch
            id="active-toggle"
            checked={isActive}
            onCheckedChange={handleToggleActive}
          />
        </CardContent>
      </Card>

      {/* Form Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t.forms.form_details}</CardTitle>
          <CardDescription>
            {t.forms.form_details_desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormComponent {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forms.name}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.forms.name_placeholder} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t.forms.name_desc}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forms.slug}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.forms.slug_placeholder} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t.forms.slug_desc}{' '}
                      <code className="bg-muted rounded px-1 text-xs">
                        /collect/{field.value || 'your-slug'}
                      </code>
                    </FormDescription>
                    {slugError && (
                      <p className="text-destructive text-sm">{slugError}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forms.headline}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.forms.headline_placeholder}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t.forms.headline_desc}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forms.description}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.forms.description_placeholder}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t.forms.description_desc}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forms.brand_color}</FormLabel>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Input
                          type="color"
                          className="h-10 w-16 cursor-pointer p-1"
                          {...field}
                        />
                      </FormControl>
                      <Input
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="#6366f1"
                        className="w-32 font-mono"
                      />
                    </div>
                    <FormDescription>
                      {t.forms.brand_color_desc}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thank_you_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forms.thank_you}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.forms.thank_you_placeholder}
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t.forms.thank_you_desc}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" asChild>
                  <Link href="/forms">{t.common.cancel}</Link>
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="size-4 animate-spin" />}
                  {t.forms.save_changes}
                </Button>
              </div>
            </form>
          </FormComponent>
        </CardContent>
      </Card>

      {/* Custom Questions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.forms.questions_title}</CardTitle>
          <CardDescription>
            {t.forms.questions_desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionsEditor questions={questions} onChange={setQuestions} />
          <p className="mt-3 text-xs text-muted-foreground">
            {t.forms.questions_save_note}
          </p>
        </CardContent>
      </Card>

      {/* Request via Email Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.forms.email_title}</CardTitle>
          <CardDescription>
            {t.forms.email_desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailTemplateGenerator
            formName={formData?.name || 'your product'}
            collectionUrl={collectionUrl}
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">{t.forms.danger_zone}</CardTitle>
          <CardDescription>
            {t.forms.danger_desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="size-4" />
                {t.forms.delete_form}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.forms.delete_confirm}</DialogTitle>
                <DialogDescription>
                  {t.forms.delete_confirm_desc_1}{' '}
                  <span className="font-semibold">{formData?.name}</span> {t.forms.delete_confirm_desc_2}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="size-4 animate-spin" />}
                  {t.forms.delete_permanently}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Separator />
    </div>
  );
}
