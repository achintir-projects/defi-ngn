import { NextRequest, NextResponse } from 'next/server'
import smartContractService from '@/lib/smartContractService'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'templates':
        // Get all available contract templates
        const templates = smartContractService.getTemplates()
        return NextResponse.json({
          success: true,
          templates
        })
        
      case 'contracts':
        // Get all deployed contracts
        const contracts = await smartContractService.getDeployedContracts()
        return NextResponse.json({
          success: true,
          contracts
        })
        
      case 'contract':
        // Get specific contract by address
        const address = searchParams.get('address')
        if (!address) {
          return NextResponse.json({
            success: false,
            error: 'Contract address is required'
          }, { status: 400 })
        }
        
        const contract = await smartContractService.getDeployedContract(address)
        if (!contract) {
          return NextResponse.json({
            success: false,
            error: 'Contract not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          contract
        })
        
      case 'verification':
        // Generate verification data for a contract
        const contractAddress = searchParams.get('contractAddress')
        if (!contractAddress) {
          return NextResponse.json({
            success: false,
            error: 'Contract address is required'
          }, { status: 400 })
        }
        
        const contractForVerification = await smartContractService.getDeployedContract(contractAddress)
        if (!contractForVerification) {
          return NextResponse.json({
            success: false,
            error: 'Contract not found'
          }, { status: 404 })
        }
        
        const verificationData = smartContractService.generateVerificationData(contractForVerification)
        return NextResponse.json({
          success: true,
          verificationData
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in token deployment API:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body
    
    switch (action) {
      case 'deploy':
        // Deploy a new token contract
        const { name, symbol, type, decimals, initialSupply, forcedPrice, deployerAddress } = params
        
        if (!name || !symbol || !type || !decimals || !initialSupply || !deployerAddress) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters for deployment'
          }, { status: 400 })
        }
        
        const deploymentRequest = {
          name,
          symbol,
          type,
          decimals,
          initialSupply,
          forcedPrice: forcedPrice || 1.0,
          deployerAddress
        }
        
        const deployedContract = await smartContractService.deployToken(deploymentRequest)
        
        return NextResponse.json({
          success: true,
          contract: deployedContract,
          message: `Token ${symbol} deployed successfully at ${deployedContract.address}`
        })
        
      case 'deployUSDT':
        // Deploy predefined USDT tokens
        const { deployerAddress: usdtDeployer } = params
        if (!usdtDeployer) {
          return NextResponse.json({
            success: false,
            error: 'Deployer address is required'
          }, { status: 400 })
        }
        
        const usdtContracts = await smartContractService.deployUSDTTokens(usdtDeployer)
        
        return NextResponse.json({
          success: true,
          contracts: usdtContracts,
          message: 'USDT ERC20 and TRC20 tokens deployed successfully'
        })
        
      case 'deployMultiple':
        // Deploy multiple tokens at once
        const { tokens: tokenList, deployerAddress: multiDeployer } = params
        
        if (!tokenList || !Array.isArray(tokenList) || !multiDeployer) {
          return NextResponse.json({
            success: false,
            error: 'Invalid parameters for multiple deployment'
          }, { status: 400 })
        }
        
        const deployedContracts = []
        
        for (const tokenConfig of tokenList) {
          try {
            const contract = await smartContractService.deployToken({
              ...tokenConfig,
              deployerAddress: multiDeployer
            })
            deployedContracts.push(contract)
          } catch (error) {
            console.error(`Error deploying token ${tokenConfig.symbol}:`, error)
          }
        }
        
        return NextResponse.json({
          success: true,
          contracts: deployedContracts,
          deployed: deployedContracts.length,
          total: tokenList.length,
          message: `Successfully deployed ${deployedContracts.length}/${tokenList.length} tokens`
        })
        
      case 'updateContract':
        // Update deployed contract status
        const { contractAddress, isActive } = params
        
        if (!contractAddress || typeof isActive !== 'boolean') {
          return NextResponse.json({
            success: false,
            error: 'Invalid parameters for contract update'
          }, { status: 400 })
        }
        
        const updatedContract = await db.deployedContract.update({
          where: { address: contractAddress },
          data: { isActive }
        })
        
        return NextResponse.json({
          success: true,
          contract: updatedContract,
          message: `Contract status updated to ${isActive ? 'active' : 'inactive'}`
        })
        
      case 'verifyContract':
        // Mark contract as verified (simulated)
        const { contractAddress: verifyAddress, verificationData } = params
        
        if (!verifyAddress) {
          return NextResponse.json({
            success: false,
            error: 'Contract address is required for verification'
          }, { status: 400 })
        }
        
        // In a real implementation, this would interact with a block explorer
        // For now, we'll just update the contract record
        const verifiedContract = await db.deployedContract.update({
          where: { address: verifyAddress },
          data: { 
            // Add verification status if needed
            updatedAt: new Date()
          }
        })
        
        return NextResponse.json({
          success: true,
          contract: verifiedContract,
          message: 'Contract verification completed'
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in token deployment API:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}