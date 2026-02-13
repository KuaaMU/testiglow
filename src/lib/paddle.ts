export function getPaddleEnvironment() {
  return process.env.PADDLE_ENVIRONMENT === 'production'
    ? 'production'
    : 'sandbox';
}

export function getPaddlePriceId() {
  return process.env.PADDLE_PRICE_ID || '';
}

export async function verifyPaddleWebhook(
  rawBody: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expectedSignature = Buffer.from(sig).toString('hex');

  const h1Match = signature.match(/h1=(\w+)/);
  if (!h1Match) return false;

  return h1Match[1] === expectedSignature;
}
