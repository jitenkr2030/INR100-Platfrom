'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  Settings
} from 'lucide-react';

interface CorporateClient {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  industry: string;
  companySize: string;
  subscriptionPlan: string;
  status: string;
  createdAt: string;
  _count: {
    employees: number;
    courses: number;
    trainingSessions: number;
  };
}

interface AnalyticsData {
  overview: {
    totalEmployees: number;
    activeEmployees: number;
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalTrainingHours: number;
    averageCompletionRate: number;
  };
  departmentStats: Array<{
    department: string;
    employeeCount: number;
  }>;
  topPerformers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    department: string;
    role: string;
    completedCourses: number;
    averageScore: number;
    totalTimeSpent: number;
    performanceScore: number;
  }>;
  compliance: {
    total: number;
    compliant: number;
    nonCompliant: number;
    pending: number;
    complianceRate: number;
  };
  monthlyProgress: Array<{
    month: string;
    enrollments: number;
  }>;
}

export default function CorporateAdminDashboard() {
  const [corporateClients, setCorporateClients] = useState<CorporateClient[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'analytics' | 'courses'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCorporateClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchAnalytics(selectedClient);
    }
  }, [selectedClient]);

  const fetchCorporateClients = async () => {
    try {
      const response = await fetch('/api/corporate/clients');
      const result = await response.json();
      if (result.success) {
        setCorporateClients(result.data);
        if (result.data.length > 0) {
          setSelectedClient(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching corporate clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (clientId: string) => {
    try {
      const response = await fetch(`/api/corporate/analytics?corporateClientId=${clientId}`);
      const result = await response.json();
      if (result.success) {
        setAnalyticsData(result.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const filteredClients = corporateClients.filter(client => {
    const matchesSearch = client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-8 h-8" style={{ color }} />
        </div>
      </div>
    </div>
  );

  const ComplianceCard = () => {
    if (!analyticsData) return null;
    
    const { compliance } = analyticsData;
    const compliancePercentage = compliance.complianceRate;

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Status</h3>
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Compliance Rate</span>
            <span className="font-semibold">{compliancePercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${compliancePercentage}%` }}
            ></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{compliance.compliant}</div>
            <div className="text-sm text-gray-600">Compliant</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{compliance.nonCompliant}</div>
            <div className="text-sm text-gray-600">Non-Compliant</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{compliance.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Corporate Admin Dashboard</h1>
                <p className="text-gray-600">Manage enterprise training programs</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {corporateClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-5 h-5 mr-2 inline" />
                Add Client
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'clients', label: 'Clients', icon: Building2 },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'courses', label: 'Courses', icon: BookOpen }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analyticsData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Employees"
                value={analyticsData.overview.totalEmployees}
                icon={Users}
                color="#3B82F6"
                subtitle="Registered users"
              />
              <StatCard
                title="Active Learners"
                value={analyticsData.overview.activeEmployees}
                icon={Activity}
                color="#10B981"
                subtitle="Currently enrolled"
              />
              <StatCard
                title="Courses Available"
                value={analyticsData.overview.totalCourses}
                icon={BookOpen}
                color="#8B5CF6"
                subtitle="Training programs"
              />
              <StatCard
                title="Completion Rate"
                value={`${analyticsData.overview.averageCompletionRate}%`}
                icon={Target}
                color="#F59E0B"
                subtitle="Average progress"
              />
            </div>

            {/* Training Hours & Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatCard
                title="Total Training Hours"
                value={Math.round(analyticsData.overview.totalTrainingHours / 60)}
                icon={Clock}
                color="#EF4444"
                subtitle="Hours completed"
              />
              <ComplianceCard />
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Top Performers</h3>
                <Award className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="space-y-4">
                {analyticsData.topPerformers.slice(0, 5).map((performer, index) => (
                  <div key={performer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {performer.firstName} {performer.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {performer.department} • {performer.role}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{performer.performanceScore}</div>
                      <div className="text-sm text-gray-600">Performance Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {/* Clients Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="w-8 h-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{client.companyName}</div>
                              <div className="text-sm text-gray-500">{client.companySize}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{client.contactPerson}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.industry}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {client.subscriptionPlan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client._count.employees}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            client.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Settings className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analyticsData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Breakdown */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
                <div className="space-y-3">
                  {analyticsData.departmentStats.map((dept) => (
                    <div key={dept.department} className="flex items-center justify-between">
                      <span className="text-gray-700">{dept.department}</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(dept.employeeCount / analyticsData.overview.totalEmployees) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{dept.employeeCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Progress */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Enrollments</h3>
                <div className="space-y-3">
                  {analyticsData.monthlyProgress.slice(-6).map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-gray-700">
                        {new Date(month.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-sm font-medium text-blue-600">{month.enrollments}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Corporate Training Courses</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-5 h-5 mr-2 inline" />
                Create Course
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first corporate training course.</p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Create First Course
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}