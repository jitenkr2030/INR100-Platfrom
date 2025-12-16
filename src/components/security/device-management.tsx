"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Laptop, Smartphone, Tablet, Monitor, Trash2, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Device {
  id: string
  deviceId: string
  deviceType: string
  deviceName?: string
  platform?: string
  browser?: string
  ipAddress: string
  location?: string
  isActive: boolean
  lastSeenAt: string
  createdAt: string
}

export function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deviceToRemove, setDeviceToRemove] = useState<Device | null>(null)

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices")
      if (!response.ok) {
        throw new Error("Failed to fetch devices")
      }
      const data = await response.json()
      setDevices(data.devices)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const removeDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE"
      })
      
      if (!response.ok) {
        throw new Error("Failed to remove device")
      }
      
      setDevices(devices.filter(device => device.id !== deviceId))
      setDeviceToRemove(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />
      case "tablet":
        return <Tablet className="h-5 w-5" />
      case "desktop":
        return <Monitor className="h-5 w-5" />
      default:
        return <Laptop className="h-5 w-5" />
    }
  }

  const isCurrentDevice = (device: Device) => {
    // This is a simplified check - in a real app, you'd compare with the current session
    return device.deviceId === "current" || devices.length === 1
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Management</CardTitle>
          <CardDescription>Manage your registered devices</CardDescription>
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
            <Laptop className="h-5 w-5" />
            Device Management
          </CardTitle>
          <CardDescription>
            Manage your registered devices. You can have up to 3 active devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {devices.length >= 3 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have reached the maximum device limit. Remove a device to add a new one.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(device.deviceType)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {device.deviceName || `${device.platform} ${device.browser}`}
                      </h4>
                      {isCurrentDevice(device) && (
                        <Badge variant="secondary">Current Device</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {device.platform} • {device.browser}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      IP: {device.ipAddress} • Last seen:{" "}
                      {formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                {!isCurrentDevice(device) && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeviceToRemove(device)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remove Device</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to remove this device? This will log out all sessions
                          on this device.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeviceToRemove(null)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => removeDevice(device.id)}
                        >
                          Remove Device
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ))}
          </div>

          {devices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Laptop className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No devices registered yet.</p>
              <p className="text-sm">Devices will be registered automatically when you log in.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}