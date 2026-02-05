import { NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request. url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
        console.log("Google Access Token:", data.session.provider_token);
        console.log("Google Refresh Token:", data.session.provider_refresh_token);

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions if something goes wrong
  return NextResponse.redirect(`${origin}/login-error`)
}