'use client'
import { useState } from 'react'
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
import { Button } from '@/components/ui/button'

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
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('sending')

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    if (res.ok) {
      setStatus('sent')
      setMessage('')
      setTimeout(() => {
        setFeedbackOpen(false)
        setStatus('idle')
      }, 2000)
    } else {
      setStatus('error')
    }
  }

  return (
    <>
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
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => setFeedbackOpen(true)}
          >
            Feedback
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

      {/* Feedback modal — rendered outside dropdown so it survives dropdown close */}
      {feedbackOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFeedbackOpen(false)
          }}
        >
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Send feedback</h2>
              <button
                onClick={() => setFeedbackOpen(false)}
                aria-label="Close feedback"
                className="text-muted-foreground hover:text-foreground text-xl leading-none focus:outline-none"
              >
                ✕
              </button>
            </div>

            {status === 'sent' ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                Thanks for the feedback!
              </p>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  I read every message personally and will do my best to respond
                  within 48 hours. I&apos;ll try to implement all the suggestions
                  I can. Your feedback is invaluable for developing this into a
                  tool woodworkers actually want to use.
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Sending as <span className="font-medium">{email}</span>
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's working, what's broken, what's missing..."
                    rows={5}
                    required
                    autoFocus
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-destructive">
                    Something went wrong — try emailing boardfootfeedback@gmail.com directly.
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setFeedbackOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={status === 'sending' || !message.trim()}>
                    {status === 'sending' ? 'Sending...' : 'Send feedback'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
