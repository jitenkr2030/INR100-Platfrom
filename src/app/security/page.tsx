"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Lock, 
  Smartphone, 
  Mail, 
  Eye, 
  EyeOff, 
  Key, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Fingerprint,
  Activity,
  FileText,
  Users,
  TrendingUp,
  Settings,
  Monitor,
  Wifi,
  Camera,
  Mic,
  QrCode,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { DeviceManagement } from "@/components/security/device-management";

export default function SecurityPage() {
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Security settings states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  // Data states
  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Two-factor authentication states
  const [twoFactorMethod, setTwoFactorMethod] = useState('authenticator');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorQR, setTwoFactorQR] = useState('');

  // Biometric states
  const [biometricSupport, setBiometricSupport] = useState({
    fingerprint: false,
    faceId: false,
    voiceId: false,
  });

  // KYC states
  const [kycStatus, setKycStatus] = useState('pending');
  const [kycLevel, setKycLevel] = useState('basic');

  // Suspicious activity states
  const [suspiciousActivities, setSuspiciousActivities] = useState<any[]>([]);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load security dashboard data
      const response = await fetch('/api/security?action=dashboard');
      const data = await response.json();
      setSecurityData(data);

      // Update local states
      setTwoFactorEnabled(data.twoFactorEnabled);
      setBiometricEnabled(data.biometricEnabled);
      setKycStatus(data.kycStatus);

      // Load suspicious activities
      const activitiesResponse = await fetch('/api/security/suspicious-activity');
      const activitiesData = await activitiesResponse.json();
      setSuspiciousActivities(activitiesData.activities || []);

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSetup = async () => {
    try {
      const response = await fetch('/api/security/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable',
          method: twoFactorMethod,
          contactInfo: 'user@example.com' // In production, get from user profile
        })
      });

      const result = await response.json();
      if (result.success) {
        setTwoFactorQR(result.qrCode || '');
        setTwoFactorEnabled(true);
        loadSecurityData();
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
    }
  };

  const handleBiometricSetup = async () => {
    try {
      const response = await fetch('/api/security/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-support',
          deviceId: 'current-device'
        })
      });

      const support = await response.json();
      setBiometricSupport(support);
      
      // In a real app, you would initiate biometric enrollment here
      setBiometricEnabled(true);
      loadSecurityData();
    } catch (error) {
      console.error('Error setting up biometric:', error);
    }
  };

  const handleKYCStart = async (level: string) => {
    try {
      const response = await fetch('/api/security/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          level
        })
      });

      const result = await response.json();
      if (result.success) {
        setKycLevel(level);
        setKycStatus('pending');
        loadSecurityData();
      }
    } catch (error) {
      console.error('Error starting KYC:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading security settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Security Center</h1>
        <p className="text-gray-600">
          Comprehensive security management for your account with advanced protection features.
        </p>
      </div>

      {/* Security Overview Dashboard */}
      {securityData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold">Security Score</p>
                  <p className="text-2xl font-bold text-green-600">{securityData.securityScore}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Monitor className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold">Active Sessions</p>
                  <p className="text-2xl font-bold text-blue-600">{securityData.activeSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="font-semibold">Security Alerts</p>
                  <p className="text-2xl font-bold text-orange-600">{securityData.suspiciousActivities}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-semibold">KYC Status</p>
                  <p className="text-sm font-medium text-purple-600 capitalize">{securityData.kycStatus}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Security Recommendations */}
          {securityData?.recommendations && securityData.recommendations.length > 0 && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Recommendations:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {securityData.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Recent Security Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Security Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityData?.recentActivities?.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{activity.category}</Badge>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">No recent activities</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Security Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab('authentication')}>
                  <Smartphone className="h-6 w-6" />
                  <span>Setup 2FA</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab('devices')}>
                  <Fingerprint className="h-6 w-6" />
                  <span>Add Biometric</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab('kyc')}>
                  <FileText className="h-6 w-6" />
                  <span>Complete KYC</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-6">
          {/* Password Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password Management
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication (2FA)
                <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
                  {twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!twoFactorEnabled ? (
                <div className="space-y-4">
                  <div>
                    <Label>Select 2FA Method</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <Button
                        variant={twoFactorMethod === 'authenticator' ? 'default' : 'outline'}
                        onClick={() => setTwoFactorMethod('authenticator')}
                        className="h-20 flex-col gap-2"
                      >
                        <QrCode className="h-6 w-6" />
                        <span>Authenticator App</span>
                      </Button>
                      <Button
                        variant={twoFactorMethod === 'sms' ? 'default' : 'outline'}
                        onClick={() => setTwoFactorMethod('sms')}
                        className="h-20 flex-col gap-2"
                      >
                        <Smartphone className="h-6 w-6" />
                        <span>SMS</span>
                      </Button>
                      <Button
                        variant={twoFactorMethod === 'email' ? 'default' : 'outline'}
                        onClick={() => setTwoFactorMethod('email')}
                        className="h-20 flex-col gap-2"
                      >
                        <Mail className="h-6 w-6" />
                        <span>Email</span>
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleTwoFactorSetup} className="w-full">
                    Enable Two-Factor Authentication
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-green-800 font-medium">2FA is active</p>
                  </div>
                  <p className="text-sm text-green-600">
                    Method: {twoFactorMethod.charAt(0).toUpperCase() + twoFactorMethod.slice(1)}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Disable 2FA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Biometric Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Biometric Authentication
                <Badge variant={biometricEnabled ? "default" : "secondary"}>
                  {biometricEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Use biometric data for quick and secure authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!biometricEnabled ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Fingerprint className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-medium">Fingerprint</p>
                        <p className="text-sm text-gray-500">{biometricSupport.fingerprint ? 'Supported' : 'Not Available'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Camera className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium">Face ID</p>
                        <p className="text-sm text-gray-500">{biometricSupport.faceId ? 'Supported' : 'Not Available'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Mic className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="font-medium">Voice ID</p>
                        <p className="text-sm text-gray-500">{biometricSupport.voiceId ? 'Supported' : 'Not Available'}</p>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleBiometricSetup} className="w-full">
                    Setup Biometric Authentication
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-blue-800 font-medium">Biometric authentication is active</p>
                  </div>
                  <p className="text-sm text-blue-600">
                    Your biometric data is securely stored and used for authentication
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Remove Biometric Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Login Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Login Notifications</CardTitle>
              <CardDescription>
                Manage how you receive security alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">
                    Get notified when someone logs into your account
                  </p>
                </div>
                <Switch 
                  checked={loginNotifications} 
                  onCheckedChange={setLoginNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Alerts</p>
                  <p className="text-sm text-gray-600">
                    Receive SMS alerts for suspicious login attempts
                  </p>
                </div>
                <Switch 
                  checked={smsAlerts} 
                  onCheckedChange={setSmsAlerts}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <DeviceManagement />
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active login sessions across devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Session items would be loaded here */}
                <div className="text-center py-8 text-gray-500">
                  <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Loading active sessions...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                KYC Verification
                <Badge variant={kycStatus === 'approved' ? 'default' : 'secondary'}>
                  {kycStatus}
                </Badge>
              </CardTitle>
              <CardDescription>
                Complete identity verification to unlock premium features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {kycStatus === 'not_started' ? (
                <div className="space-y-4">
                  <p className="text-gray-600">Choose your verification level:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleKYCStart('basic')}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Basic</h3>
                        <p className="text-sm text-gray-600">PAN Card + Address Proof</p>
                        <p className="text-xs text-gray-500 mt-2">Processing: 1-2 hours</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleKYCStart('enhanced')}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Enhanced</h3>
                        <p className="text-sm text-gray-600">PAN + Aadhaar + Bank Statement</p>
                        <p className="text-xs text-gray-500 mt-2">Processing: 2-4 hours</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleKYCStart('premium')}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Premium</h3>
                        <p className="text-sm text-gray-600">Multiple documents + Video verification</p>
                        <p className="text-xs text-gray-500 mt-2">Processing: 4-6 hours</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-blue-800 font-medium">KYC verification in progress</p>
                  </div>
                  <p className="text-sm text-blue-600">
                    Level: {kycLevel.charAt(0).toUpperCase() + kycLevel.slice(1)} | Status: {kycStatus}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                View detailed security activity logs for compliance and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Suspicious Activities */}
                {suspiciousActivities.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Recent Suspicious Activities
                    </h3>
                    <div className="space-y-2">
                      {suspiciousActivities.slice(0, 3).map((activity, index) => (
                        <div key={index} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-orange-800">{activity.activity}</p>
                            <Badge variant="outline">{activity.riskScore}% Risk</Badge>
                          </div>
                          <p className="text-sm text-orange-600 mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Audit logs will be displayed here</p>
                  <p className="text-sm">Complete security events and compliance data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-800">Deactivate Account</p>
              <p className="text-sm text-red-600">
                Temporarily disable your account access
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Deactivate
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-800">Delete Account</p>
              <p className="text-sm text-red-600">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}