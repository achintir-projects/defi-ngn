import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const role = searchParams.get('role') || 'all'

    // Verify admin access (in real implementation, check JWT token)
    const adminId = request.headers.get('x-admin-id')
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const admin = await db.user.findUnique({
      where: { id: adminId, isAdmin: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status !== 'all') {
      where.status = status
    }
    
    if (role !== 'all') {
      where.role = role
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          wallets: {
            select: {
              id: true,
              type: true,
              address: true,
              isConnected: true,
              chain: true
            }
          },
          _count: {
            select: {
              transactions: true,
              injectionJobs: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      db.user.count({ where })
    ])

    // Calculate user statistics
    const userStats = await getUserStatistics()

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: userStats
    })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, role = 'user', status = 'active' } = await request.json()

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify admin access
    const adminId = request.headers.get('x-admin-id')
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const admin = await db.user.findUnique({
      where: { id: adminId, isAdmin: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create new user
    const newUser = await db.user.create({
      data: {
        email,
        name,
        role,
        status,
        // Create default internal wallet
        wallets: {
          create: {
            address: generateWalletAddress(),
            type: 'internal',
            chain: 'Ethereum',
            isConnected: true
          }
        }
      },
      include: {
        wallets: true
      }
    })

    // Log user creation
    await db.transaction.create({
      data: {
        type: 'user_creation',
        status: 'completed',
        amount: 0,
        tokenSymbol: 'N/A',
        fromAddress: adminId,
        toAddress: newUser.id,
        chain: 'System',
        forcedPrice: 0,
        realPrice: 0,
        value: 0,
        isGasless: true,
        userId: adminId
      }
    })

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully'
    })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, updates } = await request.json()

    // Validate required fields
    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify admin access
    const adminId = request.headers.get('x-admin-id')
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const admin = await db.user.findUnique({
      where: { id: adminId, isAdmin: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Find the user to update
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updates,
      include: {
        wallets: true
      }
    })

    // Log user update
    await db.transaction.create({
      data: {
        type: 'user_update',
        status: 'completed',
        amount: 0,
        tokenSymbol: 'N/A',
        fromAddress: adminId,
        toAddress: userId,
        chain: 'System',
        forcedPrice: 0,
        realPrice: 0,
        value: 0,
        isGasless: true,
        userId: adminId
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify admin access
    const adminId = request.headers.get('x-admin-id')
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const admin = await db.user.findUnique({
      where: { id: adminId, isAdmin: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Find the user to delete
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Don't allow deleting admin users
    if (user.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 400 }
      )
    }

    // Delete user (this will cascade delete related records)
    await db.user.delete({
      where: { id: userId }
    })

    // Log user deletion
    await db.transaction.create({
      data: {
        type: 'user_deletion',
        status: 'completed',
        amount: 0,
        tokenSymbol: 'N/A',
        fromAddress: adminId,
        toAddress: userId,
        chain: 'System',
        forcedPrice: 0,
        realPrice: 0,
        value: 0,
        isGasless: true,
        userId: adminId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get user statistics
async function getUserStatistics() {
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    adminUsers,
    newUsersThisWeek,
    usersWithWallets
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: 'active' } }),
    db.user.count({ where: { status: 'suspended' } }),
    db.user.count({ where: { isAdmin: true } }),
    db.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    }),
    db.user.count({
      where: {
        wallets: {
          some: {
            isConnected: true
          }
        }
      }
    })
  ])

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    adminUsers,
    newUsersThisWeek,
    usersWithWallets
  }
}

// Helper function to generate wallet address
function generateWalletAddress(): string {
  return '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
}