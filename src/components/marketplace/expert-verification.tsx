"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle,
  Upload,
  FileText,
  User,
  Award,
  TrendingUp,
  DollarSign,
  RefreshCw
} from "lucide-react";

interface ExpertProfile {
  id: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isVerified: boolean;
  appliedAt: Date;
  verifiedAt?: Date;
  credentials: any;
  specializations: string[];
}

interface ExpertStats {
  portfolioTemplates: number;
  totalPortfolioCopies: number;
  insights: number;
  totalInsightPurchases: number;
  newsletters: number;
  totalNewsletterSubscribers: number;
  totalEarnings: number;
  averageRating: number;
  totalRatings: number;
}

export function ExpertVerification() {
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    name: '',
    qualification: '',
    experience: '',
    specializations: '',
    description: '',
    documents: [] as File[]
  });

  useEffect(() => {
    loadExpertProfile();
  }, []);

  const loadExpertProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketplace/expert-verification?includeStats=true', {
        headers: { 'x-user-id': 'user-123' }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.expertProfile);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load expert profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVerification = async () => {
    if (!applicationData.name || !applicationData.qualification || !applicationData.experience) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/marketplace/expert-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-123'
        },
        body: JSON.stringify({
          action: 'apply',
          credentials: {
            name: applicationData.name,
            qualification: applicationData.qualification,
            experience: applicationData.experience
          },
          documents: [], // File upload would be handled separately
          experience: {
            years: applicationData.experience,
            description: applicationData.description
          },
          specializations: applicationData.specializations.split(',').map(s => s.trim())
        })
      });

      if (response.ok) {
        alert('Verification application submitted successfully!');
        setShowApplicationForm(false);
        setApplicationData({
          name: '',
          qualification: '',
          experience: '',
          specializations: '',
          description: '',
          documents: []
        });
        loadExpertProfile();
      } else {
        const error = await response.json();
        alert(error?.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading expert profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <CardTitle>Expert Verification</CardTitle>
            </div>
            {profile && (
              <Badge className={getStatusColor(profile.status)}>
                {getStatusIcon(profile.status)}
                <span className="ml-1">{profile.status}</span>
              </Badge>
            )}
          </div>
          <CardDescription>
            {profile?.isVerified 
              ? "You are a verified expert. You can now sell your expertise on the marketplace."
              : "Apply to become a verified expert and start earning from your financial knowledge."
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Portfolio Templates</p>
                  <p className="text-xl font-bold">{stats.portfolioTemplates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Copies</p>
                  <p className="text-xl font-bold">{stats.totalPortfolioCopies}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-xl font-bold">{stats.averageRating.toFixed(1)}/5.0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Verification Requirements */}
      {stats?.verificationStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Requirements</CardTitle>
            <CardDescription>Requirements to become a verified expert</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Minimum Rating: 4.0/5.0</span>
                </div>
                <Badge variant={stats.averageRating >= 4.0 ? "default" : "destructive"}>
                  {stats.averageRating.toFixed(1)}/5.0
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Minimum Earnings: ₹10,000</span>
                </div>
                <Badge variant={stats.totalEarnings >= 10000 ? "default" : "destructive"}>
                  {formatCurrency(stats.totalEarnings)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Form */}
      {!profile || profile.status === 'REJECTED' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Apply for Expert Verification</CardTitle>
                <CardDescription>Submit your credentials to become a verified expert</CardDescription>
              </div>
              <Button 
                onClick={() => setShowApplicationForm(!showApplicationForm)}
                disabled={profile?.status === 'PENDING'}
              >
                {showApplicationForm ? 'Cancel' : 'Apply Now'}
              </Button>
            </div>
          </CardHeader>
          {showApplicationForm && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input 
                    placeholder="Your full name"
                    value={applicationData.name}
                    onChange={(e) => setApplicationData({...applicationData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Qualification *</label>
                  <Input 
                    placeholder="e.g., CA, CFA, MBA Finance"
                    value={applicationData.qualification}
                    onChange={(e) => setApplicationData({...applicationData, qualification: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Years of Experience *</label>
                <Input 
                  placeholder="e.g., 5 years"
                  value={applicationData.experience}
                  onChange={(e) => setApplicationData({...applicationData, experience: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Specializations</label>
                <Input 
                  placeholder="e.g., Equity Research, Portfolio Management, Mutual Funds (comma separated)"
                  value={applicationData.specializations}
                  onChange={(e) => setApplicationData({...applicationData, specializations: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Professional Description</label>
                <Textarea 
                  placeholder="Describe your background and expertise..."
                  value={applicationData.description}
                  onChange={(e) => setApplicationData({...applicationData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Upload Documents</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Upload qualification certificates, experience letters, etc.</p>
                  <Button variant="outline" className="mt-2">
                    Choose Files
                  </Button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleApplyVerification}>
                  Submit Application
                </Button>
                <Button variant="outline" onClick={() => setShowApplicationForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      ) : profile.status === 'PENDING' ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-lg font-semibold mb-2">Application Under Review</h3>
            <p className="text-gray-600 mb-4">
              Your verification application is being reviewed by our team. 
              You'll be notified once the review is complete.
            </p>
            <p className="text-sm text-gray-500">
              Applied on: {profile.appliedAt.toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}