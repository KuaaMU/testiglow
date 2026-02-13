import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LemonSqueezyCheckoutButton } from "@/components/dashboard/lemonsqueezy-checkout";
import { getCheckoutUrl } from "@/lib/lemonsqueezy";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const checkoutUrl = getCheckoutUrl(user?.email || "", user!.id);

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
          <CardContent>
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
              {profile?.plan !== "pro" && (
                <LemonSqueezyCheckoutButton checkoutUrl={checkoutUrl} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
