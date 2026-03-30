import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FeedbackButton } from "@/components/shared/FeedbackButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          <div className="flex items-center gap-6">
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

          <div className="flex items-center gap-4">
            <FeedbackButton userEmail={user.email ?? ''} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">
                    {profile?.display_name ?? "Account"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                  {isPro && (
                    <span className="text-xs text-primary font-medium">
                      Pro
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/overhead" className="cursor-pointer">
                  Shop settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/billing" className="cursor-pointer">
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/auth/signout" method="post" className="w-full">
                  <button
                    type="submit"
                    className="cursor-pointer w-full text-left text-sm text-destructive"
                  >
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
