import { NextRequest, NextResponse } from 'next/server'
import trustWalletService from '@/lib/trustWalletService'

export async function GET(request: NextRequest) {
  try {
    // Get Trust Wallet configuration
    const config = trustWalletService.exportConfiguration()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const includeMobileDetection = searchParams.get('includeMobileDetection') === 'true'
    
    // Prepare response based on format
    let response: any = {
      success: true,
      network: config.trustWallet.network,
      tokens: config.trustWallet.tokens,
      deepLinkUrl: config.trustWallet.deepLinkUrl,
      installationGuide: config.installationInstructions
    }
    
    if (includeMobileDetection) {
      response.mobileDetection = config.mobileDetection
    }
    
    // Handle different response formats
    switch (format) {
      case 'json':
        return NextResponse.json(response)
        
      case 'qr':
        const qrConfig = trustWalletService.generateQRCodeConfig()
        return NextResponse.json({
          success: true,
          qrData: qrConfig.qrData,
          configString: qrConfig.configString,
          network: qrConfig.network,
          tokens: qrConfig.tokens
        })
        
      case 'config':
        return NextResponse.json({
          success: true,
          configFile: config.networkConfigFile,
          contentType: 'application/json'
        })
        
      case 'deeplink':
        return NextResponse.json({
          success: true,
          deepLinkUrl: config.trustWallet.deepLinkUrl,
          network: config.trustWallet.network,
          tokens: config.trustWallet.tokens
        })
        
      default:
        return NextResponse.json(response)
    }
  } catch (error) {
    console.error('Error generating Trust Wallet config:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate Trust Wallet configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, tokenAddress, symbol, decimals } = body
    
    switch (action) {
      case 'addNetwork':
        const networkSuccess = await trustWalletService.addNetworkToTrustWallet()
        return NextResponse.json({
          success: networkSuccess,
          message: networkSuccess ? 'Network added successfully' : 'Failed to add network'
        })
        
      case 'addToken':
        if (!tokenAddress || !symbol || !decimals) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: tokenAddress, symbol, decimals'
          }, { status: 400 })
        }
        
        const tokenSuccess = await trustWalletService.addTokenToTrustWallet(
          tokenAddress,
          symbol,
          decimals
        )
        return NextResponse.json({
          success: tokenSuccess,
          message: tokenSuccess ? 'Token added successfully' : 'Failed to add token'
        })
        
      case 'addAllTokens':
        const allTokensSuccess = await trustWalletService.addAllTokensToWallet()
        return NextResponse.json({
          success: allTokensSuccess,
          message: allTokensSuccess ? 'All tokens added successfully' : 'Failed to add some tokens'
        })
        
      case 'detectWallet':
        const detection = trustWalletService.detectMobileWallet()
        return NextResponse.json({
          success: true,
          detection
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in Trust Wallet API:', error)
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