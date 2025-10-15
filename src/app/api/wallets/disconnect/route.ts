import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, walletId } = await request.json()

    // Validate required fields
    if (!userId || !walletId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find the wallet to disconnect
    const wallet = await db.userWallet.findFirst({
      where: {
        id: walletId,
        userId
      }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Disconnect the wallet
    const disconnectedWallet = await db.userWallet.update({
      where: { id: walletId },
      data: {
        isConnected: false,
        lastDisconnectedAt: new Date()
      }
    })

    // Log the disconnection event
    await db.transaction.create({
      data: {
        type: 'wallet_disconnection',
        status: 'completed',
        amount: 0,
        tokenSymbol: 'N/A',
        fromAddress: userId,
        toAddress: wallet.address,
        chain: wallet.chain,
        forcedPrice: 0,
        realPrice: 0,
        value: 0,
        isGasless: true,
        userId
      }
    })

    return NextResponse.json({
      success: true,
      wallet: disconnectedWallet,
      message: 'Wallet disconnected successfully'
    })

  } catch (error) {
    console.error('Wallet disconnection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}