'use client';

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

export function LemonSqueezyCheckoutButton({
  checkoutUrl,
}: {
  checkoutUrl: string;
}) {
  useEffect(() => {
    if (document.getElementById('lemonsqueezy-js')) return;

    const script = document.createElement('script');
    script.id = 'lemonsqueezy-js';
    script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
    script.defer = true;
    script.onload = () => {
      window.createLemonSqueezy?.();
    };
    document.head.appendChild(script);
  }, []);

  const handleClick = useCallback(() => {
    if (window.LemonSqueezy) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      window.open(checkoutUrl, '_blank');
    }
  }, [checkoutUrl]);

  if (!checkoutUrl) return null;

  return (
    <Button
      onClick={handleClick}
      className="bg-indigo-600 hover:bg-indigo-700"
    >
      Upgrade to Pro — $19/mo
    </Button>
  );
}
