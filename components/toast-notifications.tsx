'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, Info, Gift } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useNotifications, Notification } from '@/hooks/useNotifications'

const getToastIcon = (type: Notification['type']) => {
  switch (type) {
    case 'welcome': return <Gift className="w-5 h-5 text-blue-500" />
    case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    case 'reward': return <Gift className="w-5 h-5 text-green-500" />
    default: return <Info className="w-5 h-5 text-blue-500" />
  }
}

const getToastColor = (type: Notification['type']) => {
  switch (type) {
    case 'welcome': return 'bg-blue-50 border-blue-200 text-blue-800'
    case 'success': return 'bg-green-50 border-green-200 text-green-800'
    case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    case 'reward': return 'bg-green-50 border-green-200 text-green-800'
    default: return 'bg-blue-50 border-blue-200 text-blue-800'
  }
}

export function ToastNotifications() {
  const { address } = useAccount()
  const { notifications, markAsRead } = useNotifications(address)
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([])

  useEffect(() => {
    // Show only unread notifications as toasts
    const unreadNotifications = notifications
      .filter(n => !n.read)
      .slice(0, 3) // Show max 3 toasts at once
    
    setVisibleToasts(unreadNotifications)
  }, [notifications])

  const dismissToast = (notificationId: string) => {
    markAsRead(notificationId)
    setVisibleToasts(prev => prev.filter(n => n.id !== notificationId))
  }

  // Auto-dismiss toasts after 8 seconds (except welcome)
  useEffect(() => {
    visibleToasts.forEach(toast => {
      if (toast.type !== 'welcome') {
        const timer = setTimeout(() => {
          dismissToast(toast.id)
        }, 8000)
        
        return () => clearTimeout(timer)
      }
    })
  }, [visibleToasts])

  if (visibleToasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3">
      {visibleToasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`
            max-w-sm w-full rounded-lg border shadow-lg p-4 transform transition-all duration-300 ease-in-out
            ${getToastColor(toast.type)}
            animate-slide-in-right
          `}
          style={{
            animationDelay: `${index * 150}ms`
          }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getToastIcon(toast.type)}
            </div>
            
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold">
                {toast.title}
              </p>
              <p className="text-sm mt-1 opacity-90">
                {toast.message}
              </p>
              
              {toast.type === 'welcome' && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      dismissToast(toast.id)
                      // Navigate to dashboard
                      window.location.href = '/dashboard'
                    }}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
            
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => dismissToast(toast.id)}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
