import Link from "next/link";
import {
  MessageSquareHeart,
  Sparkles,
  Code2,
  Star,
  Users,
  Clock,
  Check,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n/server";

export default async function LandingPage() {
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    // ignore
  }

  const t = await getDict();

  return (
    <div>
      {/* Hero */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Sparkles className="size-4" />
            {t.landing.badge}
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            {t.landing.hero_title_1}{" "}
            <span className="text-indigo-600">{t.landing.hero_title_2}</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            {t.landing.hero_desc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                {t.nav.go_to_dashboard} <ArrowRight className="size-5" />
              </Link>
            ) : (
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                {t.landing.start_free} <ArrowRight className="size-5" />
              </Link>
            )}
            <Link
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              {t.landing.see_how}
            </Link>
          </div>
        </div>

        {/* Mock Wall of Love */}
        <div className="max-w-5xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: t.landing.demo_1_name, role: t.landing.demo_1_role, text: t.landing.demo_1_text, rating: 5 },
            { name: t.landing.demo_2_name, role: t.landing.demo_2_role, text: t.landing.demo_2_text, rating: 5 },
            { name: t.landing.demo_3_name, role: t.landing.demo_3_role, text: t.landing.demo_3_text, rating: 5 },
          ].map((d, i) => (
            <div key={i} className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: d.rating }).map((_, j) => (
                  <Star key={j} className="size-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-4">&ldquo;{d.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
                  {d.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {t.landing.features_title}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto">
            {t.landing.features_desc}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquareHeart,
                title: t.landing.feature_1_title,
                desc: t.landing.feature_1_desc,
              },
              {
                icon: Sparkles,
                title: t.landing.feature_2_title,
                desc: t.landing.feature_2_desc,
              },
              {
                icon: Code2,
                title: t.landing.feature_3_title,
                desc: t.landing.feature_3_desc,
              },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border">
                <div className="size-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                  <f.icon className="size-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-8 font-medium uppercase tracking-wider">
            {t.landing.trusted}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: MessageSquareHeart, value: t.landing.stat_1_value, label: t.landing.stat_1_label },
              { icon: Users, value: t.landing.stat_2_value, label: t.landing.stat_2_label },
              { icon: Clock, value: t.landing.stat_3_value, label: t.landing.stat_3_label },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <s.icon className="size-5 text-indigo-600 mb-2" />
                <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {t.landing.pricing_title}
          </h2>
          <p className="text-center text-gray-600 mb-12">
            {t.landing.pricing_desc}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-xl border p-8">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{t.pricing.free_title}</h3>
              <p className="text-sm text-gray-500 mb-4">{t.pricing.free_desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {t.pricing.free_landing_features.map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="size-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                {t.nav.get_started}
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-xl border-2 border-indigo-600 p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                {t.pricing.most_popular}
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{t.pricing.pro_title}</h3>
              <p className="text-sm text-gray-500 mb-4">{t.pricing.pro_desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$9.9</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {t.pricing.pro_landing_features.map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="size-4 text-indigo-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=pro"
                className="block w-full text-center bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                {t.pricing.start_pro}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t.landing.cta_title}
          </h2>
          <p className="text-gray-600 mb-8">
            {t.landing.cta_desc}
          </p>
          <Link
            href={isLoggedIn ? "/dashboard" : "/signup"}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            {isLoggedIn ? t.nav.go_to_dashboard : t.nav.get_started} <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
