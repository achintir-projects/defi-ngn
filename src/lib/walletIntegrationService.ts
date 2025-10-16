import networkService from '@/lib/networkService'
import trustWalletService from '@/lib/trustWalletService'
import blockchainService from '@/lib/blockchainService'
import WalletConnectionService from '@/lib/walletConnectionService'
import { db } from '@/lib/db'

export interface WalletDetectionResult {
  isMobile: boolean
  isTrustWallet: boolean
  isBybitWallet: boolean
  isMetaMask: boolean
  isOtherWallet: boolean
  walletName: string
  userAgent: string
  deepLinkSupported: boolean
  recommendedAction: 'add_network' | 'install_wallet' | 'switch_network' | 'use_desktop'
}

export interface NetworkIntegrationResult {
  success: boolean
  networkAdded: boolean
  tokensAdded: boolean
  message: string
  error?: string
  stepsCompleted: string[]
}

export interface WalletIntegrationConfig {
  network: {
    chainId: string
    chainName: string
    nativeCurrency: {
      name: string
      symbol: string
      decimals: number
    }
    rpcUrls: string[]
    blockExplorerUrls: string[]
  }
  tokens: Array<{
    symbol: string
    name: string
    address: string
    decimals: number
    type: string
    logoURI?: string
  }>
  deepLinks: {
    network: string
    tokens: string[]
  }
  qrCodes: {
    network: string
    tokens: string[]
  }
}

export interface IntegrationSession {
  id: string
  walletAddress: string
  walletType: string
  networkStatus: 'disconnected' | 'connected' | 'wrong_network' | 'network_added'
  tokenStatus: 'not_added' | 'adding' | 'added' | 'failed'
  stepsCompleted: string[]
  createdAt: string
  lastActivity: string
}

class WalletIntegrationService {
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private activeSessions: Map<string, IntegrationSession> = new Map()

  // Detect wallet type and capabilities
  detectWallet(): WalletDetectionResult {
    const userAgent = navigator.userAgent.toLowerCase()
    
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isTrustWallet = /trustwallet/i.test(userAgent)
    const isBybitWallet = /bybit/i.test(userAgent)
    const isMetaMask = /metamask/i.test(userAgent)
    
    let walletName = 'Unknown Wallet'
    let recommendedAction: 'add_network' | 'install_wallet' | 'switch_network' | 'use_desktop' = 'use_desktop'
    
    if (isTrustWallet) {
      walletName = 'Trust Wallet'
      recommendedAction = isMobile ? 'add_network' : 'use_desktop'
    } else if (isBybitWallet) {
      walletName = 'Bybit Wallet'
      recommendedAction = isMobile ? 'add_network' : 'use_desktop'
    } else if (isMetaMask) {
      walletName = 'MetaMask'
      recommendedAction = 'add_network'
    } else if (isMobile) {
      walletName = 'Mobile Browser'
      recommendedAction = 'install_wallet'
    } else {
      walletName = 'Desktop Browser'
      recommendedAction = 'add_network'
    }

    const deepLinkSupported = isMobile && (isTrustWallet || isBybitWallet)

    return {
      isMobile,
      isTrustWallet,
      isBybitWallet,
      isMetaMask,
      isOtherWallet: !isTrustWallet && !isBybitWallet && !isMetaMask,
      walletName,
      userAgent,
      deepLinkSupported,
      recommendedAction
    }
  }

  // Get wallet integration configuration
  getIntegrationConfig(): WalletIntegrationConfig {
    const trustWalletConfig = trustWalletService.generateTrustWalletConfig()
    const tokenContracts = blockchainService.getTokenContracts()
    
    const tokenDeepLinks = tokenContracts.map(contract => 
      trustWalletService.generateTokenDeepLink(contract.address, contract.symbol, contract.decimals)
    )

    return {
      network: trustWalletConfig.network,
      tokens: trustWalletConfig.tokens,
      deepLinks: {
        network: trustWalletConfig.deepLinkUrl,
        tokens: tokenDeepLinks
      },
      qrCodes: {
        network: trustWalletConfig.qrCodeData,
        tokens: tokenContracts.map(contract => 
          `token:${contract.address}:${contract.symbol}:${contract.decimals}`
        )
      }
    }
  }

