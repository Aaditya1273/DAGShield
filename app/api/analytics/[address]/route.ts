import { NextRequest, NextResponse } from 'next/server'

// Mock database for analytics
const mockAnalyticsDatabase = {
  analytics: new Map(),
  initialized: false
}

// Initialize mock analytics data
function initializeMockAnalytics() {
  if (mockAnalyticsDatabase.initialized) return;
  
  const sampleAddresses = [
    '0x742d35Cc6634C0532925a3b8D8eA3C98E8b6b8A2',
    '0x8f3c4B2A1d9E6F7C8A5B3D2E1F4A9C7B6D8E5F2A',
    '0x1234567890abcdef1234567890abcdef12345678'
  ];

  sampleAddresses.forEach((address, index) => {
    const baseAnalytics = {
      threatStats: {
        total: 1000 + index * 300 + Math.floor(Math.random() * 500),
        blocked: 950 + index * 280 + Math.floor(Math.random() * 450),
        successRate: 95 + Math.random() * 5,
        avgResponse: 0.2 + Math.random() * 0.3
      },
      networkMetrics: {
        activeNodes: 2500 + index * 500 + Math.floor(Math.random() * 1000),
        uptime: 95 + Math.random() * 5,
        consensus: 99 + Math.random() * 1,
        latency: 40 + Math.random() * 20
      },
      performance: {
        daily: generateDailyPerformance(),
        weekly: generateWeeklyPerformance(),
        monthly: generateMonthlyPerformance()
      },
      earnings: {
        today: 15 + Math.random() * 10,
        week: 100 + Math.random() * 50,
        month: 400 + Math.random() * 200,
        total: 5000 + index * 2000 + Math.random() * 3000
      },
      threats: {
        hourly: generateHourlyThreats(),
        daily: generateDailyThreats(),
        categories: {
          malware: Math.floor(Math.random() * 100),
          phishing: Math.floor(Math.random() * 80),
          ddos: Math.floor(Math.random() * 60),
          intrusion: Math.floor(Math.random() * 40),
          other: Math.floor(Math.random() * 30)
        }
      }
    };
    
    mockAnalyticsDatabase.analytics.set(address.toLowerCase(), baseAnalytics);
  });
  
  mockAnalyticsDatabase.initialized = true;
}

function generateDailyPerformance() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => {
    const threats = 35 + Math.floor(Math.random() * 30);
    return {
      date: day,
      threats,
      blocked: Math.floor(threats * (0.9 + Math.random() * 0.1)),
      performance: 90 + Math.random() * 10,
      earnings: 10 + Math.random() * 15
    };
  });
}

function generateWeeklyPerformance() {
  const weeks = [];
  for (let i = 4; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    const threats = 200 + Math.floor(Math.random() * 100);
    weeks.push({
      week: `Week ${5-i}`,
      date: date.toISOString().split('T')[0],
      threats,
      blocked: Math.floor(threats * (0.85 + Math.random() * 0.15)),
      performance: 85 + Math.random() * 15,
      earnings: 70 + Math.random() * 50
    });
  }
  return weeks;
}

function generateMonthlyPerformance() {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const threats = 800 + Math.floor(Math.random() * 400);
    months.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      date: date.toISOString().split('T')[0],
      threats,
      blocked: Math.floor(threats * (0.8 + Math.random() * 0.2)),
      performance: 80 + Math.random() * 20,
      earnings: 300 + Math.random() * 200
    });
  }
  return months;
}

function generateHourlyThreats() {
  const hours = [];
  for (let i = 23; i >= 0; i--) {
    const date = new Date();
    date.setHours(date.getHours() - i);
    const threats = Math.floor(Math.random() * 20);
    hours.push({
      hour: date.getHours(),
      time: date.toISOString(),
      threats,
      blocked: Math.floor(threats * (0.9 + Math.random() * 0.1))
    });
  }
  return hours;
}

function generateDailyThreats() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const threats = 30 + Math.floor(Math.random() * 40);
    days.push({
      date: date.toISOString().split('T')[0],
      threats,
      blocked: Math.floor(threats * (0.85 + Math.random() * 0.15)),
      severity: {
        high: Math.floor(Math.random() * 10),
        medium: Math.floor(Math.random() * 20),
        low: Math.floor(Math.random() * 30)
      }
    });
  }
  return days;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    // Initialize mock data
    initializeMockAnalytics();
    
    const { address: rawAddress } = await params;
    const address = rawAddress.toLowerCase();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 800));
    
    // Get analytics for the address
    let analytics = mockAnalyticsDatabase.analytics.get(address);
    
    // If address not found, create default analytics
    if (!analytics) {
      analytics = {
        threatStats: {
          total: 500 + Math.floor(Math.random() * 300),
          blocked: 450 + Math.floor(Math.random() * 270),
          successRate: 90 + Math.random() * 10,
          avgResponse: 0.3 + Math.random() * 0.4
        },
        networkMetrics: {
          activeNodes: 1500 + Math.floor(Math.random() * 500),
          uptime: 90 + Math.random() * 10,
          consensus: 98 + Math.random() * 2,
          latency: 50 + Math.random() * 30
        },
        performance: {
          daily: generateDailyPerformance(),
          weekly: generateWeeklyPerformance(),
          monthly: generateMonthlyPerformance()
        },
        earnings: {
          today: 8 + Math.random() * 7,
          week: 60 + Math.random() * 40,
          month: 250 + Math.random() * 150,
          total: 2000 + Math.random() * 1500
        },
        threats: {
          hourly: generateHourlyThreats(),
          daily: generateDailyThreats(),
          categories: {
            malware: Math.floor(Math.random() * 50),
            phishing: Math.floor(Math.random() * 40),
            ddos: Math.floor(Math.random() * 30),
            intrusion: Math.floor(Math.random() * 20),
            other: Math.floor(Math.random() * 15)
          }
        }
      };
      
      // Store the new analytics
      mockAnalyticsDatabase.analytics.set(address, analytics);
    }
    
    // Update analytics with real-time simulation
    const updatedAnalytics = {
      ...analytics,
      threatStats: {
        ...analytics.threatStats,
        total: analytics.threatStats.total + Math.floor(Math.random() * 5),
        blocked: analytics.threatStats.blocked + Math.floor(Math.random() * 4)
      },
      networkMetrics: {
        ...analytics.networkMetrics,
        uptime: Math.max(85, Math.min(100, analytics.networkMetrics.uptime + (Math.random() - 0.5) * 1)),
        latency: Math.max(20, Math.min(100, analytics.networkMetrics.latency + (Math.random() - 0.5) * 5))
      },
      earnings: {
        ...analytics.earnings,
        today: analytics.earnings.today + Math.random() * 2,
        total: analytics.earnings.total + Math.random() * 5
      }
    };
    
    return NextResponse.json({
      ...updatedAnalytics,
      timestamp: new Date().toISOString(),
      success: true,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}
