import networkService from '@/lib/networkService'
import blockchainService from '@/lib/blockchainService'
import smartContractService from '@/lib/smartContractService'

export interface TrustWalletNetworkConfig {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
  isCustom: boolean
}

export interface TrustWalletTokenConfig {
  symbol: string
  name: string
  address: string
  decimals: number
  type: string
  logoURI?: string
}

export interface TrustWalletConfig {
  network: TrustWalletNetworkConfig
  tokens: TrustWalletTokenConfig[]
  deepLinkUrl: string
  qrCodeData: string
  installationGuide: {
    title: string
    description: string
    steps: string[]
  }
}

export interface MobileWalletDetection {
  isTrustWallet: boolean
  isBybitWallet: boolean
  isMobile: boolean
  userAgent: string
  deepLinkSupported: boolean
}

class TrustWalletService {
  private readonly TRUST_WALLET_DEEPLINK_SCHEME = 'trust:'
  private readonly TRUST_WALLET_APP_STORE_URL = 'https://trustwallet.com/download'
  private readonly BYBIT_WALLET_APP_STORE_URL = 'https://www.bybit.com/en/download/'

  // Generate complete Trust Wallet configuration
  generateTrustWalletConfig(): TrustWalletConfig {
    const networkConfig = networkService.getTrustWalletConfig()
    const tokenContracts = blockchainService.getTokenContracts()

    const tokens: TrustWalletTokenConfig[] = tokenContracts.map(contract => ({
      symbol: contract.symbol,
      name: contract.name,
      address: contract.address,
      decimals: contract.decimals,
      type: contract.type,
      logoURI: this.generateTokenLogoUrl(contract.symbol)
    }))

    return {
      network: {
        chainId: networkConfig.networkConfig.chainId,
        chainName: networkConfig.networkConfig.chainName,
        nativeCurrency: networkConfig.networkConfig.nativeCurrency,
        rpcUrls: networkConfig.networkConfig.rpcUrls,
        blockExplorerUrls: networkConfig.networkConfig.blockExplorerUrls,
        isCustom: networkConfig.networkConfig.isCustom
      },
      tokens,
      deepLinkUrl: networkConfig.deepLinkUrl,
      qrCodeData: networkConfig.qrCodeData,
      installationGuide: {
        title: 'Add DeFi NGN Network to Trust Wallet',
        description: 'Follow these steps to add the DeFi NGN Network and tokens to your Trust Wallet:',
        steps: [
          '1. Open Trust Wallet on your mobile device',
          '2. Tap on "Settings" in the bottom-right corner',
          '3. Select "Networks" from the settings menu',
          '4. Tap the "+" button in the top-right corner',
          '5. Choose "Add Custom Network"',
          '6. Enter the network details provided below',
          '7. Tap "Save" to add the network',
          '8. Switch to the DeFi NGN Network',
          '9. Your USDT and NGN tokens will appear automatically'
        ]
      }
    }
  }

  // Generate network-specific configuration for QR codes
  generateQRCodeConfig(): {
    network: TrustWalletNetworkConfig
    tokens: TrustWalletTokenConfig[]
    configString: string
    qrData: string
  } {
    const config = this.generateTrustWalletConfig()
    
    const configString = JSON.stringify({
      network: config.network,
      tokens: config.tokens,
      timestamp: Date.now(),
      version: '1.0'
    }, null, 2)

    const qrData = `defi-ngn://${Buffer.from(configString).toString('base64')}`

    return {
      network: config.network,
      tokens: config.tokens,
      configString,
      qrData
    }
  }

  // Generate Trust Wallet deep link for network addition
  generateNetworkDeepLink(): string {
    const config = this.generateTrustWalletConfig()
    return config.deepLinkUrl
  }

  // Generate token addition deep link
  generateTokenDeepLink(tokenAddress: string, symbol: string, decimals: number): string {
    return `trust://add_asset?asset_type=ERC20&address=${tokenAddress}&symbol=${symbol}&decimals=${decimals}`
  }

  // Detect mobile wallet environment
  detectMobileWallet(): MobileWalletDetection {
    const userAgent = navigator.userAgent.toLowerCase()
    
    const isTrustWallet = /trustwallet/.test(userAgent)
    const isBybitWallet = /bybit/.test(userAgent)
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const deepLinkSupported = isMobile && (isTrustWallet || isBybitWallet)

    return {
      isTrustWallet,
      isBybitWallet,
      isMobile,
      userAgent,
      deepLinkSupported
    }
  }

  // Attempt to add network to Trust Wallet automatically
  async addNetworkToTrustWallet(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No web3 wallet found')
      }

      const detection = this.detectMobileWallet()
      
      if (!detection.isTrustWallet && !detection.isBybitWallet) {
        throw new Error('Trust Wallet or Bybit Wallet not detected')
      }

      // Use the network service to add the network
      const success = await networkService.addNetworkToWallet()
      
      if (success) {
        // Try to add tokens automatically
        await this.addAllTokensToWallet()
      }

