import networkService from '@/lib/networkService'
import trustWalletService from '@/lib/trustWalletService'
import blockchainService from '@/lib/blockchainService'
import { db } from '@/lib/db'

export interface TrustWalletIntegrationConfig {
  autoNetworkSwitch: boolean
  autoTokenDetection: boolean
  forcedPricing: boolean
  deepLinkSupported: boolean
  walletDetection: {
    isTrustWallet: boolean
    isMobile: boolean
    userAgent: string
  }
}

export interface NetworkSetupResult {
  success: boolean
  networkAdded: boolean
  networkSwitched: boolean
  tokensAdded: number
  error?: string
  stepsCompleted: string[]
}

export interface AutoConfigurationResult {
  success: boolean
  networkConfigured: boolean
  tokensConfigured: boolean
  pricingApplied: boolean
  walletConnected: boolean
  error?: string
  details: {
    networkSetup: NetworkSetupResult
    tokensAdded: number
    pricingUpdates: number
  }
}

class TrustWalletIntegration {
  private config: TrustWalletIntegrationConfig
  private isInitialized = false

  constructor() {
    this.config = {
      autoNetworkSwitch: true,
      autoTokenDetection: true,
      forcedPricing: true,
      deepLinkSupported: false,
      walletDetection: {
        isTrustWallet: false,
        isMobile: false,
        userAgent: ''
      }
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Detect wallet environment
    this.detectWalletEnvironment()

    // Initialize blockchain service
    await blockchainService.initialize()

    this.isInitialized = true
    console.log('Trust Wallet integration initialized')
  }

  // Detect wallet environment and capabilities
  private detectWalletEnvironment(): void {
    if (typeof window === 'undefined') return

    const detection = trustWalletService.detectMobileWallet()
    
    this.config = {
      ...this.config,
      walletDetection: detection,
      deepLinkSupported: detection.deepLinkSupported
    }

    console.log('Wallet environment detected:', detection)
  }

  // Get current integration configuration
  getConfiguration(): TrustWalletIntegrationConfig {
    return this.config
  }

  // Auto-configure Trust Wallet with network and tokens
  async autoConfigure(): Promise<AutoConfigurationResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const result: AutoConfigurationResult = {
        success: false,
        networkConfigured: false,
        tokensConfigured: false,
        pricingApplied: false,
        walletConnected: false,
        details: {
          networkSetup: {
            success: false,
            networkAdded: false,
            networkSwitched: false,
            tokensAdded: 0,
            stepsCompleted: []
          },
          tokensAdded: 0,
          pricingUpdates: 0
        }
      }

      // Step 1: Configure network
      try {
        const networkSetup = await this.setupNetwork()
        result.details.networkSetup = networkSetup
        result.networkConfigured = networkSetup.success
      } catch (error) {
        console.error('Network setup failed:', error)
      }

      // Step 2: Configure tokens if network was successful
      if (result.networkConfigured) {
        try {
          const tokensAdded = await this.configureTokens()
          result.details.tokensAdded = tokensAdded
          result.tokensConfigured = tokensAdded > 0
        } catch (error) {
          console.error('Token configuration failed:', error)
        }
      }

      // Step 3: Apply forced pricing
      if (this.config.forcedPricing) {
        try {
          const pricingUpdates = await this.applyForcedPricing()
          result.details.pricingUpdates = pricingUpdates
          result.pricingApplied = pricingUpdates > 0
        } catch (error) {
          console.error('Forced pricing application failed:', error)
        }
      }

      // Step 4: Check wallet connection
      try {
        const walletConnected = await this.checkWalletConnection()
        result.walletConnected = walletConnected
      } catch (error) {
        console.error('Wallet connection check failed:', error)
      }

      result.success = result.networkConfigured && result.walletConnected

      return result
    } catch (error) {
      console.error('Auto-configuration failed:', error)
      return {
        success: false,
        networkConfigured: false,
        tokensConfigured: false,
        pricingApplied: false,
        walletConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          networkSetup: {
            success: false,
            networkAdded: false,
            networkSwitched: false,
            tokensAdded: 0,
            stepsCompleted: []
          },
          tokensAdded: 0,
          pricingUpdates: 0
        }
      }
    }
  }

  // Setup network in Trust Wallet
  private async setupNetwork(): Promise<NetworkSetupResult> {
    const result: NetworkSetupResult = {
      success: false,
      networkAdded: false,
      networkSwitched: false,
      tokensAdded: 0,
      stepsCompleted: []
    }

    try {
      // Check if we can interact with the wallet
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No web3 wallet detected')
      }

      // Step 1: Try to add the network
      try {
        const networkAdded = await networkService.addNetworkToWallet()
        result.networkAdded = networkAdded
        result.stepsCompleted.push('Network added successfully')
      } catch (error) {
        console.error('Network addition failed:', error)
        result.stepsCompleted.push('Network addition failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }

      // Step 2: Try to switch to the network
      if (this.config.autoNetworkSwitch) {
        try {
          const networkSwitched = await networkService.switchToCustomNetwork()
          result.networkSwitched = networkSwitched
          result.stepsCompleted.push('Network switched successfully')
        } catch (error) {
          console.error('Network switch failed:', error)
          result.stepsCompleted.push('Network switch failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
        }
      }

      // Step 3: Verify network configuration
      try {
        const isCorrectNetwork = await networkService.isOnCustomNetwork()
        if (isCorrectNetwork) {
          result.stepsCompleted.push('Network verification successful')
        } else {
          result.stepsCompleted.push('Network verification failed - wrong network')
        }
      } catch (error) {
        console.error('Network verification failed:', error)
        result.stepsCompleted.push('Network verification failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }

      result.success = result.networkAdded && result.networkSwitched

      return result
    } catch (error) {
      console.error('Network setup failed:', error)
      result.error = error instanceof Error ? error.message : 'Unknown error'
      return result
    }
  }

  // Configure tokens in Trust Wallet
  private async configureTokens(): Promise<number> {
    let tokensAdded = 0

    try {
      if (!this.config.autoTokenDetection) {
        return 0
      }

      // Get available token contracts
      const tokenContracts = blockchainService.getTokenContracts()
      
      for (const contract of tokenContracts) {
        try {
          // Try to add token to wallet
          const added = await trustWalletService.addTokenToTrustWallet(
            contract.address,
            contract.symbol,
            contract.decimals
          )
          
          if (added) {
            tokensAdded++
            console.log(`Token ${contract.symbol} added to wallet successfully`)
          }
        } catch (error) {
          console.error(`Failed to add token ${contract.symbol}:`, error)
        }
      }

      return tokensAdded
    } catch (error) {
      console.error('Token configuration failed:', error)
      return 0
    }
  }

  // Apply forced pricing to tokens
  private async applyForcedPricing(): Promise<number> {
    try {
      // Get all token configurations
      const tokens = await db.tokenConfig.findMany({
        where: { status: 'active' }
      })

      let pricingUpdates = 0

      for (const token of tokens) {
        try {
          // Check if token has forced pricing
          if (token.forcedPrice > 0 && token.forcedPrice !== token.currentPrice) {
            // Update the pricing (this would trigger balance updates)
            await db.tokenConfig.update({
              where: { symbol: token.symbol },
              data: {
                updatedAt: new Date()
              }
            })
            pricingUpdates++
          }
        } catch (error) {
          console.error(`Failed to apply forced pricing for ${token.symbol}:`, error)
        }
      }

      return pricingUpdates
    } catch (error) {
      console.error('Forced pricing application failed:', error)
      return 0
    }
  }

  // Check if wallet is connected and on correct network
  private async checkWalletConnection(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        return false
      }

      // Check if accounts are available
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      })

      if (!accounts || accounts.length === 0) {
        return false
      }

      // Check if on correct network
      const isCorrectNetwork = await networkService.isOnCustomNetwork()
      
      return isCorrectNetwork
    } catch (error) {
      console.error('Wallet connection check failed:', error)
      return false
    }
  }

  // Generate Trust Wallet deep link with network configuration
  generateDeepLinkWithConfig(): string {
    const config = trustWalletService.generateTrustWalletConfig()
    
    // Enhanced deep link with network and token configuration
    const deepLink = `trust://add_network?chainId=${config.network.chainId}&chainName=${encodeURIComponent(config.network.chainName)}&rpcUrl=${encodeURIComponent(config.network.rpcUrls[0])}&symbol=${config.network.nativeCurrency.symbol}&decimals=${config.network.nativeCurrency.decimals}&blockExplorerUrl=${encodeURIComponent(config.network.blockExplorerUrls[0])}`
    
    // Add token information if available
    if (config.tokens.length > 0) {
      const tokenParams = config.tokens.map(token => 
        `tokens[]=${encodeURIComponent(JSON.stringify({
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          name: token.name
        }))}`
      ).join('&')
      
      return `${deepLink}&${tokenParams}`
    }

    return deepLink
  }

  // Generate QR code data for Trust Wallet setup
  generateQRCodeData(): string {
    const config = trustWalletService.generateQRCodeConfig()
    
    // Enhanced QR code data with comprehensive setup information
    const qrData = {
      action: 'setup_trust_wallet',
      network: config.network,
      tokens: config.tokens,
      timestamp: Date.now(),
      version: '1.0',
      instructions: {
        title: 'Setup DeFi NGN Network',
        steps: [
          '1. Scan this QR code with Trust Wallet',
          '2. Approve the network addition',
          '3. Switch to the DeFi NGN Network',
          '4. Your tokens will appear automatically'
        ]
      }
    }

    return `defi-ngn://${Buffer.from(JSON.stringify(qrData)).toString('base64')}`
  }

  // Handle wallet callback from mobile app
  async handleWalletCallback(callbackData: {
    action: string
    wallet: string
    address?: string
    error?: string
  }): Promise<{
    success: boolean
    address?: string
    error?: string
    nextSteps?: string[]
  }> {
    try {
      const { action, wallet, address, error } = callbackData

      if (error) {
        return {
          success: false,
          error: `Wallet callback error: ${error}`
        }
      }

      if (action === 'connect' && wallet === 'trustwallet') {
        if (address) {
          // Store the connected wallet
          try {
            await db.userWallet.upsert({
              where: { address },
              update: {
                isConnected: true,
                lastConnectedAt: new Date(),
                connectionMethod: 'deeplink'
              },
              create: {
                address,
                type: 'trustwallet',
                chain: 'DeFi NGN Network',
                isConnected: true,
                connectionMethod: 'deeplink',
                lastConnectedAt: new Date()
              }
            })

            // Auto-configure the wallet
            const autoConfig = await this.autoConfigure()

            return {
              success: true,
              address,
              nextSteps: autoConfig.success ? 
                ['Wallet connected and configured successfully'] :
                ['Wallet connected, but configuration may be incomplete']
            }
          } catch (error) {
            console.error('Error storing wallet:', error)
            return {
              success: true,
              address,
              nextSteps: ['Wallet connected, but there was an error saving the connection']
            }
          }
        } else {
          return {
            success: false,
            error: 'No address provided in callback'
          }
        }
      }

      return {
        success: false,
        error: 'Unsupported callback action'
      }
    } catch (error) {
      console.error('Error handling wallet callback:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Monitor wallet connection and network changes
  setupWalletMonitoring(): void {
    if (typeof window === 'undefined' || !window.ethereum) return

    // Monitor account changes
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      console.log('Accounts changed:', accounts)
      if (accounts.length === 0) {
        // Wallet disconnected
        this.handleWalletDisconnection()
      } else {
        // Account changed - reconfigure if needed
        this.handleAccountChange(accounts[0])
      }
    })

    // Monitor chain changes
    window.ethereum.on('chainChanged', (chainId: string) => {
      console.log('Chain changed:', chainId)
      this.handleChainChange(chainId)
    })

    // Monitor disconnect event
    window.ethereum.on('disconnect', (error: { code: number; message: string }) => {
      console.log('Wallet disconnected:', error)
      this.handleWalletDisconnection()
    })
  }

  // Handle wallet disconnection
  private handleWalletDisconnection(): void {
    console.log('Wallet disconnected - cleaning up')
    // Update wallet status in database
    // This would be implemented based on your requirements
  }

  // Handle account change
  private async handleAccountChange(address: string): Promise<void> {
    console.log('Account changed to:', address)
    
    // Re-configure for the new account
    try {
      await this.autoConfigure()
    } catch (error) {
      console.error('Failed to reconfigure for new account:', error)
    }
  }

  // Handle chain change
  private async handleChainChange(chainId: string): Promise<void> {
    console.log('Chain changed to:', chainId)
    
    // Check if we're on the correct network
    try {
      const isCorrectNetwork = await networkService.isOnCustomNetwork()
      if (!isCorrectNetwork) {
        console.log('Not on correct network - attempting to switch back')
        await networkService.switchToCustomNetwork()
      }
    } catch (error) {
      console.error('Failed to handle chain change:', error)
    }
  }

  // Get integration status and diagnostics
  async getIntegrationStatus(): Promise<{
    isInitialized: boolean
    walletDetected: boolean
    networkConfigured: boolean
    tokensConfigured: boolean
    walletConnected: boolean
    diagnostics: {
      walletType: string
      chainId: string
      accounts: string[]
      networkMatch: boolean
      errors: string[]
    }
  }> {
    try {
      const walletDetected = this.config.walletDetection.isTrustWallet
      const networkConfigured = await networkService.isOnCustomNetwork()
      const walletConnected = await this.checkWalletConnection()
      
      let chainId = 'unknown'
      let accounts: string[] = []
      let networkMatch = false

      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          chainId = await window.ethereum.request({ method: 'eth_chainId' })
          accounts = await window.ethereum.request({ method: 'eth_accounts' })
          networkMatch = chainId === '0xaa36a7' // Sepolia chain ID in hex
        } catch (error) {
          console.error('Error getting wallet info:', error)
        }
      }

      return {
        isInitialized: this.isInitialized,
        walletDetected,
        networkConfigured,
        tokensConfigured: walletConnected && networkConfigured,
        walletConnected,
        diagnostics: {
          walletType: this.config.walletDetection.isTrustWallet ? 'Trust Wallet' : 'Other',
          chainId,
          accounts,
          networkMatch,
          errors: []
        }
      }
    } catch (error) {
      console.error('Error getting integration status:', error)
      return {
        isInitialized: false,
        walletDetected: false,
        networkConfigured: false,
        tokensConfigured: false,
        walletConnected: false,
        diagnostics: {
          walletType: 'Unknown',
          chainId: 'unknown',
          accounts: [],
          networkMatch: false,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      }
    }
  }
}

// Create and export the service instance
const trustWalletIntegration = new TrustWalletIntegration()
export default trustWalletIntegration