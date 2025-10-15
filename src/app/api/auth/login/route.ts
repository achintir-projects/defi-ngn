import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { provider, token, userInfo } = await request.json()

    if (!provider || !token || !userInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate the token with the provider (mock implementation)
    // In a real implementation, you would verify the token with Google, Apple, or Facebook
    const isValidToken = await validateSocialToken(provider, token)
    
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { email: userInfo.email }
    })

    if (!user) {
      user = await db.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          // Create default wallet address for the user
          wallets: {
            create: {
              address: generateWalletAddress(),
              type: 'internal',
              chain: 'Ethereum',
              isConnected: true
            }
          }
        },
        include: {
          wallets: true
        }
      })
    }

    // Update last login time
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Create session token (JWT in real implementation)
    const sessionToken = generateSessionToken(user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin || false,
        wallets: user.wallets
      },
      sessionToken
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions (mock implementations)
async function validateSocialToken(provider: string, token: string): Promise<boolean> {
  // In a real implementation, you would:
  // - For Google: Use Google OAuth2 client to verify the token
  // - For Apple: Use Apple Sign In verification
  // - For Facebook: Use Facebook Graph API to verify the token
  
  // For demo purposes, we'll accept any non-empty token
  return token.length > 0
}

function generateWalletAddress(): string {
  // Generate a random Ethereum-style address
  return '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
}

function generateSessionToken(userId: string): string {
  // In a real implementation, you would sign a JWT token
  return `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}