      return success
    } catch (error) {
      console.error('Error adding network to Trust Wallet:', error)
      throw error
    }
  }

  // Add specific token to wallet
  async addTokenToTrustWallet(tokenAddress: string, symbol: string, decimals: number): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No web3 wallet found')
      }

      const detection = this.detectMobileWallet()
      
      if (!detection.isTrustWallet && !detection.isBybitWallet) {
        throw new Error('Trust Wallet or Bybit Wallet not detected')
      }

      const success = await networkService.addTokenToWallet(tokenAddress, symbol, decimals)
      
      if (success) {
        console.log(`Token ${symbol} added to wallet successfully`)
      }

      return success
    } catch (error) {
      console.error('Error adding token to Trust Wallet:', error)
      throw error
    }
  }

  // Add all available tokens to wallet
  async addAllTokensToWallet(): Promise<boolean> {
    try {
      const tokenContracts = blockchainService.getTokenContracts()
      let successCount = 0

      for (const contract of tokenContracts) {
        const success = await this.addTokenToTrustWallet(
          contract.address,
          contract.symbol,
          contract.decimals
        )
        if (success) {
          successCount++
        }
      }

      console.log(`Successfully added ${successCount}/${tokenContracts.length} tokens to wallet`)
      return successCount > 0
    } catch (error) {
      console.error('Error adding tokens to Trust Wallet:', error)
      throw error
    }
  }

  // Generate installation instructions based on device
  getInstallationInstructions(): {
    title: string
    description: string
    steps: string[]
    appStoreUrl: string
    qrCodeData?: string
  } {
    const detection = this.detectMobileWallet()
    
    if (detection.isMobile) {
      if (detection.isTrustWallet) {
        return {
          title: 'Trust Wallet Detected',
          description: 'Great! You already have Trust Wallet installed. You can now add the DeFi NGN Network.',
          steps: [
            '1. Tap the "Add Network" button below',
            '2. Approve the network addition in Trust Wallet',
            '3. Switch to the DeFi NGN Network',
            '4. Your tokens will appear automatically'
          ],
          appStoreUrl: this.TRUST_WALLET_APP_STORE_URL
        }
      } else if (detection.isBybitWallet) {
        return {
          title: 'Bybit Wallet Detected',
          description: 'Great! You have Bybit Wallet installed. You can now add the DeFi NGN Network.',
          steps: [
            '1. Tap the "Add Network" button below',
            '2. Approve the network addition in Bybit Wallet',
            '3. Switch to the DeFi NGN Network',
            '4. Your tokens will appear automatically'
          ],
          appStoreUrl: this.BYBIT_WALLET_APP_STORE_URL
        }
      } else {
        return {
          title: 'Install Trust Wallet',
          description: 'To use the DeFi NGN Network, you need to install Trust Wallet first.',
          steps: [
            '1. Tap the "Download Trust Wallet" button below',
            '2. Install Trust Wallet from the app store',
            '3. Return to this page and tap "Add Network"',
            '4. Follow the setup instructions'
          ],
          appStoreUrl: this.TRUST_WALLET_APP_STORE_URL
        }
      }
    } else {
      return {
        title: 'Install Trust Wallet on Mobile',
        description: 'The DeFi NGN Network is designed for mobile wallets. Please install Trust Wallet on your mobile device.',
        steps: [
          '1. Scan the QR code below with your mobile device',
          '2. Install Trust Wallet from the app store',
          '3. Return to this page on your mobile device',
          '4. Tap "Add Network" to configure the DeFi NGN Network'
        ],
        appStoreUrl: this.TRUST_WALLET_APP_STORE_URL,
        qrCodeData: this.TRUST_WALLET_APP_STORE_URL
      }
    }
  }

  // Generate token logo URL
  private generateTokenLogoUrl(symbol: string): string {
    // In a real implementation, this would return actual token logo URLs
    const logoMap: { [key: string]: string } = {
      'USDT': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
      'USDT_TRC20': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/assets/TXkQxd6dJgNrpjU5H3H1LZJGJZ4KkD4bJ/logo.png',
      'NGN': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x0000000000000000000000000000000000000000/logo.png'
    }
    
    return logoMap[symbol] || `https://via.placeholder.com/32x32?text=${symbol}`
  }

  // Validate network configuration
  validateNetworkConfig(config: TrustWalletNetworkConfig): boolean {
    return (
      config.chainId &&
      config.chainName &&
      config.nativeCurrency &&
      config.nativeCurrency.name &&
      config.nativeCurrency.symbol &&
      config.nativeCurrency.decimals &&
      config.rpcUrls &&
      config.rpcUrls.length > 0 &&
      config.blockExplorerUrls &&
      config.blockExplorerUrls.length > 0
    )
  }

  // Generate network configuration file for Trust Wallet
  generateNetworkConfigFile(): string {
    const config = this.generateTrustWalletConfig()
    
    return JSON.stringify({
      name: config.network.chainName,
      chainId: parseInt(config.network.chainId, 16),
      shortName: 'ngn',
      chain: 'NGN',
      network: 'defi-ngn',
      nativeCurrency: {
        name: config.network.nativeCurrency.name,
        symbol: config.network.nativeCurrency.symbol,
        decimals: config.network.nativeCurrency.decimals
      },
      rpc: config.network.rpcUrls[0],
      faucets: [],
      infoURL: config.network.blockExplorerUrls[0],
      tokens: config.tokens.map(token => ({
        name: token.name,
        symbol: token.symbol,
        address: token.address,
        decimals: token.decimals,
        chainId: parseInt(config.network.chainId, 16),
        logoURI: token.logoURI
      }))
    }, null, 2)
  }

  // Export configuration for external use
  exportConfiguration(): {
    trustWallet: TrustWalletConfig
    networkConfigFile: string
    mobileDetection: MobileWalletDetection
    installationInstructions: ReturnType<typeof this.getInstallationInstructions>
  } {
    return {
      trustWallet: this.generateTrustWalletConfig(),
      networkConfigFile: this.generateNetworkConfigFile(),
      mobileDetection: this.detectMobileWallet(),
      installationInstructions: this.getInstallationInstructions()
    }
  }
}

// Create and export the service instance
const trustWalletService = new TrustWalletService()
export default trustWalletService