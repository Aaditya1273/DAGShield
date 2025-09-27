import { useState, useEffect, useCallback } from 'react'

export interface Notification {
  id: string
  type: 'welcome' | 'node' | 'threat' | 'reward' | 'system' | 'warning' | 'success'
  title: string
  message: string
  timestamp: number
  read: boolean
  userAddress?: string
  nodeId?: string
  data?: any
}

const NOTIFICATIONS_KEY = 'dagshield_notifications'
const USER_SETTINGS_KEY = 'dagshield_user_settings'

export const useNotifications = (userAddress?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications from localStorage
  const loadNotifications = useCallback(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY)
      const allNotifications: Notification[] = stored ? JSON.parse(stored) : []
      
      // Filter notifications for current user
      const userNotifications = userAddress 
        ? allNotifications.filter(n => n.userAddress === userAddress || !n.userAddress)
        : allNotifications.filter(n => !n.userAddress)
      
      setNotifications(userNotifications)
      setUnreadCount(userNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Failed to load notifications:', error)
      setNotifications([])
      setUnreadCount(0)
    }
  }, [userAddress])

  // Save notifications to localStorage
  const saveNotifications = useCallback((newNotifications: Notification[]) => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY)
      const allNotifications: Notification[] = stored ? JSON.parse(stored) : []
      
      // Remove old notifications for this user
      const otherUserNotifications = allNotifications.filter(n => 
        n.userAddress !== userAddress && n.userAddress !== undefined
      )
      
      // Combine with new notifications
      const updatedNotifications = [...otherUserNotifications, ...newNotifications]
      
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications))
      setNotifications(newNotifications)
      setUnreadCount(newNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Failed to save notifications:', error)
    }
  }, [userAddress])

  // Check if user is new (first time connecting)
  const isNewUser = useCallback(() => {
    if (!userAddress) return false
    
    try {
      const settings = localStorage.getItem(USER_SETTINGS_KEY)
      const userSettings = settings ? JSON.parse(settings) : {}
      return !userSettings[userAddress]?.hasConnectedBefore
    } catch {
      return true
    }
  }, [userAddress])

  // Mark user as having connected before
  const markUserAsConnected = useCallback(() => {
    if (!userAddress) return
    
    try {
      const settings = localStorage.getItem(USER_SETTINGS_KEY)
      const userSettings = settings ? JSON.parse(settings) : {}
      
      userSettings[userAddress] = {
        ...userSettings[userAddress],
        hasConnectedBefore: true,
        firstConnectedAt: Date.now()
      }
      
      localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(userSettings))
    } catch (error) {
      console.error('Failed to save user settings:', error)
    }
  }, [userAddress])

  // Add new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'userAddress'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
      userAddress
    }

    const updatedNotifications = [newNotification, ...notifications].slice(0, 50) // Keep only last 50
    saveNotifications(updatedNotifications)
  }, [notifications, saveNotifications, userAddress])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    )
    saveNotifications(updatedNotifications)
  }, [notifications, saveNotifications])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
    saveNotifications(updatedNotifications)
  }, [notifications, saveNotifications])

  // Clear all notifications
  const clearAll = useCallback(() => {
    saveNotifications([])
  }, [saveNotifications])

  // Add welcome notification for new users
  const addWelcomeNotification = useCallback(() => {
    if (isNewUser()) {
      addNotification({
        type: 'welcome',
        title: 'Welcome to DAGShield! 🎉',
        message: 'Welcome to the decentralized AI security network. Start by deploying your first node to begin earning rewards and protecting Web3.',
        data: { isWelcome: true }
      })
      markUserAsConnected()
    }
  }, [isNewUser, addNotification, markUserAsConnected])

  // Generate node-based notifications
  const generateNodeNotifications = useCallback(() => {
    try {
      const nodes = JSON.parse(localStorage.getItem('dagshield_nodes') || '[]')
      
      nodes.forEach((node: any) => {
        // High performance notification
        if (node.performance > 95 && node.threatsDetected > 50) {
          const existingNotification = notifications.find(n => 
            n.nodeId === node.id && n.type === 'success' && n.data?.type === 'high_performance'
          )
          
          if (!existingNotification) {
            addNotification({
              type: 'success',
              title: 'Excellent Node Performance! 🚀',
              message: `Node ${node.name} is performing exceptionally well with ${node.performance}% efficiency and ${node.threatsDetected} threats detected.`,
              nodeId: node.id,
              data: { type: 'high_performance', performance: node.performance, threats: node.threatsDetected }
            })
          }
        }
        
        // Low performance warning
        if (node.performance < 80) {
          const existingWarning = notifications.find(n => 
            n.nodeId === node.id && n.type === 'warning' && n.data?.type === 'low_performance'
          )
          
          if (!existingWarning) {
            addNotification({
              type: 'warning',
              title: 'Node Performance Warning ⚠️',
              message: `Node ${node.name} performance has dropped to ${node.performance}%. Consider checking your node configuration.`,
              nodeId: node.id,
              data: { type: 'low_performance', performance: node.performance }
            })
          }
        }
        
        // Maintenance notification
        if (node.status === 'maintenance') {
          const existingMaintenance = notifications.find(n => 
            n.nodeId === node.id && n.type === 'system' && n.data?.type === 'maintenance'
          )
          
          if (!existingMaintenance) {
            addNotification({
              type: 'system',
              title: 'Node Under Maintenance 🔧',
              message: `Node ${node.name} is currently under maintenance. It will resume operations shortly.`,
              nodeId: node.id,
              data: { type: 'maintenance' }
            })
          }
        }
        
        // Reward notification (when node earns significant rewards)
        if (node.rewards > 100) {
          const existingReward = notifications.find(n => 
            n.nodeId === node.id && n.type === 'reward' && n.data?.rewards === node.rewards
          )
          
          if (!existingReward) {
            addNotification({
              type: 'reward',
              title: 'Rewards Earned! 💰',
              message: `Node ${node.name} has earned ${node.rewards.toLocaleString()} DAG tokens from threat detection.`,
              nodeId: node.id,
              data: { type: 'rewards', rewards: node.rewards }
            })
          }
        }
      })
    } catch (error) {
      console.error('Failed to generate node notifications:', error)
    }
  }, [notifications, addNotification])

  // Load notifications on mount and when user changes
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Add welcome notification when user connects for first time
  useEffect(() => {
    if (userAddress) {
      addWelcomeNotification()
    }
  }, [userAddress, addWelcomeNotification])

  // Generate node notifications periodically
  useEffect(() => {
    if (userAddress) {
      generateNodeNotifications()
      
      const interval = setInterval(generateNodeNotifications, 60000) // Check every minute
      return () => clearInterval(interval)
    }
  }, [userAddress, generateNodeNotifications])

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    loadNotifications
  }
}
