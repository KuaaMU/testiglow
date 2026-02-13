import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LemonSqueezyCheckoutButton } from "@/components/dashboard/lemonsqueezy-checkout";
import { CryptoCheckoutButton } from "@/components/dashboard/crypto-checkout";
import { getCheckoutUrl } from "@/lib/lemonsqueezy";
import { PRO_PRICE_MONTHLY } from "@/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const checkoutUrl = getCheckoutUrl(user?.email || "", user!.id);
  const usdtWallet = process.env.USDT_WALLET_ADDRESS || "";

  // Check if user has a pending crypto payment (table may not exist yet)
  let pendingPayment = null;
  try {
    const { data } = await supabase
      .from("crypto_payments")
      .select("id, status")
      .eq("user_id", user!.id)
      .eq("status", "pending")
      .maybeSingle();
    pendingPayment = data;
  } catch {
    // table may not exist - ignore
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{profile?.full_name || "Not set"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{profile?.email || user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={profile?.plan === "pro" ? "default" : "secondary"} className="mb-2">
                  {profile?.plan === "pro" ? "Pro" : "Free"}
                </Badge>
                <p className="text-sm text-gray-500">
                  {profile?.plan === "pro"
                    ? "You have unlimited access to all features."
                    : `You have used ${profile?.testimonial_count || 0} of 15 testimonials.`}
                </p>
              </div>
            </div>

            {profile?.plan !== "pro" && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Upgrade to Pro — ${PRO_PRICE_MONTHLY}/mo
                </p>

                {pendingPayment ? (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
                    <p className="text-sm text-yellow-800">
                      Your USDT payment is pending verification. We&apos;ll upgrade your account within 24 hours.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <LemonSqueezyCheckoutButton checkoutUrl={checkoutUrl} />
                    {usdtWallet && (
                      <CryptoCheckoutButton
                        userId={user!.id}
                        walletAddress={usdtWallet}
                        amount={PRO_PRICE_MONTHLY}
                      />
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Pay with credit card via Lemon Squeezy, or send USDT (TRC-20) directly.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
