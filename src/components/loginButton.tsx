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
        redirectTo: `${window.location.origin}/auth/callback`,
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
      className="bg-white text-gray-700 font-semibold py-2 px-4 border border-gray-400 rounded shadow hover:bg-gray-100 transition"
    >
      Sign in with Google
    </button>
  )
}