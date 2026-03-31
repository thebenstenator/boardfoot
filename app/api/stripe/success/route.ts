import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Re-validate the session server-side before redirecting to dashboard
  // This ensures the Supabase cookie is fresh after returning from Stripe
  const supabase = await createClient()
  await supabase.auth.getUser()

  return NextResponse.redirect(new URL('/dashboard?upgraded=true', request.url), { status: 303 })
}
