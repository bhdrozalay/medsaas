import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({
      message: 'Çıkış başarılı'
    })

    // Cookie'yi temizle
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Hemen expire et
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: 'Çıkış işlemi sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}