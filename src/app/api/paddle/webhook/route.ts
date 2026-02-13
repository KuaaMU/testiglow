import { createAdminClient } from '@/lib/supabase/server';
import { verifyPaddleWebhook } from '@/lib/paddle';
import { NextResponse } from 'next/server';

/**
 * Paddle webhook handler.
 * Uses admin client (service role) because webhooks arrive without user auth.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('paddle-signature') || '';

    // Verify webhook authenticity
    const isValid = await verifyPaddleWebhook(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type as string;
    const data = event.data;

    const supabase = createAdminClient();

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.resumed': {
        const customerId = data.customer_id as string;
        const subscriptionId = data.id as string;

        // Find user by paddle_customer_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paddle_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              paddle_subscription_id: subscriptionId,
            })
            .eq('id', profile.id);
        }
        break;
      }

      case 'subscription.canceled':
      case 'subscription.past_due': {
        const subscriptionId = data.id as string;

        // Find user by subscription ID and downgrade
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paddle_subscription_id', subscriptionId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('id', profile.id);
        }
        break;
      }

      case 'subscription.updated': {
        // Handle plan changes (e.g., billing cycle updates)
        const subscriptionId = data.id as string;
        const status = data.status as string;

        if (status === 'active') {
          await supabase
            .from('profiles')
            .update({ plan: 'pro' })
            .eq('paddle_subscription_id', subscriptionId);
        } else if (status === 'canceled' || status === 'paused') {
          await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('paddle_subscription_id', subscriptionId);
        }
        break;
      }

      case 'transaction.completed': {
        // First-time checkout: link customer to profile
        const customerId = data.customer_id as string;
        const customData = data.custom_data as { user_id?: string } | null;

        if (customData?.user_id) {
          await supabase
            .from('profiles')
            .update({ paddle_customer_id: customerId })
            .eq('id', customData.user_id);
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paddle webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
