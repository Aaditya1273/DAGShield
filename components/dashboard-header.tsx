"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Menu, X, BarChart3, Server, Activity, Gift, Sun, Moon } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"
import Link from "next/link"

export function DashboardHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const pathname = usePathname()

  // Simple theme toggle function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  // Navigation items with icons and active states
  const navItems = [
    { 
      href: "/dashboard", 
      label: "Dashboard", 
      icon: BarChart3,
      isActive: pathname === "/dashboard" || pathname.startsWith("/dashboard")
    },
    { 
      href: "/nodes", 
      label: "Nodes", 
      icon: Server,
      isActive: pathname === "/nodes" || pathname.startsWith("/nodes")
    },
    { 
      href: "/analytics", 
      label: "Analytics", 
      icon: Activity,
      isActive: pathname === "/analytics" || pathname.startsWith("/analytics")
    },
    { 
      href: "/gamification", 
      label: "Rewards", 
      icon: Gift,
      isActive: pathname === "/gamification" || pathname.startsWith("/gamification")
    }
  ]

  // Debug: Log current pathname and active states
  console.log("Current pathname:", pathname)
  console.log("Nav items active states:", navItems.map(item => ({ label: item.label, isActive: item.isActive })))

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 animate-slide-in-up">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 overflow-visible">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4 animate-slide-in-right">
            <div className="flex items-center space-x-2 smooth-hover">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">DAGShield</span>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Network Active
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-3 px-2">
            {navItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant={item.isActive ? "default" : "ghost"} 
                    size="sm" 
                    className={`
                      smooth-hover relative overflow-hidden group px-4 py-2
                      ${item.isActive 
                        ? 'bg-black text-white shadow-2xl scale-105 border-2 border-gray-300 !rounded-xl' 
                        : 'hover:bg-accent/50 text-black !rounded-lg'
                      }
                      stagger-${index + 2}
                    `}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${item.isActive ? 'text-white' : ''}`} />
                    {item.label}
                    {item.isActive && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                      </>
                    )}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3 animate-slide-in-right">
            <div className="animate-scale-in stagger-1">
              <NotificationBell />
            </div>

            <div className="hidden sm:block animate-scale-in stagger-2">
              <ConnectButton showBalance={false} />
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="smooth-hover animate-scale-in stagger-3"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-black dark:text-white" />
              ) : (
                <Moon className="h-5 w-5 text-black dark:text-white" />
              )}
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden smooth-hover animate-scale-in stagger-4"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 animate-slide-in-up glass">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <Button 
                      variant={item.isActive ? "default" : "ghost"} 
                      size="sm" 
                      className={`
                        justify-start w-full smooth-hover relative overflow-hidden
                        ${item.isActive 
                          ? 'bg-black text-white shadow-xl border-2 border-gray-300 !rounded-xl' 
                          : 'hover:bg-accent/50 text-black !rounded-lg'
                        }
                        stagger-${index + 1}
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className={`h-4 w-4 mr-2 ${item.isActive ? 'text-white' : ''}`} />
                      {item.label}
                      {item.isActive && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                        </>
                      )}
                    </Button>
                  </Link>
                )
              })}
              <div className="pt-4 animate-scale-in stagger-5">
                <ConnectButton />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
