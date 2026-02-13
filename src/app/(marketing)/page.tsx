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

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Sparkles className="size-4" />
            AI-Powered Testimonial Platform
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Collect & Showcase{" "}
            <span className="text-indigo-600">Customer Love</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            The easiest way to collect testimonials from your customers and
            display them beautifully on your website. Boost conversions with
            authentic social proof.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Start Free <ArrowRight className="size-5" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              See How It Works
            </Link>
          </div>
        </div>

        {/* Mock Wall of Love */}
        <div className="max-w-5xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: "Sarah Chen", role: "CEO at TechCo", text: "TestiGlow transformed how we collect customer feedback. Our conversion rate increased by 40%!", rating: 5 },
            { name: "Marcus Johnson", role: "Founder, DevStudio", text: "Simple, beautiful, and effective. We went from zero social proof to a stunning Wall of Love in minutes.", rating: 5 },
            { name: "Emily Rodriguez", role: "Marketing Lead", text: "The AI highlights feature saves us hours. It automatically pulls the best quotes from long testimonials.", rating: 5 },
          ].map((t, i) => (
            <div key={i} className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="size-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
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
            Everything you need
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto">
            From collection to display, TestiGlow handles the entire testimonial lifecycle.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquareHeart,
                title: "Collect with Ease",
                desc: "Create custom forms, share a link, done. Customers submit testimonials in seconds.",
              },
              {
                icon: Sparkles,
                title: "AI-Powered Highlights",
                desc: "AI extracts the most impactful quotes and auto-tags testimonials for easy organization.",
              },
              {
                icon: Code2,
                title: "Embed Anywhere",
                desc: "One line of code. Beautiful Wall of Love widget that matches your brand.",
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
            Trusted by growing businesses
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: MessageSquareHeart, value: "2,000+", label: "Testimonials Collected" },
              { icon: Users, value: "35%", label: "Avg. Conversion Boost" },
              { icon: Clock, value: "< 2 min", label: "Setup Time" },
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
            Simple pricing
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Start free. Upgrade when you need more.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-xl border p-8">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">Free</h3>
              <p className="text-sm text-gray-500 mb-4">Perfect to get started</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Up to 15 testimonials",
                  "1 collection form",
                  "Wall of Love widget",
                  "\"Powered by TestiGlow\" badge",
                  "Email support",
                ].map((f, i) => (
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
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-xl border-2 border-indigo-600 p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-1">Pro</h3>
              <p className="text-sm text-gray-500 mb-4">For growing businesses</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$19</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited testimonials",
                  "Unlimited forms",
                  "AI highlights & tags",
                  "Remove branding",
                  "Priority support",
                  "Custom widget themes",
                ].map((f, i) => (
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
                Start Pro Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to collect your first testimonial?
          </h2>
          <p className="text-gray-600 mb-8">
            Join hundreds of businesses using TestiGlow to boost conversions with social proof.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Get Started Free <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
