'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/context';
import type { Form, Testimonial } from '@/types';
import { Loader2, AlertCircle, StarIcon, MessageSquareHeart } from 'lucide-react';

export default function PublicWallPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useT();

  const [formData, setFormData] = useState<Form | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('slug', slug)
      .single();

    if (formError || !form) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setFormData(form as Form);

    const { data: testimonialData } = await supabase
      .from('testimonials')
      .select('*')
      .eq('form_id', form.id)
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    setTestimonials((testimonialData || []) as Testimonial[]);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (notFound || !formData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <AlertCircle className="mx-auto mb-4 size-12 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">{t.wall.not_found}</h1>
        <p className="mt-2 text-gray-600">
          {t.wall.not_found_desc}
        </p>
      </div>
    );
  }

  const brandColor = formData.brand_color || '#6366f1';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 text-center">
          {formData.logo_url && (
            <img
              src={formData.logo_url}
              alt=""
              className="mx-auto mb-4 h-10 w-auto object-contain"
            />
          )}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {formData.headline || `${t.wall.what_people_say} ${formData.name}`}
          </h1>
          {formData.description && (
            <p className="mx-auto mt-3 max-w-xl text-lg text-gray-600">
              {formData.description}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
            <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium text-gray-500">
              {testimonials.length} {testimonials.length !== 1 ? t.forms.testimonials : t.forms.testimonial}
            </span>
          </div>
        </div>
      </header>

      {/* Testimonials Grid */}
      <main className="mx-auto max-w-5xl px-4 py-10">
        {testimonials.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500">{t.wall.no_testimonials}</p>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {testimonials.map((tm) => {
              const initial = tm.author_name?.charAt(0)?.toUpperCase() || '?';
              return (
                <div
                  key={tm.id}
                  className="mb-4 break-inside-avoid rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Stars */}
                  {tm.rating !== null && (
                    <div className="mb-3 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`size-4 ${
                            i < (tm.rating ?? 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <p className="text-sm leading-relaxed text-gray-700">
                    &ldquo;{tm.content}&rdquo;
                  </p>

                  {/* Video link */}
                  {tm.video_url && (
                    <a
                      href={tm.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                    >
                      {t.wall.watch_video}
                    </a>
                  )}

                  {/* Author */}
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      {initial}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tm.author_name}
                      </p>
                      {(tm.author_title || tm.author_company) && (
                        <p className="text-xs text-gray-500">
                          {[tm.author_title, tm.author_company]
                            .filter(Boolean)
                            .join(' at ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          <MessageSquareHeart className="size-3.5" />
          {t.common.powered_by}
        </a>
      </footer>
    </div>
  );
}
