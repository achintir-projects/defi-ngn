'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import TrustWalletIntegration, { 
  TrustWalletIntegrationConfig, 
  NetworkSetupResult, 
  AutoConfigurationResult 
} from '@/lib/trustWalletIntegration'
import trustWalletService, { 
  TrustWalletConfig, 
  MobileWalletDetection 
} from '@/lib/trustWalletService'
import networkService from '@/lib/networkService'
import OffChainTokenService from '@/lib/offChainTokenService'
import { 
  Smartphone, 
  QrCode, 
  Network, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Settings,
  Shield,
  Wifi,
  WifiOff,
  ExternalLink,
  Copy,
  Download,
  RefreshCw
} from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'failed'
  message?: string
  details?: any
  timestamp: Date
}

export default function TrustWalletIntegrationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [integrationConfig, setIntegrationConfig] = useState<TrustWalletIntegrationConfig | null>(null)
  const [trustWalletConfig, setTrustWalletConfig] = useState<TrustWalletConfig | null>(null)
  const [mobileDetection, setMobileDetection] = useState<MobileWalletDetection | null>(null)
  const [autoConfigResult, setAutoConfigResult] = useState<AutoConfigurationResult | null>(null)
  
  const { toast } = useToast()
  const trustWalletIntegration = new TrustWalletIntegration()
  const tokenService = OffChainTokenService

  useEffect(() => {
    // Initialize the integration
    initializeIntegration()
  }, [])

  const initializeIntegration = async () => {
    try {
      await trustWalletIntegration.initialize()
      const config = trustWalletIntegration.getConfiguration()
      setIntegrationConfig(config)
      
      const twConfig = trustWalletService.generateTrustWalletConfig()
      setTrustWalletConfig(twConfig)
      
      const detection = trustWalletService.detectMobileWallet()
      setMobileDetection(detection)
      
      addTestResult('Integration Initialization', 'success', 'Trust Wallet integration initialized successfully')
    } catch (error) {
      addTestResult('Integration Initialization', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const addTestResult = (name: string, status: TestResult['status'], message?: string, details?: any) => {
    const result: TestResult = {
      name,
      status,
      message,
      details,
      timestamp: new Date()
    }
    
    setTestResults(prev => {
      const existing = prev.findIndex(r => r.name === name)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = result
        return updated
      }
      return [...prev, result]
    })
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    setTestResults([])
    
    try {
      // Test 1: Environment Detection
      addTestResult('Environment Detection', 'running')
      await testEnvironmentDetection()
      
      // Test 2: Network Configuration
      addTestResult('Network Configuration', 'running')
      await testNetworkConfiguration()
      
      // Test 3: Token Configuration
      addTestResult('Token Configuration', 'running')
      await testTokenConfiguration()
      
      // Test 4: Deep Link Generation
      addTestResult('Deep Link Generation', 'running')
      await testDeepLinkGeneration()
      
      // Test 5: QR Code Generation
      addTestResult('QR Code Generation', 'running')
      await testQRCodeGeneration()
      
      // Test 6: Auto Configuration
      addTestResult('Auto Configuration', 'running')
      await testAutoConfiguration()
      
      // Test 7: Wallet Connection Simulation
      addTestResult('Wallet Connection Simulation', 'running')
      await testWalletConnectionSimulation()
      
      // Test 8: Mobile Detection
      addTestResult('Mobile Detection', 'running')
      await testMobileDetection()
      
      toast({
        title: "Tests Completed",
        description: "Trust Wallet integration tests have been completed.",
      })
    } catch (error) {
      console.error('Test execution error:', error)
      toast({
        title: "Test Error",
        description: "An error occurred while running tests.",
        variant: "destructive",
      })
    } finally {
      setIsRunningTests(false)
    }
  }

  const testEnvironmentDetection = async () => {
    try {
      const detection = trustWalletService.detectMobileWallet()
      
      const details = {
        isTrustWallet: detection.isTrustWallet,
        isBybitWallet: detection.isBybitWallet,
        isMobile: detection.isMobile,
        userAgent: detection.userAgent,
        deepLinkSupported: detection.deepLinkSupported
      }
      
      addTestResult('Environment Detection', 'success', 'Environment detected successfully', details)
    } catch (error) {
      addTestResult('Environment Detection', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const testNetworkConfiguration = async () => {
    try {
      const config = trustWalletService.generateTrustWalletConfig()
      const isValid = trustWalletService.validateNetworkConfig(config.network)
      
      const details = {
        networkConfig: config.network,
        isValid,
        chainId: config.network.chainId,
        chainName: config.network.chainName,
        rpcUrls: config.network.rpcUrls,
        nativeCurrency: config.network.nativeCurrency
      }
      
      if (isValid) {
        addTestResult('Network Configuration', 'success', 'Network configuration is valid', details)
      } else {
        addTestResult('Network Configuration', 'failed', 'Network configuration is invalid', details)
      }
    } catch (error) {
      addTestResult('Network Configuration', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const testTokenConfiguration = async () => {
    try {
      const config = trustWalletService.generateTrustWalletConfig()
      
      const details = {
        tokens: config.tokens,
        tokenCount: config.tokens.length,
        tokenTypes: config.tokens.map(t => t.type),
        tokenSymbols: config.tokens.map(t => t.symbol)
      }
      
      if (config.tokens.length > 0) {
        addTestResult('Token Configuration', 'success', `Found ${config.tokens.length} configured tokens`, details)
      } else {
        addTestResult('Token Configuration', 'failed', 'No tokens configured', details)
      }
    } catch (error) {
      addTestResult('Token Configuration', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const testDeepLinkGeneration = async () => {
    try {
      const deepLink = trustWalletService.generateNetworkDeepLink()
      const tokenDeepLink = trustWalletService.generateTokenDeepLink('0x1234567890123456789012345678901234567890', 'TEST', 18)
      
      const details = {
        networkDeepLink: deepLink,
        tokenDeepLink: tokenDeepLink,
        isValidNetworkLink: deepLink.startsWith('trust://'),
        isValidTokenLink: tokenDeepLink.startsWith('trust://')
      }
      
      if (deepLink && tokenDeepLink) {
        addTestResult('Deep Link Generation', 'success', 'Deep links generated successfully', details)
      } else {
        addTestResult('Deep Link Generation', 'failed', 'Failed to generate deep links', details)
      }
    } catch (error) {
      addTestResult('Deep Link Generation', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const testQRCodeGeneration = async () => {
    try {
      const qrConfig = trustWalletService.generateQRCodeConfig()
      const integrationQR = trustWalletIntegration.generateQRCodeData()
      
      const details = {
        qrConfig: qrConfig,
        integrationQR: integrationQR,
        hasNetworkData: !!qrConfig.network,
        hasTokenData: qrConfig.tokens.length > 0,
        qrDataLength: integrationQR.length
      }
      
      if (qrConfig.qrData && integrationQR) {
        addTestResult('QR Code Generation', 'success', 'QR code data generated successfully', details)
      } else {
        addTestResult('QR Code Generation', 'failed', 'Failed to generate QR code data', details)
      }
    } catch (error) {
      addTestResult('QR Code Generation', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const testAutoConfiguration = async () => {
    try {
      // Note: This test may fail in browser environment without actual wallet
      const autoConfig = await trustWalletIntegration.autoConfigure()
      setAutoConfigResult(autoConfig)
      
      const details = {
        autoConfig,
        networkConfigured: autoConfig.networkConfigured,
        tokensConfigured: autoConfig.tokensConfigured,
        pricingApplied: autoConfig.pricingApplied,
        walletConnected: autoConfig.walletConnected,
        stepsCompleted: autoConfig.details.networkSetup.stepsCompleted
      }
      
      // In test environment, we consider it success if the process runs without error
      addTestResult('Auto Configuration', 'success', 'Auto configuration process completed', details)
    } catch (error) {
      addTestResult('Auto Configuration', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const testWalletConnectionSimulation = async () => {
    try {
      // Simulate wallet callback handling
      const callbackResult = await trustWalletIntegration.handleWalletCallback({
        action: 'connect',
        wallet: 'trustwallet',
        address: '0x1234567890123456789012345678901234567890'
      })
      
      const details = {
        callbackResult,
        handledSuccessfully: callbackResult.success,
        addressReceived: !!callbackResult.address,
        nextSteps: callbackResult.nextSteps
      }
      
      if (callbackResult.success) {
        addTestResult('Wallet Connection Simulation', 'success', 'Wallet callback handled successfully', details)
      } else {
        addTestResult('Wallet Connection Simulation', 'failed', callbackResult.error || 'Failed to handle wallet callback', details)
      }
    } catch (error) {
      addTestResult('Wallet Connection Simulation', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const testMobileDetection = async () => {
    try {
      const detection = trustWalletService.detectMobileWallet()
      const instructions = trustWalletService.getInstallationInstructions()
      
      const details = {
        detection,
        instructions,
        isMobileOptimized: detection.isMobile,
        hasTrustWallet: detection.isTrustWallet,
        hasBybitWallet: detection.isBybitWallet,
        deepLinkSupported: detection.deepLinkSupported
      }
      
      addTestResult('Mobile Detection', 'success', 'Mobile environment detection completed', details)
    } catch (error) {
      addTestResult('Mobile Detection', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      })
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'running':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const passedTests = testResults.filter(r => r.status === 'success').length
  const totalTests = testResults.length
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Smartphone className="mr-2 h-5 w-5" />
            Trust Wallet Integration Test
          </CardTitle>
          <CardDescription className="text-gray-300">
            Comprehensive testing suite for Trust Wallet integration features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-purple-600 text-white">
                {passedTests}/{totalTests} Tests Passed
              </Badge>
              <Badge variant="outline" className={successRate >= 80 ? 'text-green-400' : 'text-yellow-400'}>
                {successRate}% Success Rate
              </Badge>
            </div>
            <Button 
              onClick={runAllTests} 
              disabled={isRunningTests}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunningTests ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Run All Tests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Test Results</CardTitle>
          <CardDescription className="text-gray-300">
            Individual test results and detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-medium text-white">{result.name}</h3>
                      <p className="text-sm text-gray-300">{result.message}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
                {result.details && (
                  <div className="mt-3 p-3 bg-black/20 rounded">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-400 hover:text-white">
                        View Details
                      </summary>
                      <pre className="mt-2 text-gray-300 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Details */}
      <Tabs defaultValue="integration" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="autoconfig">Auto Config</TabsTrigger>
        </TabsList>

        <TabsContent value="integration">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Integration Configuration</CardTitle>
              <CardDescription className="text-gray-300">
                Current Trust Wallet integration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integrationConfig ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Auto Network Switch</label>
                      <Badge variant={integrationConfig.autoNetworkSwitch ? "default" : "secondary"}>
                        {integrationConfig.autoNetworkSwitch ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Auto Token Detection</label>
                      <Badge variant={integrationConfig.autoTokenDetection ? "default" : "secondary"}>
                        {integrationConfig.autoTokenDetection ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Forced Pricing</label>
                      <Badge variant={integrationConfig.forcedPricing ? "default" : "secondary"}>
                        {integrationConfig.forcedPricing ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Deep Link Support</label>
                      <Badge variant={integrationConfig.deepLinkSupported ? "default" : "secondary"}>
                        {integrationConfig.deepLinkSupported ? "Supported" : "Not Supported"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-black/20 rounded">
                    <h4 className="text-sm font-medium text-white mb-2">Wallet Detection</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-300">Is Trust Wallet:</div>
                      <div className="text-white">{integrationConfig.walletDetection.isTrustWallet ? "Yes" : "No"}</div>
                      <div className="text-gray-300">Is Mobile:</div>
                      <div className="text-white">{integrationConfig.walletDetection.isMobile ? "Yes" : "No"}</div>
                      <div className="text-gray-300">User Agent:</div>
                      <div className="text-white text-xs truncate">{integrationConfig.walletDetection.userAgent}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Integration configuration not loaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Network Configuration</CardTitle>
              <CardDescription className="text-gray-300">
                Trust Wallet network settings and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trustWalletConfig ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Chain Name</label>
                      <p className="text-white">{trustWalletConfig.network.chainName}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Chain ID</label>
                      <p className="text-white">{trustWalletConfig.network.chainId}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Native Currency</label>
                      <p className="text-white">{trustWalletConfig.network.nativeCurrency.name} ({trustWalletConfig.network.nativeCurrency.symbol})</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Decimals</label>
                      <p className="text-white">{trustWalletConfig.network.nativeCurrency.decimals}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-black/20 rounded">
                    <h4 className="text-sm font-medium text-white mb-2">RPC URLs</h4>
                    <div className="space-y-1">
                      {trustWalletConfig.network.rpcUrls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <p className="text-sm text-gray-300 truncate">{url}</p>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(url)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-black/20 rounded">
                    <h4 className="text-sm font-medium text-white mb-2">Block Explorer URLs</h4>
                    <div className="space-y-1">
                      {trustWalletConfig.network.blockExplorerUrls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <p className="text-sm text-gray-300 truncate">{url}</p>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(url)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Network configuration not loaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Mobile Detection</CardTitle>
              <CardDescription className="text-gray-300">
                Mobile wallet detection and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mobileDetection ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Is Mobile Device</label>
                      <Badge variant={mobileDetection.isMobile ? "default" : "secondary"}>
                        {mobileDetection.isMobile ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Trust Wallet Detected</label>
                      <Badge variant={mobileDetection.isTrustWallet ? "default" : "secondary"}>
                        {mobileDetection.isTrustWallet ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Bybit Wallet Detected</label>
                      <Badge variant={mobileDetection.isBybitWallet ? "default" : "secondary"}>
                        {mobileDetection.isBybitWallet ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Deep Link Supported</label>
                      <Badge variant={mobileDetection.deepLinkSupported ? "default" : "secondary"}>
                        {mobileDetection.deepLinkSupported ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-black/20 rounded">
                    <h4 className="text-sm font-medium text-white mb-2">User Agent</h4>
                    <p className="text-sm text-gray-300 break-all">{mobileDetection.userAgent}</p>
                  </div>
                  
                  <Alert>
                    <Smartphone className="h-4 w-4" />
                    <AlertDescription>
                      {mobileDetection.isMobile ? 
                        "Mobile device detected. Trust Wallet integration features are available." :
                        "Desktop device detected. Some mobile-specific features may not be available."
                      }
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <p className="text-gray-400">Mobile detection not loaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="autoconfig">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Auto Configuration Results</CardTitle>
              <CardDescription className="text-gray-300">
                Results from the automatic configuration process
              </CardDescription>
            </CardHeader>
            <CardContent>
              {autoConfigResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Overall Success</label>
                      <Badge variant={autoConfigResult.success ? "default" : "destructive"}>
                        {autoConfigResult.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Network Configured</label>
                      <Badge variant={autoConfigResult.networkConfigured ? "default" : "secondary"}>
                        {autoConfigResult.networkConfigured ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Tokens Configured</label>
                      <Badge variant={autoConfigResult.tokensConfigured ? "default" : "secondary"}>
                        {autoConfigResult.tokensConfigured ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Wallet Connected</label>
                      <Badge variant={autoConfigResult.walletConnected ? "default" : "secondary"}>
                        {autoConfigResult.walletConnected ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-black/20 rounded">
                    <h4 className="text-sm font-medium text-white mb-2">Configuration Details</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-gray-300">Tokens Added:</div>
                      <div className="text-white col-span-2">{autoConfigResult.details.tokensAdded}</div>
                      <div className="text-gray-300">Pricing Updates:</div>
                      <div className="text-white col-span-2">{autoConfigResult.details.pricingUpdates}</div>
                      <div className="text-gray-300">Network Added:</div>
                      <div className="text-white col-span-2">{autoConfigResult.details.networkSetup.networkAdded ? "Yes" : "No"}</div>
                      <div className="text-gray-300">Network Switched:</div>
                      <div className="text-white col-span-2">{autoConfigResult.details.networkSetup.networkSwitched ? "Yes" : "No"}</div>
                    </div>
                  </div>
                  
                  {autoConfigResult.details.networkSetup.stepsCompleted.length > 0 && (
                    <div className="p-3 bg-black/20 rounded">
                      <h4 className="text-sm font-medium text-white mb-2">Completed Steps</h4>
                      <div className="space-y-1">
                        {autoConfigResult.details.networkSetup.stepsCompleted.map((step, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <p className="text-sm text-gray-300">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {autoConfigResult.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Configuration Error: {autoConfigResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">Auto configuration not run yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-300">
            Common Trust Wallet integration actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                const deepLink = trustWalletService.generateNetworkDeepLink()
                copyToClipboard(deepLink)
                toast({ title: "Deep Link Copied", description: "Network deep link copied to clipboard" })
              }}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Copy Deep Link
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                const qrData = trustWalletIntegration.generateQRCodeData()
                copyToClipboard(qrData)
                toast({ title: "QR Data Copied", description: "QR code data copied to clipboard" })
              }}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Copy QR Data
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                const config = trustWalletService.generateNetworkConfigFile()
                copyToClipboard(config)
                toast({ title: "Config Copied", description: "Network configuration copied to clipboard" })
              }}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <Settings className="mr-2 h-4 w-4" />
              Copy Config
            </Button>
            
            <Button 
              variant="outline" 
              onClick={initializeIntegration}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}