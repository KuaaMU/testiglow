'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Star, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Form } from '@/types';

// ---------------------------------------------------------------------------
// Inline StarRating component
// ---------------------------------------------------------------------------
function StarRating({
  value,
  onChange,
  brandColor,
}: {
  value: number;
  onChange: (rating: number) => void;
  brandColor: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: isFilled ? brandColor : '#d1d5db',
            }}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              className="size-8 transition-colors"
              fill={isFilled ? 'currentColor' : 'none'}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main collection page
// ---------------------------------------------------------------------------
export default function CollectPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [formData, setFormData] = useState<Form | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Submission form state
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [authorTitle, setAuthorTitle] = useState('');
  const [authorCompany, setAuthorCompany] = useState('');
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const brandColor = formData?.brand_color || '#6366f1';

  const loadForm = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setNotFound(true);
      setIsLoadingForm(false);
      return;
    }

    setFormData(data as Form);
    setIsLoadingForm(false);
  }, [slug]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!authorName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Please write your testimonial.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: formData!.id,
          author_name: authorName.trim(),
          author_email: authorEmail.trim() || null,
          author_title: authorTitle.trim() || null,
          author_company: authorCompany.trim() || null,
          rating: rating || null,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setErrorMessage(body.error || 'Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setErrorMessage('Network error. Please try again.');
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (isLoadingForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2
          className="size-8 animate-spin"
          style={{ color: '#6366f1' }}
        />
      </div>
    );
  }

  // Not found / inactive
  if (notFound || !formData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900">
            Form Not Found
          </h1>
          <p className="mt-2 text-gray-600">
            This testimonial form doesn&apos;t exist or is no longer accepting
            submissions.
          </p>
        </div>
      </div>
    );
  }

  // Thank you state
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div
            className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            <CheckCircle2
              className="size-8"
              style={{ color: brandColor }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Thank You!
          </h1>
          <p className="mt-3 text-gray-600">
            {formData.thank_you_message ||
              'Thank you for your testimonial! We truly appreciate your feedback.'}
          </p>
        </div>
      </div>
    );
  }

  // Collection form
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 py-8 sm:py-16">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          {formData.logo_url && (
            <img
              src={formData.logo_url}
              alt=""
              className="mx-auto mb-6 h-12 w-auto object-contain"
            />
          )}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {formData.headline || formData.name}
          </h1>
          {formData.description && (
            <p className="mt-3 text-lg text-gray-600">
              {formData.description}
            </p>
          )}
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label
                htmlFor="author_name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="author_name"
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Jane Smith"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-shadow placeholder:text-gray-400 focus:border-transparent focus:ring-2"
                style={
                  {
                    '--tw-ring-color': brandColor,
                  } as React.CSSProperties
                }
                onFocus={(e) => {
                  e.target.style.boxShadow = `0 0 0 2px ${brandColor}`;
                  e.target.style.borderColor = 'transparent';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = '';
                  e.target.style.borderColor = '';
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="author_email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="author_email"
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="jane@company.com"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-shadow placeholder:text-gray-400"
                onFocus={(e) => {
                  e.target.style.boxShadow = `0 0 0 2px ${brandColor}`;
                  e.target.style.borderColor = 'transparent';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = '';
                  e.target.style.borderColor = '';
                }}
              />
            </div>

            {/* Job Title & Company in a row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="author_title"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Job Title
                </label>
                <input
                  id="author_title"
                  type="text"
                  value={authorTitle}
                  onChange={(e) => setAuthorTitle(e.target.value)}
                  placeholder="Product Manager"
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-shadow placeholder:text-gray-400"
                  onFocus={(e) => {
                    e.target.style.boxShadow = `0 0 0 2px ${brandColor}`;
                    e.target.style.borderColor = 'transparent';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = '';
                    e.target.style.borderColor = '';
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="author_company"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Company
                </label>
                <input
                  id="author_company"
                  type="text"
                  value={authorCompany}
                  onChange={(e) => setAuthorCompany(e.target.value)}
                  placeholder="Acme Inc."
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-shadow placeholder:text-gray-400"
                  onFocus={(e) => {
                    e.target.style.boxShadow = `0 0 0 2px ${brandColor}`;
                    e.target.style.borderColor = 'transparent';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = '';
                    e.target.style.borderColor = '';
                  }}
                />
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rating
              </label>
              <StarRating
                value={rating}
                onChange={setRating}
                brandColor={brandColor}
              />
            </div>

            {/* Testimonial Content */}
            <div>
              <label
                htmlFor="content"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Your Testimonial <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell us about your experience..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-shadow placeholder:text-gray-400"
                onFocus={(e) => {
                  e.target.style.boxShadow = `0 0 0 2px ${brandColor}`;
                  e.target.style.borderColor = 'transparent';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = '';
                  e.target.style.borderColor = '';
                }}
              />
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="size-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
              )}
              style={{ backgroundColor: brandColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Testimonial'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by{' '}
          <span className="font-semibold text-gray-500">TestiSpark</span>
        </p>
      </div>
    </div>
  );
}
