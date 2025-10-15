import OffChainTokenService from './offChainTokenService'

export interface WalletConnectionResult {
  success: boolean
  address?: string
  walletType?: string
  error?: string
}

export interface WalletInfo {
  address: string
  type: string
  chain: string
  isConnected: boolean
  connectionMethod?: string
}

class WalletConnectionService {
  private tokenService = OffChainTokenService
  private customNetwork = 'Custom Network'

  // Detect available wallets
  detectAvailableWallets(): string[] {
    const wallets: string[] = []
    
    if (typeof window !== 'undefined') {
      // MetaMask
      if (window.ethereum?.isMetaMask) {
        wallets.push('metamask')
      }
      
      // Trust Wallet
      if (window.ethereum?.isTrust || window.trustwallet) {
        wallets.push('trustwallet')
      }
      
      // Bybit Wallet
      if (window.bybit || window.ethereum?.isBybit) {
        wallets.push('bybit')
      }
      
      // Coinbase Wallet
      if (window.ethereum?.isCoinbaseWallet) {
        wallets.push('coinbase')
      }
      
      // Phantom (Solana)
      if (window.solana?.isPhantom) {
        wallets.push('phantom')
      }
      
      // General Web3 provider
      if (window.ethereum && !window.ethereum.isMetaMask && !window.ethereum.isTrust) {
        wallets.push('web3')
      }
    }
    
    // Always include manual option
    if (!wallets.includes('manual')) {
      wallets.push('manual')
    }
    
    return wallets
  }

