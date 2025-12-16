"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Play, 
  Clock, 
  Star, 
  Trophy, 
  Target, 
  CheckCircle,
  TrendingUp,
  Lightbulb,
  Award,
  Users,
  Search,
  Lock,
  Unlock,
  Calendar,
  BarChart3,
  Brain,
  Briefcase,
  TrendingUp as TrendUp,
  Shield,
  AlertTriangle,
  PieChart,
  Heart,
  DollarSign,
  GraduationCap,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Scale,
  ShieldCheck,
  AlertCircle,
  Calculator,
  Home,
  PiggyBank,
  CreditCard,
  Umbrella,
  Target as TargetIcon,
  CheckSquare,
  XCircle,
  TrendingDown,
  Zap,
  Timer,
  Filter,
  Plus,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon
} from "lucide-react";

export default function LearnPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("categories");
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Course categories for fallback display
  const courseCategories = [
    {
      id: "stock-foundations",
      title: "Stock Market Foundations",
      description: "Beginner friendly introduction to stock market basics",
      icon: TrendingUp,
      color: "bg-blue-100 text-blue-600",
      level: "beginner",
      duration: "2-3 hours",
      lessons: 10,
      topics: [
        "How the stock market works",
        "Primary market vs. secondary market",
        "What is an IPO?",
        "What are market indices? (NIFTY, Sensex)",
        "Market cycles: bull vs. bear",
        "Understanding dividends",
        "Market cap: small-cap, mid-cap, large-cap",
        "What are blue-chip companies?",
        "What is liquidity?",
        "What is market depth?"
      ],
      isEnrolled: true,
      progress: 60,
      xpReward: 150,
      importance: "high"
    },
    {
      id: "mutual-funds",
      title: "Mutual Funds Deep Dive",
      description: "Comprehensive guide to mutual fund investing",
      icon: PieChart,
      color: "bg-green-100 text-green-600",
      level: "intermediate",
      duration: "3-4 hours",
      lessons: 10,
      topics: [
        "Types of mutual funds (Equity, Debt, Hybrid)",
        "Index funds vs. active funds",
        "How NAV works",
        "What is expense ratio?",
        "How mutual funds generate returns",
        "Direct plan vs. regular plan",
        "What is a fund manager?",
        "How to read a factsheet",
        "AUM and why it matters",
        "What is STP (Systematic Transfer Plan)?",
        "What is SWP (Systematic Withdrawal Plan)?"
      ],
      isEnrolled: false,
      progress: 0,
      xpReward: 200,
      importance: "high"
    },
    {
      id: "sip-wealth",
      title: "SIP & Wealth Building",
      description: "Master systematic investment and wealth creation",
      icon: PiggyBank,
      color: "bg-purple-100 text-purple-600",
      level: "beginner",
      duration: "2-3 hours",
      lessons: 9,
      topics: [
        "SIP vs Lump-sum: pros & cons",
        "Power of compounding explained",
        "SIP return calculation",
        "SIP myths & facts",
        "How long-term compounding works",
        "How to set financial goals",
        "What is asset allocation?",
        "How to create a simple long-term portfolio",
        "Rebalancing: what, why, when"
      ],
      isEnrolled: true,
      progress: 30,
      xpReward: 175,
      importance: "high"
    },
    {
      id: "behavioral-finance",
      title: "Behavioral Finance / Psychology",
      description: "Understanding the psychology of investing",
      icon: Brain,
      color: "bg-orange-100 text-orange-600",
      level: "intermediate",
      duration: "1-2 hours",
      lessons: 5,
      topics: [
        "Common mental biases in investing",
        "FOMO, panic selling & herd mentality",
        "Emotional control in markets",
        "How to build discipline",
        "The cost of reaction vs. patience"
      ],
      isEnrolled: false,
      progress: 0,
      xpReward: 125,
      importance: "medium"
    },
    {
      id: "risk-management",
      title: "Risk Management & Safety",
      description: "Learn to protect your investments",
      icon: Shield,
      color: "bg-red-100 text-red-600",
      level: "beginner",
      duration: "2-3 hours",
      lessons: 7,
      topics: [
        "What is volatility?",
        "How to measure risk",
        "What is drawdown?",
        "Diversification basics",
        "Debt funds vs equity funds risk levels",
        "Emergency fund basics",
        "Insurance vs investment (important difference)"
      ],
      isEnrolled: true,
      progress: 45,
      xpReward: 150,
      importance: "high"
    },
    {
      id: "scam-awareness",
      title: "Scam Awareness",
      description: "VERY IMPORTANT - Protect yourself from fraud",
      icon: AlertTriangle,
      color: "bg-yellow-100 text-yellow-800",
      level: "beginner",
      duration: "1-2 hours",
      lessons: 7,
      topics: [
        "Recognizing stock market fraud",
        "Pump-and-dump schemes",
        "WhatsApp/Telegram tip scams",
        "How to verify brokers",
        "Fake websites & phishing",
        "How to identify Ponzi schemes",
        "Safe investing habits for beginners"
      ],
      isEnrolled: true,
      progress: 80,
      xpReward: 100,
      importance: "critical"
    },
    {
      id: "options-basics",
      title: "Options (Educational Only)",
      description: "SEBI Safe - For education purposes only",
      icon: Calculator,
      color: "bg-indigo-100 text-indigo-600",
      level: "advanced",
      duration: "2-3 hours",
      lessons: 6,
      topics: [
        "What is an option? (Call & Put)",
        "How option premiums work",
        "Why 90% people lose in options",
        "Time decay (Theta) explained",
        "How option price changes",
        "Why beginners should avoid trading options"
      ],
      isEnrolled: false,
      progress: 0,
      xpReward: 200,
      importance: "medium",
      warning: "For educational purposes only - Not trading advice"
    },
    {
      id: "personal-finance",
      title: "Basics of Personal Finance",
      description: "Essential money management skills",
      icon: Home,
      color: "bg-teal-100 text-teal-600",
      level: "beginner",
      duration: "2-3 hours",
      lessons: 8,
      topics: [
        "Budgeting simple method",
        "Credit score basics",
        "Good debt vs bad debt",
        "Saving vs investing",
        "Tax-saving basics (ELSS, 80C)",
        "Why you need health insurance",
        "Building your first emergency fund",
        "How to plan for retirement early"
      ],
      isEnrolled: true,
      progress: 20,
      xpReward: 175,
      importance: "high"
    },
    {
      id: "financial-planning",
      title: "Beginners' Guide to Financial Planning",
      description: "Create your personal financial roadmap",
      icon: GraduationCap,
      color: "bg-pink-100 text-pink-600",
      level: "beginner",
      duration: "1-2 hours",
      lessons: 6,
      topics: [
        "How to create a 1-year money plan",
        "Simple rules for growing money",
        "How much to invest monthly",
        "How to avoid lifestyle inflation",
        "Tracking expenses effectively",
        "Creating money habits that stick"
      ],
      isEnrolled: false,
      progress: 0,
      xpReward: 125,
      importance: "high"
    }
  ];

  const learningPaths = [
    {
      id: "beginner-path",
      title: "Complete Beginner Path",
      description: "Start from zero and build strong foundations",
      categories: ["stock-foundations", "sip-wealth", "risk-management", "scam-awareness"],
      duration: "2-3 weeks",
      level: "beginner",
      totalXp: 575,
      icon: Star,
      color: "bg-green-100 text-green-600"
    },
    {
      id: "safety-first",
      title: "Safety First Path",
      description: "Learn to protect yourself and invest safely",
      categories: ["scam-awareness", "risk-management", "personal-finance"],
      duration: "1-2 weeks",
      level: "beginner",
      totalXp: 400,
      icon: ShieldCheck,
      color: "bg-blue-100 text-blue-600"
    },
    {
      id: "wealth-builder",
      title: "Wealth Builder Path",
      description: "Focus on long-term wealth creation",
      categories: ["sip-wealth", "mutual-funds", "financial-planning"],
      duration: "2-3 weeks",
      level: "intermediate",
      totalXp: 500,
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const achievements = [
    {
      id: "safety-first",
      title: "Safety First",
      description: "Complete Scam Awareness course",
      icon: ShieldCheck,
      isUnlocked: true,
      unlockedAt: "2024-01-15"
    },
    {
      id: "foundation-builder",
      title: "Foundation Builder",
      description: "Complete Stock Market Foundations",
      icon: Briefcase,
      isUnlocked: false,
      progress: 60
    },
    {
      id: "wealth-creator",
      title: "Wealth Creator",
      description: "Complete SIP & Wealth Building course",
      icon: PiggyBank,
      isUnlocked: false,
      progress: 30
    },
    {
      id: "knowledge-seeker",
      title: "Knowledge Seeker",
      description: "Complete 5 courses",
      icon: Brain,
      isUnlocked: false,
      progress: 2
    }
  ];

  const stats = {
    totalCategories: 9,
    completedCategories: 1,
    totalTopics: 78,
    completedTopics: 35,
    totalXp: 875,
    currentStreak: 5,
    learningHours: 18
  };

  const getFilteredCategories = () => {
    // Use API data if available, otherwise use fallback data
    const categoriesToFilter = courses.length > 0 ? courses : courseCategories;
    
    return categoriesToFilter.filter(category => {
      const matchesSearch = category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           category.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  };

  const CategoryCard = ({ category }: { category: any }) => {
    const handleEnrollClick = () => {
      router.push(`/learn/course/${category.id}`);
    };

    const getCourseIcon = (iconName: string) => {
      const icons: Record<string, any> = {
        TrendingUp,
        PieChart,
        PiggyBank,
        Brain,
        Shield,
        AlertTriangle,
        Calculator,
        Home,
        GraduationCap
      };
      return icons[iconName] || BookOpen;
    };

    const CourseIcon = getCourseIcon(category.icon);

    return (
      <Card 
        className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
        onClick={handleEnrollClick}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-3 rounded-lg ${category.color || 'bg-blue-100 text-blue-600'}`}>
                <CourseIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  {category.importance === "critical" && (
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      CRITICAL
                    </Badge>
                  )}
                  {category.importance === "high" && (
                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      IMPORTANT
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1">{category.description}</CardDescription>
              </div>
            </div>
            <Badge className={
              category.level === "beginner" ? "bg-green-100 text-green-800" :
              category.level === "intermediate" ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }>
              {category.level}
            </Badge>
          </div>
        </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Warning for Options course */}
          {category.warning && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">{category.warning}</p>
              </div>
            </div>
          )}

          {/* Course Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{category.duration || '2-3 hours'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>{category.lessons || 0} lessons</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4" />
                <span>{category.xpReward || 0} XP</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          {category.isEnrolled && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{category.progress}%</span>
              </div>
              <Progress value={category.progress} className="h-2" />
            </div>
          )}

          {/* Topics Preview */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Key Topics:</h4>
            <div className="grid grid-cols-1 gap-1">
              {category.topics.slice(0, 3).map((topic: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>{topic}</span>
                </div>
              ))}
              {category.topics.length > 3 && (
                <div className="text-xs text-blue-600 font-medium">
                  +{category.topics.length - 3} more topics
                </div>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="flex space-x-2">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handleEnrollClick();
              }}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              View Course
              <Play className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* XP Reward */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">XP Reward:</span>
            <Badge className="bg-purple-100 text-purple-800">
              +{category.xpReward || 0} XP
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout user={{
        name: "Rahul Sharma",
        email: "rahul.sharma@email.com",
        avatar: "/placeholder-avatar.jpg",
        level: 5,
        xp: 2500,
        nextLevelXp: 3000,
        walletBalance: 15000,
        notifications: 3
      }}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={{
      name: "Rahul Sharma",
      email: "rahul.sharma@email.com",
      avatar: "/placeholder-avatar.jpg",
      level: 5,
      xp: 2500,
      nextLevelXp: 3000,
      walletBalance: 15000,
      notifications: 3
    }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span>INR100 Learning Academy</span>
              <Badge className="bg-green-100 text-green-800">
                <Trophy className="h-3 w-3 mr-1" />
                Earn XP
              </Badge>
            </h1>
            <p className="text-gray-600 mt-1">
              Master investing with our comprehensive courses designed for INR100 users
            </p>
          </div>
          
          {/* Phase 2 & 3 Quick Access Buttons */}
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            {/* Phase 2 Features */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/learn/dashboard')}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/learn/achievements')}
              className="flex items-center space-x-2"
            >
              <Award className="h-4 w-4" />
              <span>Achievements</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/learn/leaderboard')}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Leaderboard</span>
            </Button>
            
            {/* Phase 3 Features */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/learn/multimedia')}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Multimedia</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/learn/learning-paths')}
              className="flex items-center space-x-2"
            >
              <TargetIcon className="h-4 w-4" />
              <span>Learning Paths</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/learn/community')}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Community</span>
            </Button>
          </div>
        </div>

        {/* Learning Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalCategories}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedCategories}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.completedTopics}/{stats.totalTopics}</div>
              <div className="text-sm text-gray-600">Topics</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalXp}</div>
              <div className="text-sm text-gray-600">Total XP</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.currentStreak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.learningHours}h</div>
              <div className="text-sm text-gray-600">Learning Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="categories">Courses</TabsTrigger>
            <TabsTrigger value="paths">Paths</TabsTrigger>
            <TabsTrigger value="multimedia">Multimedia</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            {/* Search */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search courses, topics, or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Course Categories Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredCategories().map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>

            {/* Critical Course Highlight */}
            <Card className="border-2 border-yellow-300 bg-yellow-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  <div>
                    <h3 className="font-bold text-yellow-800">🚨 Must Complete: Scam Awareness</h3>
                    <p className="text-yellow-700 text-sm">
                      This course is critical for your financial safety. Complete it before investing real money.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paths" className="space-y-6">
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
              {learningPaths.map((path) => (
                <Card key={path.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${path.color}`}>
                        <path.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{path.title}</CardTitle>
                        <CardDescription>{path.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{path.duration}</span>
                        </div>
                        <Badge className={
                          path.level === "beginner" ? "bg-green-100 text-green-800" :
                          path.level === "intermediate" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }>
                          {path.level}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Included Categories:</h4>
                        <div className="space-y-1">
                          {path.categories.map((catId: string) => {
                            const category = courseCategories.find(c => c.id === catId);
                            return category ? (
                              <div key={catId} className="flex items-center space-x-2 text-sm text-gray-600">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <span>{category.title}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total XP:</span>
                        <Badge className="bg-purple-100 text-purple-800">
                          +{path.totalXp} XP
                        </Badge>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                        Start Learning Path
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="multimedia" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Multimedia Content</span>
                </CardTitle>
                <CardDescription>
                  Access videos, audio lessons, documents, and interactive content to enhance your learning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">25</div>
                    <div className="text-sm text-gray-600">Videos</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">12</div>
                    <div className="text-sm text-gray-600">Audio Lessons</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">8</div>
                    <div className="text-sm text-gray-600">Documents</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">5</div>
                    <div className="text-sm text-gray-600">Interactive</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => router.push('/learn/multimedia')} 
                    className="flex items-center space-x-2"
                  >
                    <Play className="h-4 w-4" />
                    <span>Browse Multimedia</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/learn/multimedia/upload')} 
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Upload Content</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Community Hub</span>
                </CardTitle>
                <CardDescription>
                  Connect with fellow learners, join study groups, and participate in expert sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">45</div>
                    <div className="text-sm text-gray-600">Discussions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">8</div>
                    <div className="text-sm text-gray-600">Study Groups</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">3</div>
                    <div className="text-sm text-gray-600">Expert Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">156</div>
                    <div className="text-sm text-gray-600">Active Members</div>
                  </div>
                </div>

                {/* Community Features */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border border-gray-200 p-4">
                    <div className="text-center">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-semibold mb-2">Discussions</h3>
                      <p className="text-sm text-gray-600 mb-3">Ask questions and share knowledge</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push('/learn/community')}
                        className="w-full"
                      >
                        Join Discussions
                      </Button>
                    </div>
                  </Card>
                  
                  <Card className="border border-gray-200 p-4">
                    <div className="text-center">
                      <UserGroupIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-semibold mb-2">Study Groups</h3>
                      <p className="text-sm text-gray-600 mb-3">Learn together with peers</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push('/learn/community')}
                        className="w-full"
                      >
                        Find Groups
                      </Button>
                    </div>
                  </Card>
                  
                  <Card className="border border-gray-200 p-4">
                    <div className="text-center">
                      <AcademicCapIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <h3 className="font-semibold mb-2">Expert Sessions</h3>
                      <p className="text-sm text-gray-600 mb-3">Learn from industry experts</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push('/learn/community')}
                        className="w-full"
                      >
                        View Sessions
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => router.push('/learn/community')} 
                    className="flex items-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Enter Community</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/learn/community/discussions/new')} 
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Start Discussion</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Learning Dashboard</span>
                </CardTitle>
                <CardDescription>
                  Track your progress, view achievements, and see your learning analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.completedTopics}</div>
                    <div className="text-sm text-gray-600">Lessons Done</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.completedCategories}</div>
                    <div className="text-sm text-gray-600">Courses Done</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{stats.currentStreak}</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalXp}</div>
                    <div className="text-sm text-gray-600">Total XP</div>
                  </div>
                </div>

                {/* Level Progress */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Level Progress</h3>
                    <Badge variant="outline">Level 5</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to Level 6</span>
                      <span>500 / 3000 XP</span>
                    </div>
                    <Progress value={17} className="h-2" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => router.push('/learn/dashboard')} 
                    className="flex items-center space-x-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>View Full Dashboard</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/learn/achievements')} 
                    className="flex items-center space-x-2"
                  >
                    <Award className="h-4 w-4" />
                    <span>View Achievements</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/learn/leaderboard')} 
                    className="flex items-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>View Leaderboard</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={`border-0 shadow-lg ${achievement.isUnlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : 'bg-gray-50'}`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      achievement.isUnlocked ? 'bg-yellow-200' : 'bg-gray-200'
                    }`}>
                      <achievement.icon className={`h-8 w-8 ${
                        achievement.isUnlocked ? 'text-yellow-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                    
                    {achievement.isUnlocked ? (
                      <div className="space-y-2">
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Unlocked
                        </Badge>
                        <p className="text-xs text-gray-500">
                          Unlocked on {achievement.unlockedAt}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge className="bg-gray-100 text-gray-800">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                        {achievement.progress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{achievement.progress}%</span>
                            </div>
                            <Progress value={achievement.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Leaderboard</span>
                </CardTitle>
                <CardDescription>
                  See how you rank among fellow learners and compete for the top spots
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Your Rank */}
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">#47</div>
                  <div className="text-lg font-semibold text-gray-900">Your Current Rank</div>
                  <div className="text-sm text-gray-600">Out of 1,234 active learners</div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">2,500</div>
                    <div className="text-sm text-gray-600">Your XP</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">5</div>
                    <div className="text-sm text-gray-600">Your Level</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">4</div>
                    <div className="text-sm text-gray-600">Courses Done</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">5</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                </div>

                {/* Top Performers Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Top 5 Learners This Week</h3>
                  <div className="space-y-2">
                    {[
                      { rank: 1, name: "Priya Sharma", xp: "5,250", level: 8, badge: "🏆" },
                      { rank: 2, name: "Rajesh Kumar", xp: "4,890", level: 7, badge: "🥈" },
                      { rank: 3, name: "Anita Singh", xp: "4,650", level: 7, badge: "🥉" },
                      { rank: 4, name: "Vikram Patel", xp: "4,200", level: 6, badge: "" },
                      { rank: 5, name: "Meera Gupta", xp: "3,950", level: 6, badge: "" }
                    ].map((learner) => (
                      <div key={learner.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-gray-600">#{learner.rank}</span>
                          <span className="text-lg">{learner.badge}</span>
                          <div>
                            <div className="font-medium">{learner.name}</div>
                            <div className="text-sm text-gray-600">Level {learner.level}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-600">{learner.xp} XP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => router.push('/learn/leaderboard')} 
                    className="flex items-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>View Full Leaderboard</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/learn/dashboard')} 
                    className="flex items-center space-x-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Improve Your Rank</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}