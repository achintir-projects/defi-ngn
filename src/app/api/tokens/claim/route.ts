import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { signature, userWallet, tokenSymbol, amount } = await request.json()

    // Validate required fields
    if (!signature || !userWallet || !tokenSymbol || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the signature
    const isValidSignature = await verifyClaimSignature(signature, userWallet, tokenSymbol, amount)
    
    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid or expired signature' },
        { status: 401 }
      )
    }

    // Check if signature has already been used
    const existingClaim = await db.claimSignature.findUnique({
      where: { signature }
    })

    if (existingClaim && existingClaim.used) {
      return NextResponse.json(
        { error: 'Signature already used' },
        { status: 400 }
      )
    }

    // Get token configuration
    const tokenConfig = await db.tokenConfig.findUnique({
      where: { symbol: tokenSymbol }
    })

    if (!tokenConfig) {
      return NextResponse.json(
        { error: 'Token configuration not found' },
        { status: 404 }
      )
    }

    // Check if there's sufficient supply
    if (tokenConfig.circulatingSupply + amount > tokenConfig.maxSupply) {
      return NextResponse.json(
        { error: 'Insufficient token supply' },
        { status: 400 }
      )
    }

    // Process the claim
    const transaction = await db.$transaction(async (prisma) => {
      // Mark signature as used
      await prisma.claimSignature.update({
        where: { signature },
        data: { 
          used: true,
          usedAt: new Date()
        }
      })

      // Create transaction record
      const tx = await prisma.transaction.create({
        data: {
          type: 'claim',
          status: 'completed',
          amount,
          tokenSymbol,
          fromAddress: '0x0000000000000000000000000000000000000000', // System address
          toAddress: userWallet,
          hash: generateTransactionHash(),
          chain: tokenConfig.chain,
          forcedPrice: tokenConfig.forcedPrice,
          realPrice: tokenConfig.currentPrice,
          value: amount * tokenConfig.forcedPrice,
          isGasless: true,
          confirmations: 1,
          requiredConfirmations: 1
        }
      })

      // Update token circulating supply
      await prisma.tokenConfig.update({
        where: { symbol: tokenSymbol },
        data: {
          circulatingSupply: {
            increment: amount
          },
          updatedAt: new Date()
        }
      })

      return tx
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        hash: transaction.hash,
        amount,
        tokenSymbol,
        value: transaction.value,
        status: 'completed'
      }
    })

  } catch (error) {
    console.error('Token claim error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to verify claim signature
async function verifyClaimSignature(signature: string, userWallet: string, tokenSymbol: string, amount: number): Promise<boolean> {
  try {
    // Find the claim signature
    const claimSignature = await db.claimSignature.findUnique({
      where: { signature }
    })

    if (!claimSignature) {
      return false
    }

    // Check if signature is expired
    if (new Date() > new Date(claimSignature.expiry)) {
      return false
    }

    // Verify signature matches the expected parameters
    // In a real implementation, you would cryptographically verify the signature
    return (
      claimSignature.userWallet === userWallet &&
      claimSignature.tokenSymbol === tokenSymbol &&
      claimSignature.amount === amount &&
      !claimSignature.used
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// Helper function to generate transaction hash
function generateTransactionHash(): string {
  return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
}