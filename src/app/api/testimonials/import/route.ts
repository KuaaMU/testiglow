import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { form_id, testimonials } = body;

    if (!form_id || !Array.isArray(testimonials) || testimonials.length === 0) {
      return NextResponse.json(
        { error: 'form_id and testimonials array are required.' },
        { status: 400 }
      );
    }

    // Verify the form belongs to the user
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', form_id)
      .eq('user_id', user.id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found or access denied.' },
        { status: 403 }
      );
    }

    // Build insert rows
    const insertRows = testimonials.map(
      (t: {
        author_name: string;
        content: string;
        rating?: number | null;
        author_company?: string | null;
      }) => ({
        form_id,
        user_id: user.id,
        author_name: t.author_name,
        content: t.content,
        rating: t.rating ?? null,
        author_company: t.author_company ?? null,
        status: 'approved',
      })
    );

    const { error: insertError } = await supabase
      .from('testimonials')
      .insert(insertRows);

    if (insertError) {
      console.error('Import insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to import testimonials.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: insertRows.length });
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
