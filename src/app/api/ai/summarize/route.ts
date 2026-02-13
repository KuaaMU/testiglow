import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTestimonialSummary } from '@/lib/ai';

// ---------------------------------------------------------------------------
// POST /api/ai/summarize -- Authenticated: generate AI summary for a testimonial
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
    const { testimonial_id } = body;

    if (!testimonial_id || typeof testimonial_id !== 'string') {
      return NextResponse.json(
        { error: 'testimonial_id is required' },
        { status: 400 }
      );
    }

    // Fetch the testimonial and verify ownership
    const { data: testimonial, error: fetchError } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', testimonial_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !testimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    // Generate AI summary and tags
    const { summary, tags } = await generateTestimonialSummary(
      testimonial.content
    );

    // Update the testimonial with AI results
    const { data: updated, error: updateError } = await supabase
      .from('testimonials')
      .update({
        ai_summary: summary,
        ai_tags: tags,
      })
      .eq('id', testimonial_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating testimonial with AI summary:', updateError);
      return NextResponse.json(
        { error: 'Failed to save AI summary' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('POST /api/ai/summarize error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
