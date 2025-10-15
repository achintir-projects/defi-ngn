import TrustWalletValidationReport from '@/components/TrustWalletValidationReport'

export default function ValidationReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Trust Wallet Integration Validation Report
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive validation and testing results for Trust Wallet integration
          </p>
        </div>
        
        <TrustWalletValidationReport />
      </div>
    </div>
  )
}