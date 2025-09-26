"use client"

import { useState } from "react"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Settings, Shield, Menu, X } from "lucide-react"
import Link from "next/link"

export function DashboardHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary glow-blue" />
              <span className="text-xl font-bold text-foreground">DAGShield</span>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Network Active
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Button variant="ghost" size="sm">
              Nodes
            </Button>
            <Button variant="ghost" size="sm">
              Analytics
            </Button>
            <Link href="/gamification">
              <Button variant="ghost" size="sm">
                Rewards
              </Button>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-black" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive">3</Badge>
            </Button>

            <div className="hidden sm:block">
              <ConnectButton showBalance={false} />
            </div>

            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5 text-black" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <nav className="flex flex-col space-y-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="justify-start w-full">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="justify-start">
                Nodes
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                Analytics
              </Button>
              <Link href="/gamification">
                <Button variant="ghost" size="sm" className="justify-start w-full">
                  Rewards
                </Button>
              </Link>
              <div className="pt-4">
                <ConnectButton />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
