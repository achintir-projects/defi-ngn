import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { address, type, connectionMethod } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Check if wallet already exists
    let wallet = await db.userWallet.findUnique({
      where: { address }
    })

    if (wallet) {
      return NextResponse.json({
        success: true,
        wallet: {
          address: wallet.address,
          type: wallet.type,
          chain: wallet.chain,
          isConnected: wallet.isConnected,
          connectionMethod: wallet.connectionMethod
        }
      })
    }

    // Create new wallet
    wallet = await db.userWallet.create({
      data: {
        address,
        type: type || 'manual',
        chain: 'Custom Network',
        isConnected: true,
        connectionMethod: connectionMethod || 'manual'
      }
    })

    return NextResponse.json({
      success: true,
      wallet: {
        address: wallet.address,
        type: wallet.type,
        chain: wallet.chain,
        isConnected: wallet.isConnected,
        connectionMethod: wallet.connectionMethod
      }
    })

  } catch (error) {
    console.error('Error creating wallet:', error)
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const wallets = await db.userWallet.findMany({
      include: {
        tokenBalances: {
          include: {
            tokenConfig: true
          }
        }
      }
    })

    const walletsWithBalances = wallets.map(wallet => ({
      address: wallet.address,
      type: wallet.type,
      chain: wallet.chain,
      isConnected: wallet.isConnected,
      connectionMethod: wallet.connectionMethod,
      balances: wallet.tokenBalances.map(balance => ({
        tokenSymbol: balance.tokenSymbol,
        balance: balance.balance,
        forcedPrice: balance.tokenConfig.forcedPrice,
        realPrice: balance.tokenConfig.currentPrice,
        value: balance.balance * balance.tokenConfig.forcedPrice
      }))
    }))

    return NextResponse.json({
      success: true,
      wallets: walletsWithBalances
    })

  } catch (error) {
    console.error('Error fetching wallets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Delete wallet token balances first
    await db.walletTokenBalance.deleteMany({
      where: { walletAddress: address }
    })

    // Delete wallet
    await db.userWallet.delete({
      where: { address }
    })

    return NextResponse.json({
      success: true,
      message: 'Wallet deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting wallet:', error)
    return NextResponse.json(
      { error: 'Failed to delete wallet' },
      { status: 500 }
    )
  }
}