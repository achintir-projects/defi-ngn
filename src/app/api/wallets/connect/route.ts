import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, walletType, walletAddress, connectionMethod = 'manual' } = await request.json()

    // Validate required fields
    if (!userId || !walletType || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate wallet address format
    if (!isValidWalletAddress(walletAddress, walletType)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
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

    // Check if wallet is already connected for this user
    const existingWallet = await db.userWallet.findFirst({
      where: {
        userId,
        address: walletAddress,
        type: walletType
      }
    })

    if (existingWallet) {
      // Update existing wallet connection
      const updatedWallet = await db.userWallet.update({
        where: { id: existingWallet.id },
        data: {
          isConnected: true,
          lastConnectedAt: new Date(),
          connectionMethod
        }
      })

      return NextResponse.json({
        success: true,
        wallet: updatedWallet,
        message: 'Wallet reconnected successfully'
      })
    }

    // Create new wallet connection
    const newWallet = await db.userWallet.create({
      data: {
        userId,
        type: walletType,
        address: walletAddress,
        isConnected: true,
        connectionMethod,
        lastConnectedAt: new Date()
      }
    })

    // Log the connection event
    await db.transaction.create({
      data: {
        type: 'wallet_connection',
        status: 'completed',
        amount: 0,
        tokenSymbol: 'N/A',
        fromAddress: userId,
        toAddress: walletAddress,
        chain: getWalletChain(walletType),
        forcedPrice: 0,
        realPrice: 0,
        value: 0,
        isGasless: true,
        userId
      }
    })

    return NextResponse.json({
      success: true,
      wallet: newWallet,
      message: 'Wallet connected successfully'
    })

  } catch (error) {
    console.error('Wallet connection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to validate wallet address format
function isValidWalletAddress(address: string, walletType: string): boolean {
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address
  
  // Check if address is valid hex string
  if (!/^[0-9a-fA-F]+$/.test(cleanAddress)) {
    return false
  }

  // Check length based on wallet type
  switch (walletType.toLowerCase()) {
    case 'metamask':
    case 'trustwallet':
    case 'bybit':
    case 'coinbase':
      // Ethereum-style addresses (20 bytes = 40 hex chars)
      return cleanAddress.length === 40
    
    case 'phantom':
      // Solana-style addresses (32 bytes = 64 hex chars)
      return cleanAddress.length === 64
    
    default:
      // Default to Ethereum-style address
      return cleanAddress.length === 40
  }
}

// Helper function to get default chain for wallet type
function getWalletChain(walletType: string): string {
  switch (walletType.toLowerCase()) {
    case 'metamask':
    case 'trustwallet':
    case 'bybit':
    case 'coinbase':
      return 'Ethereum'
    
    case 'phantom':
      return 'Solana'
    
    default:
      return 'Ethereum'
  }
}