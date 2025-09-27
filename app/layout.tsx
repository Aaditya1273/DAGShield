import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import { ToastNotifications } from "@/components/toast-notifications"
import "./globals.css"

// Fix EventEmitter memory leak warnings
if (typeof process !== 'undefined' && process.setMaxListeners) {
  process.setMaxListeners(20)
}

// Suppress network-related console errors globally
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args) => {
    const message = args.join(' ').toLowerCase()
    if (
      message.includes('failed to fetch') ||
      message.includes('network request failed') ||
      message.includes('fetch error') ||
      message.includes('connection error') ||
      message.includes('rpc error')
    ) {
      return // Suppress these errors
    }
    originalError(...args)
  }
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "DAGShield - Decentralized AI Security Network",
  description: "Real-time Web3 threat detection powered by AI and DePIN",
  manifest: "/manifest.json",
  generator: 'v0.app'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head />
      <body className="font-sans">
        <Script src="/suppress-errors.js" strategy="beforeInteractive" />
        <Providers>
          {children}
          <ToastNotifications />
        </Providers>
      </body>
    </html>
  )
}
