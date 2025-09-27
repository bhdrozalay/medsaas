import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signJWT } from '../../../../lib/jwt-edge'
import { prisma } from '@medsas/database'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST LOGIN START ===');

    const body = await request.json()
    console.log('Request body:', body);

    const { email, password } = body;

    // Find user
    console.log('Looking for user:', email);
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    console.log('User found:', !!user);
    if (user) {
      console.log('User details:', {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      });
    }

    if (!user) {
      console.log('No user found');
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check password
    console.log('Checking password...');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
    }

    // Create token
    console.log('Creating JWT token...');
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId
    }, '1h');
    console.log('Token created successfully');

    console.log('=== TEST LOGIN SUCCESS ===');
    return NextResponse.json({
      message: 'Success',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('=== TEST LOGIN ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    return NextResponse.json(
      {
        message: 'Test error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      },
      { status: 500 }
    );
  }
}