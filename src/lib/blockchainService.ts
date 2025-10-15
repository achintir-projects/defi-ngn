import { db } from '@/lib/db'

export interface Block {
  number: number
  hash: string
  parentHash: string
  timestamp: number
  gasLimit: string
  gasUsed: string
  miner: string
  difficulty: string
  totalDifficulty: string
  transactions: Transaction[]
}

export interface Transaction {
  hash: string
  blockNumber: number
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  input: string
  nonce: number
  timestamp: number
  status: number
  contractAddress?: string
  logs: Log[]
}

export interface Log {
  address: string
  topics: string[]
  data: string
  blockNumber: number
  transactionHash: string
  logIndex: number
}

export interface TokenContract {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  type: 'ERC20' | 'TRC20' | 'NATIVE'
  chainId: number
  owner: string
  createdAt: number
}

export interface NetworkState {
  chainId: number
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  blockNumber: number
  gasPrice: string
  accounts: Map<string, AccountState>
  contracts: Map<string, TokenContract>
  blocks: Map<number, Block>
  pendingTransactions: Transaction[]
}

export interface AccountState {
  address: string
  balance: string
  nonce: number
  code?: string
  storage?: Map<string, string>
}

class BlockchainService {
  private state: NetworkState
  private genesisBlock: Block
  private isInitialized = false

  constructor() {
    this.state = {
      chainId: 1337,
      chainName: 'DeFi NGN Network',
      nativeCurrency: {
        name: 'Nigerian Ether',
        symbol: 'NGN',
        decimals: 18
      },
      blockNumber: 0,
      gasPrice: '0x77359400', // 2000000000 wei
      accounts: new Map(),
      contracts: new Map(),
      blocks: new Map(),
      pendingTransactions: []
    }

    this.genesisBlock = {
      number: 0,
      hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: Math.floor(Date.now() / 1000),
      gasLimit: '0x6691b7',
      gasUsed: '0x0',
      miner: '0x0000000000000000000000000000000000000000',
      difficulty: '0x0',
      totalDifficulty: '0x0',
      transactions: []
    }
  }

  async initialize() {
    if (this.isInitialized) return

    // Load existing state from database
    await this.loadStateFromDatabase()
    
    // Initialize genesis block
    this.state.blocks.set(0, this.genesisBlock)
    
    // Create default token contracts
    await this.createDefaultTokenContracts()
    
    this.isInitialized = true
    console.log('Blockchain service initialized')
  }

  private async loadStateFromDatabase() {
    try {
      // Load token configurations as contracts
      const tokens = await db.tokenConfig.findMany({
        where: { status: 'active' }
      })

      for (const token of tokens) {
        const contractAddress = this.generateContractAddress(token.symbol)
        const contract: TokenContract = {
          address: contractAddress,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          totalSupply: this.toHex(token.maxSupply * Math.pow(10, token.decimals)),
          type: token.tokenType as 'ERC20' | 'TRC20' | 'NATIVE',
          chainId: this.state.chainId,
          owner: '0x0000000000000000000000000000000000000000',
          createdAt: Date.now()
        }
        this.state.contracts.set(contractAddress, contract)
      }

      // Load wallet balances as account states
      const wallets = await db.userWallet.findMany({
        include: {
          tokenBalances: true
        }
      })

      for (const wallet of wallets) {
        const accountState: AccountState = {
          address: wallet.address,
          balance: '0x0', // Native currency balance
          nonce: 0
        }
        this.state.accounts.set(wallet.address.toLowerCase(), accountState)
      }
    } catch (error) {
      console.error('Error loading state from database:', error)
    }
  }

  private async createDefaultTokenContracts() {
    const defaultTokens = [
      {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        type: 'ERC20' as const,
        totalSupply: '1000000000000000' // 1M USDT with 6 decimals
      },
      {
        symbol: 'USDT_TRC20',
        name: 'Tether USD (TRC20)',
        decimals: 6,
        type: 'TRC20' as const,
        totalSupply: '1000000000000000' // 1M USDT with 6 decimals
      },
      {
        symbol: 'NGN',
        name: 'Nigerian Naira Token',
        decimals: 18,
        type: 'ERC20' as const,
        totalSupply: '1000000000000000000000000' // 1M NGN with 18 decimals
      }
    ]

    for (const token of defaultTokens) {
      const contractAddress = this.generateContractAddress(token.symbol)
      const contract: TokenContract = {
        address: contractAddress,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        totalSupply: token.totalSupply,
        type: token.type,
        chainId: this.state.chainId,
        owner: '0x0000000000000000000000000000000000000000',
        createdAt: Date.now()
      }
      this.state.contracts.set(contractAddress, contract)
    }
  }

