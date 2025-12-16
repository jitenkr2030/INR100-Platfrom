"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Share2, 
  Heart, 
  Plus,
  Search,
  Filter,
  Star,
  Target,
  Trophy,
  Calendar,
  BarChart3,
  Copy,
  UserPlus,
  UserCheck,
  ThumbsUp,
  MessageCircle,
  Share,
  MoreHorizontal,
  Eye,
  Award,
  Zap,
  Send,
  Bell,
  Settings,
  LogOut,
  UserX,
  Crown,
  Shield,
  Flag,
  Bookmark,
  Edit,
  Trash2,
  Pin,
  Lock,
  Globe,
  Group,
  Hash,
  AtSign,
  Image,
  FileText,
  Video,
  Paperclip,
  Smile,
  Gift,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  Phone,
  Video as VideoCall,
  MoreVertical,
  UserMinus,
  UserCog,
  Ban,
  RefreshCw
} from "lucide-react";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real-time state
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Posts state
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState("discussion");
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<{ [postId: string]: any[] }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const [commentContent, setCommentContent] = useState<{ [postId: string]: string }>({});
  
  // Following state
  const [followSuggestions, setFollowSuggestions] = useState<any[]>([]);
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
  
  // Messaging state
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [showMessages, setShowMessages] = useState(false);
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});
  
  // Groups state
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  
  // User state
  const [currentUser] = useState({
    id: "user_current",
    username: "current_user",
    displayName: "Current User",
    avatar: "/avatars/current.jpg",
    verified: false,
    level: 5
  });
  
  // Moderation state
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  
  // WebSocket connection
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadNotifications();
    loadPosts();
    loadFollowSuggestions();
    loadConversations();
    loadGroups();
    if (activeTab === 'groups') {
      loadMyGroups();
    }
  }, [activeTab]);

  const connectWebSocket = () => {
    try {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-domain.com/ws/community'
        : 'ws://localhost:8080';
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Authenticate user
        ws.send(JSON.stringify({
          type: 'authenticate',
          data: { userId: currentUser.id }
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!isConnected) {
            connectWebSocket();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'notification':
        handleNewNotification(message.data);
        break;
      case 'message':
        handleNewMessage(message.data);
        break;
      case 'post_update':
        handlePostUpdate(message.data);
        break;
      case 'comment':
        handleNewComment(message.data);
        break;
      case 'typing':
        handleTypingIndicator(message.data);
        break;
      case 'follow_update':
        handleFollowUpdate(message.data);
        break;
      case 'group_update':
        handleGroupUpdate(message.data);
        break;
      case 'online_status':
        handleOnlineStatus(message.data);
        break;
      default:
        console.log('Unknown WebSocket message:', message);
    }
  };

  const handleNewNotification = (data: any) => {
    setNotifications(prev => [data.notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const handleNewMessage = (data: any) => {
    if (selectedConversation && data.senderId === selectedConversation.participants.find((p: any) => p.id !== currentUser.id)?.id) {
      setMessages(prev => [...prev, data.message]);
    }
    // Update conversation list
    setConversations(prev => prev.map(conv => 
      conv.id === data.conversationId 
        ? { ...conv, lastMessage: data.message, unreadCount: conv.unreadCount + 1 }
        : conv
    ));
  };

  const handlePostUpdate = (data: any) => {
    setPosts(prev => prev.map(post => 
      post.id === data.postId 
        ? { ...post, ...data.update }
        : post
    ));
  };

  const handleNewComment = (data: any) => {
    setComments(prev => ({
      ...prev,
      [data.postId]: [...(prev[data.postId] || []), data.comment]
    }));
    // Update post comment count
    setPosts(prev => prev.map(post => 
      post.id === data.postId 
        ? { ...post, comments: post.comments + 1 }
        : post
    ));
  };

  const handleTypingIndicator = (data: any) => {
    if (data.senderId !== currentUser.id) {
      setIsTyping(prev => ({
        ...prev,
        [data.senderId]: data.isTyping
      }));
      // Clear typing indicator after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setIsTyping(prev => ({
            ...prev,
            [data.senderId]: false
          }));
        }, 3000);
      }
    }
  };

  const handleFollowUpdate = (data: any) => {
    if (data.followingId === currentUser.id) {
      // Someone followed/unfollowed current user
      loadFollowSuggestions(); // Refresh suggestions
    }
  };

  const handleGroupUpdate = (data: any) => {
    // Handle group-related updates
    loadMyGroups();
  };

  const handleOnlineStatus = (data: any) => {
    // Update user online status in conversations and suggestions
    setConversations(prev => prev.map(conv => ({
      ...conv,
      participants: conv.participants.map((p: any) => 
        p.id === data.userId ? { ...p, online: data.isOnline } : p
      )
    })));
  };

  // Data loading functions
  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/community/notifications?limit=10');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const response = await fetch(`/api/community/posts?type=feed&limit=20`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const loadFollowSuggestions = async () => {
    try {
      const response = await fetch('/api/community/following?action=suggestions');
      const data = await response.json();
      if (data.success) {
        setFollowSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to load follow suggestions:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/community/messages?action=conversations');
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/community/messages?action=messages&conversationId=${conversationId}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/community/groups?action=groups&type=public&limit=20');
      const data = await response.json();
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadMyGroups = async () => {
    try {
      const response = await fetch('/api/community/groups?action=myGroups');
      const data = await response.json();
      if (data.success) {
        setMyGroups(data.groups);
      }
    } catch (error) {
      console.error('Failed to load my groups:', error);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/comments?postId=${postId}`);
      const data = await response.json();
      if (data.success) {
        setComments(prev => ({
          ...prev,
          [postId]: data.comments
        }));
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  // Action handlers
  const createPost = async () => {
    if (!postContent.trim()) return;

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent,
          type: postType,
          tags: extractTags(postContent),
          mentions: extractMentions(postContent),
          visibility: 'public'
        })
      });

      const data = await response.json();
      if (data.success) {
        setPosts(prev => [data.post, ...prev]);
        setPostContent("");
        setShowCreatePost(false);
        
        // Subscribe to real-time updates for this post
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            data: { subscriptions: [data.post.id] }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const likePost = async (postId: string) => {
    try {
      const response = await fetch('/api/community/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          action: 'like',
          data: { userId: currentUser.id }
        })
      });

      const data = await response.json();
      if (data.success) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: data.post.likes, isLiked: data.post.isLiked }
            : post
        ));
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const commentOnPost = async (postId: string) => {
    const content = commentContent[postId];
    if (!content?.trim()) return;

    try {
      const response = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content,
          mentions: extractMentions(content)
        })
      });

      const data = await response.json();
      if (data.success) {
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }));
        setCommentContent(prev => ({ ...prev, [postId]: '' }));
        
        // Update post comment count
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, comments: post.comments + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Failed to comment on post:', error);
    }
  };

  const followUser = async (userId: string) => {
    try {
      const response = await fetch('/api/community/following', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          action: 'follow'
        })
      });

      const data = await response.json();
      if (data.success) {
        setFollowingUsers(prev => [...prev, userId]);
        setFollowSuggestions(prev => prev.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const sendMessage = async (recipientId: string) => {
    if (!messageContent.trim()) return;

    try {
      const response = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          data: {
            recipientId,
            content: messageContent,
            type: 'text'
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setMessageContent("");
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      const response = await fetch('/api/community/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          data: { groupId }
        })
      });

      const data = await response.json();
      if (data.success) {
        setGroups(prev => prev.map(group => 
          group.id === groupId 
            ? { ...group, isJoined: true, memberCount: group.memberCount + 1 }
            : group
        ));
        
        if (data.status === 'pending') {
          setGroups(prev => prev.map(group => 
            group.id === groupId 
              ? { ...group, isPending: true }
              : group
          ));
        }
      }
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  const reportContent = async (contentType: string, contentId: string, reason: string) => {
    try {
      const response = await fetch('/api/community/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          data: {
            contentType,
            contentId,
            reason,
            description: `Reported ${contentType} ${contentId}`
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Content reported successfully');
      }
    } catch (error) {
      console.error('Failed to report content:', error);
    }
  };

  // Helper functions
  const extractTags = (content: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);
    return matches ? matches.map(mention => mention.slice(1)) : [];
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Mock data for backward compatibility (will be replaced by API calls)
  const expertInvestors = followSuggestions.length > 0 ? followSuggestions : [
    {
      id: "1",
      name: "Dr. Ananya Sharma",
      username: "@ananya_sharma",
      avatar: "/avatars/expert1.jpg",
      bio: "CFP | 15+ years experience | Specialized in equity research",
      followers: 15420,
      following: 892,
      portfolioValue: 2500000,
      returns: 28.5,
      isFollowing: followingUsers.includes("1"),
      expertise: ["Equity Research", "Financial Planning", "Risk Management"],
      verified: true
    }
  ];

  const communityChallenges = [
    {
      id: "1",
      title: "₹100 to ₹1000 Challenge",
      description: "Turn ₹100 into ₹1000 through smart investing in 30 days",
      participants: 15420,
      daysLeft: 15,
      prizePool: "₹50,000",
      difficulty: "Medium",
      icon: Target
    },
    {
      id: "2",
      title: "SIP Marathon",
      description: "Maintain active SIP for 90 consecutive days",
      participants: 8900,
      daysLeft: 45,
      prizePool: "₹25,000",
      difficulty: "Easy",
      icon: TrendingUp
    }
  ];

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Low": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Very High": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "analysis": return "bg-blue-100 text-blue-800";
      case "achievement": return "bg-green-100 text-green-800";
      case "question": return "bg-purple-100 text-purple-800";
      case "educational": return "bg-orange-100 text-orange-800";
      case "discussion": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    
    if (!comments[postId]) {
      loadComments(postId);
    }
  };

  const handleTyping = (conversationId: string, isTyping: boolean) => {
    if (wsRef.current) {
      const recipient = selectedConversation?.participants.find((p: any) => p.id !== currentUser.id);
      if (recipient) {
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          data: {
            recipientId: recipient.id,
            isTyping
          }
        }));
      }
    }
  };

  return (
    <DashboardLayout user={{
      name: currentUser.displayName,
      email: `${currentUser.username}@example.com`,
      avatar: currentUser.avatar,
      level: currentUser.level,
      xp: 2500,
      nextLevelXp: 3000,
      walletBalance: 15000,
      notifications: unreadCount
    }}>
      <div className="space-y-6">
        {/* Enhanced Header with Real-time Status */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <span>Investing Community</span>
              <Badge className={`${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </h1>
            <p className="text-gray-600 mt-1">
              Connect with fellow investors, follow experts, share insights, and build your network
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={() => setShowMessages(!showMessages)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
              {conversations.some(conv => conv.unreadCount > 0) && (
                <Badge className="ml-2 bg-red-500 text-white">
                  {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
                </Badge>
              )}
            </Button>
            
            <Button variant="outline" onClick={() => setShowCreatePost(!showCreatePost)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
            
            <Button variant="outline" onClick={() => setShowModerationPanel(!showModerationPanel)}>
              <Shield className="h-4 w-4 mr-2" />
              Moderate
            </Button>
          </div>
        </div>

        {/* Community Stats with Real-time Data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">50K+</div>
              <div className="text-sm text-gray-600">Active Investors</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">500+</div>
              <div className="text-sm text-gray-600">Expert Investors</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{posts.length}+</div>
              <div className="text-sm text-gray-600">Live Posts</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{conversations.length}</div>
              <div className="text-sm text-gray-600">Conversations</div>
            </CardContent>
          </Card>
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
              <CardDescription>Share your investment insights with the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Avatar>
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.displayName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <Textarea
                    placeholder="What's on your mind about investing?"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button
                        variant={postType === "analysis" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPostType("analysis")}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analysis
                      </Button>
                      <Button
                        variant={postType === "achievement" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPostType("achievement")}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Achievement
                      </Button>
                      <Button
                        variant={postType === "question" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPostType("question")}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Question
                      </Button>
                      <Button
                        variant={postType === "discussion" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPostType("discussion")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Discussion
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Image className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                      <Button 
                        onClick={createPost}
                        disabled={!postContent.trim()}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content with Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="feed">Community Feed</TabsTrigger>
            <TabsTrigger value="experts">Expert Investors</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            {isLoadingPosts ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2">Loading posts...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback>
                            {post.author.displayName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{post.author.displayName}</span>
                                <span className="text-gray-600">@{post.author.username}</span>
                                {post.author.verified && (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                                {post.author.level >= 5 && (
                                  <Badge className="bg-purple-100 text-purple-800">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Level {post.author.level}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <span>{formatTimeAgo(post.createdAt)}</span>
                                <span>•</span>
                                <span className="capitalize">{post.visibility}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Post Options</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-2">
                                    <Button variant="outline" className="w-full justify-start">
                                      <Bookmark className="h-4 w-4 mr-2" />
                                      Save Post
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start">
                                      <Flag className="h-4 w-4 mr-2" />
                                      Report Post
                                    </Button>
                                    {post.authorId === currentUser.id && (
                                      <>
                                        <Button variant="outline" className="w-full justify-start">
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Post
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Post
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          
                          <p className="text-gray-900 mb-3 whitespace-pre-wrap">{post.content}</p>
                          
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {post.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs hover:bg-blue-50 cursor-pointer">
                                  <Hash className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={`text-gray-600 hover:text-blue-600 ${post.isLiked ? 'text-blue-600' : ''}`}
                                onClick={() => likePost(post.id)}
                              >
                                <ThumbsUp className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                                {post.likes}
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-600 hover:text-green-600"
                                onClick={() => toggleComments(post.id)}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                {post.comments}
                              </Button>
                              
                              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600">
                                <Share className="h-4 w-4 mr-1" />
                                {post.shares}
                              </Button>
                              
                              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-600">
                                <Eye className="h-4 w-4 mr-1" />
                                {post.views}
                              </Button>
                            </div>
                            
                            <Badge className={getPostTypeColor(post.type)}>
                              {post.type}
                            </Badge>
                          </div>
                          
                          {/* Comments Section */}
                          {showComments[post.id] && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="space-y-3 mb-4">
                                {comments[post.id]?.map((comment) => (
                                  <div key={comment.id} className="flex space-x-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={comment.author.avatar} />
                                      <AvatarFallback>
                                        {comment.author.displayName.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="font-medium text-sm">{comment.author.displayName}</span>
                                          {comment.author.verified && (
                                            <CheckCircle className="h-3 w-3 text-blue-600" />
                                          )}
                                          <span className="text-xs text-gray-500">
                                            {formatTimeAgo(comment.createdAt)}
                                          </span>
                                        </div>
                                        <p className="text-sm">{comment.content}</p>
                                      </div>
                                      <div className="flex items-center space-x-4 mt-2">
                                        <Button variant="ghost" size="sm" className="text-xs">
                                          <ThumbsUp className="h-3 w-3 mr-1" />
                                          {comment.likes}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-xs">
                                          Reply
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Comment Input */}
                              <div className="flex space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={currentUser.avatar} />
                                  <AvatarFallback>
                                    {currentUser.displayName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex space-x-2">
                                  <Input
                                    placeholder="Write a comment..."
                                    value={commentContent[post.id] || ''}
                                    onChange={(e) => setCommentContent(prev => ({
                                      ...prev,
                                      [post.id]: e.target.value
                                    }))}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        commentOnPost(post.id);
                                      }
                                    }}
                                    className="flex-1"
                                  />
                                  <Button 
                                    size="sm"
                                    onClick={() => commentOnPost(post.id)}
                                    disabled={!commentContent[post.id]?.trim()}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {posts.length === 0 && (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No posts yet</h3>
                      <p className="text-gray-600 mb-4">
                        Be the first to share your investment insights with the community!
                      </p>
                      <Button onClick={() => setShowCreatePost(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Post
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Enhanced Expert Investors Tab */}
          <TabsContent value="experts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expertInvestors.map((expert) => (
                <Card key={expert.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={expert.avatar} />
                        <AvatarFallback>
                          {expert.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-1">
                          <h3 className="font-medium">{expert.name}</h3>
                          {expert.verified && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">@{expert.username}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Level {expert.level || 5}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{expert.bio}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <div className="text-gray-600">Followers</div>
                        <div className="font-medium">{expert.followers?.toLocaleString() || '0'}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Returns</div>
                        <div className="font-medium text-green-600">+{expert.returns || 0}%</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="text-xs text-gray-600">Expertise:</div>
                      <div className="flex flex-wrap gap-1">
                        {(expert.expertise || []).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1" 
                        variant={expert.isFollowing ? "outline" : "default"}
                        onClick={() => followUser(expert.id)}
                        disabled={expert.isFollowing}
                      >
                        {expert.isFollowing ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="icon">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversations List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                          selectedConversation?.id === conversation.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-transparent'
                        }`}
                        onClick={() => {
                          setSelectedConversation(conversation);
                          loadMessages(conversation.id);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={conversation.participants.find(p => p.id !== currentUser.id)?.avatar} />
                              <AvatarFallback>
                                {conversation.participants.find(p => p.id !== currentUser.id)?.displayName?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {conversation.participants.find(p => p.id !== currentUser.id)?.online && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {conversation.participants.find(p => p.id !== currentUser.id)?.displayName || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTimeAgo(conversation.updatedAt)}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-blue-500 text-white">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="lg:col-span-2">
                {selectedConversation ? (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={selectedConversation.participants.find(p => p.id !== currentUser.id)?.avatar} />
                            <AvatarFallback>
                              {selectedConversation.participants.find(p => p.id !== currentUser.id)?.displayName?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {selectedConversation.participants.find(p => p.id !== currentUser.id)?.displayName || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedConversation.participants.find(p => p.id !== currentUser.id)?.online ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <VideoCall className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      {/* Messages */}
                      <div className="h-96 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === currentUser.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p>{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.senderId === currentUser.id ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTimeAgo(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {/* Typing Indicator */}
                        {Object.values(isTyping).some(typing => typing) && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg px-4 py-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Message Input */}
                      <div className="border-t p-4">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Type a message..."
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const recipient = selectedConversation.participants.find(p => p.id !== currentUser.id);
                                if (recipient) {
                                  sendMessage(recipient.id);
                                }
                              }
                            }}
                            onFocus={() => handleTyping(selectedConversation.id, true)}
                            onBlur={() => handleTyping(selectedConversation.id, false)}
                            className="flex-1"
                          />
                          <Button 
                            onClick={() => {
                              const recipient = selectedConversation.participants.find(p => p.id !== currentUser.id);
                              if (recipient) {
                                sendMessage(recipient.id);
                              }
                            }}
                            disabled={!messageContent.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Select a conversation</h3>
                      <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Community Groups</h2>
              <Button onClick={() => setShowCreateGroup(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeTab === 'groups' ? [...groups, ...myGroups] : groups).map((group) => (
                <Card key={group.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={group.avatar} />
                        <AvatarFallback>{group.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{group.name}</h3>
                          {group.type === 'private' ? (
                            <Lock className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Globe className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{group.category}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-600">
                        <Users className="h-4 w-4 inline mr-1" />
                        {group.memberCount?.toLocaleString() || 0} members
                      </div>
                      <div className="flex space-x-1">
                        {(group.tags || []).slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      variant={group.isJoined ? "outline" : "default"}
                      disabled={group.isPending}
                      onClick={() => joinGroup(group.id)}
                    >
                      {group.isPending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          Pending Approval
                        </>
                      ) : group.isJoined ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Joined
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Join Group
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Notifications</h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={loadNotifications}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  Mark All Read
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card key={notification.id} className={`border-l-4 ${
                  notification.read ? 'border-transparent' : 'border-blue-500 bg-blue-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        notification.type === 'like' ? 'bg-red-100' :
                        notification.type === 'comment' ? 'bg-blue-100' :
                        notification.type === 'follow' ? 'bg-green-100' :
                        notification.type === 'mention' ? 'bg-purple-100' :
                        'bg-gray-100'
                      }`}>
                        {notification.type === 'like' && <Heart className="h-4 w-4" />}
                        {notification.type === 'comment' && <MessageCircle className="h-4 w-4" />}
                        {notification.type === 'follow' && <UserPlus className="h-4 w-4" />}
                        {notification.type === 'mention' && <AtSign className="h-4 w-4" />}
                        {notification.type === 'achievement' && <Award className="h-4 w-4" />}
                        {notification.type === 'message' && <MessageSquare className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {notifications.length === 0 && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No notifications</h3>
                    <p className="text-gray-600">You're all caught up!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {communityChallenges.map((challenge) => (
                <Card key={challenge.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
                        <challenge.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-medium">{challenge.title}</h3>
                        <Badge className={getDifficultyColor(challenge.difficulty)}>
                          {challenge.difficulty}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <div className="text-gray-600">Participants</div>
                        <div className="font-medium">{challenge.participants.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Days Left</div>
                        <div className="font-medium text-orange-600">{challenge.daysLeft}</div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="text-sm font-medium text-yellow-800 mb-1">Prize Pool</div>
                      <div className="text-lg font-bold text-yellow-900">{challenge.prizePool}</div>
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      Join Challenge
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}