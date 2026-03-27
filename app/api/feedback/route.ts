import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
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
    .select('display_name, subscription_tier')
    .eq('id', user.id)
    .single()

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

  return NextResponse.json({ ok: true })
}
