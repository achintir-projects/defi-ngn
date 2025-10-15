import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { 
      tokenSymbol, 
      amount, 
      forcedPrice, 
      targetWallets, 
      isGasless = true,
      scheduledFor,
      adminId 
    } = await request.json()

    // Validate required fields
    if (!tokenSymbol || !amount || !forcedPrice || !targetWallets || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify admin permissions
    const admin = await db.user.findUnique({
      where: { id: adminId, isAdmin: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Get token configuration
    const tokenConfig = await db.tokenConfig.findUnique({
      where: { symbol: tokenSymbol }
    })

    if (!tokenConfig) {
      return NextResponse.json(
        { error: 'Token configuration not found' },
        { status: 404 }
      )
    }

    if (!tokenConfig.isAdminControlled) {
      return NextResponse.json(
        { error: 'Token is not admin controlled' },
        { status: 400 }
      )
    }

    // Validate amount against token supply
    const totalAmount = amount * targetWallets.length
    if (tokenConfig.circulatingSupply + totalAmount > tokenConfig.maxSupply) {
      return NextResponse.json(
        { error: 'Insufficient token supply' },
        { status: 400 }
      )
    }

    // Create injection job
    const injectionJob = await db.injectionJob.create({
      data: {
        tokenSymbol,
        amount,
        forcedPrice,
        targetWallets,
        status: scheduledFor ? 'pending' : 'processing',
        isGasless,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        adminId,
        totalValue: totalAmount * forcedPrice,
        transactionHash: isGasless ? null : generateTransactionHash()
      }
    })

    // If not scheduled, process the injection immediately
    if (!scheduledFor) {
      await processTokenInjection(injectionJob.id, tokenConfig)
    }

    return NextResponse.json({
      success: true,
      injectionJob: {
        id: injectionJob.id,
        status: injectionJob.status,
        tokenSymbol,
        amount,
        forcedPrice,
        targetWallets: targetWallets.length,
        totalValue: injectionJob.totalValue,
        isGasless,
        scheduledFor: injectionJob.scheduledFor
      }
    })

  } catch (error) {
    console.error('Token injection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to process token injection
async function processTokenInjection(jobId: string, tokenConfig: any) {
  try {
    // Update job status to processing
    await db.injectionJob.update({
      where: { id: jobId },
      data: { status: 'processing' }
    })

    // Get the injection job details
    const job = await db.injectionJob.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      throw new Error('Injection job not found')
    }

    // Process each target wallet
    for (const walletAddress of job.targetWallets) {
      try {
        // Create transaction record
        await db.transaction.create({
          data: {
            type: 'injection',
            status: 'completed',
            amount: job.amount,
            tokenSymbol: job.tokenSymbol,
            fromAddress: '0x0000000000000000000000000000000000000000', // System address
            toAddress: walletAddress,
            hash: job.transactionHash || generateTransactionHash(),
            chain: tokenConfig.chain,
            forcedPrice: job.forcedPrice,
            realPrice: tokenConfig.currentPrice,
            value: job.amount * job.forcedPrice,
            isGasless: job.isGasless,
            userId: job.adminId
          }
        })

        // Update user's token balance
        await db.userTokenBalance.upsert({
          where: {
            userId_tokenSymbol: {
              userId: job.adminId,
              tokenSymbol: job.tokenSymbol
            }
          },
          update: {
            balance: {
              increment: job.amount
            },
            lastUpdated: new Date()
          },
          create: {
            userId: job.adminId,
            tokenSymbol: job.tokenSymbol,
            balance: job.amount,
            lastUpdated: new Date()
          }
        })

      } catch (error) {
        console.error(`Failed to process wallet ${walletAddress}:`, error)
        // Continue with other wallets even if one fails
      }
    }

    // Update token circulating supply
    await db.tokenConfig.update({
      where: { symbol: job.tokenSymbol },
      data: {
        circulatingSupply: {
          increment: job.amount * job.targetWallets.length
        },
        updatedAt: new Date()
      }
    })

    // Mark job as completed
    await db.injectionJob.update({
      where: { id: jobId },
      data: { 
        status: 'completed',
        completedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Error processing injection job:', error)
    
    // Mark job as failed
    await db.injectionJob.update({
      where: { id: jobId },
      data: { 
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}

// Helper function to generate transaction hash
function generateTransactionHash(): string {
  return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
}