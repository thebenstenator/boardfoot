'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface FeedbackButtonProps {
  userEmail: string
}

export function FeedbackButton({ userEmail }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
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
        setOpen(false)
        setStatus('idle')
      }, 2000)
    } else {
      setStatus('error')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Send feedback"
      >
        Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Send feedback</h2>
              <button
                onClick={() => setOpen(false)}
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Sending as <span className="font-medium">{userEmail}</span>
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's working, what's broken, what's missing..."
                    rows={5}
                    required
                    autoFocus
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none
                               focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-destructive">
                    Something went wrong — try emailing boardfootfeedback@gmail.com directly.
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
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
