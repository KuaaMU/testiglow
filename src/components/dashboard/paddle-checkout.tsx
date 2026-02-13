'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: {
        open: (opts: {
          items: { priceId: string; quantity: number }[];
          customData?: Record<string, string>;
          customer?: { email: string };
          settings?: {
            successUrl?: string;
            displayMode?: string;
            theme?: string;
          };
        }) => void;
      };
    };
  }
}

export function PaddleCheckoutButton({
  userEmail,
  userId,
  priceId,
  environment,
  clientToken,
}: {
  userEmail: string;
  userId: string;
  priceId: string;
  environment: string;
  clientToken: string;
}) {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load Paddle.js
    if (document.querySelector('script[src*="paddle.com"]')) {
      setReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => {
      if (window.Paddle) {
        if (environment === 'sandbox') {
          window.Paddle.Environment.set('sandbox');
        }
        window.Paddle.Initialize({ token: clientToken });
        setReady(true);
      }
    };
    document.head.appendChild(script);
  }, [environment, clientToken]);

  function handleCheckout() {
    if (!window.Paddle || !ready) return;

    setLoading(true);
    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: { user_id: userId },
      customer: { email: userEmail },
      settings: {
        successUrl: `${window.location.origin}/settings?upgraded=true`,
        displayMode: 'overlay',
        theme: 'light',
      },
    });

    // Reset loading after a delay (checkout overlay takes over)
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={!ready || loading}
      className="bg-indigo-600 hover:bg-indigo-700"
    >
      {loading ? (
        <>
          <Loader2 className="size-4 mr-2 animate-spin" />
          Opening checkout...
        </>
      ) : (
        'Upgrade to Pro — $19/mo'
      )}
    </Button>
  );
}
