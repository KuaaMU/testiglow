import Link from "next/link";
import { Check } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto">
          Start collecting testimonials for free. Upgrade to Pro for unlimited access and premium features.
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
                "Basic testimonial cards",
                "\"Powered by TestiGlow\" badge",
                "Community support",
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
                "Unlimited collection forms",
                "AI-powered highlights & tags",
                "Remove TestiGlow branding",
                "Custom widget themes",
                "Carousel & badge widgets",
                "Video testimonials",
                "Priority email support",
                "Export to CSV",
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

        <div className="mt-16 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Need more?</h3>
          <p className="text-sm text-gray-500">
            Contact us at{" "}
            <a href="mailto:hello@testiglow.com" className="text-indigo-600 hover:underline">
              hello@testiglow.com
            </a>{" "}
            for custom enterprise plans.
          </p>
        </div>
      </div>
    </div>
  );
}
