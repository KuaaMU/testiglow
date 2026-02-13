import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// POST /api/forms -- Authenticated: create a new form
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, headline, description, brand_color, thank_you_message } =
      body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }
    if (!slug || typeof slug !== 'string' || !slug.trim()) {
      return NextResponse.json(
        { error: 'slug is required' },
        { status: 400 }
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const { data: existingForm } = await supabase
      .from('forms')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingForm) {
      return NextResponse.json(
        { error: 'A form with this slug already exists' },
        { status: 409 }
      );
    }

    // Insert the form
    const { data: form, error: insertError } = await supabase
      .from('forms')
      .insert({
        user_id: user.id,
        name: name.trim(),
        slug: slug.trim(),
        headline: headline || null,
        description: description || null,
        brand_color: brand_color || '#6366f1',
        thank_you_message:
          thank_you_message ||
          'Thank you for your testimonial! We truly appreciate your feedback.',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'A form with this slug already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating form:', insertError);
      return NextResponse.json(
        { error: 'Failed to create form' },
        { status: 500 }
      );
    }

    return NextResponse.json(form, { status: 201 });
  } catch (err) {
    console.error('POST /api/forms error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/forms -- Authenticated: list forms for the current user
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: forms, error } = await supabase
      .from('forms')
      .select('*, testimonials(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching forms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch forms' },
        { status: 500 }
      );
    }

    // Flatten the testimonial count
    const result = (forms || []).map((form: Record<string, unknown>) => ({
      ...form,
      testimonial_count:
        (form.testimonials as { count: number }[])?.[0]?.count ?? 0,
      testimonials: undefined,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/forms error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
