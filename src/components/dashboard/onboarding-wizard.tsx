'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Copy,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ArrowRight,
  SkipForward,
  StarIcon,
} from 'lucide-react';

interface OnboardingWizardProps {
  userId: string;
}

export function OnboardingWizard({ userId }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formHeadline, setFormHeadline] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [createdFormSlug, setCreatedFormSlug] = useState('');

  // Step 2 state
  const [copied, setCopied] = useState(false);

  const collectionUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/collect/${createdFormSlug}`
      : `/collect/${createdFormSlug}`;

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
  }

  function handleNameChange(value: string) {
    setFormName(value);
    const slug = generateSlug(value);
    setFormSlug(slug);
    setSlugError(null);
  }

  async function handleCreateForm() {
    if (!formName.trim() || !formSlug.trim()) return;

    setIsSubmitting(true);
    setSlugError(null);

    const supabase = createClient();

    const { data: existing } = await supabase
      .from('forms')
      .select('id')
      .eq('slug', formSlug)
      .maybeSingle();

    if (existing) {
      setSlugError('This slug is already taken. Try a different name.');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('forms').insert({
      user_id: userId,
      name: formName.trim(),
      slug: formSlug,
      headline: formHeadline.trim() || "We'd love to hear from you!",
      brand_color: '#6366f1',
      is_active: true,
      questions: [
        { id: '1', text: 'How was your experience?', type: 'text', required: true },
        { id: '2', text: 'Rate us', type: 'rating', required: true },
      ],
    });

    if (error) {
      if (error.code === '23505') {
        setSlugError('This slug is already taken. Try a different name.');
      } else {
        console.error('Error creating form:', error);
      }
      setIsSubmitting(false);
      return;
    }

    setCreatedFormSlug(formSlug);
    setIsSubmitting(false);
    setStep(1);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(collectionUrl);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = collectionUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function completeOnboarding() {
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);
    router.refresh();
  }

  async function handleSkip() {
    await completeOnboarding();
  }

  async function handleFinish() {
    await completeOnboarding();
  }

  const steps = [
    { label: 'Create Form', number: 1 },
    { label: 'Share Link', number: 2 },
    { label: 'Preview', number: 3 },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to TestiSpark!
        </h1>
        <p className="text-muted-foreground mt-1">
          Let&apos;s get you set up in 3 quick steps.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.number} className="flex items-center gap-2">
            <div
              className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                i <= step
                  ? 'bg-indigo-600 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? (
                <CheckCircle2 className="size-4" />
              ) : (
                s.number
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 transition-colors ${
                  i < step ? 'bg-indigo-600' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 0 && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-lg font-semibold">
              Step 1: Create your first collection form
            </h2>
            <p className="text-sm text-muted-foreground">
              This form will be the page where your customers leave testimonials.
            </p>

            <div className="space-y-3">
              <div>
                <Label htmlFor="onb-name">Form Name</Label>
                <Input
                  id="onb-name"
                  placeholder="e.g. My SaaS Product"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="onb-slug">Slug</Label>
                <Input
                  id="onb-slug"
                  placeholder="my-saas-product"
                  value={formSlug}
                  onChange={(e) => {
                    setFormSlug(e.target.value);
                    setSlugError(null);
                  }}
                  className="font-mono"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Your collection page: /collect/{formSlug || 'your-slug'}
                </p>
                {slugError && (
                  <p className="mt-1 text-sm text-destructive">{slugError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="onb-headline">Headline (optional)</Label>
                <Input
                  id="onb-headline"
                  placeholder="We'd love to hear from you!"
                  value={formHeadline}
                  onChange={(e) => setFormHeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={handleSkip}>
                <SkipForward className="mr-1 size-4" />
                Skip Setup
              </Button>
              <Button
                onClick={handleCreateForm}
                disabled={!formName.trim() || !formSlug.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                Create & Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-lg font-semibold">
              Step 2: Share your collection link
            </h2>
            <p className="text-sm text-muted-foreground">
              Send this link to your customers so they can submit testimonials.
            </p>

            <div className="flex items-center gap-2">
              <div className="bg-muted flex-1 truncate rounded-md border px-3 py-2 font-mono text-sm">
                {collectionUrl}
              </div>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <CheckCircle2 className="size-4 text-green-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a
                  href={`/collect/${createdFormSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={handleSkip}>
                <SkipForward className="mr-1 size-4" />
                Skip Setup
              </Button>
              <Button onClick={() => setStep(2)}>
                <ArrowRight className="size-4" />
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-lg font-semibold">
              Step 3: See how testimonials look
            </h2>
            <p className="text-sm text-muted-foreground">
              Here&apos;s a preview of what a collected testimonial looks like in your dashboard.
            </p>

            {/* Demo testimonial card */}
            <Card className="border-dashed">
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                    A
                  </div>
                  <div>
                    <p className="font-medium">Alex Johnson</p>
                    <p className="text-sm text-muted-foreground">Acme Corp</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className="size-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed">
                  &quot;This product has completely transformed how we handle customer
                  feedback. The setup was incredibly easy and we started seeing
                  results within the first week. Highly recommended!&quot;
                </p>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
              Once customers submit testimonials, you can approve, reject, feature
              them, generate AI summaries, and embed them on your website using
              widgets.
            </p>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={handleSkip}>
                <SkipForward className="mr-1 size-4" />
                Skip
              </Button>
              <Button onClick={handleFinish}>
                <CheckCircle2 className="size-4" />
                Done — Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
