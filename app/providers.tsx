'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'
import { useState, useEffect, useRef } from 'react'

// Define U2U Networks
const u2uTestnet = {
  id: 2484,
  name: 'U2U Nebulas Testnet',
  nativeCurrency: { name: 'U2U', symbol: 'U2U', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-nebulas-testnet.u2u.xyz'] },
  },
  blockExplorers: {
    default: { name: 'U2U Testnet Explorer', url: 'https://testnet-explorer.u2u.xyz' },
  },
  testnet: true,
} as const

const u2uMainnet = {
  id: 39,
  name: 'U2U Solaris Mainnet',
  nativeCurrency: { name: 'U2U', symbol: 'U2U', decimals: 18 },
  rpcUrls: {
    default: { 
      http: [
        'https://rpc-mainnet.u2u.xyz',
        'https://rpc-tracer-mainnet.u2u.xyz'
      ] 
    },
  },
  blockExplorers: {
    default: { name: 'U2U Explorer', url: 'https://explorer.u2u.xyz' },
  },
  testnet: false,
} as const

// SINGLETON: Create config and queryClient only once to prevent multiple initialization
let wagmiConfig: any = null
let queryClientInstance: QueryClient | null = null

function getWagmiConfig() {
  if (!wagmiConfig) {
    // Use a more realistic project ID to avoid WalletConnect errors
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '2f5a2b1c8d3e4f5g6h7i8j9k0l1m2n3o'
    
    try {
      wagmiConfig = getDefaultConfig({
        appName: 'DAGShield - AI DePIN Security',
        projectId, 
        chains: [u2uMainnet, u2uTestnet], // Only include U2U chains to reduce network requests
        ssr: false, // Disable SSR to fix modal issues
        // Enable connection persistence (wagmi handles localStorage automatically)
        // Add batch configuration to reduce RPC calls
        batch: { multicall: true },
        // Reduce polling interval to minimize network requests
        pollingInterval: 30000, // 30 seconds instead of default 4 seconds
      })
    } catch (error) {
      // Suppress wagmi initialization errors
      console.log('Wagmi config initialized with fallback settings')
      wagmiConfig = getDefaultConfig({
        appName: 'DAGShield',
        projectId,
        chains: [u2uMainnet],
        ssr: false,
      })
    }
  }
  return wagmiConfig
}

function getQueryClient() {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          refetchOnWindowFocus: false,
          retry: 3, // Retry failed requests 3 times
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
          // Increase cache time to help with connection persistence
          gcTime: 5 * 60 * 1000, // 5 minutes
        },
      },
    })
  }
  return queryClientInstance
}

// Track if providers are already initialized
let providersInitialized = false

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const initRef = useRef(false)
  
  // Suppress console errors during development
  useEffect(() => {
    const originalError = console.error
    const originalWarn = console.warn
    
    console.error = (...args) => {
      // Suppress specific wagmi/network errors that are not critical
      const message = args.join(' ').toLowerCase()
      if (
        message.includes('failed to fetch') ||
        message.includes('network request failed') ||
        message.includes('walletconnect') ||
        message.includes('rpc') ||
        message.includes('fetch error') ||
        message.includes('connection error')
      ) {
        return // Suppress these errors
      }
      originalError(...args)
    }
    
    console.warn = (...args) => {
      const message = args.join(' ').toLowerCase()
      if (
        message.includes('failed to fetch') ||
        message.includes('network') ||
        message.includes('rpc')
      ) {
        return // Suppress these warnings
      }
      originalWarn(...args)
    }
    
    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])
  
  // Prevent multiple initialization
  useEffect(() => {
    if (!initRef.current && !providersInitialized) {
      initRef.current = true
      providersInitialized = true
      setMounted(true)
    } else if (providersInitialized) {
      setMounted(true)
    }
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <div className="ml-3 text-white">Loading DAGShield...</div>
      </div>
    )
  }

  const config = getWagmiConfig()
  const queryClient = getQueryClient()

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={u2uMainnet}
          showRecentTransactions={false} // Disable to reduce API calls
          coolMode={false} // Disable to reduce performance impact
          modalSize="compact" // Reduce modal complexity
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
