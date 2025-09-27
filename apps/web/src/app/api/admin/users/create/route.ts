import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, firstName, lastName, phone, tenantName, role = 'USER', trialDays = 30 } = body

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, firstName, and lastName are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi giriniz' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanımda' },
        { status: 400 }
      )
    }

    // Generate a temporary password (user should change it on first login)
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Calculate trial end date
    const now = new Date()
    const trialStartDate = now
    const trialEndDate = new Date()
    trialEndDate.setDate(now.getDate() + trialDays)

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role,
status: 'PENDING_VERIFICATION', // New users need approval first
        trialStartDate,
        trialEndDate,
        extraTrialDays: 0,
        tenantId: tenantName || null, // Using tenantId field for company name for now
        emailVerifiedAt: new Date(), // Email verified since created by admin
        preferences: '{}',
        profile: '{}',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('New user created by admin:', {
      id: newUser.id,
      email: newUser.email,
      name: `${newUser.firstName} ${newUser.lastName}`,
      role: newUser.role,
      tempPassword // Log temp password for admin to share with user
    })

    return NextResponse.json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        trialEndDate: newUser.trialEndDate,
        tenantName: newUser.tenantId
      },
      tempPassword // Return temp password so admin can share with user
    })

  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}