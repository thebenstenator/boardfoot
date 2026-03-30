'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setStatus(res.ok ? 'success' : 'error')
  }

  return (
    <section className="border-t">
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold">Stay in the loop</h2>
        <p className="text-muted-foreground">
          Get notified when new features launch. No spam, unsubscribe anytime.
        </p>

        {status === 'success' ? (
          <p className="text-green-500 font-medium">You&apos;re on the list!</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending…' : 'Notify me'}
            </Button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-destructive text-sm">Something went wrong — try again.</p>
        )}

        <p className="text-xs text-muted-foreground">
          By subscribing you agree to receive product updates from BoardFoot.
          See our{' '}
          <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>
      </div>
    </section>
  )
}
