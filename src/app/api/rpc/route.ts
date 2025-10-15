import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // This is a mock RPC endpoint for Netlify deployment
    // In a real implementation, this would connect to an actual blockchain node
    // For now, we'll return a basic response to satisfy wallet connection requirements
    
    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method') || 'eth_chainId'
    
    // Handle basic RPC methods that wallets typically call
    switch (method) {
      case 'eth_chainId':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: '0x539' // 1337 in hex
        })
        
      case 'eth_getBlockByNumber':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: {
            number: '0x1',
            hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
            parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            timestamp: '0x1234567890',
            gasLimit: '0x6691b7',
            gasUsed: '0x5208',
            miner: '0x0000000000000000000000000000000000000000',
            difficulty: '0x0',
            totalDifficulty: '0x0',
            transactions: []
          }
        })
        
      case 'eth_getBalance':
        const address = searchParams.get('params')?.[0] || '0x0'
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: '0x0' // Return 0 balance for all addresses
        })
        
      case 'eth_getTransactionCount':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: '0x0' // Return 0 nonce for all addresses
        })
        
      case 'eth_sendRawTransaction':
        // Mock transaction response
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        })
        
      case 'eth_estimateGas':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: '0x5208' // 21000 gas
        })
        
      case 'eth_call':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: '0x' // Return empty result
        })
        
      case 'net_version':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: '1337'
        })
        
      default:
        // Return a generic response for unsupported methods
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: null
        })
    }
  } catch (error) {
    console.error('RPC endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const method = body.method || 'eth_chainId'
    
    // Handle POST requests similar to GET
    switch (method) {
      case 'eth_chainId':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: '0x539' // 1337 in hex
        })
        
      case 'eth_getBlockByNumber':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: {
            number: '0x1',
            hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
            parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            timestamp: '0x1234567890',
            gasLimit: '0x6691b7',
            gasUsed: '0x5208',
            miner: '0x0000000000000000000000000000000000000000',
            difficulty: '0x0',
            totalDifficulty: '0x0',
            transactions: []
          }
        })
        
      case 'eth_getBalance':
        const address = body.params?.[0] || '0x0'
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: '0x0'
        })
        
      case 'eth_getTransactionCount':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: '0x0'
        })
        
      case 'eth_sendRawTransaction':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        })
        
      case 'eth_estimateGas':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: '0x5208'
        })
        
      case 'eth_call':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: '0x'
        })
        
      case 'net_version':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: '1337'
        })
        
      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: null
        })
    }
  } catch (error) {
    console.error('RPC endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}