import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { FREE_TESTIMONIAL_LIMIT } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/testimonials -- Public: create a new testimonial
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { form_id, author_name, author_email, author_title, author_company, rating, content } =
      body;

    // Validate required fields
    if (!form_id || typeof form_id !== 'string') {
      return NextResponse.json(
        { error: 'form_id is required' },
        { status: 400 }
      );
    }
    if (!author_name || typeof author_name !== 'string' || !author_name.trim()) {
      return NextResponse.json(
        { error: 'author_name is required' },
        { status: 400 }
      );
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    // Use admin client (service role key) to bypass RLS for public submissions.
    // This is a trusted server route — the admin client lets us:
    // 1. Read form data to verify it's active
    // 2. Read the form owner's profile to check plan limits
    // 3. Count existing testimonials for limit enforcement
    // 4. Insert the testimonial
    const supabase = createAdminClient();

    // Look up the form to get the owner user_id and verify it's active
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, user_id, is_active')
      .eq('id', form_id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    if (!form.is_active) {
      return NextResponse.json(
        { error: 'This form is no longer accepting testimonials' },
        { status: 400 }
      );
    }

    // Check if the form owner is on a free plan and has hit the limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', form.user_id)
      .single();

    if (profile && profile.plan === 'free') {
      const { count } = await supabase
        .from('testimonials')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', form.user_id);

      if (count !== null && count >= FREE_TESTIMONIAL_LIMIT) {
        return NextResponse.json(
          {
            error:
              'This account has reached the free plan testimonial limit. Please ask the site owner to upgrade.',
          },
          { status: 403 }
        );
      }
    }

    // Insert the testimonial
    const { data: testimonial, error: insertError } = await supabase
      .from('testimonials')
      .insert({
        form_id,
        user_id: form.user_id,
        author_name: author_name.trim(),
        author_email: author_email || null,
        author_title: author_title || null,
        author_company: author_company || null,
        rating: rating || null,
        content: content.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting testimonial:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json(testimonial, { status: 201 });
  } catch (err) {
    console.error('POST /api/testimonials error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/testimonials -- Authenticated: list testimonials for current user
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('form_id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('testimonials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (formId) {
      query = query.eq('form_id', formId);
    }

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `author_name.ilike.%${search}%,content.ilike.%${search}%,author_email.ilike.%${search}%`
      );
    }

    const { data: testimonials, error } = await query;

    if (error) {
      console.error('Error fetching testimonials:', error);
      return NextResponse.json(
        { error: 'Failed to fetch testimonials' },
        { status: 500 }
      );
    }

    return NextResponse.json(testimonials);
  } catch (err) {
    console.error('GET /api/testimonials error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
