import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export interface TokenBalance {
  walletAddress: string
  tokenSymbol: string
  balance: number
  frozenBalance: number
  forcedPrice: number
  realPrice: number
  value: number
  lastUpdated: string
}

export interface TokenConfig {
  symbol: string
  name: string
  decimals: number
  chain: string
  tokenType: string
  currentPrice: number
  forcedPrice: number
  maxSupply: number
  circulatingSupply: number
  isAdminControlled: boolean
  contractAddress?: string
  status: string
}

export interface WalletInfo {
  address: string
  type: string
  chain: string
  isConnected: boolean
  connectionMethod?: string
  lastConnectedAt?: string
}

export interface TransactionRequest {
  fromAddress: string
  toAddress: string
  tokenSymbol: string
  amount: number
  forcedPrice?: number
}

class OffChainTokenService {
  private customNetwork = 'Sepolia'

  // Initialize default tokens
  async initializeDefaultTokens() {
    const defaultTokens = [
      {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        chain: this.customNetwork,
        tokenType: 'ERC20',
        currentPrice: 1.0,
        forcedPrice: 2.0,
        maxSupply: 1000000000,
        circulatingSupply: 0,
        isAdminControlled: true,
        status: 'active'
      },
      {
        symbol: 'USDT_TRC20',
        name: 'Tether USD (TRC20)',
        decimals: 6,
        chain: this.customNetwork,
        tokenType: 'TRC20',
        currentPrice: 1.0,
        forcedPrice: 2.0,
        maxSupply: 1000000000,
        circulatingSupply: 0,
        isAdminControlled: true,
        status: 'active'
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        chain: this.customNetwork,
        tokenType: 'NATIVE',
        currentPrice: 3000.0,
        forcedPrice: 3500.0,
        maxSupply: 1000000,
        circulatingSupply: 0,
        isAdminControlled: true,
        status: 'active'
      },
      {
        symbol: 'CUSTOM',
        name: 'Platform Token',
        decimals: 18,
        chain: this.customNetwork,
        tokenType: 'ERC20',
        currentPrice: 0.1,
        forcedPrice: 10.0,
        maxSupply: 100000000,
        circulatingSupply: 0,
        isAdminControlled: true,
        status: 'active'
      }
    ]

    for (const token of defaultTokens) {
      try {
        await db.tokenConfig.upsert({
          where: { symbol: token.symbol },
          update: token,
          create: token
        })
      } catch (error) {
        console.error(`Error initializing token ${token.symbol}:`, error)
      }
    }
  }

  // Get or create wallet
  async getOrCreateWallet(address: string, type: string, connectionMethod?: string): Promise<WalletInfo> {
    try {
      let wallet = await db.userWallet.findUnique({
        where: { address }
      })

      if (!wallet) {
        wallet = await db.userWallet.create({
          data: {
            address,
            type,
            chain: this.customNetwork,
            connectionMethod,
            isConnected: true,
            lastConnectedAt: new Date()
          }
        })
      } else {
        wallet = await db.userWallet.update({
          where: { address },
          data: {
            isConnected: true,
            lastConnectedAt: new Date(),
            connectionMethod
          }
        })
      }

      return {
        address: wallet.address,
        type: wallet.type,
        chain: wallet.chain,
        isConnected: wallet.isConnected,
        connectionMethod: wallet.connectionMethod || undefined,
        lastConnectedAt: wallet.lastConnectedAt?.toISOString()
      }
    } catch (error) {
      console.error('Error getting/creating wallet:', error)
      throw error
    }
  }

