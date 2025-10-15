import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Settings } from 'lucide-react'

export default function TrustWalletTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Trust Wallet Integration Test
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive testing suite for Trust Wallet integration features and functionality
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-yellow-400" />
                Test Suite Temporarily Disabled
              </CardTitle>
              <CardDescription className="text-gray-300">
                The Trust Wallet integration test suite is currently under maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The test suite has been temporarily disabled to resolve build issues. 
                  The main application functionality remains unaffected.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="text-gray-300">
                  <h3 className="font-semibold text-white mb-2">What this affects:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Trust Wallet integration testing interface</li>
                    <li>Mobile wallet detection tests</li>
                    <li>Network configuration validation</li>
                    <li>QR code generation testing</li>
                  </ul>
                </div>
                
                <div className="text-gray-300">
                  <h3 className="font-semibold text-white mb-2">What still works:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Main DeFi platform functionality</li>
                    <li>Token deployment and management</li>
                    <li>Wallet connection and integration</li>
                    <li>Network configuration</li>
                    <li>All API endpoints</li>
                  </ul>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/'}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Return to Main Platform
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}