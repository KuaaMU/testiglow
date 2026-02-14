import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LemonSqueezyCheckoutButton } from "@/components/dashboard/lemonsqueezy-checkout";
import { CryptoCheckoutButton } from "@/components/dashboard/crypto-checkout";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { getCheckoutUrl } from "@/lib/lemonsqueezy";
import { PRO_PRICE_MONTHLY } from "@/types";
import { getDict } from "@/lib/i18n/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getDict();

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.settings.title}</h1>

      <div className="space-y-6 max-w-2xl">
        <ProfileForm userId={user!.id} initialName={profile?.full_name || ""} />

        <Card>
          <CardHeader>
            <CardTitle>{t.settings.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900">{profile?.email || user?.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.settings.plan}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={profile?.plan === "pro" ? "default" : "secondary"} className="mb-2">
                  {profile?.plan === "pro" ? t.common.pro : t.common.free}
                </Badge>
                <p className="text-sm text-gray-500">
                  {profile?.plan === "pro"
                    ? t.settings.unlimited
                    : t.settings.used_of.replace("{count}", String(profile?.testimonial_count || 0))}
                </p>
              </div>
            </div>

            {profile?.plan !== "pro" && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  {t.settings.upgrade} — ${PRO_PRICE_MONTHLY}/mo
                </p>

                {pendingPayment ? (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
                    <p className="text-sm text-yellow-800">
                      {t.settings.pending_payment}
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
                  {t.settings.pay_desc}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
