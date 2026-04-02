import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FeedbackButton } from "@/components/shared/FeedbackButton";
import { UserMenu } from "@/components/shared/UserMenu";

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, subscription_tier")
    .eq("id", user.id)
    .single();

  const initials = getInitials(
    profile?.display_name ?? null,
    user.email ?? null,
  );
  const isPro = profile?.subscription_tier === "pro";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/dashboard"
              className="font-bold text-lg hover:opacity-80 transition-opacity"
            >
              BoardFoot
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/templates"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Templates
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <FeedbackButton userEmail={user.email ?? ''} />
            <UserMenu
              initials={initials}
              displayName={profile?.display_name ?? null}
              email={user.email ?? ''}
              isPro={isPro}
            />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
