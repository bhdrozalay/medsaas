import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from './lib/jwt-edge'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value
  
  // subscription ve checkout sayfalarına TAMAMEN SERBEST ERİŞİM - HİÇBİR KONTROL YOK
  if (request.nextUrl.pathname === '/subscription') {
    console.log('🟢 MIDDLEWARE: Subscription page - FULL ACCESS GRANTED');
    return NextResponse.next()
  }
  
  if (request.nextUrl.pathname === '/checkout') {
    console.log('🟢 MIDDLEWARE: Checkout page - FULL ACCESS GRANTED');
    return NextResponse.next()
  }
  
  // tenant-admin sayfalarını özel kontrol et
  if (request.nextUrl.pathname.startsWith('/tenant-admin')) {
    if (!token) {
      console.log('No token found for tenant-admin, redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    try {
      const decoded = await verifyJWT(token)
      console.log('Tenant-admin middleware: Token decoded, user role:', decoded.role, 'user id:', decoded.userId)

      // TENANT_ADMIN veya ADMIN rolü kontrolü
      if (decoded.role !== 'TENANT_ADMIN' && decoded.role !== 'ADMIN') {
        console.log('User role is not TENANT_ADMIN or ADMIN, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Demo süresi kontrolü - TENANT_ADMIN'ler için özel kontrol
      if (decoded.role === 'TENANT_ADMIN') {
        // User status API'sinden demo süresi durumunu kontrol et
        try {
          const statusResponse = await fetch(`${request.nextUrl.origin}/api/user/status`, {
            headers: {
              'Cookie': `access_token=${token}`
            }
          })

          if (statusResponse.ok) {
            const userData = await statusResponse.json()
            // Demo süresi dolmuşsa subscription sayfasına yönlendir
            if (userData.trialExpired && userData.redirectTo) {
              console.log('TENANT_ADMIN demo trial expired, redirecting to:', userData.redirectTo)
              return NextResponse.redirect(new URL(userData.redirectTo, request.url))
            }
          }
        } catch (statusError) {
          console.log('Error checking user status in middleware:', statusError)
          // Status kontrolü başarısızsa erişime izin ver (fallback)
        }
      }

      console.log('Tenant-admin access granted for user:', decoded.email)
      return NextResponse.next()
    } catch (error) {
      console.log('Tenant-admin token verification error:', error)
      return NextResponse.redirect(new URL('/auth/login?error=invalid-token', request.url))
    }
  }
  
  // Diğer korumalı sayfalar için basit token kontrolü
  const protectedRoutes = ['/dashboard', '/pending-approval']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    try {
      const decoded = await verifyJWT(token)
      console.log('Protected route access for:', decoded.email, 'role:', decoded.role)
    } catch (error) {
      console.log('Token verification error:', error)
      return NextResponse.redirect(new URL('/auth/login?error=invalid-token', request.url))
    }
  }
  
  // pending-approval ve dashboard sayfaları için basit kontrol
  if (request.nextUrl.pathname === '/pending-approval' || request.nextUrl.pathname === '/dashboard') {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    try {
      // JWT token'ı doğrula - detaylı kontroller client-side yapılacak
      await verifyJWT(token)
    } catch (error) {
      console.log('Token verification error:', error)
      return NextResponse.redirect(new URL('/auth/login?error=invalid-token', request.url))
    }
    
    return NextResponse.next()
  }
  
  // Admin rotlarını koru
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('access_token')?.value

    if (!token) {
      console.log('No token found, redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    try {
      // JWT token'ı doğrula
      console.log('Middleware: Verifying token...') // Debug
      const decoded = await verifyJWT(token)
      console.log('Middleware: Token decoded, user role:', decoded.role) // Debug
      
      // Super Admin kontrolü
      if (decoded.role !== 'SUPER_ADMIN') {
        console.log('User is not SUPER_ADMIN, redirecting to unauthorized')
        return NextResponse.redirect(new URL('/auth/login?error=unauthorized', request.url))
      }
      
      console.log('Token verified, user is SUPER_ADMIN, allowing access')
    } catch (error) {
      console.log('Invalid token error:', error) // Detaylı error log
      return NextResponse.redirect(new URL('/auth/login?error=invalid-token', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/pending-approval', '/dashboard', '/tenant-admin/:path*']
}
