import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import parallelMiddleware from './app/server/middlewares/parallel'

export function middleware(request:NextRequest) {
  const route = request.nextUrl.pathname
  const origin = request.nextUrl.origin
  if (route.startsWith('/routes/random')) {
      return NextResponse.redirect(new URL('/', request.url))
  }
  if (route.startsWith('/routes/parallel')) {
      return parallelMiddleware(request,origin)
  }
}
