"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Shield, 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Search,
  Filter,
  Eye,
  Ban,
  MoreHorizontal,
  BarChart3,
  Activity,
  Settings,
  FileText,
  Database,
  UserCheck,
  UserX,
  Clock,
  Zap,
  Globe,
  CreditCard,
  FileCheck,
  AlertCircle,
  Server,
  Smartphone,
  Mail,
  Target,
  Star,
  TrendingDown
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  todayTransactions: number;
  systemLoad: number;
  totalRevenue: number;
  pendingCommissions: number;
  expertMarketplace: {
    totalExperts: number;
    totalInsights: number;
    totalTemplates: number;
    totalNewsletters: number;
  };
}

interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: string;
    responseTime: number;
  };
  services: {
    [key: string]: {
      status: "up" | "down" | "warning";
      responseTime?: number;
    };
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  kycStatus: string;
  isVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
  _count: {
    portfolios: number;
    orders: number;
    transactions: number;
  };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load system overview
      const overviewResponse = await fetch("/api/admin/system?type=overview");
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setStats(overviewData);
      }

      // Load system health
      const healthResponse = await fetch("/api/admin/system?type=health");
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setSystemHealth(healthData);
      }

      // Load recent users
      const usersResponse = await fetch("/api/admin/users?limit=10&sortBy=createdAt&sortOrder=desc");
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "up":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "up":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "critical":
      case "down":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": "admin-id-here", // Replace with actual admin ID
        },
        body: JSON.stringify({ action, userId }),
      });

      if (response.ok) {
        alert(`User ${action} action completed`);
        loadDashboardData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error?.error || "Action failed");
      }
    } catch (error) {
      console.error("User action error:", error);
      alert("Action failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Mock admin dashboard data for fallback
  const adminStats = {
    totalUsers: 125000,
    activeUsers: 85000,
    newUsersToday: 1250,
    totalInvestments: 2500000000, // 2.5B INR
    dailyVolume: 125000000, // 125M INR
    pendingKYC: 450,
    flaggedTransactions: 23,
    systemHealth: 98.5,
    uptime: "99.9%",
    totalRevenue: 2500000000,
    pendingCommissions: 1250000,
    expertMarketplace: {
      totalExperts: 150,
      totalInsights: 2500,
      totalTemplates: 85,
      totalNewsletters: 45,
    }
  };

  // Mock users data
  const users = [
    {
      id: "1",
      name: "Rahul Sharma",
      email: "rahul.sharma@email.com",
      phone: "+91 98765 43210",
      kycStatus: "verified",
      riskProfile: "moderate",
      level: 5,
      totalInvested: 125000,
      joinDate: "2024-01-01",
      lastLogin: "2024-01-15",
      status: "active",
      flagged: false
    },
    {
      id: "2",
      name: "Priya Singh",
      email: "priya.singh@email.com",
      phone: "+91 98765 43211",
      kycStatus: "pending",
      riskProfile: "conservative",
      level: 3,
      totalInvested: 25000,
      joinDate: "2024-01-10",
      lastLogin: "2024-01-14",
      status: "active",
      flagged: false
    },
    {
      id: "3",
      name: "Amit Kumar",
      email: "amit.kumar@email.com",
      phone: "+91 98765 43212",
      kycStatus: "rejected",
      riskProfile: "aggressive",
      level: 7,
      totalInvested: 500000,
      joinDate: "2023-12-01",
      lastLogin: "2024-01-13",
      status: "suspended",
      flagged: true
    }
  ];

  // Mock transactions
  const transactions = [
    {
      id: "1",
      userId: "1",
      userName: "Rahul Sharma",
      type: "deposit",
      amount: 5000,
      status: "completed",
      method: "UPI",
      timestamp: "2024-01-15 10:30",
      flagged: false
    },
    {
      id: "2",
      userId: "2",
      userName: "Priya Singh",
      type: "withdrawal",
      amount: 2000,
      status: "pending",
      method: "Bank Transfer",
      timestamp: "2024-01-15 09:15",
      flagged: false
    },
    {
      id: "3",
      userId: "3",
      userName: "Amit Kumar",
      type: "investment",
      amount: 50000,
      status: "completed",
      method: "Wallet",
      timestamp: "2024-01-14 16:45",
      flagged: true
    }
  ];

  // Mock system alerts
  const systemAlerts = [
    {
      id: "1",
      type: "security",
      severity: "high",
      title: "Unusual Login Activity",
      description: "Multiple failed login attempts detected from IP 192.168.1.100",
      timestamp: "2024-01-15 11:30",
      isRead: false
    },
    {
      id: "2",
      type: "compliance",
      severity: "medium",
      title: "KYC Documents Pending",
      description: "450 users have pending KYC verification",
      timestamp: "2024-01-15 10:00",
      isRead: false
    },
    {
      id: "3",
      type: "system",
      severity: "low",
      title: "Scheduled Maintenance",
      description: "System maintenance scheduled for 2024-01-20 02:00 AM",
      timestamp: "2024-01-15 09:00",
      isRead: true
    }
  ];

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "suspended": return "bg-red-100 text-red-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold">Admin Panel</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                Administrator Access
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-medium">Admin User</div>
                <div className="text-sm text-gray-600">admin@inr100.com</div>
              </div>
              <Avatar>
                <AvatarImage src="/avatars/admin.jpg" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* System Status Alert */}
        {systemHealth && systemHealth.status !== "healthy" && (
          <div className={`mb-6 p-4 rounded-lg border ${
            systemHealth.status === "critical" 
              ? "bg-red-50 border-red-200 text-red-800" 
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
          }`}>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span className="font-semibold">
                System Status: {systemHealth.status.toUpperCase()}
              </span>
            </div>
            {systemHealth.status === "critical" && (
              <p className="mt-2 text-sm">
                Immediate attention required. Check system health metrics below.
              </p>
            )}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats?.users?.total || adminStats.totalUsers).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stats?.users?.newThisMonth || adminStats.newUsersToday} new this month
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats?.todayTransactions || adminStats.dailyVolume / 100000).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">Volume: ₹{((stats?.totalRevenue || adminStats.totalRevenue) / 10000000).toFixed(1)}M</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Load</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats?.systemLoad || adminStats.systemHealth).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">CPU usage</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Commissions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{(stats?.pendingCommissions || adminStats.pendingCommissions).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">Expert marketplace</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Health */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>System Health</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemHealth ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Overall Status</span>
                        <div className="flex items-center">
                          {getStatusIcon(systemHealth.status)}
                          <span className={`ml-2 font-semibold ${getStatusColor(systemHealth.status)}`}>
                            {systemHealth.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>Uptime</span>
                        <span className="font-semibold">{formatUptime(systemHealth.uptime)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>Memory Usage</span>
                        <span className="font-semibold">
                          {formatBytes(systemHealth.memory.used)} / {formatBytes(systemHealth.memory.total)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>Database</span>
                        <div className="flex items-center">
                          {getStatusIcon(systemHealth.database.status)}
                          <span className={`ml-2 ${getStatusColor(systemHealth.database.status)}`}>
                            {systemHealth.database.responseTime}ms
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Server Uptime</span>
                        <span className="font-medium">{adminStats.uptime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Connections</span>
                        <span className="font-medium">12,450</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Response Time</span>
                        <span className="font-medium text-green-600">45ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Database Size</span>
                        <span className="font-medium">2.4 GB</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expert Marketplace Overview */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <span>Expert Marketplace</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats?.expertMarketplace ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Total Experts</span>
                        <span className="font-semibold">{stats.expertMarketplace.totalExperts}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Published Insights</span>
                        <span className="font-semibold">{stats.expertMarketplace.totalInsights}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Portfolio Templates</span>
                        <span className="font-semibold">{stats.expertMarketplace.totalTemplates}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Active Newsletters</span>
                        <span className="font-semibold">{stats.expertMarketplace.totalNewsletters}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Total Experts</span>
                        <span className="font-semibold">{adminStats.expertMarketplace.totalExperts}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Published Insights</span>
                        <span className="font-semibold">{adminStats.expertMarketplace.totalInsights}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Portfolio Templates</span>
                        <span className="font-semibold">{adminStats.expertMarketplace.totalTemplates}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Active Newsletters</span>
                        <span className="font-semibold">{adminStats.expertMarketplace.totalNewsletters}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent User Activity</CardTitle>
                <CardDescription>Latest user registrations and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length > 0 ? users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={user.kycStatus === "APPROVED" ? "default" : "secondary"}>
                          {user.kycStatus}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) : systemAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className={`p-2 rounded-lg ${getAlertSeverityColor(alert.severity)}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          {!alert.isRead && (
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{alert.description}</p>
                        <div className="text-xs text-gray-500">{alert.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* User Management */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>User Management</span>
                    </CardTitle>
                    <CardDescription>Manage and monitor all platform users</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length > 0 ? users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={`/avatars/${user.id}.jpg`} />
                          <AvatarFallback>
                            {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{user.name}</span>
                            {user.isVerified && (
                              <Badge className="bg-green-100 text-green-800">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500">
                            Joined: {new Date(user.createdAt).toLocaleDateString()} • Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{user._count.portfolios} portfolios</div>
                          <div className="text-xs text-gray-600">{user._count.transactions} transactions</div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Badge className={getKYCStatusColor(user.kycStatus.toLowerCase())}>
                            {user.kycStatus}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.kycStatus !== "APPROVED" ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUserAction(user.id, "update_kyc")}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUserAction(user.id, "suspend")}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={`/avatars/${user.id}.jpg`} />
                          <AvatarFallback>
                            {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{user.name}</span>
                            {user.isVerified && (
                              <Badge className="bg-green-100 text-green-800">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500">
                            Joined: {new Date(user.createdAt).toLocaleDateString()} • Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{user._count.portfolios} portfolios</div>
                          <div className="text-xs text-gray-600">{user._count.transactions} transactions</div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Badge className={getKYCStatusColor(user.kycStatus.toLowerCase())}>
                            {user.kycStatus}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.kycStatus !== "APPROVED" ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUserAction(user.id, "update_kyc")}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUserAction(user.id, "suspend")}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>System Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemHealth ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Server Uptime</span>
                        <span className="font-semibold">{formatUptime(systemHealth.uptime)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Memory Usage</span>
                        <span className="font-semibold">
                          {systemHealth.memory.percentage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Database Response</span>
                        <span className="font-semibold">
                          {systemHealth.database.responseTime}ms
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>System Load</span>
                        <span className="font-semibold">{stats?.systemLoad?.toFixed(1) || adminStats.systemHealth}%</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Server Uptime</span>
                        <span className="font-medium">{adminStats.uptime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Connections</span>
                        <span className="font-medium">12,450</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Response Time</span>
                        <span className="font-medium text-green-600">45ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Database Size</span>
                        <span className="font-medium">2.4 GB</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Service Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemHealth?.services ? Object.entries(systemHealth.services).map(([service, info]) => (
                    <div key={service} className="flex items-center justify-between">
                      <span className="capitalize">{service}</span>
                      <div className="flex items-center">
                        {getStatusIcon(info.status)}
                        <span className={`ml-2 ${getStatusColor(info.status)}`}>
                          {info.status.toUpperCase()}
                        </span>
                        {info.responseTime && (
                          <span className="ml-2 text-sm text-gray-500">
                            {info.responseTime}ms
                          </span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span>API</span>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="ml-2 text-green-600">UP</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Database</span>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="ml-2 text-green-600">UP</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Email</span>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="ml-2 text-green-600">UP</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Payment</span>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="ml-2 text-green-600">UP</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  Expert Marketplace Management
                </CardTitle>
                <CardDescription>Monitor and manage expert content, commissions, and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">
                      {stats?.expertMarketplace?.totalExperts || adminStats.expertMarketplace.totalExperts}
                    </p>
                    <p className="text-sm text-blue-800">Total Experts</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {stats?.expertMarketplace?.totalInsights || adminStats.expertMarketplace.totalInsights}
                    </p>
                    <p className="text-sm text-green-800">Published Insights</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">
                      {stats?.expertMarketplace?.totalTemplates || adminStats.expertMarketplace.totalTemplates}
                    </p>
                    <p className="text-sm text-purple-800">Portfolio Templates</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Mail className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">
                      {stats?.expertMarketplace?.totalNewsletters || adminStats.expertMarketplace.totalNewsletters}
                    </p>
                    <p className="text-sm text-orange-800">Active Newsletters</p>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button>
                    <Eye className="mr-2 h-4 w-4" />
                    View All Experts
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Commission Reports
                  </Button>
                  <Button variant="outline">
                    <Star className="mr-2 h-4 w-4" />
                    Content Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  Security & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Security Alerts</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                        <span className="text-sm">No critical security issues</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                        <span className="text-sm">3 suspicious login attempts</span>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Compliance Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">KYC Compliance</span>
                        <Badge variant="default">95%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Data Protection</span>
                        <Badge variant="default">100%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Audit Trail</span>
                        <Badge variant="default">Complete</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Platform Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Maintenance Mode</span>
                        <Badge variant="secondary">Off</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">User Registration</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Expert Verification</span>
                        <Badge variant="default">Required</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">API Configuration</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Rate Limiting</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">CORS Policy</span>
                        <Badge variant="default">Configured</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Version</span>
                        <Badge variant="outline">v1.0</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Admin Actions</h4>
                  <div className="flex space-x-4">
                    <Button variant="outline">
                      <Database className="mr-2 h-4 w-4" />
                      Backup Database
                    </Button>
                    <Button variant="outline">
                      <Server className="mr-2 h-4 w-4" />
                      Restart Services
                    </Button>
                    <Button variant="outline">
                      <Smartphone className="mr-2 h-4 w-4" />
                      Mobile App Config
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            {/* Transaction Monitoring */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Transaction Monitoring</span>
                </CardTitle>
                <CardDescription>Monitor all financial transactions on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === "deposit" ? "bg-green-100 text-green-600" :
                          transaction.type === "withdrawal" ? "bg-red-100 text-red-600" :
                          "bg-blue-100 text-blue-600"
                        }`}>
                          {transaction.type === "deposit" && <TrendingUp className="h-4 w-4" />}
                          {transaction.type === "withdrawal" && <AlertTriangle className="h-4 w-4" />}
                          {transaction.type === "investment" && <BarChart3 className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{transaction.type}</div>
                          <div className="text-sm text-gray-600">{transaction.userName}</div>
                          <div className="text-xs text-gray-500">{transaction.timestamp}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`font-medium ${
                            transaction.type === "deposit" ? "text-green-600" :
                            transaction.type === "withdrawal" ? "text-red-600" :
                            "text-blue-600"
                          }`}>
                            {transaction.type === "deposit" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">{transaction.method}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {transaction.flagged && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Flagged
                            </Badge>
                          )}
                          <Badge className={
                            transaction.status === "completed" ? "bg-green-100 text-green-800" :
                            transaction.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }>
                            {transaction.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* KYC Verification Queue */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileCheck className="h-5 w-5" />
                    <span>KYC Verification Queue</span>
                  </CardTitle>
                  <CardDescription>
                    {adminStats.pendingKYC} users awaiting verification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.filter(u => u.kycStatus === "pending").map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={`/avatars/${user.id}.jpg`} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                            <Ban className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Reports */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Compliance Reports</span>
                  </CardTitle>
                  <CardDescription>Generate and view compliance reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      User Activity Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Transaction Summary Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileCheck className="h-4 w-4 mr-2" />
                      KYC Verification Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Risk Assessment Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {/* System Alerts */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>System Alerts & Notifications</span>
                </CardTitle>
                <CardDescription>Monitor and manage system alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className={`p-3 rounded-lg ${getAlertSeverityColor(alert.severity)}`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{alert.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={getAlertSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            {!alert.isRead && (
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="text-xs text-gray-500">{alert.timestamp}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm">Resolve</Button>
                        <Button variant="outline" size="sm">Dismiss</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}