import Link from "next/link";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n/server";

export default async function PricingPage() {
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
    <div className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
          {t.pricing.title}
        </h1>
        <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto">
          {t.pricing.desc}
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
              {t.pricing.free_features.map((f: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="size-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={isLoggedIn ? "/dashboard" : "/signup"}
              className="block w-full text-center border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              {isLoggedIn ? t.nav.go_to_dashboard : t.nav.get_started}
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
              {t.pricing.pro_features.map((f: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="size-4 text-indigo-600 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={isLoggedIn ? "/settings" : "/signup?plan=pro"}
              className="block w-full text-center bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              {isLoggedIn ? t.pricing.upgrade_now : t.pricing.start_pro}
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">{t.pricing.need_more}</h3>
          <p className="text-sm text-gray-500">
            {t.pricing.contact_us}{" "}
            <a href="mailto:hello@testispark.com" className="text-indigo-600 hover:underline">
              hello@testispark.com
            </a>{" "}
            {t.pricing.enterprise_desc}
          </p>
        </div>
      </div>
    </div>
  );
}
