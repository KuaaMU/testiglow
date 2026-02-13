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
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'A valid tweet URL is required.' },
        { status: 400 }
      );
    }

    // Validate URL looks like a tweet
    const tweetPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
    if (!tweetPattern.test(url)) {
      return NextResponse.json(
        { error: 'Please provide a valid Twitter/X tweet URL.' },
        { status: 400 }
      );
    }

    // Call Twitter oEmbed API (free, no API key needed)
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
    const res = await fetch(oembedUrl);

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch tweet. It may be private or deleted.' },
        { status: 400 }
      );
    }

    const data = await res.json();

    // Extract author name from the response
    const authorName = data.author_name || 'Unknown';

    // Extract text content by stripping HTML tags from the html field
    const htmlContent: string = data.html || '';
    const textContent = htmlContent
      .replace(/<blockquote[^>]*>/gi, '')
      .replace(/<\/blockquote>/gi, '')
      .replace(/<a[^>]*>.*?<\/a>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&mdash;[\s\S]*$/, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({
      author_name: authorName,
      content: textContent || 'Could not extract tweet text.',
      url,
    });
  } catch (err) {
    console.error('Twitter import error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
