import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, FileText, Code2, Clock, Plus, StarIcon, ArrowRight } from "lucide-react";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { getDict } from "@/lib/i18n/server";
import type { Testimonial } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getDict();

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
    { label: t.dashboard.total_testimonials, value: totalTestimonials || 0, icon: MessageSquare },
    { label: t.dashboard.pending_review, value: pendingCount || 0, icon: Clock },
    { label: t.dashboard.collection_forms, value: formsCount || 0, icon: FileText },
    { label: t.dashboard.active_widgets, value: widgetsCount || 0, icon: Code2 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.dashboard.welcome} {profile?.full_name || "there"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t.dashboard.subtitle}
          </p>
        </div>
        <Badge variant={profile?.plan === "pro" ? "default" : "secondary"}>
          {profile?.plan === "pro" ? t.dashboard.pro_plan : t.dashboard.free_plan}
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
            {t.dashboard.create_form}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/testimonials">{t.dashboard.view_testimonials}</Link>
        </Button>
      </div>

      {/* Recent Pending Testimonials */}
      {recentTestimonials.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.pending_review}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/testimonials" className="gap-1.5">
                {t.common.view_all}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentTestimonials.map((testimonial) => {
              const initial = testimonial.author_name?.charAt(0)?.toUpperCase() || '?';
              return (
                <Card key={testimonial.id}>
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{testimonial.author_name}</p>
                        {testimonial.author_company && (
                          <span className="text-xs text-gray-500">{testimonial.author_company}</span>
                        )}
                      </div>
                      {testimonial.rating !== null && (
                        <div className="mt-1 flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`size-3 ${
                                i < (testimonial.rating ?? 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {testimonial.content}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(testimonial.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 bg-yellow-100 text-yellow-800 border-yellow-300">
                      {t.common.pending}
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
