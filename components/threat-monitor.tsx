"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap } from "lucide-react"

export function ThreatMonitor() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Threat Detection</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-black border-black">
              <Zap className="h-3 w-3 mr-1 text-black" />
              Real-time
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">1,247</div>
            <div className="text-sm text-muted-foreground">Threats Detected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black">1,198</div>
            <div className="text-sm text-muted-foreground">Threats Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-chart-3">96.1%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">0.3s</div>
            <div className="text-sm text-muted-foreground">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black">47ms</div>
            <div className="text-sm text-muted-foreground">Consensus</div>
          </div>
        </div>

        <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg border border-border">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Threat Detection Chart</p>
            <p className="text-xs text-muted-foreground mt-1">Real-time monitoring active</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
