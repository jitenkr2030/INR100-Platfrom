"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Smartphone,
  RefreshCw,
  Filter
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SecurityAlert {
  id: string
  type: string
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  title: string
  description: string
  ipAddress?: string
  deviceId?: string
  metadata?: string
  isResolved: boolean
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export function SecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unresolvedOnly, setUnresolvedOnly] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [unresolvedOnly])

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/security-alerts?unresolved=${unresolvedOnly}`)
      if (!response.ok) {
        throw new Error("Failed to fetch security alerts")
      }
      const data = await response.json()
      setAlerts(data.alerts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/security-alerts/${alertId}`, {
        method: "PATCH"
      })
      
      if (!response.ok) {
        throw new Error("Failed to resolve alert")
      }
      
      setAlerts(alerts.filter(alert => alert.id !== alertId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "LOW":
        return <Shield className="h-4 w-4" />
      case "MEDIUM":
        return <Clock className="h-4 w-4" />
      case "HIGH":
        return <AlertTriangle className="h-4 w-4" />
      case "CRITICAL":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "SUSPICIOUS_LOGIN":
        return <Shield className="h-5 w-5" />
      case "MULTIPLE_DEVICES":
        return <Smartphone className="h-5 w-5" />
      case "RAPID_IP_CHANGES":
        return <MapPin className="h-5 w-5" />
      case "UNUSUAL_ACTIVITY":
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Shield className="h-5 w-5" />
    }
  }

  const formatAlertType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Alerts
          </CardTitle>
          <CardDescription>
            Monitor security alerts and suspicious activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Alerts
          </CardTitle>
          <CardDescription>
            Monitor security alerts and suspicious activities on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant={unresolvedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setUnresolvedOnly(true)}
              >
                Unresolved ({alerts.filter(a => !a.isResolved).length})
              </Button>
              <Button
                variant={!unresolvedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setUnresolvedOnly(false)}
              >
                All Alerts
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAlerts}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No security alerts found.</p>
                <p className="text-sm">Your account appears to be secure.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${
                    alert.isResolved ? "bg-gray-50" : "border-l-4 border-l-red-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertTypeIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge 
                            variant="outline" 
                            className={getSeverityColor(alert.severity)}
                          >
                            <div className="flex items-center gap-1">
                              {getSeverityIcon(alert.severity)}
                              {alert.severity}
                            </div>
                          </Badge>
                          <Badge variant="secondary">
                            {formatAlertType(alert.type)}
                          </Badge>
                          {alert.isResolved && (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created: {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                          {alert.ipAddress && (
                            <span>IP: {alert.ipAddress}</span>
                          )}
                          {alert.resolvedAt && (
                            <span>Resolved: {formatDistanceToNow(new Date(alert.resolvedAt), { addSuffix: true })}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!alert.isResolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}