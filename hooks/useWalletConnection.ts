'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useWalletConnection() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  // Redirect to dashboard when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      router.push('/dashboard')
    }
  }, [isConnected, address, router])

  return {
    address,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    connectors,
  }
}
