import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { EmailCapture } from "@/components/marketing/EmailCapture";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero with background image */}
      <div className="relative">
        <Image
          src="/hero-background.webp"
          alt=""
          fill
          className="object-cover object-[center_70%]"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* Nav */}
        <nav className="relative z-10">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <span className="font-bold text-lg text-white">BoardFoot</span>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm text-white/70 hover:text-white"
              >
                Sign in
              </Link>
              <Link href="/signup">
                <Button size="sm" className="cursor-pointer">
                  Get started free
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 py-24 text-center space-y-6">
          <div className="inline-block bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20">
            Free to start — no credit card required
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white">
            Measure twice,
            <br />
            price once.
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            BoardFoot is a bill of materials planner for woodworkers. Calculate
            board feet, track hardware and consumables, and know exactly what
            your project costs before you buy a single board.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link href="/signup">
              <Button size="lg" className="cursor-pointer">
                Start planning for free
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="cursor-pointer text-white border-white/40 hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Problem */}
      <section className="border-y bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl font-bold">
            Stop guessing. Stop overspending.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Most woodworkers plan projects in their head or on a napkin, show up
            at the lumber yard, and end up buying too much — or worse, not
            enough. BoardFoot gives you a complete cost estimate before you
            spend a dollar.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything in one place
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: "📐",
              title: "Accurate board foot math",
              description:
                "Automatic board foot calculations with nominal-to-actual conversion. Waste factor uses margin math, not additive markup — so you actually buy enough.",
            },
            {
              icon: "🔩",
              title: "Full bill of materials",
              description:
                "Track lumber, hardware, and consumables in one project. See your complete material cost at a glance, updated in real time as you add items.",
            },
            {
              icon: "✨",
              title: "AI BOM generator",
              description:
                "Describe your project in plain English and let AI draft your bill of materials. Edit, refine, and add to your project in seconds instead of minutes.",
            },
            {
              icon: "🪚",
              title: "Cut list optimizer",
              description:
                "Automatically pack your cut pieces onto stock boards using bin-packing to minimize waste. Visual diagrams show exactly how to cut each board.",
            },
            {
              icon: "💰",
              title: "Know your true COGS",
              description:
                "Add labor hours and overhead to see your real cost of goods sold. Get a suggested retail price and Etsy listing price with fees already calculated.",
            },
            {
              icon: "🛒",
              title: "Shopping list by store",
              description:
                "Export a shopping list grouped by lumber yard, big box store, and specialty shop. Make one efficient trip and buy exactly what you need.",
            },
          ].map((feature) => (
            <div key={feature.title} className="space-y-3">
              <div className="text-3xl">{feature.icon}</div>
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple pricing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="border rounded-lg p-6 flex flex-col gap-4 bg-background">
              <div>
                <p className="font-semibold text-lg">Free</p>
                <p className="text-3xl font-bold mt-1">$0</p>
                <p className="text-sm text-muted-foreground">forever</p>
              </div>
              <ul className="space-y-2 text-sm flex-1">
                {[
                  "3 saved projects",
                  "Full BOM calculator",
                  "Board foot + waste math",
                  "Hardware & consumables tracking",
                  "Live cost summary",
                  "Cut list + stock layout optimizer",
                  "Branded PDF & shopping list export",
                  "Species price database",
                  "3 photo attachments per project",
                  "5 AI BOM generations",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full cursor-pointer">
                  Get started free
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="border border-primary rounded-lg p-6 flex flex-col gap-4 bg-background relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most popular
                </span>
              </div>
              <div>
                <p className="font-semibold text-lg">Pro</p>
                <p className="text-3xl font-bold mt-1">
                  $9
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">cancel anytime</p>
              </div>
              <ul className="space-y-2 text-sm flex-1">
                {[
                  "Everything in Free",
                  "Unlimited projects",
                  "Unlimited AI BOM generation",
                  "Clean unbranded PDF & shopping list export",
                  "Labor & overhead tracking",
                  "Suggested retail + Etsy pricing",
                  "Unlimited photo attachments",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button className="w-full cursor-pointer">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-24 text-center space-y-6">
        <h2 className="text-4xl font-bold">
          Ready to price your next project?
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Join woodworkers who plan smarter with BoardFoot. Free to start, no
          credit card required.
        </p>
        <Link href="/signup">
          <Button size="lg" className="cursor-pointer">
            Get started free
          </Button>
        </Link>
      </section>

      <EmailCapture />

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 BoardFoot</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/cookie-policy" className="hover:text-foreground">
              Cookie Policy
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
