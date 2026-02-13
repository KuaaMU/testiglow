'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CopyIcon, CheckIcon } from 'lucide-react';

export function CopyEmbedCodeButton({ embedCode }: { embedCode: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = embedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleCopy}>
      {copied ? (
        <>
          <CheckIcon className="size-3.5" />
          Copied!
        </>
      ) : (
        <>
          <CopyIcon className="size-3.5" />
          Embed Code
        </>
      )}
    </Button>
  );
}
