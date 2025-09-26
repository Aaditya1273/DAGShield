'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardHeader } from "@/components/dashboard-header"
import { ThreatMonitor } from "@/components/threat-monitor"
import { NetworkStatus } from "@/components/network-status"
import { NodeManager } from "@/components/node-manager"
import { TokenomicsPanel } from "@/components/tokenomics-panel"
import { AlertsFeed } from "@/components/alerts-feed"

export default function Dashboard() {
  const { isConnected } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="text-muted-foreground">Please connect your wallet to access the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Top Row - Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ThreatMonitor />
          </div>
          <div>
            <NetworkStatus />
          </div>
        </div>

        {/* Middle Row - Node Management & Tokenomics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NodeManager />
          <TokenomicsPanel />
        </div>

        {/* Bottom Row - Alerts Feed */}
        <AlertsFeed />
      </main>
    </div>
  )
}
