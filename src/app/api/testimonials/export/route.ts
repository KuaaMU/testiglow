import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (!profile || profile.plan !== 'pro') {
      return NextResponse.json(
        { error: 'CSV export is a Pro feature. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('form_id');
    const status = searchParams.get('status');

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

    const { data: testimonials, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch testimonials.' },
        { status: 500 }
      );
    }

    // Build CSV
    const headers = [
      'Author Name',
      'Author Email',
      'Author Title',
      'Author Company',
      'Rating',
      'Content',
      'Status',
      'Featured',
      'AI Summary',
      'AI Tags',
      'Video URL',
      'Created At',
    ];

    function escapeCSV(value: string | null | undefined): string {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const rows = (testimonials || []).map((t) =>
      [
        escapeCSV(t.author_name),
        escapeCSV(t.author_email),
        escapeCSV(t.author_title),
        escapeCSV(t.author_company),
        t.rating ?? '',
        escapeCSV(t.content),
        t.status,
        t.is_featured ? 'Yes' : 'No',
        escapeCSV(t.ai_summary),
        escapeCSV(t.ai_tags?.join('; ')),
        escapeCSV(t.video_url),
        t.created_at,
      ].join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="testimonials-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error('CSV export error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
