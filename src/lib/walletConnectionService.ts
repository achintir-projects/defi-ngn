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
  private customNetwork = 'Sepolia'

  // Detect available wallets with improved mobile detection
  detectAvailableWallets(): string[] {
    const wallets: string[] = []
    
    if (typeof window !== 'undefined') {
      // Check if we're on mobile
      if (this.isMobile()) {
        // On mobile, always show popular wallet options
        // Mobile wallets don't reliably inject JavaScript objects for detection
        wallets.push('trustwallet', 'bybit', 'metamask')
        
        // Also try to detect if any are actually available
        const detectedWallets = this.detectMobileWallets()
        detectedWallets.forEach(wallet => {
          if (!wallets.includes(wallet)) {
            wallets.push(wallet)
          }
        })
        
        // Ensure we have mobile wallet options even if detection failed
        this.ensureMobileWalletOptions(wallets)
      }
      
      // Desktop wallet detection
      // MetaMask
      if (window.ethereum?.isMetaMask && !wallets.includes('metamask')) {
        wallets.push('metamask')
      }
      
      // Trust Wallet browser extension
      if ((window.ethereum?.isTrust || window.trustwallet) && !wallets.includes('trustwallet')) {
        wallets.push('trustwallet')
      }
      
      // Bybit Wallet browser extension
      if ((window.bybit || window.ethereum?.isBybit) && !wallets.includes('bybit')) {
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
      if (window.ethereum && !window.ethereum.isMetaMask && !window.ethereum.isTrust && !wallets.includes('web3')) {
        wallets.push('web3')
      }
    }
    
    // Always include manual option
    if (!wallets.includes('manual')) {
      wallets.push('manual')
    }
    
    return wallets
  }

  // Ensure mobile wallet options are available even if detection fails
  private ensureMobileWalletOptions(wallets: string[]): void {
    const requiredMobileWallets = ['trustwallet', 'bybit']
    
    requiredMobileWallets.forEach(wallet => {
      if (!wallets.includes(wallet)) {
        wallets.push(wallet)
      }
    })
  }

  // Mobile wallet detection methods
  private isMobile(): boolean {
    // Check if we're in a browser environment
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return false
    }
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  private isTrustWalletMobile(): boolean {
    // Check if Trust Wallet is installed on mobile
    try {
      // Check if we're in a browser environment
      if (typeof navigator === 'undefined' || typeof window === 'undefined' || typeof document === 'undefined') {
        return false
      }
      
      const userAgent = navigator.userAgent.toLowerCase()
      
      // More comprehensive Trust Wallet detection
      const hasTrustWalletUA = /trustwallet|trust wallet/i.test(userAgent)
      const hasTrustWindow = (window as any).trustwallet !== undefined
      const hasTrustReferrer = document.referrer.toLowerCase().includes('trust://')
      
      // Check for ethereum provider that might be Trust Wallet
      const hasEthereum = typeof window.ethereum !== 'undefined'
      const isTrustProvider = hasEthereum && (
        (window.ethereum as any).isTrust || 
        (window.ethereum as any).isTrustWallet ||
        userAgent.includes('trust')
      )
      
      // Check for WebView patterns
      const isWebView = /WebView/i.test(userAgent) || 
                        (window as any).WebView !== undefined ||
                        document.cookie.includes('trustwallet')
      
      return hasTrustWalletUA || hasTrustWindow || hasTrustReferrer || isTrustProvider || isWebView
    } catch {
      return false
    }
  }

  private isBybitWalletMobile(): boolean {
    // Check if Bybit Wallet is installed on mobile
    try {
      // Check if we're in a browser environment
      if (typeof navigator === 'undefined' || typeof window === 'undefined' || typeof document === 'undefined') {
        return false
      }
      
      const userAgent = navigator.userAgent.toLowerCase()
      const hasBybitUA = /bybit/i.test(userAgent)
      const hasBybitWindow = (window as any).bybit !== undefined
      const hasBybitReferrer = document.referrer.toLowerCase().includes('bybit://')
      
      // Check for ethereum provider that might be Bybit
      const hasEthereum = typeof window.ethereum !== 'undefined'
      const isBybitProvider = hasEthereum && (window.ethereum as any).isBybit
      
      return hasBybitUA || hasBybitWindow || hasBybitReferrer || isBybitProvider
    } catch {
      return false
    }
  }

  private isMetaMaskMobile(): boolean {
    // Check if MetaMask mobile is installed
    try {
      // Check if we're in a browser environment
      if (typeof navigator === 'undefined' || typeof window === 'undefined' || typeof document === 'undefined') {
        return false
      }
      
      const userAgent = navigator.userAgent.toLowerCase()
      const hasMetaMaskUA = /metamask/i.test(userAgent)
      const hasMetaMaskWindow = (window as any).ethereum?.isMetaMask
      
      return hasMetaMaskUA || hasMetaMaskWindow
    } catch {
      return false
    }
  }

  // Enhanced mobile wallet detection with more aggressive methods
  detectMobileWallets(): string[] {
    const mobileWallets: string[] = []
    
    if (!this.isMobile()) {
      return mobileWallets
    }

    // Check for Trust Wallet with multiple methods
    if (this.isTrustWalletMobile()) {
      mobileWallets.push('trustwallet')
    }

    // Check for Bybit Wallet with multiple methods
    if (this.isBybitWalletMobile()) {
      mobileWallets.push('bybit')
    }

    // Check for MetaMask Mobile
    if (this.isMetaMaskMobile()) {
      mobileWallets.push('metamask')
    }

    // Additional detection methods for other wallets
    this.detectAdditionalMobileWallets(mobileWallets)

    return mobileWallets
  }

  // Detect additional mobile wallets using various methods
  private detectAdditionalMobileWallets(wallets: string[]): void {
    try {
      // Check if we're in a browser environment
      if (typeof navigator === 'undefined' || typeof window === 'undefined') {
        return
      }
      
      const userAgent = navigator.userAgent.toLowerCase()
      
      // Check for Coinbase Wallet
      if (/coinbase/i.test(userAgent) || (window as any).coinbaseWallet) {
        if (!wallets.includes('coinbase')) {
          wallets.push('coinbase')
        }
      }
      
      // Check for Phantom (Solana)
      if (/phantom/i.test(userAgent) || (window as any).solana?.isPhantom) {
        if (!wallets.includes('phantom')) {
          wallets.push('phantom')
        }
      }
      
      // Check for any ethereum provider on mobile
      if (typeof window.ethereum !== 'undefined' && wallets.length === 0) {
        // If we have an ethereum provider but no specific wallets detected,
        // add a generic web3 option
        if (!wallets.includes('web3')) {
          wallets.push('web3')
        }
      }
    } catch (error) {
      console.warn('Error detecting additional mobile wallets:', error)
    }
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
      // Check if we're on mobile
      if (this.isMobile()) {
        // On mobile, always try to connect via deep link
        // Even if we can't detect it, it might be installed
        return await this.connectTrustWalletMobile()
      }

      // Try browser extension first
      if (window.trustwallet) {
        return await this.connectTrustWalletExtension()
      }

      // Try MetaMask-compatible interface (some versions of Trust Wallet)
      if (window.ethereum?.isTrust) {
        return await this.connectTrustWalletViaEthereum()
      }

      // If no Trust Wallet found but we're on desktop, provide installation instructions
      return {
        success: false,
        error: 'Trust Wallet not found. Please install Trust Wallet from https://trustwallet.com/download/'
      }
    } catch (error) {
      console.error('Trust Wallet connection error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Trust Wallet'
      }
    }
  }

  // Mobile Trust Wallet connection
  private async connectTrustWalletMobile(): Promise<WalletConnectionResult> {
    try {
      // Try to use WalletConnect protocol if available
      if (typeof (window as any).WalletConnect !== undefined) {
        // WalletConnect implementation would go here
        // For now, we'll use deep linking as fallback
      }

      // Create a deep link with connection parameters
      const callbackUrl = encodeURIComponent(`${window.location.origin}/api/wallet-callback?action=connect&wallet=trustwallet`)
      const deepLink = `trust://wc?uri=${callbackUrl}`
      
      // Store connection attempt in localStorage for handling callback
      localStorage.setItem('trust_wallet_connection', JSON.stringify({
        timestamp: Date.now(),
        callbackUrl: window.location.href,
        walletType: 'trustwallet'
      }))

      // Redirect to Trust Wallet
      window.location.href = deepLink

      // Return pending status
      return {
        success: true,
        address: 'pending',
        walletType: 'trustwallet',
        error: 'Redirecting to Trust Wallet... Please approve the connection and return to this page.'
      }
    } catch (error) {
      throw new Error(`Mobile Trust Wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Trust Wallet browser extension connection
  private async connectTrustWalletExtension(): Promise<WalletConnectionResult> {
    try {
      const accounts = await window.trustwallet!.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in Trust Wallet')
      }

      const address = accounts[0]
      
      // Store wallet in our system
      await this.tokenService.getOrCreateWallet(address, 'trustwallet', 'extension')

      return {
        success: true,
        address,
        walletType: 'trustwallet'
      }
    } catch (error) {
      throw new Error(`Trust Wallet extension connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Trust Wallet via Ethereum interface
  private async connectTrustWalletViaEthereum(): Promise<WalletConnectionResult> {
    try {
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const address = accounts[0]
      await this.tokenService.getOrCreateWallet(address, 'trustwallet', 'ethereum_interface')

      return {
        success: true,
        address,
        walletType: 'trustwallet'
      }
    } catch (error) {
      throw new Error(`Trust Wallet via Ethereum interface failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Connect to Bybit Wallet
  async connectBybitWallet(): Promise<WalletConnectionResult> {
    try {
      // Check if we're on mobile
      if (this.isMobile()) {
        // On mobile, always try to connect via deep link
        // Even if we can't detect it, it might be installed
        return await this.connectBybitWalletMobile()
      }

      // Try browser extension or desktop app
      if (window.bybit) {
        return await this.connectBybitWalletExtension()
      }

      // Try Ethereum-compatible interface
      if (window.ethereum?.isBybit) {
        return await this.connectBybitWalletViaEthereum()
      }

      // If no Bybit Wallet found but we're on desktop, provide installation instructions
      return {
        success: false,
        error: 'Bybit Wallet not found. Please install Bybit Wallet from https://www.bybit.com/en/download/'
      }
    } catch (error) {
      console.error('Bybit Wallet connection error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Bybit Wallet'
      }
    }
  }

  // Mobile Bybit Wallet connection
  private async connectBybitWalletMobile(): Promise<WalletConnectionResult> {
    try {
      // Create a deep link for Bybit Wallet
      const callbackUrl = encodeURIComponent(`${window.location.origin}/api/wallet-callback?action=connect&wallet=bybit`)
      const deepLink = `bybit://wc?uri=${callbackUrl}`
      
      // Store connection attempt in localStorage
      localStorage.setItem('bybit_wallet_connection', JSON.stringify({
        timestamp: Date.now(),
        callbackUrl: window.location.href,
        walletType: 'bybit'
      }))

      // Redirect to Bybit Wallet
      window.location.href = deepLink

      return {
        success: true,
        address: 'pending',
        walletType: 'bybit',
        error: 'Redirecting to Bybit Wallet... Please approve the connection and return to this page.'
      }
    } catch (error) {
      throw new Error(`Mobile Bybit Wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Bybit Wallet browser extension connection
  private async connectBybitWalletExtension(): Promise<WalletConnectionResult> {
    try {
      const accounts = await window.bybit!.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in Bybit Wallet')
      }

      const address = accounts[0]
      await this.tokenService.getOrCreateWallet(address, 'bybit', 'extension')

      return {
        success: true,
        address,
        walletType: 'bybit'
      }
    } catch (error) {
      throw new Error(`Bybit Wallet extension connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Bybit Wallet via Ethereum interface
  private async connectBybitWalletViaEthereum(): Promise<WalletConnectionResult> {
    try {
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const address = accounts[0]
      await this.tokenService.getOrCreateWallet(address, 'bybit', 'ethereum_interface')

      return {
        success: true,
        address,
        walletType: 'bybit'
      }
    } catch (error) {
      throw new Error(`Bybit Wallet via Ethereum interface failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  // Universal connect method with automatic network configuration
  async connectWallet(walletType: string, manualAddress?: string): Promise<WalletConnectionResult> {
    let result: WalletConnectionResult

    // Connect to the wallet first
    switch (walletType) {
      case 'metamask':
        result = await this.connectMetaMask()
        break
      case 'trustwallet':
        result = await this.connectTrustWallet()
        break
      case 'bybit':
        result = await this.connectBybitWallet()
        break
      case 'phantom':
        result = await this.connectPhantomWallet()
        break
      case 'coinbase':
        result = await this.connectCoinbaseWallet()
        break
      case 'manual':
        if (!manualAddress) {
          return {
            success: false,
            error: 'Manual address required'
          }
        }
        result = await this.connectManualWallet(manualAddress)
        break
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

    // If connection was successful and not pending, configure network
    if (result.success && result.address && result.address !== 'pending') {
      try {
        await this.configureWalletNetwork(walletType)
      } catch (networkError) {
        console.warn('Network configuration failed:', networkError)
        // Include network configuration error in the result but don't fail the connection
        if (networkError instanceof Error) {
          result.error = `${result.error || ''}. Network setup failed: ${networkError.message}. Please add the network manually.`
        }
      }
    }

    return result
  }

  // Configure network for connected wallet
  private async configureWalletNetwork(walletType: string): Promise<void> {
    try {
      // Import NetworkService dynamically to avoid circular dependency
      const NetworkService = (await import('./networkService')).default
      const networkService = new NetworkService()

      // Try to add and switch to the custom network
      const networkAdded = await networkService.addNetworkToWallet()
      
      if (networkAdded) {
        console.log('Network configured successfully for', walletType)
      } else {
        console.warn('Failed to configure network for', walletType)
      }
    } catch (error) {
      console.error('Error configuring network:', error)
      throw error
    }
  }

  // Handle wallet callback from mobile apps
  async handleWalletCallback(): Promise<WalletConnectionResult | null> {
    try {
      // Check for Trust Wallet callback
      const trustConnection = localStorage.getItem('trust_wallet_connection')
      if (trustConnection) {
        localStorage.removeItem('trust_wallet_connection')
        const connectionData = JSON.parse(trustConnection)
        
        // Check if callback is recent (within 5 minutes)
        if (Date.now() - connectionData.timestamp < 300000) {
          return await this.handleTrustWalletCallback(connectionData)
        }
      }

      // Check for Bybit Wallet callback
      const bybitConnection = localStorage.getItem('bybit_wallet_connection')
      if (bybitConnection) {
        localStorage.removeItem('bybit_wallet_connection')
        const connectionData = JSON.parse(bybitConnection)
        
        // Check if callback is recent (within 5 minutes)
        if (Date.now() - connectionData.timestamp < 300000) {
          return await this.handleBybitWalletCallback(connectionData)
        }
      }

      return null
    } catch (error) {
      console.error('Error handling wallet callback:', error)
      return null
    }
  }

  // Handle Trust Wallet callback
  private async handleTrustWalletCallback(connectionData: any): Promise<WalletConnectionResult> {
    try {
      // Try to get accounts from Trust Wallet if available
      if (window.ethereum?.isTrust || window.trustwallet) {
        const accounts = await (window.trustwallet || window.ethereum)!.request({
          method: 'eth_requestAccounts'
        })

        if (accounts && accounts.length > 0) {
          const address = accounts[0]
          await this.tokenService.getOrCreateWallet(address, 'trustwallet', 'mobile_callback')

          return {
            success: true,
            address,
            walletType: 'trustwallet'
          }
        }
      }

      // If no direct access, try to get address from URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const address = urlParams.get('address') || urlParams.get('account')
      
      if (address) {
        await this.tokenService.getOrCreateWallet(address, 'trustwallet', 'mobile_callback')
        return {
          success: true,
          address,
          walletType: 'trustwallet'
        }
      }

      throw new Error('No address found in Trust Wallet callback')
    } catch (error) {
      return {
        success: false,
        error: `Trust Wallet callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Handle Bybit Wallet callback
  private async handleBybitWalletCallback(connectionData: any): Promise<WalletConnectionResult> {
    try {
      // Try to get accounts from Bybit Wallet if available
      if (window.bybit || window.ethereum?.isBybit) {
        const accounts = await (window.bybit || window.ethereum)!.request({
          method: 'eth_requestAccounts'
        })

        if (accounts && accounts.length > 0) {
          const address = accounts[0]
          await this.tokenService.getOrCreateWallet(address, 'bybit', 'mobile_callback')

          return {
            success: true,
            address,
            walletType: 'bybit'
          }
        }
      }

      // If no direct access, try to get address from URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const address = urlParams.get('address') || urlParams.get('account')
      
      if (address) {
        await this.tokenService.getOrCreateWallet(address, 'bybit', 'mobile_callback')
        return {
          success: true,
          address,
          walletType: 'bybit'
        }
      }

      throw new Error('No address found in Bybit Wallet callback')
    } catch (error) {
      return {
        success: false,
        error: `Bybit Wallet callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    // Check if we're in a browser environment
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return false
    }
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

  // Public method to check if device is mobile
  public isDeviceMobile(): boolean {
    return this.isMobile()
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