  private generateContractAddress(symbol: string): string {
    // Generate a deterministic contract address based on symbol
    const hash = this.createHash(`contract_${symbol}_${this.state.chainId}`)
    return `0x${hash.slice(2, 42)}`
  }

  private createHash(data: string): string {
    // Simple hash function for demonstration
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0')
  }

  // RPC Methods Implementation
  async eth_chainId(): Promise<string> {
    return `0x${this.state.chainId.toString(16)}`
  }

  async eth_getBlockByNumber(blockNumber: string, includeTransactions: boolean = false): Promise<Block | null> {
    const num = parseInt(blockNumber, 16)
    const block = this.state.blocks.get(num)
    if (!block) return null

    if (!includeTransactions) {
      return {
        ...block,
        transactions: block.transactions.map(tx => tx.hash)
      }
    }
    return block
  }

  async eth_getBalance(address: string, blockNumber: string = 'latest'): Promise<string> {
    const normalizedAddress = address.toLowerCase()
    const account = this.state.accounts.get(normalizedAddress)
    
    if (account) {
      return account.balance
    }
    
    // Return 0 balance for unknown accounts
    return '0x0'
  }

  async eth_getTransactionCount(address: string, blockNumber: string = 'latest'): Promise<string> {
    const normalizedAddress = address.toLowerCase()
    const account = this.state.accounts.get(normalizedAddress)
    
    if (account) {
      return `0x${account.nonce.toString(16)}`
    }
    
    return '0x0'
  }

  async eth_sendRawTransaction(signedTx: string): Promise<string> {
    // Simulate transaction processing
    const txHash = `0x${this.createHash(`tx_${signedTx}_${Date.now()}`).slice(0, 64)}`
    
    // Create a simple transaction object
    const transaction: Transaction = {
      hash: txHash,
      blockNumber: this.state.blockNumber + 1,
      from: '0x0000000000000000000000000000000000000000', // Would extract from signed tx
      to: '0x0000000000000000000000000000000000000000',   // Would extract from signed tx
      value: '0x0',
      gas: '0x5208',
      gasPrice: this.state.gasPrice,
      input: '0x',
      nonce: 0,
      timestamp: Math.floor(Date.now() / 1000),
      status: 1,
      logs: []
    }

    this.state.pendingTransactions.push(transaction)
    
    // Process transaction after a delay
    setTimeout(() => this.processTransaction(transaction), 1000)
    
    return txHash
  }

  async eth_estimateGas(transaction: any): Promise<string> {
    // Return a standard gas estimate
    return '0x5208' // 21000 gas
  }

  async eth_call(transaction: any, blockNumber: string = 'latest'): Promise<string> {
    // Handle contract calls, particularly for token balances
    if (transaction.to && this.state.contracts.has(transaction.to.toLowerCase())) {
      const contract = this.state.contracts.get(transaction.to.toLowerCase())!
      
      // Handle balanceOf call (ERC20/TRC20)
      if (transaction.input && transaction.input.startsWith('0x70a08231')) {
        const address = '0x' + transaction.input.slice(34, 74)
        const balance = await this.getTokenBalance(address, contract.address)
        return balance
      }
      
      // Handle other standard ERC20 calls
      if (transaction.input === '0x06fdde03') { // name()
        return this.stringToHex(contract.name)
      }
      if (transaction.input === '0x95d89b41') { // symbol()
        return this.stringToHex(contract.symbol)
      }
      if (transaction.input === '0x313ce567') { // decimals()
        return `0x${contract.decimals.toString(16)}`
      }
      if (transaction.input === '0x18160ddd') { // totalSupply()
        return contract.totalSupply
      }
    }
    
    return '0x'
  }

  async net_version(): Promise<string> {
    return this.state.chainId.toString()
  }

