import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/crypto-payment
 * Submit a crypto payment tx hash for manual verification.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tx_hash, chain, amount, wallet_address } = body;

    if (!tx_hash || !wallet_address) {
      return NextResponse.json(
        { error: 'Transaction hash and wallet address are required' },
        { status: 400 }
      );
    }

    // Check for duplicate tx_hash
    const { data: existing } = await supabase
      .from('crypto_payments')
      .select('id')
      .eq('tx_hash', tx_hash)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'This transaction has already been submitted' },
        { status: 409 }
      );
    }

    const { error } = await supabase.from('crypto_payments').insert({
      user_id: user.id,
      tx_hash,
      chain: chain || 'TRC-20',
      amount: amount || 9.9,
      currency: 'USDT',
      wallet_address,
      status: 'pending',
    });

    if (error) {
      console.error('Failed to save crypto payment:', error);
      return NextResponse.json(
        { error: 'Failed to save payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Crypto payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
