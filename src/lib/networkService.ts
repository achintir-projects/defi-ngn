import blockchainService from '@/lib/blockchainService'

export interface NetworkConfig {
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

export class NetworkService {
  private customNetwork: NetworkConfig

  constructor() {
    // Get network configuration from blockchain service
    const blockchainConfig = blockchainService.getNetworkConfig()
    this.customNetwork = {
      chainId: blockchainConfig.chainId,
      chainName: blockchainConfig.chainName,
      nativeCurrency: blockchainConfig.nativeCurrency,
      rpcUrls: blockchainConfig.rpcUrls,
      blockExplorerUrls: blockchainConfig.blockExplorerUrls,
      isCustom: blockchainConfig.isCustom
    }
  }

  // Get network configuration for wallet connection
  getNetworkConfig(): NetworkConfig {
    return this.customNetwork
  }

  // Add network to MetaMask or compatible wallet
  async addNetworkToWallet(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No web3 wallet found')
      }

      const network = this.customNetwork

      // First, try to switch to the network (it might already be added)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: network.chainId }]
        })
        console.log('Successfully switched to existing network')
        return true
      } catch (switchError: any) {
        // If the network doesn't exist (error code 4902), add it
        if (switchError.code === 4902) {
          console.log('Network not found, adding it...')
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: network.chainId,
                  chainName: network.chainName,
                  nativeCurrency: network.nativeCurrency,
                  rpcUrls: network.rpcUrls,
                  blockExplorerUrls: network.blockExplorerUrls
                }
              ]
            })
            
            // After adding, try to switch to it
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: network.chainId }]
            })
            
            console.log('Network added and switched successfully')
            return true
          } catch (addError: any) {
            console.error('Failed to add network:', addError)
            
            // Provide more specific error messages
            if (addError.code === 4001) {
              throw new Error('User rejected network addition. Please add the network manually using the instructions below.')
            } else if (addError.message?.includes('already exists')) {
              // Network might already exist, try switching again
              try {
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: network.chainId }]
                })
                return true
              } catch (switchError2) {
                throw new Error('Network already exists but failed to switch. Please try switching manually.')
              }
            } else {
              throw new Error(`Failed to add network: ${addError.message || 'Unknown error'}`)
            }
          }
        } else {
          throw new Error(`Failed to switch network: ${switchError.message || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error adding network to wallet:', error)
      throw error
    }
  }

  // Switch to custom network
  async switchToCustomNetwork(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No web3 wallet found')
      }

      const network = this.customNetwork

      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: network.chainId }]
        })
        console.log('Successfully switched to custom network')
        return true
      } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          console.log('Network not found, attempting to add it...')
          return await this.addNetworkToWallet()
        } else {
          console.error('Error switching network:', switchError)
          throw new Error(`Failed to switch network: ${switchError.message || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error switching to custom network:', error)
      return false
    }
  }

  // Check if current network is custom network
  async isOnCustomNetwork(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        return false
      }

      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      })

      return chainId === this.customNetwork.chainId
    } catch (error) {
      console.error('Error checking current network:', error)
      return false
    }
  }

  // Get network configuration for different wallet types
  getWalletNetworkInstructions(walletType: string): {
    title: string
    description: string
    steps: string[]
    networkConfig: NetworkConfig
    tokenContracts?: Array<{
      symbol: string
      name: string
      address: string
      decimals: number
      type: string
    }>
  } {
    const baseConfig = this.customNetwork
    
    // Get token contracts from blockchain service
    const tokenContracts = blockchainService.getTokenContracts().map(contract => ({
      symbol: contract.symbol,
      name: contract.name,
      address: contract.address,
      decimals: contract.decimals,
      type: contract.type
    }))

    switch (walletType.toLowerCase()) {
      case 'metamask':
        return {
          title: 'Add DeFi NGN Network to MetaMask',
          description: 'Follow these steps to add the DeFi NGN Network to your MetaMask wallet:',
          steps: [
            'Open MetaMask and click on the network selector at the top',
            'Click "Add Network" or "Add network"',
            'Enter the network details manually or use our automated setup',
            'Click "Save" to add the network',
            'Switch to the DeFi NGN Network to start using our platform'
          ],
          networkConfig: baseConfig,
          tokenContracts
        }

      case 'trustwallet':
        return {
          title: 'Add DeFi NGN Network to Trust Wallet',
          description: 'Follow these steps to add the DeFi NGN Network to your Trust Wallet:',
          steps: [
            'Open Trust Wallet and go to Settings',
            'Select "Networks" or "Network Settings"',
            'Tap "Add Network" or the + button',
            'Enter the network details provided below',
            'Save the network and switch to it',
            'The network will appear with NGN as the native currency'
          ],
          networkConfig: baseConfig,
          tokenContracts
        }

      case 'bybit':
        return {
          title: 'Add DeFi NGN Network to Bybit Wallet',
          description: 'Follow these steps to add the DeFi NGN Network to your Bybit Wallet:',
          steps: [
            'Open Bybit Wallet and go to Settings',
            'Select "Network" or "Network Settings"',
            'Click "Add Network"',
            'Enter the network configuration details',
            'Save and switch to the new network',
            'Your USDT and NGN tokens will appear with forced pricing'
          ],
          networkConfig: baseConfig,
          tokenContracts
        }

      case 'phantom':
        return {
          title: 'Add DeFi NGN Network to Phantom',
          description: 'Note: Phantom is primarily a Solana wallet. For Ethereum networks:',
          steps: [
            'Phantom currently focuses on Solana ecosystem',
            'Consider using MetaMask or Trust Wallet for Ethereum-based networks',
            'Or use our manual wallet connection feature'
          ],
          networkConfig: baseConfig,
          tokenContracts
        }

      case 'coinbase':
        return {
          title: 'Add DeFi NGN Network to Coinbase Wallet',
          description: 'Follow these steps to add the DeFi NGN Network to your Coinbase Wallet:',
          steps: [
            'Open Coinbase Wallet and go to Settings',
            'Select "Network" or "Network Settings"',
            'Tap "Add Network"',
            'Enter the network configuration',
            'Save and switch to the network'
          ],
          networkConfig: baseConfig,
          tokenContracts
        }

      default:
        return {
          title: 'Add DeFi NGN Network',
          description: 'Follow these steps to add the DeFi NGN Network to your wallet:',
          steps: [
            'Open your wallet settings',
            'Find the network configuration section',
            'Add a new network with the provided details',
            'Switch to the DeFi NGN Network'
          ],
          networkConfig: baseConfig,
          tokenContracts
        }
    }
  }

  // Generate network details for display
  getNetworkDisplayDetails(): {
    chainId: string
    chainName: string
    rpcUrl: string
    currencySymbol: string
    explorerUrl: string
    tokenContracts?: Array<{
      symbol: string
      name: string
      address: string
      decimals: number
      type: string
    }>
  } {
    const tokenContracts = blockchainService.getTokenContracts().map(contract => ({
      symbol: contract.symbol,
      name: contract.name,
      address: contract.address,
      decimals: contract.decimals,
      type: contract.type
    }))

    return {
      chainId: this.customNetwork.chainId,
      chainName: this.customNetwork.chainName,
      rpcUrl: this.customNetwork.rpcUrls[0],
      currencySymbol: this.customNetwork.nativeCurrency.symbol,
      explorerUrl: this.customNetwork.blockExplorerUrls[0],
      tokenContracts
    }
  }

  // Generate Trust Wallet specific configuration
  getTrustWalletConfig(): {
    networkConfig: NetworkConfig
    tokenContracts: Array<{
      symbol: string
      name: string
      address: string
      decimals: number
      type: string
    }>
    deepLinkUrl: string
    qrCodeData: string
  } {
    const tokenContracts = blockchainService.getTokenContracts().map(contract => ({
      symbol: contract.symbol,
      name: contract.name,
      address: contract.address,
      decimals: contract.decimals,
      type: contract.type
    }))

    const networkConfig = this.customNetwork
    
    // Generate deep link URL for Trust Wallet
    const deepLinkUrl = `https://link.trustwallet.com/add_network?chainId=${networkConfig.chainId}&chainName=${encodeURIComponent(networkConfig.chainName)}&rpcUrl=${encodeURIComponent(networkConfig.rpcUrls[0])}&symbol=${networkConfig.nativeCurrency.symbol}&decimals=${networkConfig.nativeCurrency.decimals}&blockExplorerUrl=${encodeURIComponent(networkConfig.blockExplorerUrls[0])}`
    
    // Generate QR code data
    const qrCodeData = JSON.stringify({
      chainId: networkConfig.chainId,
      chainName: networkConfig.chainName,
      nativeCurrency: networkConfig.nativeCurrency,
      rpcUrls: networkConfig.rpcUrls,
      blockExplorerUrls: networkConfig.blockExplorerUrls,
      tokens: tokenContracts
    })

    return {
      networkConfig,
      tokenContracts,
      deepLinkUrl,
      qrCodeData
    }
  }

  // Add token to wallet (for Trust Wallet and other wallets that support token detection)
  async addTokenToWallet(tokenAddress: string, tokenSymbol: string, tokenDecimals: number): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No web3 wallet found')
      }

      const tokenImage = '' // Optional: URL to token image

      try {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: tokenDecimals,
              image: tokenImage
            }
          }
        })
        return true
      } catch (error) {
        console.error('Error adding token to wallet:', error)
        return false
      }
    } catch (error) {
      console.error('Error adding token to wallet:', error)
      return false
    }
  }

  // Add all available tokens to wallet
  async addAllTokensToWallet(): Promise<boolean> {
    try {
      const tokenContracts = blockchainService.getTokenContracts()
      let successCount = 0

      for (const contract of tokenContracts) {
        const success = await this.addTokenToWallet(
          contract.address,
          contract.symbol,
          contract.decimals
        )
        if (success) {
          successCount++
        }
      }

      return successCount > 0
    } catch (error) {
      console.error('Error adding tokens to wallet:', error)
      return false
    }
  }
}

// Create and export the service instance
const networkService = new NetworkService()
export default networkService