import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => cookieStore.set(name, value, options),
          remove: (name, options) => cookieStore.set(name, '', { ...options, maxAge: 0 }),
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Password-recovery links land here too — send those to the page where
  // the user actually sets a new password, instead of straight to the app.
  const destination = type === 'recovery' ? '/reset-password' : '/dashboard';
  return NextResponse.redirect(`${origin}${destination}`);
}
