'use client'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  initials: string
  displayName: string | null
  email: string
  isPro: boolean
}

const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'slate', label: 'Slate' },
  { id: 'walnut', label: 'Walnut' },
] as const

export function UserMenu({ initials, displayName, email, isPro }: UserMenuProps) {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring">
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold">{displayName ?? 'Account'}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            {isPro && (
              <span className="text-xs text-primary font-medium">Pro</span>
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
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground mb-1.5">Theme</p>
          <div className="flex gap-1">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex-1 text-xs py-1 rounded transition-colors ${
                  theme === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

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
  )
}
