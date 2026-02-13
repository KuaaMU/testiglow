import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: widgets, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ widgets });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  // Validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const validTypes = ['wall', 'carousel', 'badge'];
  if (!type || !validTypes.includes(type)) {
    return NextResponse.json(
      { error: 'Type must be one of: wall, carousel, badge' },
      { status: 400 }
    );
  }

  if (!config || typeof config !== 'object') {
    return NextResponse.json({ error: 'Config is required' }, { status: 400 });
  }

  // Validate config fields
  const validThemes = ['light', 'dark'];
  if (!config.theme || !validThemes.includes(config.theme as string)) {
    return NextResponse.json(
      { error: 'Config theme must be light or dark' },
      { status: 400 }
    );
  }

  const cols = Number(config.columns);
  if (isNaN(cols) || cols < 1 || cols > 4) {
    return NextResponse.json(
      { error: 'Config columns must be between 1 and 4' },
      { status: 400 }
    );
  }

  const maxItems = Number(config.max_items);
  if (isNaN(maxItems) || maxItems < 3 || maxItems > 24) {
    return NextResponse.json(
      { error: 'Config max_items must be between 3 and 24' },
      { status: 400 }
    );
  }

  if (!Array.isArray(testimonial_ids)) {
    return NextResponse.json(
      { error: 'testimonial_ids must be an array' },
      { status: 400 }
    );
  }

  // Insert
  const { data: widget, error } = await supabase
    .from('widgets')
    .insert({
      user_id: user.id,
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
      },
      testimonial_ids,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ widget }, { status: 201 });
}
