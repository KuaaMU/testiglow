'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewFormPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      headline: '',
      description: '',
      brand_color: '#6366f1',
      thank_you_message: 'Thank you for your testimonial! We truly appreciate your feedback.',
    },
  });

  const onNameChange = (value: string) => {
    form.setValue('name', value);
    const currentSlug = form.getValues('slug');
    const expectedSlug = generateSlug(form.getValues('name').slice(0, -1) || '');
    // Only auto-generate slug if user hasn't manually edited it
    if (!currentSlug || currentSlug === expectedSlug || currentSlug === generateSlug(form.getValues('name'))) {
      form.setValue('slug', generateSlug(value));
    }
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setSlugError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from('forms')
        .select('id')
        .eq('slug', values.slug)
        .maybeSingle();

      if (existing) {
        setSlugError('This slug is already taken. Please choose a different one.');
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('forms').insert({
        user_id: user.id,
        name: values.name,
        slug: values.slug,
        headline: values.headline || null,
        description: values.description || null,
        brand_color: values.brand_color,
        thank_you_message:
          values.thank_you_message ||
          'Thank you for your testimonial! We truly appreciate your feedback.',
      });

      if (error) {
        if (error.code === '23505') {
          setSlugError('This slug is already taken. Please choose a different one.');
        } else {
          console.error('Error creating form:', error);
        }
        setIsSubmitting(false);
        return;
      }

      router.push('/forms');
      router.refresh();
    } catch (err) {
      console.error('Failed to create form:', err);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/forms">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Form</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new testimonial collection form.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
          <CardDescription>
            Configure how your testimonial collection form looks and behaves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Awesome Product"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          onNameChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Internal name for this form. Only visible to you.
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
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="my-awesome-product" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL-friendly identifier. Your collection page will be at{' '}
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
                    <FormLabel>Headline</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="We'd love to hear from you!"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Shown at the top of the collection page.
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your experience with our product..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional context shown below the headline.
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
                    <FormLabel>Brand Color</FormLabel>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Input type="color" className="h-10 w-16 cursor-pointer p-1" {...field} />
                      </FormControl>
                      <Input
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="#6366f1"
                        className="w-32 font-mono"
                      />
                    </div>
                    <FormDescription>
                      Used as the accent color on the collection page.
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
                    <FormLabel>Thank You Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Thank you for your testimonial!"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Shown after a customer submits their testimonial.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" asChild>
                  <Link href="/forms">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Create Form
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
