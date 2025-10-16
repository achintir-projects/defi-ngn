import { db } from '@/lib/db'
import blockchainService from '@/lib/blockchainService'
import { v4 as uuidv4 } from 'uuid'

export interface ForcedPriceConfig {
  symbol: string
  forcedPrice: number
  realPrice: number
  priceMultiplier: number
  isActive: boolean
  lastUpdated: string
  updatedBy: string
}

export interface TokenPricing {
  symbol: string
  name: string
  realPrice: number
  forcedPrice: number
  priceMultiplier: number
  marketCap: number
  volume24h: number
  priceChange24h: number
  lastUpdated: string
}

export interface BalanceDisplayConfig {
  walletAddress: string
  tokenSymbol: string
  displayBalance: number
  realBalance: number
  forcedPrice: number
  displayValue: number
  realValue: number
  isVisible: boolean
  customDecimals?: number
}

export interface PriceUpdateRequest {
  symbol: string
  forcedPrice: number
  realPrice?: number
  updateReason?: string
  updatedBy: string
}

export interface BulkPriceUpdate {
  updates: PriceUpdateRequest[]
  updatedBy: string
}

class PricingService {
  private readonly DEFAULT_PRICE_MULTIPLIER = 2.0
  private readonly PRICE_UPDATE_INTERVAL = 30000 // 30 seconds
  private priceUpdateTimer: NodeJS.Timeout | null = null

  constructor() {
    this.startPriceUpdates()
  }

  // Initialize default forced pricing
  async initializeDefaultPricing() {
    const defaultTokens = [
      {
        symbol: 'USDT',
        forcedPrice: 2.0,
        realPrice: 1.0,
        priceMultiplier: 2.0
      },
      {
        symbol: 'USDT_TRC20',
        forcedPrice: 2.0,
        realPrice: 1.0,
        priceMultiplier: 2.0
      },
      {
        symbol: 'NGN',
        forcedPrice: 10.0,
        realPrice: 0.1,
        priceMultiplier: 100.0
      },
      {
        symbol: 'ETH',
        forcedPrice: 3500.0,
        realPrice: 3000.0,
        priceMultiplier: 1.167
      }
    ]

    for (const token of defaultTokens) {
      try {
        await this.updateForcedPrice({
          symbol: token.symbol,
          forcedPrice: token.forcedPrice,
          realPrice: token.realPrice,
          updateReason: 'Initial setup',
          updatedBy: 'system'
        })
      } catch (error) {
        console.error(`Error initializing pricing for ${token.symbol}:`, error)
      }
    }
  }

  // Get forced price for a token
  async getForcedPrice(symbol: string): Promise<ForcedPriceConfig | null> {
    try {
      const tokenConfig = await db.tokenConfig.findUnique({
        where: { symbol }
      })

      if (!tokenConfig) {
        return null
      }

      return {
        symbol: tokenConfig.symbol,
        forcedPrice: tokenConfig.forcedPrice,
        realPrice: tokenConfig.currentPrice,
        priceMultiplier: tokenConfig.forcedPrice / tokenConfig.currentPrice,
        isActive: tokenConfig.status === 'active',
        lastUpdated: tokenConfig.updatedAt.toISOString(),
        updatedBy: 'system'
      }
    } catch (error) {
      console.error('Error getting forced price:', error)
      return null
    }
  }

  // Update forced price for a token
  async updateForcedPrice(request: PriceUpdateRequest): Promise<ForcedPriceConfig> {
    try {
      const { symbol, forcedPrice, realPrice, updateReason, updatedBy } = request

      // Get current token config
      const currentConfig = await db.tokenConfig.findUnique({
        where: { symbol }
      })

      if (!currentConfig) {
        throw new Error(`Token ${symbol} not found`)
      }

      // Update token config with new forced price
      const updatedConfig = await db.tokenConfig.update({
        where: { symbol },
        data: {
          forcedPrice,
          currentPrice: realPrice || currentConfig.currentPrice,
          updatedAt: new Date()
        }
      })

      // Log price update
      await db.priceUpdate.create({
        data: {
          symbol,
          oldForcedPrice: currentConfig.forcedPrice,
          newForcedPrice: forcedPrice,
          oldRealPrice: currentConfig.currentPrice,
          newRealPrice: realPrice || currentConfig.currentPrice,
          updateReason: updateReason || 'Manual update',
          updatedBy
        }
      })

      // Update all wallet balances with new pricing
      await this.updateWalletBalancesWithNewPrice(symbol, forcedPrice)

      const forcedPriceConfig: ForcedPriceConfig = {
        symbol: updatedConfig.symbol,
        forcedPrice: updatedConfig.forcedPrice,
        realPrice: updatedConfig.currentPrice,
        priceMultiplier: updatedConfig.forcedPrice / updatedConfig.currentPrice,
        isActive: updatedConfig.status === 'active',
        lastUpdated: updatedConfig.updatedAt.toISOString(),
        updatedBy
      }

      return forcedPriceConfig
    } catch (error) {
      console.error('Error updating forced price:', error)
      throw error
    }
  }