  // Connect to MetaMask or compatible wallet
  async connectMetaMask(): Promise<WalletConnectionResult> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        // Provide better error message and installation link
        return {
          success: false,
          error: 'MetaMask not found. Please install MetaMask from https://metamask.io/download/'
        }
      }

      // Request account access with better error handling
      let accounts: string[]
      try {
        accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })
      } catch (error: any) {
        if (error.code === 4001) {
          return {
            success: false,
            error: 'Connection rejected by user. Please approve the connection request.'
          }
        }
        throw error
      }

      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts found. Please make sure your wallet is unlocked.'
        }
      }

      const address = accounts[0]

      // Get wallet info
      const walletType = this.detectWalletType()
      
      // Store wallet in our system
      try {
        await this.tokenService.getOrCreateWallet(address, walletType, 'deeplink')
      } catch (error) {
        console.error('Error storing wallet:', error)
        // Continue even if storage fails
      }

      return {
        success: true,
        address,
        walletType
      }
    } catch (error) {
      console.error('MetaMask connection error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to MetaMask'
      }
    }
  }

  // Connect to Trust Wallet
  async connectTrustWallet(): Promise<WalletConnectionResult> {
    try {
      // Try mobile deep link first
      if (this.isMobile()) {
        const deepLink = `trust://wc?uri=${encodeURIComponent(window.location.href)}`
        window.location.href = deepLink
        return {
          success: true,
          address: 'pending', // Will be resolved after redirect
          walletType: 'trustwallet'
        }
      }

      // Try browser extension
      if (window.trustwallet) {
        const accounts = await window.trustwallet.request({
          method: 'eth_requestAccounts'
        })

        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found')
        }

        const address = accounts[0]
        await this.tokenService.getOrCreateWallet(address, 'trustwallet', 'deeplink')

        return {
          success: true,
          address,
          walletType: 'trustwallet'
        }
      }

      // Fallback to MetaMask-compatible interface
      if (window.ethereum?.isTrust) {
        return this.connectMetaMask()
      }

      throw new Error('Trust Wallet not found. Please install Trust Wallet.')
    } catch (error) {
      console.error('Trust Wallet connection error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Trust Wallet'
      }
    }
  }

  // Connect to Bybit Wallet
  async connectBybitWallet(): Promise<WalletConnectionResult> {
    try {
      if (typeof window === 'undefined' || !window.bybit) {
        throw new Error('Bybit Wallet not found. Please install Bybit Wallet.')
      }

      const accounts = await window.bybit.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const address = accounts[0]
      await this.tokenService.getOrCreateWallet(address, 'bybit', 'deeplink')

      return {
        success: true,
        address,
        walletType: 'bybit'
      }
    } catch (error) {
      console.error('Bybit Wallet connection error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Bybit Wallet'
      }
    }
  }

  // Connect to Phantom Wallet (Solana)
  async connectPhantomWallet(): Promise<WalletConnectionResult> {
    try {
      if (typeof window === 'undefined' || !window.solana?.isPhantom) {
        throw new Error('Phantom Wallet not found. Please install Phantom Wallet.')
      }

      const response = await window.solana.connect()
      const address = response.publicKey.toString()

      await this.tokenService.getOrCreateWallet(address, 'phantom', 'deeplink')

      return {
        success: true,
        address,
        walletType: 'phantom'
      }
    } catch (error) {
      console.error('Phantom Wallet connection error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Phantom Wallet'
      }
    }
  }

  // Connect to Coinbase Wallet
  async connectCoinbaseWallet(): Promise<WalletConnectionResult> {
    try {
      if (typeof window === 'undefined' || !window.ethereum?.isCoinbaseWallet) {
        throw new Error('Coinbase Wallet not found. Please install Coinbase Wallet.')
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const address = accounts[0]
      await this.tokenService.getOrCreateWallet(address, 'coinbase', 'deeplink')

      return {
        success: true,
        address,
        walletType: 'coinbase'
      }
    } catch (error) {
      console.error('Coinbase Wallet connection error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Coinbase Wallet'
      }
    }
  }

  // Manual wallet address input
  async connectManualWallet(address: string): Promise<WalletConnectionResult> {
    try {
      // Validate address format
      if (!this.isValidAddress(address)) {
        return {
          success: false,
          error: 'Invalid wallet address format. Please enter a valid Ethereum address starting with 0x'
        }
      }

      // Store wallet in our system
      try {
        await this.tokenService.getOrCreateWallet(address, 'manual', 'manual')
      } catch (error) {
        console.error('Error storing manual wallet:', error)
        // Continue even if storage fails
      }

      return {
        success: true,
        address,
        walletType: 'manual'
      }
    } catch (error) {
      console.error('Manual wallet connection error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      }
    }
  }

  // QR Code connection (WalletConnect style)
  async connectWithQRCode(): Promise<{ qrCode: string; connectionId: string }> {
    try {
      const connectionId = this.generateConnectionId()
      const qrCode = `wc:${connectionId}@2?relay-protocol=irn&symKey=${this.generateSymKey()}`
      
      // Store connection request
      // In a real implementation, you'd store this in your database
      // and handle the connection via WebSocket
      
      return {
        qrCode,
        connectionId
      }
    } catch (error) {
      console.error('QR code connection error:', error)
      throw error
    }
  }

  // Disconnect wallet
  async disconnectWallet(address: string): Promise<void> {
    try {
      await this.tokenService.disconnectWallet(address)
    } catch (error) {
      console.error('Wallet disconnection error:', error)
      throw error
    }
  }

  // Get wallet info
  async getWalletInfo(address: string): Promise<WalletInfo | null> {
    try {
      const wallet = await this.tokenService.getOrCreateWallet(address, 'unknown')
      return {
        address: wallet.address,
        type: wallet.type,
        chain: wallet.chain,
        isConnected: wallet.isConnected,
        connectionMethod: wallet.connectionMethod
      }
    } catch (error) {
      console.error('Error getting wallet info:', error)
      return null
    }
  }

  // Universal connect method
  async connectWallet(walletType: string, manualAddress?: string): Promise<WalletConnectionResult> {
    switch (walletType) {
      case 'metamask':
        return this.connectMetaMask()
      case 'trustwallet':
        return this.connectTrustWallet()
      case 'bybit':
        return this.connectBybitWallet()
      case 'phantom':
        return this.connectPhantomWallet()
      case 'coinbase':
        return this.connectCoinbaseWallet()
      case 'manual':
        if (!manualAddress) {
          return {
            success: false,
            error: 'Manual address required'
          }
        }
        return this.connectManualWallet(manualAddress)
      case 'qr':
        return {
          success: false,
          error: 'QR code connection not implemented yet'
        }
      default:
        return {
          success: false,
          error: 'Unsupported wallet type'
        }
    }
  }

  // Helper methods
  private detectWalletType(): string {
    if (window.ethereum?.isMetaMask) return 'metamask'
    if (window.ethereum?.isTrust) return 'trustwallet'
    if (window.ethereum?.isBybit) return 'bybit'
    if (window.ethereum?.isCoinbaseWallet) return 'coinbase'
    return 'web3'
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  private isValidAddress(address: string): boolean {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  private generateSymKey(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  // Setup event listeners for wallet changes
  setupWalletEventListeners(callback: (accounts: string[]) => void) {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        callback(accounts)
      })

      window.ethereum.on('chainChanged', (chainId: string) => {
        console.log('Chain changed:', chainId)
        // Handle chain change if needed
      })

      window.ethereum.on('disconnect', (error: { code: number; message: string }) => {
        console.error('Wallet disconnected:', error)
        callback([])
      })
    }

    if (typeof window !== 'undefined' && window.solana) {
      window.solana.on('connect', () => {
        console.log('Phantom wallet connected')
      })

      window.solana.on('disconnect', () => {
        console.log('Phantom wallet disconnected')
        callback([])
      })
    }
  }

  // Remove event listeners
  removeWalletEventListeners() {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged')
      window.ethereum.removeAllListeners('chainChanged')
      window.ethereum.removeAllListeners('disconnect')
    }

    if (typeof window !== 'undefined' && window.solana) {
      window.solana.removeAllListeners('connect')
      window.solana.removeAllListeners('disconnect')
    }
  }
}

// Add TypeScript declarations for global window object
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      isTrust?: boolean
      isBybit?: boolean
      isCoinbaseWallet?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeAllListeners: (event: string) => void
    }
    trustwallet?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
    }
    bybit?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
    }
    solana?: {
      isPhantom?: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeAllListeners: (event: string) => void
      disconnect: () => Promise<void>
    }
  }
}

// Create and export the service instance
const walletConnectionService = new WalletConnectionService()
export default walletConnectionService