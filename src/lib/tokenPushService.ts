import { db } from '@/lib/db'
import pricingService from '@/lib/pricingService'
import blockchainService from '@/lib/blockchainService'
import { v4 as uuidv4 } from 'uuid'

export interface TokenPushRequest {
  fromAddress: string
  toAddress: string
  tokenSymbol: string
  amount: number
  forcedPrice?: number
  pushType: 'admin' | 'claim' | 'airdrop' | 'reward'
  description?: string
  pushInitiator: string
}

export interface TokenPushResult {
  success: boolean
  transactionHash?: string
  error?: string
  pushId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  estimatedCompletionTime?: number
}

export interface BulkTokenPushRequest {
  pushes: TokenPushRequest[]
  pushInitiator: string
  batchId?: string
}

export interface TokenPushStatus {
  pushId: string
  fromAddress: string
  toAddress: string
  tokenSymbol: string
  amount: number
  forcedPrice: number
  status: string
  transactionHash?: string
  createdAt: string
  completedAt?: string
  errorMessage?: string
}

export interface PushStatistics {
  totalPushes: number
  successfulPushes: number
  failedPushes: number
  pendingPushes: number
  totalValuePushed: number
  averagePushValue: number
  topTokens: Array<{
    symbol: string
    pushCount: number
    totalAmount: number
  }>
}

class TokenPushService {
  private readonly PUSH_PROCESSING_DELAY = 2000 // 2 seconds
  private readonly MAX_RETRIES = 3
  private readonly BULK_PUSH_SIZE = 100

  // Push tokens to a wallet
  async pushTokens(request: TokenPushRequest): Promise<TokenPushResult> {
    try {
      const { fromAddress, toAddress, tokenSymbol, amount, forcedPrice, pushType, description, pushInitiator } = request

      // Validate request
      if (!fromAddress || !toAddress || !tokenSymbol || !amount || !pushType || !pushInitiator) {
        throw new Error('Missing required parameters for token push')
      }

      // Get token configuration
      const tokenConfig = await db.tokenConfig.findUnique({
        where: { symbol: tokenSymbol }
      })

      if (!tokenConfig) {
        throw new Error(`Token ${tokenSymbol} not found`)
      }

      // Get current forced price
      const currentPricing = await pricingService.getForcedPrice(tokenSymbol)
      const pushForcedPrice = forcedPrice || currentPricing?.forcedPrice || tokenConfig.forcedPrice

      // Generate push ID
      const pushId = `push_${uuidv4()}`

      // Create push record
      const pushRecord = await db.tokenPush.create({
        data: {
          id: pushId,
          fromAddress,
          toAddress,
          tokenSymbol,
          amount,
          forcedPrice: pushForcedPrice,
          pushType,
          description: description || `${pushType} push`,
          pushInitiator,
          status: 'pending',
          createdAt: new Date()
        }
      })

      // Start processing the push
      this.processTokenPush(pushId)

      return {
        success: true,
        pushId,
        status: 'pending',
        estimatedCompletionTime: Date.now() + this.PUSH_PROCESSING_DELAY
      }
    } catch (error) {
      console.error('Error pushing tokens:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed'
      }
    }
  }

  // Process token push asynchronously
  private async processTokenPush(pushId: string): Promise<void> {
    try {
      // Get push record
      const pushRecord = await db.tokenPush.findUnique({
        where: { id: pushId },
        include: {
          tokenConfig: true
        }
      })

      if (!pushRecord) {
        throw new Error(`Push record ${pushId} not found`)
      }

      // Update status to processing
      await db.tokenPush.update({
        where: { id: pushId },
        data: { status: 'processing' }
      })

      // Check if sender has sufficient balance
      const senderBalance = await db.walletTokenBalance.findUnique({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress: pushRecord.fromAddress,
            tokenSymbol: pushRecord.tokenSymbol
          }
        }
      })

      if (!senderBalance || senderBalance.balance < pushRecord.amount) {
        throw new Error('Insufficient balance for token push')
      }

