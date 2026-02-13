const AI_MODEL = process.env.AI_MODEL || 'claude-haiku-4-5-20251001';

export async function generateTestimonialSummary(content: string): Promise<{
  summary: string;
  tags: string[];
}> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.anthropic.com';

  if (!apiKey) {
    // Fallback: extract first sentence as summary when no API key configured
    const firstSentence = content.match(/^[^.!?]*[.!?]/)?.[0] || content.slice(0, 150);
    return { summary: firstSentence.trim(), tags: [] };
  }

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 200,
      system:
        'You are a marketing assistant. Given a customer testimonial, extract a short highlight quote (1-2 sentences, the most impactful part) and 2-4 keyword tags. Respond ONLY with valid JSON: {"summary": "...", "tags": ["tag1", "tag2"]}',
      messages: [{ role: 'user', content }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('AI API error:', response.status, errText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch {
    return { summary: content.slice(0, 150), tags: [] };
  }
}
