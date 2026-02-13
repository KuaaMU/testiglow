import { createAdminClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/lemonsqueezy';
import { NextResponse } from 'next/server';

/**
 * Lemon Squeezy webhook handler.
 * Uses admin client (service role) because webhooks arrive without user auth.
 *
 * Key events:
 * - subscription_created  → upgrade to pro
 * - subscription_updated  → check status, upgrade/downgrade
 * - subscription_cancelled → downgrade to free
 * - subscription_resumed  → upgrade to pro
 * - subscription_expired  → downgrade to free
 * - order_created         → link customer ID on first purchase
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature') || '';

    const isValid = await verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName: string = payload.meta?.event_name || '';
    const customData = payload.meta?.custom_data as
      | { user_id?: string }
      | undefined;
    const attrs = payload.data?.attributes || {};

    const supabase = createAdminClient();

    switch (eventName) {
      // ---- First purchase: link Lemon Squeezy customer to our user ----
      case 'order_created': {
        const customerId = String(attrs.customer_id ?? '');
        if (customData?.user_id && customerId) {
          await supabase
            .from('profiles')
            .update({
              lemon_customer_id: customerId,
              plan: 'pro',
            })
            .eq('id', customData.user_id);
        }
        break;
      }

      // ---- Subscription activated ----
      case 'subscription_created':
      case 'subscription_resumed': {
        const customerId = String(attrs.customer_id ?? '');
        const subscriptionId = String(payload.data?.id ?? '');

        // Try to find user by custom_data first, fallback to customer_id
        if (customData?.user_id) {
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              lemon_customer_id: customerId,
              lemon_subscription_id: subscriptionId,
            })
            .eq('id', customData.user_id);
        } else if (customerId) {
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              lemon_subscription_id: subscriptionId,
            })
            .eq('lemon_customer_id', customerId);
        }
        break;
      }

      // ---- Subscription status change ----
      case 'subscription_updated': {
        const subscriptionId = String(payload.data?.id ?? '');
        const status: string = attrs.status || '';

        if (status === 'active') {
          await supabase
            .from('profiles')
            .update({ plan: 'pro' })
            .eq('lemon_subscription_id', subscriptionId);
        } else if (
          status === 'cancelled' ||
          status === 'expired' ||
          status === 'paused' ||
          status === 'unpaid'
        ) {
          await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('lemon_subscription_id', subscriptionId);
        }
        break;
      }

      // ---- Subscription cancelled / expired → downgrade ----
      case 'subscription_cancelled':
      case 'subscription_expired': {
        const subscriptionId = String(payload.data?.id ?? '');
        if (subscriptionId) {
          await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('lemon_subscription_id', subscriptionId);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Lemon Squeezy webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
