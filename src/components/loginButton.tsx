'use client'

import { createClient } from '../utils/supabase/client'

export default function LoginButton() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email',
        // this tells google where to send the user after they log in
        redirectTo: `${window.location.origin}/auth/callback?next=/home`,
        // asks for permanent access to google calendar
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <button 
      onClick={handleLogin}
      className="bg-wild-berry text-ivory-cream px-10 py-4 rounded-full font-maitree text-lg hover:scale-105 transition-transform"
    >
      sign in with google
    </button>
  )
}