      // Get or create recipient balance
      let recipientBalance = await db.walletTokenBalance.findUnique({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress: pushRecord.toAddress,
            tokenSymbol: pushRecord.tokenSymbol
          }
        }
      })

      // Freeze sender's tokens
      await db.walletTokenBalance.update({
        where: { id: senderBalance.id },
        data: {
          balance: senderBalance.balance - pushRecord.amount,
          frozenBalance: senderBalance.frozenBalance + pushRecord.amount
        }
      })

      // Create recipient balance if doesn't exist
      if (!recipientBalance) {
        recipientBalance = await db.walletTokenBalance.create({
          data: {
            walletAddress: pushRecord.toAddress,
            tokenSymbol: pushRecord.tokenSymbol,
            balance: 0,
            frozenBalance: pushRecord.amount
          }
        })
      } else {
        await db.walletTokenBalance.update({
          where: { id: recipientBalance.id },
          data: {
            frozenBalance: recipientBalance.frozenBalance + pushRecord.amount
          }
        })
      }

      // Generate transaction hash
      const transactionHash = `push_${uuidv4()}`

      // Create transaction record
      const transaction = await db.transaction.create({
        data: {
          type: 'push',
          status: 'processing',
          amount: pushRecord.amount,
          tokenSymbol: pushRecord.tokenSymbol,
          tokenName: pushRecord.tokenConfig.name,
          fromAddress: pushRecord.fromAddress,
          toAddress: pushRecord.toAddress,
          hash: transactionHash,
          chain: 'DeFi NGN Network',
          forcedPrice: pushRecord.forcedPrice,
          realPrice: pushRecord.tokenConfig.currentPrice,
          value: pushRecord.amount * pushRecord.forcedPrice,
          isGasless: true,
          confirmations: 0,
          requiredConfirmations: 1
        }
      })

      // Simulate processing delay
      setTimeout(async () => {
        try {
          // Complete the push
          await this.completeTokenPush(pushId, transaction.id)
        } catch (error) {
          console.error('Error completing token push:', error)
          await this.failTokenPush(pushId, error instanceof Error ? error.message : 'Unknown error')
        }
      }, this.PUSH_PROCESSING_DELAY)

      // Update push record with transaction hash
      await db.tokenPush.update({
        where: { id: pushId },
        data: { transactionHash }
      })

    } catch (error) {
      console.error('Error processing token push:', error)
      await this.failTokenPush(pushId, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Complete token push
  private async completeTokenPush(pushId: string, transactionId: string): Promise<void> {
    try {
      // Get push record
      const pushRecord = await db.tokenPush.findUnique({
        where: { id: pushId }
      })

      if (!pushRecord) {
        throw new Error(`Push record ${pushId} not found`)
      }

      // Get sender and recipient balances
      const senderBalance = await db.walletTokenBalance.findUnique({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress: pushRecord.fromAddress,
            tokenSymbol: pushRecord.tokenSymbol
          }
        }
      })

      const recipientBalance = await db.walletTokenBalance.findUnique({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress: pushRecord.toAddress,
            tokenSymbol: pushRecord.tokenSymbol
          }
        }
      })

      if (!senderBalance || !recipientBalance) {
        throw new Error('Balance records not found')
      }

      // Complete the transfer
      await db.walletTokenBalance.update({
        where: { id: senderBalance.id },
        data: {
          frozenBalance: senderBalance.frozenBalance - pushRecord.amount
        }
      })

      await db.walletTokenBalance.update({
        where: { id: recipientBalance.id },
        data: {
          balance: recipientBalance.balance + pushRecord.amount,
          frozenBalance: recipientBalance.frozenBalance - pushRecord.amount
        }
      })

      // Update transaction status
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'completed',
          confirmations: 1,
          completedAt: new Date()
        }
      })

      // Update push status
      await db.tokenPush.update({
        where: { id: pushId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })

      // Update token circulating supply
      await db.tokenConfig.update({
        where: { symbol: pushRecord.tokenSymbol },
        data: {
          circulatingSupply: {
            increment: pushRecord.amount
          }
        }
      })

      console.log(`Token push ${pushId} completed successfully`)
    } catch (error) {
      console.error('Error completing token push:', error)
      throw error
    }
  }

  // Fail token push
  private async failTokenPush(pushId: string, errorMessage: string): Promise<void> {
    try {
      // Get push record
      const pushRecord = await db.tokenPush.findUnique({
        where: { id: pushId }
      })

      if (!pushRecord) {
        throw new Error(`Push record ${pushId} not found`)
      }

      // Get sender balance to unfreeze tokens
      const senderBalance = await db.walletTokenBalance.findUnique({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress: pushRecord.fromAddress,
            tokenSymbol: pushRecord.tokenSymbol
          }
        }
      })

      if (senderBalance) {
        // Unfreeze sender's tokens
        await db.walletTokenBalance.update({
          where: { id: senderBalance.id },
          data: {
            balance: senderBalance.balance + pushRecord.amount,
            frozenBalance: senderBalance.frozenBalance - pushRecord.amount
          }
        })
      }

      // Update push status
      await db.tokenPush.update({
        where: { id: pushId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage
        }
      })

      console.log(`Token push ${pushId} failed: ${errorMessage}`)
    } catch (error) {
      console.error('Error failing token push:', error)
    }
  }

  // Bulk push tokens to multiple wallets
  async bulkPushTokens(request: BulkTokenPushRequest): Promise<TokenPushResult[]> {
    try {
      const { pushes, pushInitiator, batchId } = request

      if (!pushes || !Array.isArray(pushes) || pushes.length === 0) {
        throw new Error('Invalid bulk push request')
      }

      // Limit batch size
      const batchSize = Math.min(pushes.length, this.BULK_PUSH_SIZE)
      const batch = pushes.slice(0, batchSize)

      const results: TokenPushResult[] = []
      const actualBatchId = batchId || `batch_${uuidv4()}`

      // Process pushes in parallel with rate limiting
      for (let i = 0; i < batch.length; i++) {
        const push = batch[i]
        
        try {
          const result = await this.pushTokens({
            ...push,
            pushInitiator,
            description: `${push.description || 'Bulk push'} - Batch ${actualBatchId}`
          })
          results.push(result)
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed'
          })
        }

        // Add small delay between pushes to prevent overwhelming
        if (i < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      return results
    } catch (error) {
      console.error('Error in bulk token push:', error)
      throw error
    }
  }

  // Get push status
  async getPushStatus(pushId: string): Promise<TokenPushStatus | null> {
    try {
      const push = await db.tokenPush.findUnique({
        where: { id: pushId }
      })

      if (!push) {
        return null
      }

      return {
        pushId: push.id,
        fromAddress: push.fromAddress,
        toAddress: push.toAddress,
        tokenSymbol: push.tokenSymbol,
        amount: push.amount,
        forcedPrice: push.forcedPrice,
        status: push.status,
        transactionHash: push.transactionHash || undefined,
        createdAt: push.createdAt.toISOString(),
        completedAt: push.completedAt?.toISOString(),
        errorMessage: push.errorMessage || undefined
      }
    } catch (error) {
      console.error('Error getting push status:', error)
      throw error
    }
  }

  // Get push history for a wallet
  async getPushHistory(walletAddress: string, limit: number = 50): Promise<TokenPushStatus[]> {
    try {
      const pushes = await db.tokenPush.findMany({
        where: {
          OR: [
            { fromAddress: walletAddress },
            { toAddress: walletAddress }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return pushes.map(push => ({
        pushId: push.id,
        fromAddress: push.fromAddress,
        toAddress: push.toAddress,
        tokenSymbol: push.tokenSymbol,
        amount: push.amount,
        forcedPrice: push.forcedPrice,
        status: push.status,
        transactionHash: push.transactionHash || undefined,
        createdAt: push.createdAt.toISOString(),
        completedAt: push.completedAt?.toISOString(),
        errorMessage: push.errorMessage || undefined
      }))
    } catch (error) {
      console.error('Error getting push history:', error)
      throw error
    }
  }

  // Get push statistics
  async getPushStatistics(timeRange: '24h' | '7d' | '30d' | 'all' = '24h'): Promise<PushStatistics> {
    try {
      let timeFilter = {}
      
      if (timeRange !== 'all') {
        const now = new Date()
        let startTime: Date
        
        switch (timeRange) {
          case '24h':
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            break
          case '7d':
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case '30d':
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
        }
        
        timeFilter = { createdAt: { gte: startTime } }
      }

      const pushes = await db.tokenPush.findMany({
        where: timeFilter
      })

      const totalPushes = pushes.length
      const successfulPushes = pushes.filter(p => p.status === 'completed').length
      const failedPushes = pushes.filter(p => p.status === 'failed').length
      const pendingPushes = pushes.filter(p => p.status === 'pending' || p.status === 'processing').length

      const totalValuePushed = pushes
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount * p.forcedPrice), 0)

      const averagePushValue = successfulPushes > 0 ? totalValuePushed / successfulPushes : 0

      // Calculate top tokens
      const tokenStats = new Map<string, { pushCount: number; totalAmount: number }>()
      
      pushes.forEach(push => {
        if (push.status === 'completed') {
          const current = tokenStats.get(push.tokenSymbol) || { pushCount: 0, totalAmount: 0 }
          tokenStats.set(push.tokenSymbol, {
            pushCount: current.pushCount + 1,
            totalAmount: current.totalAmount + push.amount
          })
        }
      })

      const topTokens = Array.from(tokenStats.entries())
        .map(([symbol, stats]) => ({ symbol, ...stats }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10)

      return {
        totalPushes,
        successfulPushes,
        failedPushes,
        pendingPushes,
        totalValuePushed,
        averagePushValue,
        topTokens
      }
    } catch (error) {
      console.error('Error getting push statistics:', error)
      throw error
    }
  }

  // Airdrop tokens to multiple wallets
  async airdropTokens(
    tokenSymbol: string,
    recipients: Array<{ address: string; amount: number }>,
    airdropInitiator: string,
    description?: string
  ): Promise<TokenPushResult[]> {
    try {
      const tokenConfig = await db.tokenConfig.findUnique({
        where: { symbol: tokenSymbol }
      })

      if (!tokenConfig) {
        throw new Error(`Token ${tokenSymbol} not found`)
      }

      const pushes: TokenPushRequest[] = recipients.map(recipient => ({
        fromAddress: 'SYSTEM', // System address for airdrops
        toAddress: recipient.address,
        tokenSymbol,
        amount: recipient.amount,
        pushType: 'airdrop' as const,
        description: description || `Airdrop of ${tokenSymbol}`,
        pushInitiator: airdropInitiator
      }))

      return await this.bulkPushTokens({
        pushes,
        pushInitiator: airdropInitiator,
        batchId: `airdrop_${tokenSymbol}_${Date.now()}`
      })
    } catch (error) {
      console.error('Error in airdrop:', error)
      throw error
    }
  }

  // Cancel pending push
  async cancelPush(pushId: string, cancelledBy: string): Promise<boolean> {
    try {
      const push = await db.tokenPush.findUnique({
        where: { id: pushId }
      })

      if (!push) {
        throw new Error(`Push ${pushId} not found`)
      }

      if (push.status !== 'pending' && push.status !== 'processing') {
        throw new Error(`Cannot cancel push with status ${push.status}`)
      }

      // Update push status
      await db.tokenPush.update({
        where: { id: pushId },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
          errorMessage: `Cancelled by ${cancelledBy}`
        }
      })

      // Unfreeze sender's tokens if they were frozen
      const senderBalance = await db.walletTokenBalance.findUnique({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress: push.fromAddress,
            tokenSymbol: push.tokenSymbol
          }
        }
      })

      if (senderBalance && senderBalance.frozenBalance >= push.amount) {
        await db.walletTokenBalance.update({
          where: { id: senderBalance.id },
          data: {
            balance: senderBalance.balance + push.amount,
            frozenBalance: senderBalance.frozenBalance - push.amount
          }
        })
      }

      return true
    } catch (error) {
      console.error('Error cancelling push:', error)
      throw error
    }
  }
}

// Create and export the service instance
const tokenPushService = new TokenPushService()
export default tokenPushService