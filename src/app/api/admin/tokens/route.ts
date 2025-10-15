import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tokens = await db.tokenConfig.findMany({
      where: { status: 'active' }
    })

    return NextResponse.json({
      success: true,
      tokens: tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        description: `${token.name} (${token.tokenType})`,
        type: token.tokenType,
        forcedPrice: token.forcedPrice,
        realPrice: token.currentPrice,
        decimals: token.decimals,
        contractAddress: token.contractAddress
      }))
    })

  } catch (error) {
    console.error('Error fetching tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize default tokens
    const defaultTokens = [
      {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        chain: 'Custom Network',
        tokenType: 'ERC20',
        currentPrice: 1.0,
        forcedPrice: 2.0,
        maxSupply: 1000000000,
        circulatingSupply: 0,
        isAdminControlled: true,
        status: 'active'
      },
      {
        symbol: 'USDT_TRC20',
        name: 'Tether USD (TRC20)',
        decimals: 6,
        chain: 'Custom Network',
        tokenType: 'TRC20',
        currentPrice: 1.0,
        forcedPrice: 2.0,
        maxSupply: 1000000000,
        circulatingSupply: 0,
        isAdminControlled: true,
        status: 'active'
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        chain: 'Custom Network',
        tokenType: 'NATIVE',
        currentPrice: 3000.0,
        forcedPrice: 3500.0,
        maxSupply: 1000000,
        circulatingSupply: 0,
        isAdminControlled: true,
        status: 'active'
      },
      {
        symbol: 'CUSTOM',
        name: 'Platform Token',
        decimals: 18,
        chain: 'Custom Network',
        tokenType: 'ERC20',
        currentPrice: 0.1,
        forcedPrice: 10.0,
        maxSupply: 100000000,
        circulatingSupply: 0,
        isAdminControlled: true,
        status: 'active'
      }
    ]

    for (const token of defaultTokens) {
      try {
        await db.tokenConfig.upsert({
          where: { symbol: token.symbol },
          update: token,
          create: token
        })
      } catch (error) {
        console.error(`Error initializing token ${token.symbol}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Default tokens initialized successfully'
    })

  } catch (error) {
    console.error('Error initializing tokens:', error)
    return NextResponse.json(
      { error: 'Failed to initialize tokens' },
      { status: 500 }
    )
  }
}