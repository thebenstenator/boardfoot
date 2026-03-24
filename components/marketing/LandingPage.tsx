import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg">BoardFoot</span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
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
      <section className="max-w-5xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="inline-block bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full border border-primary/20">
          Free to start — no credit card required
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          Measure twice,
          <br />
          price once.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          BoardFoot is a bill of materials planner for woodworkers. Calculate
          board feet, track hardware and consumables, and know exactly what your
          project costs before you buy a single board.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link href="/signup">
            <Button size="lg" className="cursor-pointer">
              Start planning for free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="cursor-pointer">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

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
            {
              icon: "📄",
              title: "Print-ready PDF export",
              description:
                "Generate a clean BOM report to bring to the lumber yard or attach to a client quote. Free tier includes a branded PDF.",
            },
            {
              icon: "🪵",
              title: "Species price database",
              description:
                "Built-in price estimates for 30+ wood species. Override with your local prices and they're remembered for every future project.",
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
            <div className="border rounded-lg p-6 space-y-4 bg-background">
              <div>
                <p className="font-semibold text-lg">Free</p>
                <p className="text-3xl font-bold mt-1">$0</p>
                <p className="text-sm text-muted-foreground">forever</p>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  "3 saved projects",
                  "Full BOM calculator",
                  "Board foot + waste math",
                  "Hardware & consumables tracking",
                  "Live cost summary",
                  "Branded PDF export",
                  "Species price database",
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
            <div className="border border-primary rounded-lg p-6 space-y-4 bg-background relative">
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
              <ul className="space-y-2 text-sm">
                {[
                  "Everything in Free",
                  "Unlimited projects",
                  "Clean unbranded PDF export",
                  "Labor & overhead tracking",
                  "Suggested retail + Etsy pricing",
                  "Shopping list export by store",
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
                  Start free trial
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

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 BoardFoot</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
