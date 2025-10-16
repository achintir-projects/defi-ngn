#!/usr/bin/env node

// Test script for token injection API
const API_BASE = 'http://localhost:3000';

async function testTokenInjection() {
  try {
    console.log('🧪 Testing Token Injection API...\n');

    // Test data
    const testData = {
      tokenSymbol: 'USDT',
      amount: 1000,
      forcedPrice: 2.0,
      targetWallets: ['0x742d35Cc6634C0532925a3b844Bc9e7595f8d9B3'], // Test wallet address
      isGasless: true,
      adminId: 'test_admin'
    };

    console.log('📤 Sending request to /api/tokens/inject...');
    console.log('📋 Request data:', JSON.stringify(testData, null, 2));

    const response = await fetch(`${API_BASE}/api/tokens/inject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`📡 Response status: ${response.status}`);
    
    const data = await response.json();
    console.log('📥 Response data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ Token injection test PASSED!');
      console.log(`💰 Injected ${testData.amount} ${testData.tokenSymbol} at $${testData.forcedPrice} each`);
      console.log(`🎯 Total value: $${testData.amount * testData.forcedPrice}`);
    } else {
      console.log('❌ Token injection test FAILED!');
      console.log(`🚫 Error: ${data.error}`);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Run the test
testTokenInjection();