import { NextResponse } from 'next/server';
import { PrismaClient } from '@medsas/database';

export async function GET() {
  try {
    // Environment variables kontrolü
    const databaseUrl = process.env.DATABASE_URL;
    
    // Prisma client test
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      databaseUrl: databaseUrl ? 'Found' : 'Not found',
      fullUrl: databaseUrl || 'undefined',
      nodeEnv: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('DATABASE')),
      prismaConnection: 'Success'
    });
  } catch (error) {
    console.error('Test DB error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      prismaConnection: 'Failed'
    }, { status: 500 });
  }
}
