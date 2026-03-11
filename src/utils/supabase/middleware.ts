import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: Questo assicura che ci sia almeno una richiesta al server per validare la token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Se cerchiamo di accedere ad admin e NON c'è un utente -> login
  if (url.pathname.startsWith('/admin') && !user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se siamo su login e c'è già un utente -> admin
  if (url.pathname === '/login' && user) {
    url.pathname = '/admin'
    const response = NextResponse.redirect(url)
    // Trasferiamo i cookie settati nella supabaseResponse (es. refresh token) al nuovo redirect
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value)
    })
    return response
  }

  return supabaseResponse
}
