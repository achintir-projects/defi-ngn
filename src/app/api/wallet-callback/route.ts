import { NextRequest, NextResponse } from 'next/server'
import OffChainTokenService from '@/lib/offChainTokenService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletType = searchParams.get('wallet')
    const address = searchParams.get('address')
    const action = searchParams.get('action')

    // Handle different callback actions
    switch (action) {
      case 'connect':
        if (!walletType || !address) {
          return NextResponse.json(
            { error: 'Missing wallet type or address' },
            { status: 400 }
          )
        }

        // Store the wallet connection
        const tokenService = OffChainTokenService
        try {
          const wallet = await tokenService.getOrCreateWallet(address, walletType, 'mobile_callback')
          
          // Return success response
          return NextResponse.json({
            success: true,
            wallet: {
              address: wallet.address,
              type: wallet.type,
              isConnected: wallet.isConnected
            },
            message: 'Wallet connected successfully'
          })
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to store wallet connection' },
            { status: 500 }
          )
        }

      case 'disconnect':
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address' },
            { status: 400 }
          )
        }

        try {
          const tokenService = OffChainTokenService
          await tokenService.disconnectWallet(address)
          
          return NextResponse.json({
            success: true,
            message: 'Wallet disconnected successfully'
          })
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to disconnect wallet' },
            { status: 500 }
          )
        }

      case 'status':
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address' },
            { status: 400 }
          )
        }

        try {
          const tokenService = OffChainTokenService
          const wallet = await tokenService.getOrCreateWallet(address, 'unknown')
          
          return NextResponse.json({
            success: true,
            wallet: {
              address: wallet.address,
              type: wallet.type,
              isConnected: wallet.isConnected
            }
          })
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to get wallet status' },
            { status: 500 }
          )
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Wallet callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletType, address, action } = body

    // Handle POST requests similar to GET
    switch (action) {
      case 'connect':
        if (!walletType || !address) {
          return NextResponse.json(
            { error: 'Missing wallet type or address' },
            { status: 400 }
          )
        }

        const tokenService = OffChainTokenService
        try {
          const wallet = await tokenService.getOrCreateWallet(address, walletType, 'mobile_callback')
          
          return NextResponse.json({
            success: true,
            wallet: {
              address: wallet.address,
              type: wallet.type,
              isConnected: wallet.isConnected
            },
            message: 'Wallet connected successfully'
          })
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to store wallet connection' },
            { status: 500 }
          )
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Wallet callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}