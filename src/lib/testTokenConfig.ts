import { db } from '@/lib/db'

export default async function TestTokenConfig() {
  try {
    console.log('🧪 Testing USDT Token Configuration...\n')

    // Check if USDT tokens exist
    const usdtTokens = await db.tokenConfig.findMany({
      where: {
        OR: [
          { symbol: 'USDT' },
          { symbol: 'USDT_TRC20' }
        ]
      }
    })

    console.log('📊 Found USDT tokens:', usdtTokens.length)

    for (const token of usdtTokens) {
      console.log(`\n💰 Token: ${token.symbol}`)
      console.log(`   Name: ${token.name}`)
      console.log(`   Type: ${token.tokenType}`)
      console.log(`   Chain: ${token.chain}`)
      console.log(`   Current Price: $${token.currentPrice}`)
      console.log(`   Forced Price: $${token.forcedPrice}`)
      console.log(`   Max Supply: ${token.maxSupply}`)
      console.log(`   Circulating Supply: ${token.circulatingSupply}`)
      console.log(`   Admin Controlled: ${token.isAdminControlled}`)
      console.log(`   Status: ${token.status}`)
    }

    // If no tokens found, create them
    if (usdtTokens.length === 0) {
      console.log('\n🚀 No USDT tokens found, creating them...')
      
      const defaultTokens = [
        {
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 6,
          chain: 'Sepolia',
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
          chain: 'Sepolia',
          tokenType: 'TRC20',
          currentPrice: 1.0,
          forcedPrice: 2.0,
          maxSupply: 1000000000,
          circulatingSupply: 0,
          isAdminControlled: true,
          status: 'active'
        }
      ]

      for (const token of defaultTokens) {
        await db.tokenConfig.create({
          data: token
        })
        console.log(`✅ Created ${token.symbol} token`)
      }
    }

    console.log('\n✅ USDT token configuration test completed!')

    return {
      success: true,
      tokens: usdtTokens
    }

  } catch (error) {
    console.error('❌ Error testing USDT token configuration:', error)
    return {
      success: false,
      error: error.message
    }
  }
}