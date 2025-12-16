"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Send
} from "lucide-react";

interface DisputeData {
  id: string;
  type: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  resolvedAt?: Date;
}

interface DisputeResponse {
  id: string;
  response: string;
  timestamp: Date;
  responderId: string;
}

export function DisputeManager() {
  const [disputes, setDisputes] = useState<DisputeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDispute, setNewDispute] = useState({
    type: 'payment',
    subject: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketplace/disputes', {
        headers: { 'x-user-id': 'user-123' }
      });

      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
      }
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async () => {
    if (!newDispute.subject || !newDispute.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/marketplace/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-123'
        },
        body: JSON.stringify({
          action: 'create',
          type: newDispute.type,
          itemType: 'insight',
          itemId: 'sample-insight-id',
          subject: newDispute.subject,
          description: newDispute.description,
          priority: newDispute.priority,
          evidence: []
        })
      });

      if (response.ok) {
        alert('Dispute created successfully!');
        setShowCreateForm(false);
        setNewDispute({
          type: 'payment',
          subject: '',
          description: '',
          priority: 'medium'
        });
        loadDisputes();
      } else {
        const error = await response.json();
        alert(error?.error || 'Failed to create dispute');
      }
    } catch (error) {
      console.error('Create dispute error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'ESCALATED':
        return 'bg-red-100 text-red-800';
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'UNDER_REVIEW':
        return <Clock className="h-4 w-4" />;
      case 'ESCALATED':
        return <AlertTriangle className="h-4 w-4" />;
      case 'OPEN':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const summary = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'OPEN').length,
    underReview: disputes.filter(d => d.status === 'UNDER_REVIEW').length,
    resolved: disputes.filter(d => d.status === 'RESOLVED').length,
    escalated: disputes.filter(d => d.status === 'ESCALATED').length
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading disputes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-sm text-gray-600">Total Disputes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{summary.open}</p>
              <p className="text-sm text-gray-600">Open</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.underReview}</p>
              <p className="text-sm text-gray-600">Under Review</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{summary.escalated}</p>
              <p className="text-sm text-gray-600">Escalated</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{summary.resolved}</p>
              <p className="text-sm text-gray-600">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dispute Management</CardTitle>
              <CardDescription>Manage and track your disputes</CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Dispute
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <Card className="mb-6 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Create New Dispute</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Dispute Type</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={newDispute.type}
                      onChange={(e) => setNewDispute({...newDispute, type: e.target.value})}
                    >
                      <option value="payment">Payment Issue</option>
                      <option value="content">Content Quality</option>
                      <option value="performance">Performance Issue</option>
                      <option value="service">Service Issue</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={newDispute.priority}
                      onChange={(e) => setNewDispute({...newDispute, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input 
                    placeholder="Brief description of the issue"
                    value={newDispute.subject}
                    onChange={(e) => setNewDispute({...newDispute, subject: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    placeholder="Detailed description of the issue and what you'd like us to do"
                    value={newDispute.description}
                    onChange={(e) => setNewDispute({...newDispute, description: e.target.value})}
                    rows={4}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={handleCreateDispute}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Dispute
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {disputes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No disputes found</p>
              <p className="text-sm">Create a dispute if you have an issue with a purchase</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <Card key={dispute.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{dispute.subject}</h3>
                          <Badge className={getStatusColor(dispute.status)}>
                            {getStatusIcon(dispute.status)}
                            <span className="ml-1">{dispute.status.replace(/_/g, ' ')}</span>
                          </Badge>
                          <Badge className={getPriorityColor(dispute.priority)}>
                            {dispute.priority} priority
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-2">{dispute.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Type: {dispute.type.replace(/_/g, ' ')}</span>
                          <span>Created: {formatTimeAgo(dispute.createdAt)}</span>
                          {dispute.resolvedAt && (
                            <span>Resolved: {formatTimeAgo(dispute.resolvedAt)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Respond
                        </Button>
                        {dispute.status !== 'RESOLVED' && (
                          <Button variant="outline" size="sm">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Escalate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}