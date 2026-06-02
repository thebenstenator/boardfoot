import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const FEEDBACK_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour between submissions per user

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, subscription_tier, last_feedback_sent_at')
    .eq('id', user.id)
    .single()

  // MEDIUM: Rate-limit to one submission per hour to prevent inbox flooding.
  if (profile?.last_feedback_sent_at) {
    const elapsed = Date.now() - new Date(profile.last_feedback_sent_at).getTime()
    if (elapsed < FEEDBACK_COOLDOWN_MS) {
      const retryAfterSec = Math.ceil((FEEDBACK_COOLDOWN_MS - elapsed) / 1000)
      return NextResponse.json(
        { error: 'Too many requests — please wait before sending more feedback.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      )
    }
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'BoardFoot Feedback <onboarding@resend.dev>'

  const { error } = await resend.emails.send({
    from,
    to: process.env.FEEDBACK_TO_EMAIL ?? 'thebenstenator@gmail.com',
    subject: `BoardFoot feedback from ${profile?.display_name ?? user.email}`,
    text: [
      `From: ${profile?.display_name ?? '(no name)'} <${user.email}>`,
      `Plan: ${profile?.subscription_tier ?? 'free'}`,
      `User ID: ${user.id}`,
      '',
      message.trim(),
    ].join('\n'),
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  // Record send time via SECURITY DEFINER RPC — last_feedback_sent_at is a
  // protected column that authenticated clients cannot write directly.
  await supabase.rpc('record_feedback_sent', { user_uuid: user.id })

  return NextResponse.json({ ok: true })
}
