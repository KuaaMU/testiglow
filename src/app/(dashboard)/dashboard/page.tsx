import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, FileText, Code2, Clock, Plus } from "lucide-react";

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
    </div>
  );
}
