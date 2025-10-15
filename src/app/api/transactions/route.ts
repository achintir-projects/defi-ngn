import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'all'
    const status = searchParams.get('status') || 'all'
    const chain = searchParams.get('chain') || 'all'
    const tokenSymbol = searchParams.get('tokenSymbol') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }
    
    if (type !== 'all') {
      where.type = type
    }
    
    if (status !== 'all') {
      where.status = status
    }
    
    if (chain !== 'all') {
      where.chain = chain
    }
    
    if (tokenSymbol !== 'all') {
      where.tokenSymbol = tokenSymbol
    }
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }
    
    if (search) {
      where.OR = [
        { hash: { contains: search, mode: 'insensitive' } },
        { fromAddress: { contains: search, mode: 'insensitive' } },
        { toAddress: { contains: search, mode: 'insensitive' } },
        { tokenSymbol: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      db.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      }),
      db.transaction.count({ where })
    ])

    // Get transaction statistics
    const stats = await getTransactionStatistics(where)

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats
    })

  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      type, 
      amount, 
      tokenSymbol, 
      fromAddress, 
      toAddress, 
      chain,
      forcedPrice,
      isGasless = false,
      userId 
    } = await request.json()

    // Validate required fields
    if (!type || !amount || !tokenSymbol || !fromAddress || !toAddress || !chain) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        type,
        status: 'pending',
        amount,
        tokenSymbol,
        tokenName: tokenConfig.name,
        fromAddress,
        toAddress,
        hash: generateTransactionHash(),
        chain,
        forcedPrice: forcedPrice || tokenConfig.forcedPrice,
        realPrice: tokenConfig.currentPrice,
        value: amount * (forcedPrice || tokenConfig.forcedPrice),
        isGasless,
        userId,
        confirmations: 0,
        requiredConfirmations: getRequiredConfirmations(chain)
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    // Process the transaction based on type
    if (type === 'transfer' || type === 'withdrawal') {
      await processTransfer(transaction.id)
    }

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction created successfully'
    })

  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get transaction statistics
async function getTransactionStatistics(where: any = {}) {
  const [
    totalTransactions,
    completedTransactions,
    failedTransactions,
    pendingTransactions,
    totalVolume,
    totalFees,
    successRate
  ] = await Promise.all([
    db.transaction.count({ where }),
    db.transaction.count({ where: { ...where, status: 'completed' } }),
    db.transaction.count({ where: { ...where, status: 'failed' } }),
    db.transaction.count({ where: { ...where, status: 'pending' } }),
    db.transaction.aggregate({
      where: { ...where, status: 'completed' },
      _sum: { value: true }
    }),
    db.transaction.aggregate({
      where: { ...where, status: 'completed' },
      _sum: { fee: true }
    }),
    db.transaction.aggregate({
      where: { ...where },
      _avg: {
        status: {
          case: {
            when: {
              status: 'completed'
            },
            then: 1,
            else: 0
          }
        }
      }
    })
  ])

  return {
    totalTransactions,
    completedTransactions,
    failedTransactions,
    pendingTransactions,
    totalVolume: totalVolume._sum.value || 0,
    totalFees: totalFees._sum.fee || 0,
    successRate: successRate._avg.status ? Math.round(successRate._avg.status * 100) : 0
  }
}

// Helper function to process transfers
async function processTransfer(transactionId: string) {
  try {
    // Update transaction status to processing
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: 'processing' }
    })

    // Simulate blockchain processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update transaction status to completed
    await db.transaction.update({
      where: { id: transactionId },
      data: { 
        status: 'completed',
        confirmations: 12,
        completedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Error processing transfer:', error)
    
    // Mark transaction as failed
    await db.transaction.update({
      where: { id: transactionId },
      data: { 
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}

// Helper function to get required confirmations based on chain
function getRequiredConfirmations(chain: string): number {
  switch (chain.toLowerCase()) {
    case 'ethereum':
      return 12
    case 'bsc':
      return 15
    case 'solana':
      return 1
    case 'polygon':
      return 20
    default:
      return 12
  }
}

// Helper function to generate transaction hash
function generateTransactionHash(): string {
  return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
}