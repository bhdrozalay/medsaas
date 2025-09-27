import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-in-production'
)

export interface JWTPayload {
  userId: string
  email: string
  role: string
  tenantId: string | null
  exp?: number
  iat?: number
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function signJWT(payload: Omit<JWTPayload, 'exp' | 'iat'>, expiresIn: string = '1h'): Promise<string> {
  const jwt = new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    
  // Parse expiresIn string to seconds
  let expirationTime: string
  if (expiresIn === '7d') {
    expirationTime = '7d'
  } else if (expiresIn === '1h') {
    expirationTime = '1h'
  } else {
    expirationTime = expiresIn
  }
  
  jwt.setExpirationTime(expirationTime)
  
  return await jwt.sign(secret)
}