import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, tokenSymbol, amount, forcedPrice } = await request.json()

    if (!walletAddress || !tokenSymbol || !amount || !forcedPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if wallet exists
    let wallet = await db.userWallet.findUnique({
      where: { address: walletAddress }
    })

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await db.userWallet.create({
        data: {
          address: walletAddress,
          type: 'manual',
          chain: 'Custom Network',
          isConnected: true,
          connectionMethod: 'manual'
        }
      })
    }

    // Check if token config exists
    let tokenConfig = await db.tokenConfig.findUnique({
      where: { symbol: tokenSymbol }
    })

    if (!tokenConfig) {
      return NextResponse.json(
        { error: 'Token configuration not found' },
        { status: 404 }
      )
    }

    // Check if wallet token balance exists
    let walletToken = await db.walletTokenBalance.findUnique({
      where: {
        walletAddress_tokenSymbol: {
          walletAddress: walletAddress,
          tokenSymbol: tokenSymbol
        }
      }
    })

    if (walletToken) {
      // Update existing balance
      walletToken = await db.walletTokenBalance.update({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress: walletAddress,
            tokenSymbol: tokenSymbol
          }
        },
        data: {
          balance: {
            increment: parseFloat(amount)
          },
          lastUpdated: new Date()
        }
      })
    } else {
      // Create new balance
      walletToken = await db.walletTokenBalance.create({
        data: {
          walletAddress: walletAddress,
          tokenSymbol: tokenSymbol,
          balance: parseFloat(amount),
          frozenBalance: 0,
          lastUpdated: new Date()
        }
      })
    }

    // Update token forced price if different
    if (parseFloat(forcedPrice) !== tokenConfig.forcedPrice) {
      await db.tokenConfig.update({
        where: { symbol: tokenSymbol },
        data: { forcedPrice: parseFloat(forcedPrice) }
      })
    }

    // Create transaction record
    await db.transaction.create({
      data: {
        type: 'injection',
        status: 'completed',
        amount: parseFloat(amount),
        tokenSymbol: tokenSymbol,
        tokenName: tokenConfig.name,
        fromAddress: 'SYSTEM',
        toAddress: walletAddress,
        hash: `admin_injection_${Date.now()}`,
        chain: 'Custom Network',
        forcedPrice: parseFloat(forcedPrice),
        realPrice: tokenConfig.currentPrice,
        value: parseFloat(amount) * parseFloat(forcedPrice),
        isGasless: true,
        confirmations: 1,
        requiredConfirmations: 1,
        completedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      balance: walletToken.balance,
      forcedPrice: parseFloat(forcedPrice),
      value: walletToken.balance * parseFloat(forcedPrice)
    })

  } catch (error) {
    console.error('Error injecting tokens:', error)
    return NextResponse.json(
      { error: 'Failed to inject tokens' },
      { status: 500 }
    )
  }
}