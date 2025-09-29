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
      })
      markUserAsConnected()
    }
  }, [isNewUser, addNotification, markUserAsConnected])

  // Generate notifications based on user stats from API (disabled for now to prevent spam)
  const generateNodeNotifications = useCallback(async () => {
    if (!userAddress) return;
    
    try {
      // Fetch real user stats from API instead of localStorage
      const response = await fetch(`/api/gamification/${userAddress}`);
      if (!response.ok) return;
      
      const data = await response.json();
      if (!data.success || !data.userStats) return;
      
      // Only generate notifications if user has actual nodes (not demo data)
      if (data.userStats.totalNodes === 0) return;
      
      const stats = data.userStats;
      
      // High rewards notification
      if (stats.totalRewards > 1000) {
        const existingReward = notifications.find(n => 
          n.type === 'reward' && n.data?.type === 'milestone_reward'
        )
        
        if (!existingReward) {
          addNotification({
            type: 'reward',
            title: 'Rewards Milestone! 💰',
            message: `Congratulations! You've earned ${stats.totalRewards.toLocaleString()} DAG tokens from your nodes.`,
            data: { type: 'milestone_reward', rewards: stats.totalRewards }
          })
        }
      }
      
      // High threat detection notification
      if (stats.threatsDetected > 100) {
        const existingThreat = notifications.find(n => 
          n.type === 'success' && n.data?.type === 'threat_milestone'
        )
        
        if (!existingThreat) {
          addNotification({
            type: 'success',
            title: 'Threat Detection Milestone! 🛡️',
            message: `Your nodes have successfully detected ${stats.threatsDetected} threats, keeping the network secure.`,
            data: { type: 'threat_milestone', threats: stats.threatsDetected }
          })
        }
      }
    } catch (error) {
      console.error('Failed to generate node notifications:', error)
    }
  }, [userAddress, notifications, addNotification])

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

  // Generate node notifications periodically (disabled to prevent spam)
  useEffect(() => {
    // Temporarily disabled to prevent notification spam
    // TODO: Re-enable once SQLite data is properly integrated
    /*
    if (userAddress) {
      generateNodeNotifications()
      
      const interval = setInterval(generateNodeNotifications, 60000) // Check every minute
      return () => clearInterval(interval)
    }
    */
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
