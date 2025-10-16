import { NextRequest, NextResponse } from 'next/server'
import pricingService from '@/lib/pricingService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'tokenPricing':
        // Get pricing for a specific token
        const symbol = searchParams.get('symbol')
        if (!symbol) {
          return NextResponse.json({
            success: false,
            error: 'Token symbol is required'
          }, { status: 400 })
        }
        
        const pricing = await pricingService.getForcedPrice(symbol)
        if (!pricing) {
          return NextResponse.json({
            success: false,
            error: 'Token not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          pricing
        })
        
      case 'allPricing':
        // Get all token pricing
        const allPricing = await pricingService.getAllTokenPricing()
        return NextResponse.json({
          success: true,
          pricing: allPricing
        })
        
      case 'balanceDisplay':
        // Get balance display for wallet
        const walletAddress = searchParams.get('walletAddress')
        const tokenSymbol = searchParams.get('tokenSymbol')
        
        if (!walletAddress) {
          return NextResponse.json({
            success: false,
            error: 'Wallet address is required'
          }, { status: 400 })
        }
        
        const balanceDisplay = await pricingService.getBalanceDisplay(walletAddress, tokenSymbol || undefined)
        return NextResponse.json({
          success: true,
          balanceDisplay
        })
        
      case 'portfolioValue':
        // Calculate portfolio value
        const portfolioWallet = searchParams.get('walletAddress')
        if (!portfolioWallet) {
          return NextResponse.json({
            success: false,
            error: 'Wallet address is required'
          }, { status: 400 })
        }
        
        const portfolio = await pricingService.calculatePortfolioValue(portfolioWallet)
        return NextResponse.json({
          success: true,
          portfolio
        })
        
      case 'priceFeed':
        // Generate price feed
        const priceFeed = await pricingService.generatePriceFeed()
        return NextResponse.json({
          success: true,
          priceFeed
        })
        
      case 'priceHistory':
        // Get price update history
        const historySymbol = searchParams.get('symbol')
        const limit = parseInt(searchParams.get('limit') || '50')
        
        const history = await pricingService.getPriceUpdateHistory(historySymbol || undefined, limit)
        return NextResponse.json({
          success: true,
          history
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in pricing API:', error)
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
      case 'updatePrice':
        // Update forced price for a token
        const { symbol, forcedPrice, realPrice, updateReason, updatedBy } = params
        
        if (!symbol || forcedPrice === undefined || !updatedBy) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: symbol, forcedPrice, updatedBy'
          }, { status: 400 })
        }
        
        const updateRequest = {
          symbol,
          forcedPrice,
          realPrice,
          updateReason,
          updatedBy
        }
        
        const updatedPricing = await pricingService.updateForcedPrice(updateRequest)
        return NextResponse.json({
          success: true,
          pricing: updatedPricing,
          message: `Price updated for ${symbol}`
        })
        
      case 'bulkUpdatePrices':
        // Bulk update forced prices
        const { updates, updatedBy: bulkUpdatedBy } = params
        
        if (!updates || !Array.isArray(updates) || !bulkUpdatedBy) {
          return NextResponse.json({
            success: false,
            error: 'Invalid parameters for bulk update'
          }, { status: 400 })
        }
        
        const bulkUpdateRequest = {
          updates,
          updatedBy: bulkUpdatedBy
        }
        
        const bulkResults = await pricingService.bulkUpdateForcedPrices(bulkUpdateRequest)
        return NextResponse.json({
          success: true,
          results: bulkResults,
          updated: bulkResults.length,
          message: `Bulk price update completed for ${bulkResults.length} tokens`
        })
        
      case 'initializePricing':
        // Initialize default pricing
        await pricingService.initializeDefaultPricing()
        return NextResponse.json({
          success: true,
          message: 'Default pricing initialized successfully'
        })
        
      case 'exportConfig':
        // Export pricing configuration
        const config = pricingService.exportPricingConfig()
        return NextResponse.json({
          success: true,
          config
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in pricing API:', error)
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