  // Start integration session
  async startIntegration(walletAddress: string, walletType: string): Promise<IntegrationSession> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const session: IntegrationSession = {
        id: sessionId,
        walletAddress,
        walletType,
        networkStatus: 'disconnected',
        tokenStatus: 'not_added',
        stepsCompleted: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      }

      this.activeSessions.set(sessionId, session)
      
      // Store session in database
      await db.integrationSession.create({
        data: {
          id: sessionId,
          walletAddress,
          walletType,
          networkStatus: 'disconnected',
          tokenStatus: 'not_added',
          stepsCompleted: [],
          createdAt: new Date(),
          lastActivity: new Date()
        }
      })

      return session
    } catch (error) {
      console.error('Error starting integration session:', error)
      throw error
    }
  }

  // Complete network integration
  async completeNetworkIntegration(sessionId: string): Promise<NetworkIntegrationResult> {
    try {
      const session = this.activeSessions.get(sessionId)
      if (!session) {
        throw new Error('Integration session not found')
      }

      const stepsCompleted: string[] = []
      let networkAdded = false
      let tokensAdded = false

      try {
        // Step 1: Add network to wallet
        const networkSuccess = await networkService.addNetworkToWallet()
        if (networkSuccess) {
          networkAdded = true
          stepsCompleted.push('Network added successfully')
          session.networkStatus = 'network_added'
        } else {
          throw new Error('Failed to add network')
        }
      } catch (error) {
        console.error('Error adding network:', error)
        return {
          success: false,
          networkAdded: false,
          tokensAdded: false,
          message: 'Failed to add network to wallet',
          error: error instanceof Error ? error.message : 'Unknown error',
          stepsCompleted
        }
      }

      try {
        // Step 2: Add tokens to wallet
        const tokensSuccess = await trustWalletService.addAllTokensToWallet()
        if (tokensSuccess) {
          tokensAdded = true
          stepsCompleted.push('Tokens added successfully')
          session.tokenStatus = 'added'
        } else {
          session.tokenStatus = 'failed'
          stepsCompleted.push('Some tokens failed to add')
        }
      } catch (error) {
        console.error('Error adding tokens:', error)
        session.tokenStatus = 'failed'
        stepsCompleted.push('Token addition failed')
      }

      // Update session
      session.stepsCompleted = stepsCompleted
      session.lastActivity = new Date().toISOString()
      this.activeSessions.set(sessionId, session)

      // Update session in database
      await db.integrationSession.update({
        where: { id: sessionId },
        data: {
          networkStatus: session.networkStatus,
          tokenStatus: session.tokenStatus,
          stepsCompleted,
          lastActivity: new Date()
        }
      })

      return {
        success: networkAdded,
        networkAdded,
        tokensAdded,
        message: `Integration ${networkAdded ? 'completed' : 'partially completed'}`,
        stepsCompleted
      }
    } catch (error) {
      console.error('Error completing network integration:', error)
      return {
        success: false,
        networkAdded: false,
        tokensAdded: false,
        message: 'Integration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stepsCompleted: []
      }
    }
  }

  // Get integration session status
  async getIntegrationSession(sessionId: string): Promise<IntegrationSession | null> {
    try {
      // Check memory first
      const memorySession = this.activeSessions.get(sessionId)
      if (memorySession) {
        return memorySession
      }

      // Check database
      const dbSession = await db.integrationSession.findUnique({
        where: { id: sessionId }
      })

      if (!dbSession) {
        return null
      }

      const session: IntegrationSession = {
        id: dbSession.id,
        walletAddress: dbSession.walletAddress,
        walletType: dbSession.walletType,
        networkStatus: dbSession.networkStatus as any,
        tokenStatus: dbSession.tokenStatus as any,
        stepsCompleted: dbSession.stepsCompleted as string[],
        createdAt: dbSession.createdAt.toISOString(),
        lastActivity: dbSession.lastActivity.toISOString()
      }

      // Load into memory
      this.activeSessions.set(sessionId, session)
      return session
    } catch (error) {
      console.error('Error getting integration session:', error)
      return null
    }
  }

  // Generate integration instructions
  generateIntegrationInstructions(walletDetection: WalletDetectionResult): {
    title: string
    description: string
    steps: Array<{
      step: number
      title: string
      description: string
      action?: string
      deepLink?: string
      qrCode?: string
      completed: boolean
    }>
    estimatedTime: string
    difficulty: 'easy' | 'medium' | 'hard'
  } {
    const config = this.getIntegrationConfig()
    const steps = []

    switch (walletDetection.recommendedAction) {
      case 'add_network':
        steps.push(
          {
            step: 1,
            title: 'Add Network',
            description: 'Add the Sepolia testnet to your wallet',
            action: 'add_network',
            deepLink: config.deepLinks.network,
            qrCode: config.qrCodes.network,
            completed: false
          },
          {
            step: 2,
            title: 'Add Tokens',
            description: 'Add USDT and other tokens to your wallet',
            action: 'add_tokens',
            deepLink: config.deepLinks.tokens[0],
            completed: false
          }
        )
        break

      case 'install_wallet':
        steps.push(
          {
            step: 1,
            title: 'Install Trust Wallet',
            description: 'Download and install Trust Wallet on your mobile device',
            action: 'install_wallet',
            deepLink: 'https://trustwallet.com/download',
            completed: false
          },
          {
            step: 2,
            title: 'Add Network',
            description: 'Add the Sepolia testnet to Trust Wallet',
            action: 'add_network',
            deepLink: config.deepLinks.network,
            qrCode: config.qrCodes.network,
            completed: false
          },
          {
            step: 3,
            title: 'Add Tokens',
            description: 'Add USDT and other tokens to your wallet',
            action: 'add_tokens',
            completed: false
          }
        )
        break

      case 'switch_network':
        steps.push(
          {
            step: 1,
            title: 'Switch Network',
            description: 'Switch to the Sepolia testnet in your wallet',
            action: 'switch_network',
            completed: false
          },
          {
            step: 2,
            title: 'Add Tokens',
            description: 'Add USDT and other tokens to your wallet',
            action: 'add_tokens',
            completed: false
          }
        )
        break

      case 'use_desktop':
        steps.push(
          {
            step: 1,
            title: 'Use Mobile Device',
            description: 'Please switch to a mobile device with Trust Wallet for the best experience',
            action: 'switch_device',
            completed: false
          }
        )
        break
    }

    return {
      title: `Integrate with ${walletDetection.walletName}`,
      description: `Follow these steps to integrate the Sepolia testnet with ${walletDetection.walletName}`,
      steps,
      estimatedTime: '2-5 minutes',
      difficulty: walletDetection.isMobile ? 'easy' : 'medium'
    }
  }

  // Auto-integrate with wallet
  async autoIntegrate(walletAddress: string): Promise<{
    success: boolean
    session?: IntegrationSession
    result?: NetworkIntegrationResult
    error?: string
  }> {
    try {
      const walletDetection = this.detectWallet()
      
      if (!walletDetection.deepLinkSupported && !walletDetection.isMetaMask) {
        return {
          success: false,
          error: 'Auto-integration not supported for this wallet type'
        }
      }

      // Start integration session
      const session = await this.startIntegration(walletAddress, walletDetection.walletName)

      // Complete integration
      const result = await this.completeNetworkIntegration(session.id)

      return {
        success: result.success,
        session,
        result
      }
    } catch (error) {
      console.error('Error in auto-integration:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Validate wallet integration
  async validateIntegration(walletAddress: string): Promise<{
    networkConnected: boolean
    tokensAdded: boolean
    tokenCount: number
    issues: string[]
  }> {
    try {
      const issues: string[] = []
      let networkConnected = false
      let tokensAdded = false
      let tokenCount = 0

      // Check if wallet is on correct network
      try {
        networkConnected = await networkService.isOnCustomNetwork()
        if (!networkConnected) {
          issues.push('Wallet is not connected to Sepolia testnet')
        }
      } catch (error) {
        issues.push('Unable to verify network connection')
      }

      // Check token balances
      try {
        const balances = await db.walletTokenBalance.findMany({
          where: { walletAddress },
          include: {
            tokenConfig: true
          }
        })

        tokenCount = balances.length
        tokensAdded = tokenCount > 0

        if (tokenCount === 0) {
          issues.push('No tokens found in wallet')
        }
      } catch (error) {
        issues.push('Unable to verify token balances')
      }

      return {
        networkConnected,
        tokensAdded,
        tokenCount,
        issues
      }
    } catch (error) {
      console.error('Error validating integration:', error)
      return {
        networkConnected: false,
        tokensAdded: false,
        tokenCount: 0,
        issues: ['Validation failed']
      }
    }
  }

  // Clean up expired sessions
  cleanupExpiredSessions(): void {
    const now = Date.now()
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      const lastActivity = new Date(session.lastActivity).getTime()
      
      if (now - lastActivity > this.SESSION_TIMEOUT) {
        this.activeSessions.delete(sessionId)
      }
    }
  }

  // Get integration statistics
  async getIntegrationStatistics(): Promise<{
    totalSessions: number
    successfulIntegrations: number
    failedIntegrations: number
    averageIntegrationTime: number
    popularWallets: Array<{
      walletType: string
      count: number
    }>
  }> {
    try {
      const sessions = await db.integrationSession.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1000 // Last 1000 sessions
      })

      const totalSessions = sessions.length
      const successfulIntegrations = sessions.filter(s => 
        s.networkStatus === 'network_added' && s.tokenStatus === 'added'
      ).length
      const failedIntegrations = sessions.filter(s => 
        s.networkStatus === 'disconnected' || s.tokenStatus === 'failed'
      ).length

      // Calculate average integration time
      const integrationTimes = sessions
        .filter(s => s.lastActivity && s.createdAt)
        .map(s => s.lastActivity.getTime() - s.createdAt.getTime())
      
      const averageIntegrationTime = integrationTimes.length > 0 
        ? integrationTimes.reduce((a, b) => a + b, 0) / integrationTimes.length 
        : 0

      // Popular wallets
      const walletCounts = new Map<string, number>()
      sessions.forEach(session => {
        const count = walletCounts.get(session.walletType) || 0
        walletCounts.set(session.walletType, count + 1)
      })

      const popularWallets = Array.from(walletCounts.entries())
        .map(([walletType, count]) => ({ walletType, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        totalSessions,
        successfulIntegrations,
        failedIntegrations,
        averageIntegrationTime,
        popularWallets
      }
    } catch (error) {
      console.error('Error getting integration statistics:', error)
      return {
        totalSessions: 0,
        successfulIntegrations: 0,
        failedIntegrations: 0,
        averageIntegrationTime: 0,
        popularWallets: []
      }
    }
  }

  // Export integration configuration
  exportIntegrationConfig(): {
    timestamp: number
    version: string
    network: any
    tokens: any[]
    supportedWallets: string[]
    integrationMethods: string[]
  } {
    const config = this.getIntegrationConfig()
    
    return {
      timestamp: Date.now(),
      version: '1.0.0',
      network: config.network,
      tokens: config.tokens,
      supportedWallets: ['Trust Wallet', 'Bybit Wallet', 'MetaMask'],
      integrationMethods: ['deep_link', 'qr_code', 'manual', 'auto']
    }
  }
}

// Create and export the service instance
const walletIntegrationService = new WalletIntegrationService()
export default walletIntegrationService