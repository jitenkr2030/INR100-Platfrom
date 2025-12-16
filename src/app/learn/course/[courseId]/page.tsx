"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Play, 
  Clock, 
  CheckCircle, 
  Lock, 
  Star,
  Trophy,
  Target,
  Users,
  TrendingUp,
  Award,
  AlertTriangle,
  FileText,
  Video,
  Calculator,
  Zap
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  lessons: number;
  xpReward: number;
  importance: string;
  icon: string;
  color: string;
  lessons_data?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  order: number;
  duration: number;
  difficulty: string;
  xpReward: number;
  isPremium: boolean;
  quiz?: {
    id: string;
    title: string;
    passingScore: number;
    _count: {
      questions: number;
    };
  };
  progress?: {
    status: string;
    completedAt?: string;
  }[];
}

interface UserProgress {
  status: string;
  timeSpent: number;
  completedAt?: string;
  quizScore?: number;
}

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const courseId = params.courseId as string;

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      
      // Load course data
      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        headers: {
          'x-user-id': 'demo-user-id' // Replace with actual user ID
        }
      });

      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse(courseData.course);
        setLessons(courseData.course.lessons || []);
        setUserProgress(courseData.lessonProgress || []);
        setEnrolled(!!courseData.enrollment);
      }

    } catch (error) {
      console.error('Failed to load course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-id' // Replace with actual user ID
        }
      });

      if (response.ok) {
        setEnrolled(true);
        loadCourseData(); // Reload to get updated data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const getLessonProgress = (lessonId: string) => {
    return userProgress.find(p => p.lessonId === lessonId);
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="h-4 w-4" />;
      case 'QUIZ': return <Target className="h-4 w-4" />;
      case 'INTERACTIVE': return <Calculator className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  if (!course) {
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
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Course Not Found</h2>
          <p className="text-gray-600 mt-2">The course you're looking for doesn't exist.</p>
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
        {/* Course Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{course.title}</h1>
                  <p className="text-blue-100 mt-1">{course.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <Badge className="bg-white/20 text-white">
                  {course.level}
                </Badge>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>{course.lessons} lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>{course.xpReward} XP</span>
                </div>
                {course.importance === 'critical' && (
                  <Badge className="bg-red-500 text-white">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    CRITICAL
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-right">
              {enrolled ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-blue-100">Your Progress</div>
                    <div className="text-2xl font-bold">
                      {lessons.length > 0 
                        ? Math.round((userProgress.filter(p => p.status === 'COMPLETED').length / lessons.length) * 100)
                        : 0
                      }%
                    </div>
                  </div>
                  <Progress 
                    value={lessons.length > 0 
                      ? (userProgress.filter(p => p.status === 'COMPLETED').length / lessons.length) * 100
                      : 0
                    } 
                    className="w-32 bg-white/20" 
                  />
                </div>
              ) : (
                <Button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Course Content */}
        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-6">
            {enrolled ? (
              <div className="grid gap-4">
                {lessons.map((lesson, index) => {
                  const progress = getLessonProgress(lesson.id);
                  const isLocked = index > 0 && !getLessonProgress(lessons[index - 1].id || '')?.completedAt;
                  
                  return (
                    <Card 
                      key={lesson.id} 
                      className={`border-0 shadow-lg hover:shadow-xl transition-all ${
                        isLocked ? 'opacity-60' : 'hover:scale-105'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                progress?.status === 'COMPLETED' 
                                  ? 'bg-green-100 text-green-600' 
                                  : progress?.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {getLessonIcon(lesson.type)}
                              </div>
                              {progress?.status === 'COMPLETED' && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-lg">{lesson.title}</h3>
                                {lesson.isPremium && (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{lesson.duration} min</span>
                                </div>
                                <Badge className={getLevelColor(lesson.difficulty)}>
                                  {lesson.difficulty}
                                </Badge>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4" />
                                  <span>{lesson.xpReward} XP</span>
                                </div>
                                {lesson.quiz && (
                                  <div className="flex items-center space-x-1">
                                    <Target className="h-4 w-4" />
                                    <span>{lesson.quiz._count.questions} questions</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {isLocked ? (
                              <Button variant="outline" disabled>
                                <Lock className="h-4 w-4 mr-2" />
                                Locked
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => router.push(`/learn/course/${courseId}/lesson/${lesson.id}`)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              >
                                {progress?.status === 'COMPLETED' ? 'Review' : 
                                 progress?.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                                <Play className="h-4 w-4 ml-2" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Enroll to Start Learning
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Sign up for this course to access all lessons and start your learning journey.
                  </p>
                  <Button 
                    onClick={handleEnroll}
                    disabled={enrolling}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty Level</span>
                    <Badge className={getLevelColor(course.level)}>
                      {course.level}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Duration</span>
                    <span className="font-medium">{course.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Lessons</span>
                    <span className="font-medium">{course.lessons} lessons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">XP Reward</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{course.xpReward} XP</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Importance</span>
                    <Badge className={getImportanceColor(course.importance)}>
                      {course.importance}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>What You'll Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Understand core concepts and fundamentals</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Learn practical applications and examples</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Master advanced techniques and strategies</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Earn certification upon completion</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
                <CardDescription>
                  Track your learning journey and achievements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {userProgress.filter(p => p.status === 'COMPLETED').length}
                    </div>
                    <div className="text-sm text-blue-800">Completed Lessons</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {userProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0)}
                    </div>
                    <div className="text-sm text-green-800">Minutes Studied</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(
                        userProgress.reduce((sum, p) => sum + (p.quizScore || 0), 0) / 
                        Math.max(userProgress.filter(p => p.quizScore).length, 1)
                      )}%
                    </div>
                    <div className="text-sm text-purple-800">Average Quiz Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