  // Disconnect wallet
  async disconnectWallet(address: string): Promise<void> {
    try {
      await db.userWallet.update({
        where: { address },
        data: {
          isConnected: false,
          lastDisconnectedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
      throw error
    }
  }

  // Get token balance for wallet
  async getTokenBalance(walletAddress: string, tokenSymbol: string): Promise<TokenBalance | null> {
    try {
      const balance = await db.walletTokenBalance.findUnique({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress,
            tokenSymbol
          }
        },
        include: {
          tokenConfig: true
        }
      })

      if (!balance) {
        return null
      }

      const tokenConfig = balance.tokenConfig
      const forcedPrice = tokenConfig.forcedPrice
      const realPrice = tokenConfig.currentPrice
      const totalBalance = balance.balance + balance.frozenBalance

      return {
        walletAddress: balance.walletAddress,
        tokenSymbol: balance.tokenSymbol,
        balance: balance.balance,
        frozenBalance: balance.frozenBalance,
        forcedPrice,
        realPrice,
        value: totalBalance * forcedPrice,
        lastUpdated: balance.lastUpdated.toISOString()
      }
    } catch (error) {
      console.error('Error getting token balance:', error)
      throw error
    }
  }

  // Get all token balances for wallet
  async getAllTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      const balances = await db.walletTokenBalance.findMany({
        where: { walletAddress },
        include: {
          tokenConfig: true
        }
      })

      return balances.map(balance => {
        const tokenConfig = balance.tokenConfig
        const forcedPrice = tokenConfig.forcedPrice
        const realPrice = tokenConfig.currentPrice
        const totalBalance = balance.balance + balance.frozenBalance

        return {
          walletAddress: balance.walletAddress,
          tokenSymbol: balance.tokenSymbol,
          balance: balance.balance,
          frozenBalance: balance.frozenBalance,
          forcedPrice,
          realPrice,
          value: totalBalance * forcedPrice,
          lastUpdated: balance.lastUpdated.toISOString()
        }
      })
    } catch (error) {
      console.error('Error getting all token balances:', error)
      throw error
    }
  }

  // Inject tokens to wallet (admin only)
  async injectTokens(
    walletAddress: string,
    tokenSymbol: string,
    amount: number,
    forcedPrice?: number,
    adminId?: string
  ): Promise<TokenBalance> {
    try {
      // Get token config
      const tokenConfig = await db.tokenConfig.findUnique({
        where: { symbol: tokenSymbol }
      })

      if (!tokenConfig) {
        throw new Error(`Token ${tokenSymbol} not found`)
      }

      // Update forced price if provided
      if (forcedPrice && forcedPrice !== tokenConfig.forcedPrice) {
        await db.tokenConfig.update({
          where: { symbol: tokenSymbol },
          data: { forcedPrice }
        })
      }

      // Get or create balance
      let balance = await db.walletTokenBalance.findUnique({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress,
            tokenSymbol
          }
        }
      })

      if (!balance) {
        balance = await db.walletTokenBalance.create({
          data: {
            walletAddress,
            tokenSymbol,
            balance: amount,
            frozenBalance: 0
          }
        })
      } else {
        balance = await db.walletTokenBalance.update({
          where: { id: balance.id },
          data: {
            balance: balance.balance + amount
          }
        })
      }

      // Update token circulating supply
      await db.tokenConfig.update({
        where: { symbol: tokenSymbol },
        data: {
          circulatingSupply: tokenConfig.circulatingSupply + amount
        }
      })

      // Create transaction record
      const transactionHash = `offchain_${uuidv4()}`
      await db.transaction.create({
        data: {
          type: 'injection',
          status: 'completed',
          amount,
          tokenSymbol,
          tokenName: tokenConfig.name,
          fromAddress: 'SYSTEM',
          toAddress: walletAddress,
          hash: transactionHash,
          chain: this.customNetwork,
          forcedPrice: forcedPrice || tokenConfig.forcedPrice,
          realPrice: tokenConfig.currentPrice,
          value: amount * (forcedPrice || tokenConfig.forcedPrice),
          isGasless: true,
          confirmations: 1,
          requiredConfirmations: 1,
          completedAt: new Date(),
          userId: adminId
        }
      })

      // Return updated balance
      return await this.getTokenBalance(walletAddress, tokenSymbol)!
    } catch (error) {
      console.error('Error injecting tokens:', error)
      throw error
    }
  }

  // Transfer tokens between wallets
  async transferTokens(request: TransactionRequest): Promise<{
    success: boolean
    transactionHash?: string
    error?: string
  }> {
    try {
      const { fromAddress, toAddress, tokenSymbol, amount, forcedPrice } = request

      // Get token config
      const tokenConfig = await db.tokenConfig.findUnique({
        where: { symbol: tokenSymbol }
      })

      if (!tokenConfig) {
        throw new Error(`Token ${tokenSymbol} not found`)
      }

      // Get sender balance
      const senderBalance = await db.walletTokenBalance.findUnique({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress: fromAddress,
            tokenSymbol
          }
        }
      })

      if (!senderBalance || senderBalance.balance < amount) {
        throw new Error('Insufficient balance')
      }

      // Get or create recipient balance
      let recipientBalance = await db.walletTokenBalance.findUnique({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress: toAddress,
            tokenSymbol
          }
        }
      })

      // Freeze sender's tokens
      await db.walletTokenBalance.update({
        where: { id: senderBalance.id },
        data: {
          balance: senderBalance.balance - amount,
          frozenBalance: senderBalance.frozenBalance + amount
        }
      })

      // Create recipient balance if doesn't exist
      if (!recipientBalance) {
        recipientBalance = await db.walletTokenBalance.create({
          data: {
            walletAddress: toAddress,
            tokenSymbol,
            balance: 0,
            frozenBalance: amount
          }
        })
      } else {
        await db.walletTokenBalance.update({
          where: { id: recipientBalance.id },
          data: {
            frozenBalance: recipientBalance.frozenBalance + amount
          }
        })
      }

      // Create transaction record
      const transactionHash = `offchain_${uuidv4()}`
      const transaction = await db.transaction.create({
        data: {
          type: 'transfer',
          status: 'processing',
          amount,
          tokenSymbol,
          tokenName: tokenConfig.name,
          fromAddress,
          toAddress,
          hash: transactionHash,
          chain: this.customNetwork,
          forcedPrice: forcedPrice || tokenConfig.forcedPrice,
          realPrice: tokenConfig.currentPrice,
          value: amount * (forcedPrice || tokenConfig.forcedPrice),
          isGasless: true,
          confirmations: 0,
          requiredConfirmations: 1
        }
      })

      // Simulate processing delay
      setTimeout(async () => {
        try {
          // Complete the transfer
          await db.walletTokenBalance.update({
            where: { id: senderBalance.id },
            data: {
              frozenBalance: senderBalance.frozenBalance
            }
          })

          await db.walletTokenBalance.update({
            where: { id: recipientBalance.id },
            data: {
              balance: recipientBalance.balance + amount,
              frozenBalance: recipientBalance.frozenBalance - amount
            }
          })

          await db.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'completed',
              confirmations: 1,
              completedAt: new Date()
            }
          })
        } catch (error) {
          console.error('Error completing transfer:', error)
          // Reverse the transaction
          await db.walletTokenBalance.update({
            where: { id: senderBalance.id },
            data: {
              balance: senderBalance.balance,
              frozenBalance: senderBalance.frozenBalance
            }
          })

          await db.walletTokenBalance.update({
            where: { id: recipientBalance.id },
            data: {
              frozenBalance: recipientBalance.frozenBalance - amount
            }
          })

          await db.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'failed',
              errorMessage: 'Transfer failed',
              completedAt: new Date()
            }
          })
        }
      }, 2000) // 2 second delay for processing

      return {
        success: true,
        transactionHash
      }
    } catch (error) {
      console.error('Error transferring tokens:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed'
      }
    }
  }

  // Get all available tokens
  async getAllTokens(): Promise<TokenConfig[]> {
    try {
      const tokens = await db.tokenConfig.findMany({
        where: { status: 'active' }
      })

      return tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        chain: token.chain,
        tokenType: token.tokenType,
        currentPrice: token.currentPrice,
        forcedPrice: token.forcedPrice,
        maxSupply: token.maxSupply,
        circulatingSupply: token.circulatingSupply,
        isAdminControlled: token.isAdminControlled,
        contractAddress: token.contractAddress || undefined,
        status: token.status
      }))
    } catch (error) {
      console.error('Error getting all tokens:', error)
      throw error
    }
  }

  // Get transaction history for wallet
  async getTransactionHistory(walletAddress: string): Promise<any[]> {
    try {
      const transactions = await db.transaction.findMany({
        where: {
          OR: [
            { fromAddress: walletAddress },
            { toAddress: walletAddress }
          ]
        },
        orderBy: { timestamp: 'desc' },
        include: {
          tokenConfig: true,
          fromWallet: true,
          toWallet: true
        }
      })

      return transactions
    } catch (error) {
      console.error('Error getting transaction history:', error)
      throw error
    }
  }

  // Generate claim signature for gasless claims
  async generateClaimSignature(
    walletAddress: string,
    tokenSymbol: string,
    amount: number,
    expiryHours: number = 24
  ): Promise<{ signature: string; expiry: string }> {
    try {
      const expiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000)
      const signature = `claim_${uuidv4()}_${walletAddress}_${tokenSymbol}_${amount}_${expiry.getTime()}`

      await db.claimSignature.create({
        data: {
          walletAddress,
          tokenSymbol,
          amount,
          signature,
          expiry
        }
      })

      return { signature, expiry: expiry.toISOString() }
    } catch (error) {
      console.error('Error generating claim signature:', error)
      throw error
    }
  }

  // Claim tokens using signature
  async claimTokens(signature: string, walletAddress: string): Promise<TokenBalance> {
    try {
      const claimSig = await db.claimSignature.findUnique({
        where: { signature },
        include: {
          tokenConfig: true
        }
      })

      if (!claimSig) {
        throw new Error('Invalid signature')
      }

      if (claimSig.used) {
        throw new Error('Signature already used')
      }

      if (new Date() > claimSig.expiry) {
        throw new Error('Signature expired')
      }

      if (claimSig.walletAddress !== walletAddress) {
        throw new Error('Signature not for this wallet')
      }

      // Mark signature as used
      await db.claimSignature.update({
        where: { id: claimSig.id },
        data: {
          used: true,
          usedAt: new Date()
        }
      })

      // Inject tokens
      return await this.injectTokens(
        walletAddress,
        claimSig.tokenSymbol,
        claimSig.amount,
        claimSig.tokenConfig.forcedPrice
      )
    } catch (error) {
      console.error('Error claiming tokens:', error)
      throw error
    }
  }
}

// Create and export the service instance
const offChainTokenService = new OffChainTokenService()
export default offChainTokenService