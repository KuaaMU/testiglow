import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, FileText, Code2, Clock, Plus, StarIcon, ArrowRight } from "lucide-react";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import type { Testimonial } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { count: totalTestimonials } = await supabase
    .from("testimonials")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: pendingCount } = await supabase
    .from("testimonials")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("status", "pending");

  const { count: formsCount } = await supabase
    .from("forms")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: widgetsCount } = await supabase
    .from("widgets")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  // Fetch recent pending testimonials for quick review
  const { data: recentPending } = await supabase
    .from("testimonials")
    .select("*")
    .eq("user_id", user!.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  const recentTestimonials = (recentPending || []) as Testimonial[];

  // Show onboarding wizard for new users with no forms
  if ((formsCount ?? 0) === 0 && !profile?.onboarding_completed) {
    return <OnboardingWizard userId={user!.id} />;
  }

  const stats = [
    { label: "Total Testimonials", value: totalTestimonials || 0, icon: MessageSquare },
    { label: "Pending Review", value: pendingCount || 0, icon: Clock },
    { label: "Collection Forms", value: formsCount || 0, icon: FileText },
    { label: "Active Widgets", value: widgetsCount || 0, icon: Code2 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || "there"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here&apos;s what&apos;s happening with your testimonials.
          </p>
        </div>
        <Badge variant={profile?.plan === "pro" ? "default" : "secondary"}>
          {profile?.plan === "pro" ? "Pro Plan" : "Free Plan"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/forms/new">
            <Plus className="size-4 mr-2" />
            Create Form
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/testimonials">View Testimonials</Link>
        </Button>
      </div>

      {/* Recent Pending Testimonials */}
      {recentTestimonials.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Review</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/testimonials" className="gap-1.5">
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentTestimonials.map((t) => {
              const initial = t.author_name?.charAt(0)?.toUpperCase() || '?';
              return (
                <Card key={t.id}>
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{t.author_name}</p>
                        {t.author_company && (
                          <span className="text-xs text-gray-500">{t.author_company}</span>
                        )}
                      </div>
                      {t.rating !== null && (
                        <div className="mt-1 flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`size-3 ${
                                i < (t.rating ?? 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {t.content}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(t.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 bg-yellow-100 text-yellow-800 border-yellow-300">
                      Pending
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
