import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Debug API is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      message: 'Debug POST received',
      receivedBody: body,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries())
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error parsing JSON',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 400 });
  }
}