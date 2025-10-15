import { NextRequest, NextResponse } from 'next/server'
import tokenPushService from '@/lib/tokenPushService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'status':
        // Get push status
        const pushId = searchParams.get('pushId')
        if (!pushId) {
          return NextResponse.json({
            success: false,
            error: 'Push ID is required'
          }, { status: 400 })
        }
        
        const status = await tokenPushService.getPushStatus(pushId)
        if (!status) {
          return NextResponse.json({
            success: false,
            error: 'Push not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          status
        })
        
      case 'history':
        // Get push history for wallet
        const walletAddress = searchParams.get('walletAddress')
        const limit = parseInt(searchParams.get('limit') || '50')
        
        if (!walletAddress) {
          return NextResponse.json({
            success: false,
            error: 'Wallet address is required'
          }, { status: 400 })
        }
        
        const history = await tokenPushService.getPushHistory(walletAddress, limit)
        return NextResponse.json({
          success: true,
          history
        })
        
      case 'statistics':
        // Get push statistics
        const timeRange = searchParams.get('timeRange') as '24h' | '7d' | '30d' | 'all' || '24h'
        const statistics = await tokenPushService.getPushStatistics(timeRange)
        
        return NextResponse.json({
          success: true,
          statistics
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in token push API:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body
    
    switch (action) {
      case 'push':
        // Push tokens to wallet
        const { fromAddress, toAddress, tokenSymbol, amount, forcedPrice, pushType, description, pushInitiator } = params
        
        if (!fromAddress || !toAddress || !tokenSymbol || !amount || !pushType || !pushInitiator) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters for token push'
          }, { status: 400 })
        }
        
        const pushRequest = {
          fromAddress,
          toAddress,
          tokenSymbol,
          amount,
          forcedPrice,
          pushType,
          description,
          pushInitiator
        }
        
        const result = await tokenPushService.pushTokens(pushRequest)
        return NextResponse.json({
          success: result.success,
          result,
          message: result.success ? 'Token push initiated successfully' : 'Token push failed'
        })
        
      case 'bulkPush':
        // Bulk push tokens to multiple wallets
        const { pushes, pushInitiator: bulkPushInitiator, batchId } = params
        
        if (!pushes || !Array.isArray(pushes) || !bulkPushInitiator) {
          return NextResponse.json({
            success: false,
            error: 'Invalid parameters for bulk push'
          }, { status: 400 })
        }
        
        const bulkPushRequest = {
          pushes,
          pushInitiator: bulkPushInitiator,
          batchId
        }
        
        const bulkResults = await tokenPushService.bulkPushTokens(bulkPushRequest)
        return NextResponse.json({
          success: true,
          results: bulkResults,
          processed: bulkResults.length,
          message: `Bulk push processed for ${bulkResults.length} wallets`
        })
        
      case 'airdrop':
        // Airdrop tokens to multiple wallets
        const { tokenSymbol, recipients, airdropInitiator, description: airdropDescription } = params
        
        if (!tokenSymbol || !recipients || !Array.isArray(recipients) || !airdropInitiator) {
          return NextResponse.json({
            success: false,
            error: 'Invalid parameters for airdrop'
          }, { status: 400 })
        }
        
        const airdropResults = await tokenPushService.airdropTokens(
          tokenSymbol,
          recipients,
          airdropInitiator,
          airdropDescription
        )
        
        return NextResponse.json({
          success: true,
          results: airdropResults,
          processed: airdropResults.length,
          message: `Airdrop processed for ${airdropResults.length} wallets`
        })
        
      case 'cancel':
        // Cancel pending push
        const { pushId: cancelPushId, cancelledBy } = params
        
        if (!cancelPushId || !cancelledBy) {
          return NextResponse.json({
            success: false,
            error: 'Push ID and cancelled by are required'
          }, { status: 400 })
        }
        
        const cancelResult = await tokenPushService.cancelPush(cancelPushId, cancelledBy)
        return NextResponse.json({
          success: cancelResult,
          message: cancelResult ? 'Push cancelled successfully' : 'Failed to cancel push'
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in token push API:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}