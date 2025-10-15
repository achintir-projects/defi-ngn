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
  private customNetwork: NetworkConfig = {
    chainId: '0x' + (1337).toString(16), // 1337 in hex
    chainName: 'Custom Network',
    nativeCurrency: {
      name: 'Custom Ether',
      symbol: 'CETH',
      decimals: 18
    },
    rpcUrls: ['http://127.0.0.1:8545'], // Default local RPC
    blockExplorerUrls: ['https://custom-network-explorer.com'],
    isCustom: true
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

      return true
    } catch (error) {
      console.error('Error adding network to wallet:', error)
      return false
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
        return true
      } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          return await this.addNetworkToWallet()
        }
        throw switchError
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
  } {
    const baseConfig = this.customNetwork

    switch (walletType.toLowerCase()) {
      case 'metamask':
        return {
          title: 'Add Custom Network to MetaMask',
          description: 'Follow these steps to add the Custom Network to your MetaMask wallet:',
          steps: [
            'Open MetaMask and click on the network selector at the top',
            'Click "Add Network" or "Add network"',
            'Enter the network details manually or use our automated setup',
            'Click "Save" to add the network',
            'Switch to the Custom Network to start using our platform'
          ],
          networkConfig: baseConfig
        }

      case 'trustwallet':
        return {
          title: 'Add Custom Network to Trust Wallet',
          description: 'Follow these steps to add the Custom Network to your Trust Wallet:',
          steps: [
            'Open Trust Wallet and go to Settings',
            'Select "Networks" or "Network Settings"',
            'Tap "Add Network" or the + button',
            'Enter the network details provided below',
            'Save the network and switch to it'
          ],
          networkConfig: baseConfig
        }

      case 'bybit':
        return {
          title: 'Add Custom Network to Bybit Wallet',
          description: 'Follow these steps to add the Custom Network to your Bybit Wallet:',
          steps: [
            'Open Bybit Wallet and go to Settings',
            'Select "Network" or "Network Settings"',
            'Click "Add Network"',
            'Enter the network configuration details',
            'Save and switch to the new network'
          ],
          networkConfig: baseConfig
        }

      case 'phantom':
        return {
          title: 'Add Custom Network to Phantom',
          description: 'Note: Phantom is primarily a Solana wallet. For Ethereum networks:',
          steps: [
            'Phantom currently focuses on Solana ecosystem',
            'Consider using MetaMask or Trust Wallet for Ethereum-based networks',
            'Or use our manual wallet connection feature'
          ],
          networkConfig: baseConfig
        }

      case 'coinbase':
        return {
          title: 'Add Custom Network to Coinbase Wallet',
          description: 'Follow these steps to add the Custom Network to your Coinbase Wallet:',
          steps: [
            'Open Coinbase Wallet and go to Settings',
            'Select "Network" or "Network Settings"',
            'Tap "Add Network"',
            'Enter the network configuration',
            'Save and switch to the network'
          ],
          networkConfig: baseConfig
        }

      default:
        return {
          title: 'Add Custom Network',
          description: 'Follow these steps to add the Custom Network to your wallet:',
          steps: [
            'Open your wallet settings',
            'Find the network configuration section',
            'Add a new network with the provided details',
            'Switch to the Custom Network'
          ],
          networkConfig: baseConfig
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
  } {
    return {
      chainId: this.customNetwork.chainId,
      chainName: this.customNetwork.chainName,
      rpcUrl: this.customNetwork.rpcUrls[0],
      currencySymbol: this.customNetwork.nativeCurrency.symbol,
      explorerUrl: this.customNetwork.blockExplorerUrls[0]
    }
  }
}

// Create and export the service instance
const networkService = new NetworkService()
export default networkService