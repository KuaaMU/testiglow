import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headers = corsHeaders();

  if (!id) {
    return NextResponse.json(
      { error: 'Widget ID is required' },
      { status: 400, headers }
    );
  }

  const supabase = createAdminClient();

  // Fetch widget (no auth required - public endpoint)
  const { data: widget, error: widgetError } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', id)
    .single();

  if (widgetError || !widget) {
    return NextResponse.json(
      { error: 'Widget not found' },
      { status: 404, headers }
    );
  }

  // Fetch the testimonials referenced by the widget
  const testimonialIds: string[] = widget.testimonial_ids ?? [];

  let testimonials: Record<string, unknown>[] = [];

  if (testimonialIds.length > 0) {
    const { data: testimonialData, error: testimonialsError } = await supabase
      .from('testimonials')
      .select('*')
      .in('id', testimonialIds)
      .eq('status', 'approved');

    if (testimonialsError) {
      return NextResponse.json(
        { error: 'Failed to fetch testimonials' },
        { status: 500, headers }
      );
    }

    testimonials = testimonialData ?? [];
  }

  return NextResponse.json(
    { widget, testimonials },
    {
      status: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