  async eth_getCode(address: string, blockNumber: string = 'latest'): Promise<string> {
    const normalizedAddress = address.toLowerCase()
    const account = this.state.accounts.get(normalizedAddress)
    
    if (account && account.code) {
      return account.code
    }
    
    // Return contract code for known contracts
    if (this.state.contracts.has(normalizedAddress)) {
      // Return a mock contract code
      return '0x608060405234801561001057600080fd5b50600436106100415760003560e01c80632e64cec11461004657806370a0823114610064578063a9059cbb14610094578063dd62ed3e146100c4575b600080fd5b61004e6100f4565b60405161005b9190610189565b60405180910390f35b61007c60048036038101906100779190610133565b6100fd565b60405161008991906101ae565b60405180910390f35b6100ac60048036038101906100a7919061010d565b610145565b6040516100b991906101ae565b60405180910390f35b6100dc60048036038101906100d7919061010d565b6101d7565b6040516100e991906101ae565b60405180910390f35b60008054905090565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6000600260008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b6000813590506101ff8161028b565b92915050565b600081359050610214816102a2565b92915050565b600081359050610229816102b9565b92915050565b60008135905061023e816102d0565b92915050565b60006020828403121561025657600080fd5b6000610264848285016101f0565b91505092915050565b6000806040838503121561028057600080fd5b600061028e858286016101f0565b925050602061029f85828601610209565b9150509250929050565b600080604083850312156102bb57600080fd5b60006102c9858286016101f0565b92505060206102da8582860161021e565b9150509250929050565b600080604083850312156102f657600080fd5b6000610304858286016101f0565b92505060206103158582860161022f565b9150509250929050565b6103278161024d565b82525050565b6103368161025b565b82525050565b600061034782610241565b610351818561024d565b9350610361818560208601610267565b61036a8161027e565b840191505092915050565b600061038260238361024d565b915061038d8261028f565b604082019050919050565b60006103a560228361024d565b91506103b0826102de565b604082019050919050565b60006103c860268361024d565b91506103d38261032d565b604082019050919050565b60006103eb60258361024d565b91506103f68261037c565b604082019050919050565b600061040e60248361024d565b9150610419826103c7565b604082019050919050565b6000602082019050610439600083018461031e565b92915050565b6000602082019050610454600083018461032d565b92915050565b60006020820190508181036000830152610474818461033c565b905092915050565b6000602082019050818103600083015261049581610375565b9050919050565b600060208201905081810360008301526104b581610398565b9050919050565b600060208201905081810360008301526104d5816103bb565b9050919050565b600060208201905081810360008301526104f5816103de565b9050919050565b6000602082019050818103600083015261051581610401565b9050919050565b6105258161025b565b811461053057600080fd5b50565b6000813590506105428161051c565b92915050565b60006020828403121561055a57600080fd5b600061056884828501610533565b9150509291505056fea2646970667358221220d4e5a8b5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a64736f6c63430008070033'
    }
    
    return '0x'
  }

  // Helper methods
  private stringToHex(str: string): string {
    return '0x' + Buffer.from(str, 'utf8').toString('hex')
  }

  private toHex(value: number): string {
    return '0x' + value.toString(16)
  }

  private async getTokenBalance(walletAddress: string, contractAddress: string): Promise<string> {
    try {
      // Get token symbol from contract
      const contract = this.state.contracts.get(contractAddress.toLowerCase())
      if (!contract) return '0x0'

      // Get balance from database
      const balance = await db.walletTokenBalance.findUnique({
        where: {
          walletAddress_tokenSymbol: {
            walletAddress: walletAddress.toLowerCase(),
            tokenSymbol: contract.symbol
          }
        }
      })

      if (!balance) return '0x0'

      // Convert balance to hex with proper decimals
      const balanceInSmallestUnit = Math.floor(balance.balance * Math.pow(10, contract.decimals))
      return '0x' + balanceInSmallestUnit.toString(16)
    } catch (error) {
      console.error('Error getting token balance:', error)
      return '0x0'
    }
  }

  private async processTransaction(transaction: Transaction) {
    // Create new block
    const newBlock: Block = {
      number: this.state.blockNumber + 1,
      hash: `0x${this.createHash(`block_${this.state.blockNumber + 1}_${Date.now()}`).slice(0, 64)}`,
      parentHash: this.state.blocks.get(this.state.blockNumber)!.hash,
      timestamp: Math.floor(Date.now() / 1000),
      gasLimit: '0x6691b7',
      gasUsed: '0x5208',
      miner: '0x0000000000000000000000000000000000000000',
      difficulty: '0x0',
      totalDifficulty: '0x0',
      transactions: [transaction]
    }

    this.state.blocks.set(newBlock.number, newBlock)
    this.state.blockNumber = newBlock.number

    // Remove from pending transactions
    this.state.pendingTransactions = this.state.pendingTransactions.filter(tx => tx.hash !== transaction.hash)
  }

  // Get network configuration for wallet setup
  getNetworkConfig() {
    return {
      chainId: `0x${this.state.chainId.toString(16)}`,
      chainName: this.state.chainName,
      nativeCurrency: this.state.nativeCurrency,
      rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL || 'https://df-ngn.netlify.app/api/rpc'],
      blockExplorerUrls: ['https://explorer.defi-ngn.com'],
      isCustom: true
    }
  }

  // Get all token contracts
  getTokenContracts(): TokenContract[] {
    return Array.from(this.state.contracts.values())
  }

  // Get token contract by symbol
  getTokenContractBySymbol(symbol: string): TokenContract | null {
    for (const contract of this.state.contracts.values()) {
      if (contract.symbol === symbol) {
        return contract
      }
    }
    return null
  }

  // Get token contract by address
  getTokenContractByAddress(address: string): TokenContract | null {
    return this.state.contracts.get(address.toLowerCase()) || null
  }
}

// Create and export the service instance
const blockchainService = new BlockchainService()
export default blockchainService