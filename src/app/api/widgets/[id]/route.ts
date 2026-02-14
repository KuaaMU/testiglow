import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: widget, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !widget) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
  }

  return NextResponse.json({ widget });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('widgets')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, type, config, testimonial_ids } = body as {
    name?: string;
    type?: string;
    config?: Record<string, unknown>;
    testimonial_ids?: string[];
  };

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const validTypes = ['wall', 'carousel', 'badge', 'slider', 'marquee', 'list'];
  if (!type || !validTypes.includes(type)) {
    return NextResponse.json(
      { error: 'Type must be one of: wall, carousel, badge, slider, marquee, list' },
      { status: 400 }
    );
  }

  if (!config || typeof config !== 'object') {
    return NextResponse.json({ error: 'Config is required' }, { status: 400 });
  }

  const validThemes = ['light', 'dark'];
  if (!config.theme || !validThemes.includes(config.theme as string)) {
    return NextResponse.json(
      { error: 'Config theme must be light or dark' },
      { status: 400 }
    );
  }

  if (!Array.isArray(testimonial_ids)) {
    return NextResponse.json(
      { error: 'testimonial_ids must be an array' },
      { status: 400 }
    );
  }

  const cols = Number(config.columns) || 3;
  const maxItems = Number(config.max_items) || 6;

  const { data: widget, error } = await supabase
    .from('widgets')
    .update({
      name: name.trim(),
      type,
      config: {
        theme: config.theme,
        columns: cols,
        max_items: maxItems,
        show_rating: Boolean(config.show_rating),
        show_avatar: Boolean(config.show_avatar),
        show_date: Boolean(config.show_date),
        border_radius: Number(config.border_radius) || 8,
        background_color:
          (config.background_color as string) ||
          (config.theme === 'light' ? '#ffffff' : '#1a1a2e'),
        card_style: config.card_style || 'bordered',
        accent_color: config.accent_color || '',
        font_size: config.font_size || 'base',
      },
      testimonial_ids,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ widget });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('widgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
