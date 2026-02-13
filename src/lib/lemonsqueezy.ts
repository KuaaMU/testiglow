/**
 * Build a Lemon Squeezy checkout URL with pre-filled customer data.
 *
 * Users are redirected to this URL (or it opens in an overlay via lemon.js)
 * to complete their Pro subscription purchase.
 */
export function getCheckoutUrl(email: string, userId: string): string {
  const variantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID || '';
  if (!variantId) return '';

  const url = new URL(
    `https://testispark.lemonsqueezy.com/checkout/buy/${variantId}`
  );

  url.searchParams.set('checkout[email]', email);
  url.searchParams.set('checkout[custom][user_id]', userId);
  url.searchParams.set('embed', '1');
  url.searchParams.set('media', '0');
  url.searchParams.set('discount', '0');

  return url.toString();
}

/**
 * Verify Lemon Squeezy webhook signature (HMAC-SHA256).
 *
 * The raw request body is hashed with the webhook secret
 * and compared against the `X-Signature` header value.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === signature;
}
