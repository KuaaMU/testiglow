'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Copy, Loader2, Wallet } from 'lucide-react';

interface CryptoCheckoutProps {
  userId: string;
  walletAddress: string;
  amount: number;
}

export function CryptoCheckoutButton({
  userId,
  walletAddress,
  amount,
}: CryptoCheckoutProps) {
  const [open, setOpen] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function copyAddress() {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit() {
    if (!txHash.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/crypto-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_hash: txHash.trim(),
          chain: 'TRC-20',
          amount,
          wallet_address: walletAddress,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit payment');
      }
    } catch {
      setError('Network error, please try again');
    }

    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wallet className="size-4 mr-1.5" />
          Pay with USDT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay with USDT</DialogTitle>
          <DialogDescription>
            Send USDT to the address below, then submit your transaction hash for verification.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-12 text-green-500" />
            <p className="font-medium text-lg">Payment Submitted!</p>
            <p className="text-sm text-muted-foreground">
              We&apos;ll verify your transaction and upgrade your account within 24 hours.
              You&apos;ll see the Pro badge once confirmed.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Amount */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-xl font-bold">{amount} USDT</span>
            </div>

            {/* Chain */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <Badge variant="secondary">Tron (TRC-20)</Badge>
            </div>

            {/* Wallet address */}
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded border bg-muted px-3 py-2 text-xs font-mono break-all">
                  {walletAddress}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={copyAddress}
                >
                  {copied ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* TX Hash */}
            <div className="space-y-2">
              <Label htmlFor="txHash">Transaction Hash</Label>
              <Input
                id="txHash"
                placeholder="Paste your tx hash after sending"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Send exactly {amount} USDT (TRC-20), then paste the transaction hash here.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={!txHash.trim() || submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Payment'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your account will be upgraded within 24 hours after verification.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
