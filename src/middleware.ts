import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequestEdge } from '@/lib/auth-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('.') && !pathname.includes('/api/')
  ) {
    return NextResponse.next()
  }

  // Only protect API routes (except auth routes)
  if (pathname.startsWith('/api/')) {
    const publicApiRoutes = ['/api/auth/']
    const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

    if (!isPublicApiRoute) {
      const user = await getUserFromRequestEdge(request)

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