  // Bulk update forced prices
  async bulkUpdateForcedPrices(request: BulkPriceUpdate): Promise<ForcedPriceConfig[]> {
    try {
      const { updates, updatedBy } = request
      const results: ForcedPriceConfig[] = []

      for (const update of updates) {
        try {
          const result = await this.updateForcedPrice({
            ...update,
            updatedBy
          })
          results.push(result)
        } catch (error) {
          console.error(`Error updating price for ${update.symbol}:`, error)
        }
      }

      return results
    } catch (error) {
      console.error('Error in bulk price update:', error)
      throw error
    }
  }

  // Get all token pricing
  async getAllTokenPricing(): Promise<TokenPricing[]> {
    try {
      const tokens = await db.tokenConfig.findMany({
        where: { status: 'active' },
        orderBy: { symbol: 'asc' }
      })

      return tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        realPrice: token.currentPrice,
        forcedPrice: token.forcedPrice,
        priceMultiplier: token.forcedPrice / token.currentPrice,
        marketCap: token.circulatingSupply * token.forcedPrice,
        volume24h: 0, // Would get from real data source
        priceChange24h: 0, // Would calculate from historical data
        lastUpdated: token.updatedAt.toISOString()
      }))
    } catch (error) {
      console.error('Error getting all token pricing:', error)
      throw error
    }
  }

  // Get balance display configuration for a wallet
  async getBalanceDisplay(walletAddress: string, tokenSymbol?: string): Promise<BalanceDisplayConfig[]> {
    try {
      let balances
      
      if (tokenSymbol) {
        // Get specific token balance
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
          return []
        }

        balances = [balance]
      } else {
        // Get all token balances for wallet
        balances = await db.walletTokenBalance.findMany({
          where: { walletAddress },
          include: {
            tokenConfig: true
          }
        })
      }

      return balances.map(balance => {
        const tokenConfig = balance.tokenConfig
        const totalBalance = balance.balance + balance.frozenBalance
        const forcedPrice = tokenConfig.forcedPrice
        const realPrice = tokenConfig.currentPrice

        return {
          walletAddress: balance.walletAddress,
          tokenSymbol: balance.tokenSymbol,
          displayBalance: totalBalance,
          realBalance: totalBalance,
          forcedPrice,
          displayValue: totalBalance * forcedPrice,
          realValue: totalBalance * realPrice,
          isVisible: true,
          customDecimals: tokenConfig.decimals
        }
      })
    } catch (error) {
      console.error('Error getting balance display:', error)
      throw error
    }
  }

  // Update wallet balances with new price
  private async updateWalletBalancesWithNewPrice(symbol: string, newPrice: number) {
    try {
      // Get all wallet balances for this token
      const balances = await db.walletTokenBalance.findMany({
        where: { tokenSymbol: symbol },
        include: {
          tokenConfig: true
        }
      })

      // Update transaction values with new pricing
      for (const balance of balances) {
        const totalBalance = balance.balance + balance.frozenBalance
        const newValue = totalBalance * newPrice

        // Update any pending transactions with new pricing
        await db.transaction.updateMany({
          where: {
            tokenSymbol: symbol,
            status: 'pending'
          },
          data: {
            forcedPrice: newPrice,
            value: newValue
          }
        })
      }
    } catch (error) {
      console.error('Error updating wallet balances with new price:', error)
    }
  }

  // Calculate portfolio value with forced pricing
  async calculatePortfolioValue(walletAddress: string): Promise<{
    totalForcedValue: number
    totalRealValue: number
    tokens: Array<{
      symbol: string
      name: string
      balance: number
      forcedPrice: number
      realPrice: number
      forcedValue: number
      realValue: number
      percentage: number
    }>
  }> {
    try {
      const balances = await this.getBalanceDisplay(walletAddress)
      
      let totalForcedValue = 0
      let totalRealValue = 0

      const tokens = balances.map(balance => {
        const forcedValue = balance.displayValue
        const realValue = balance.realValue
        
        totalForcedValue += forcedValue
        totalRealValue += realValue

        return {
          symbol: balance.tokenSymbol,
          name: '', // Would get from token config
          balance: balance.displayBalance,
          forcedPrice: balance.forcedPrice,
          realPrice: balance.forcedPrice / balance.priceMultiplier,
          forcedValue,
          realValue,
          percentage: 0 // Will calculate below
        }
      })

      // Calculate percentages
      tokens.forEach(token => {
        token.percentage = totalForcedValue > 0 ? (token.forcedValue / totalForcedValue) * 100 : 0
      })

      return {
        totalForcedValue,
        totalRealValue,
        tokens
      }
    } catch (error) {
      console.error('Error calculating portfolio value:', error)
      throw error
    }
  }

  // Generate price feed for external consumption
  async generatePriceFeed(): Promise<{
    timestamp: number
    network: string
    tokens: Array<{
      symbol: string
      address: string
      forcedPrice: number
      realPrice: number
      priceMultiplier: number
      decimals: number
      lastUpdate: number
    }>
  }> {
    try {
      const pricing = await this.getAllTokenPricing()
      const contracts = blockchainService.getTokenContracts()

      const tokens = pricing.map(price => {
        const contract = contracts.find(c => c.symbol === price.symbol)
        return {
          symbol: price.symbol,
          address: contract?.address || '',
          forcedPrice: price.forcedPrice,
          realPrice: price.realPrice,
          priceMultiplier: price.priceMultiplier,
          decimals: contract?.decimals || 18,
          lastUpdate: new Date(price.lastUpdated).getTime()
        }
      })

      return {
        timestamp: Date.now(),
        network: 'DeFi NGN Network',
        tokens
      }
    } catch (error) {
      console.error('Error generating price feed:', error)
      throw error
    }
  }

  // Start automatic price updates
  private startPriceUpdates() {
    if (this.priceUpdateTimer) {
      clearInterval(this.priceUpdateTimer)
    }

    this.priceUpdateTimer = setInterval(async () => {
      try {
        await this.updateRealPricesFromMarket()
      } catch (error) {
        console.error('Error in automatic price update:', error)
      }
    }, this.PRICE_UPDATE_INTERVAL)
  }

  // Update real prices from market data (simulated)
  private async updateRealPricesFromMarket() {
    try {
      const tokens = await db.tokenConfig.findMany({
        where: { status: 'active' }
      })

      for (const token of tokens) {
        // Simulate market price fluctuations
        const currentPrice = token.currentPrice
        const fluctuation = (Math.random() - 0.5) * 0.02 // ±1% fluctuation
        const newPrice = Math.max(0.01, currentPrice * (1 + fluctuation))

        await db.tokenConfig.update({
          where: { symbol: token.symbol },
          data: {
            currentPrice: newPrice,
            updatedAt: new Date()
          }
        })
      }
    } catch (error) {
      console.error('Error updating real prices from market:', error)
    }
  }

  // Stop automatic price updates
  stopPriceUpdates() {
    if (this.priceUpdateTimer) {
      clearInterval(this.priceUpdateTimer)
      this.priceUpdateTimer = null
    }
  }

  // Get price update history
  async getPriceUpdateHistory(symbol?: string, limit: number = 50): Promise<Array<{
    id: string
    symbol: string
    oldForcedPrice: number
    newForcedPrice: number
    oldRealPrice: number
    newRealPrice: number
    updateReason: string
    updatedBy: string
    timestamp: string
  }>> {
    try {
      const updates = await db.priceUpdate.findMany({
        where: symbol ? { symbol } : {},
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return updates.map(update => ({
        id: update.id,
        symbol: update.symbol,
        oldForcedPrice: update.oldForcedPrice,
        newForcedPrice: update.newForcedPrice,
        oldRealPrice: update.oldRealPrice,
        newRealPrice: update.newRealPrice,
        updateReason: update.updateReason,
        updatedBy: update.updatedBy,
        timestamp: update.createdAt.toISOString()
      }))
    } catch (error) {
      console.error('Error getting price update history:', error)
      throw error
    }
  }

  // Export pricing configuration
  exportPricingConfig(): {
    timestamp: number
    network: string
    tokens: ForcedPriceConfig[]
    updateInterval: number
  } {
    return {
      timestamp: Date.now(),
      network: 'DeFi NGN Network',
      tokens: [], // Would get from current state
      updateInterval: this.PRICE_UPDATE_INTERVAL
    }
  }
}

// Create and export the service instance
const pricingService = new PricingService()
export default pricingService