import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  // MEDIUM: Reject non-path values to prevent open-redirect via the next param.
  const rawNext = requestUrl.searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') ? rawNext : '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // OAuth / email confirmation error — send to login with message
  if (error) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', errorDescription ?? error)
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'Could not confirm your account. The link may have expired.')
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
