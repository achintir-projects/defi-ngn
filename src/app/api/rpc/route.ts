import { NextRequest, NextResponse } from 'next/server'
import blockchainService from '@/lib/blockchainService'

// Initialize blockchain service
let blockchainInitialized = false

async function ensureBlockchainInitialized() {
  if (!blockchainInitialized) {
    await blockchainService.initialize()
    blockchainInitialized = true
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureBlockchainInitialized()
    
    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method') || 'eth_chainId'
    
    // Handle RPC methods using blockchain service
    switch (method) {
      case 'eth_chainId':
        const chainId = await blockchainService.eth_chainId()
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: chainId
        })
        
      case 'eth_getBlockByNumber':
        const blockNumber = searchParams.get('params')?.[0] || 'latest'
        const includeTransactions = searchParams.get('params')?.[1] === 'true'
        const block = await blockchainService.eth_getBlockByNumber(blockNumber, includeTransactions)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: block
        })
        
      case 'eth_getBalance':
        const address = searchParams.get('params')?.[0] || '0x0'
        const balanceBlockNumber = searchParams.get('params')?.[1] || 'latest'
        const balance = await blockchainService.eth_getBalance(address, balanceBlockNumber)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: balance
        })
        
      case 'eth_getTransactionCount':
        const txAddress = searchParams.get('params')?.[0] || '0x0'
        const txBlockNumber = searchParams.get('params')?.[1] || 'latest'
        const nonce = await blockchainService.eth_getTransactionCount(txAddress, txBlockNumber)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: nonce
        })
        
      case 'eth_sendRawTransaction':
        const signedTx = searchParams.get('params')?.[0] || ''
        const txHash = await blockchainService.eth_sendRawTransaction(signedTx)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: txHash
        })
        
      case 'eth_estimateGas':
        const gasTransaction = JSON.parse(searchParams.get('params')?.[0] || '{}')
        const gasEstimate = await blockchainService.eth_estimateGas(gasTransaction)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: gasEstimate
        })
        
      case 'eth_call':
        const callTransaction = JSON.parse(searchParams.get('params')?.[0] || '{}')
        const callBlockNumber = searchParams.get('params')?.[1] || 'latest'
        const callResult = await blockchainService.eth_call(callTransaction, callBlockNumber)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: callResult
        })
        
      case 'eth_getCode':
        const codeAddress = searchParams.get('params')?.[0] || '0x0'
        const codeBlockNumber = searchParams.get('params')?.[1] || 'latest'
        const code = await blockchainService.eth_getCode(codeAddress, codeBlockNumber)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: code
        })
        
      case 'net_version':
        const netVersion = await blockchainService.net_version()
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: netVersion
        })
        
      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        })
    }
  } catch (error) {
    console.error('RPC endpoint error:', error)
    return NextResponse.json(
      { 
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32603,
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBlockchainInitialized()
    
    const body = await request.json()
    const method = body.method || 'eth_chainId'
    const params = body.params || []
    
    // Handle RPC methods using blockchain service
    switch (method) {
      case 'eth_chainId':
        const chainId = await blockchainService.eth_chainId()
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: chainId
        })
        
      case 'eth_getBlockByNumber':
        const blockNumber = params[0] || 'latest'
        const includeTransactions = params[1] === true
        const block = await blockchainService.eth_getBlockByNumber(blockNumber, includeTransactions)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: block
        })
        
      case 'eth_getBalance':
        const address = params[0] || '0x0'
        const balanceBlockNumber = params[1] || 'latest'
        const balance = await blockchainService.eth_getBalance(address, balanceBlockNumber)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: balance
        })
        
      case 'eth_getTransactionCount':
        const txAddress = params[0] || '0x0'
        const txBlockNumber = params[1] || 'latest'
        const nonce = await blockchainService.eth_getTransactionCount(txAddress, txBlockNumber)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: nonce
        })
        
      case 'eth_sendRawTransaction':
        const signedTx = params[0] || ''
        const txHash = await blockchainService.eth_sendRawTransaction(signedTx)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: txHash
        })
        
      case 'eth_estimateGas':
        const gasTransaction = params[0] || {}
        const gasEstimate = await blockchainService.eth_estimateGas(gasTransaction)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: gasEstimate
        })
        
      case 'eth_call':
        const callTransaction = params[0] || {}
        const callBlockNumber = params[1] || 'latest'
        const callResult = await blockchainService.eth_call(callTransaction, callBlockNumber)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: callResult
        })
        
      case 'eth_getCode':
        const codeAddress = params[0] || '0x0'
        const codeBlockNumber = params[1] || 'latest'
        const code = await blockchainService.eth_getCode(codeAddress, codeBlockNumber)
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: code
        })
        
      case 'net_version':
        const netVersion = await blockchainService.net_version()
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          result: netVersion
        })
        
      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id || 1,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        })
    }
  } catch (error) {
    console.error('RPC endpoint error:', error)
    return NextResponse.json(
      { 
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32603,
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
}