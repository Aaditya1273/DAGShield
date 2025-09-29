'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useProtectedPage() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check connection after hydration
  useEffect(() => {
    if (mounted) {
      // Give wagmi time to initialize connection state
      const timer = setTimeout(() => {
        if (!isConnected) {
          router.push('/')
        } else {
          setIsChecking(false)
        }
      }, 1000) // Wait 1 second for wagmi to hydrate

      return () => clearTimeout(timer)
    }
  }, [mounted, isConnected, router])

  // Also stop checking if connected immediately
  useEffect(() => {
    if (mounted && isConnected) {
      setIsChecking(false)
    }
  }, [mounted, isConnected])

  return {
    isConnected: mounted ? isConnected : false,
    isChecking: !mounted || isChecking,
    mounted
  }
}
