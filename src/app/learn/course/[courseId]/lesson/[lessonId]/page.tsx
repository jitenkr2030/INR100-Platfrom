"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  Star,
  Play,
  FileText,
  Video,
  Calculator,
  Target,
  Lightbulb,
  ArrowLeft,
  Award,
  BookOpen,
  Zap
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  content: string;
  type: string;
  order: number;
  duration: number;
  difficulty: string;
  xpReward: number;
  isPremium: boolean;
  interactiveElements?: any;
  embeddedVideos?: any;
  dragDropActivities?: any;
  course: {
    id: string;
    title: string;
  };
  quiz?: {
    id: string;
    title: string;
    passingScore: number;
  };
}

interface UserProgress {
  id: string;
  status: string;
  timeSpent: number;
  completedAt?: string;
  quizScore?: number;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [prevLesson, setPrevLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [studyTime, setStudyTime] = useState(0);

  const { courseId, lessonId } = params as { courseId: string; lessonId: string };

  useEffect(() => {
    if (courseId && lessonId) {
      loadLessonData();
      setStartTime(Date.now());
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    // Track study time
    const interval = setInterval(() => {
      setStudyTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        headers: {
          'x-user-id': 'demo-user-id' // Replace with actual user ID
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLesson(data.lesson);
        setUserProgress(data.userProgress);
        setNextLesson(data.nextLesson);
        setPrevLesson(data.prevLesson);
      }

    } catch (error) {
      console.error('Failed to load lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (action: string) => {
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000 / 60); // Convert to minutes
      
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-id' // Replace with actual user ID
        },
        body: JSON.stringify({
          action,
          timeSpent
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserProgress(data.progress);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleStartLesson = async () => {
    await updateProgress('start');
  };

  const handleCompleteLesson = async () => {
    await updateProgress('complete');
    
    // Navigate to next lesson or quiz
    if (lesson?.quiz) {
      router.push(`/learn/course/${courseId}/quiz/${lesson.quiz.id}`);
    } else if (nextLesson) {
      router.push(`/learn/course/${courseId}/lesson/${nextLesson.id}`);
    } else {
      router.push(`/learn/course/${courseId}`);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="h-5 w-5" />;
      case 'QUIZ': return <Target className="h-5 w-5" />;
      case 'INTERACTIVE': return <Calculator className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderContent = () => {
    if (!lesson) return null;

    const content = lesson.content;
    
    // Simple markdown-like rendering
    const sections = content.split('\n\n').filter(section => section.trim());
    
    return (
      <div className="prose prose-lg max-w-none">
        {sections.map((section, index) => {
          if (section.startsWith('# ')) {
            return <h1 key={index} className="text-3xl font-bold mb-6 text-gray-900">{section.slice(2)}</h1>;
          } else if (section.startsWith('## ')) {
            return <h2 key={index} className="text-2xl font-semibold mb-4 text-gray-800">{section.slice(3)}</h2>;
          } else if (section.startsWith('### ')) {
            return <h3 key={index} className="text-xl font-medium mb-3 text-gray-700">{section.slice(4)}</h3>;
          } else if (section.startsWith('- ')) {
            const items = section.split('\n').filter(item => item.trim());
            return (
              <ul key={index} className="list-disc pl-6 mb-4 space-y-2">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-gray-700">{item.slice(2)}</li>
                ))}
              </ul>
            );
          } else if (section.startsWith('**') && section.endsWith('**')) {
            return <p key={index} className="font-semibold text-gray-800 mb-4">{section.slice(2, -2)}</p>;
          } else {
            return <p key={index} className="text-gray-700 mb-4 leading-relaxed">{section}</p>;
          }
        })}
      </div>
    );
  };

  const renderInteractiveElements = () => {
    if (!lesson?.interactiveElements) return null;

    try {
      const elements = JSON.parse(lesson.interactiveElements);
      
      return elements.map((element: any, index: number) => {
        switch (element.type) {
          case 'calculator':
            return (
              <Card key={index} className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span>{element.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {element.inputs?.principal?.label || 'Principal Amount'}
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Enter amount"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {element.inputs?.rate?.label || 'Rate (%)'}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Enter rate"
                        />
                      </div>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Calculate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          
          case 'example':
            return (
              <Card key={index} className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-green-600" />
                    <span>{element.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{element.content}</p>
                </CardContent>
              </Card>
            );
          
          default:
            return null;
        }
      });
    } catch (error) {
      console.error('Error parsing interactive elements:', error);
      return null;
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

  if (!lesson) {
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
          <h2 className="text-2xl font-bold text-gray-900">Lesson Not Found</h2>
          <p className="text-gray-600 mt-2">The lesson you're looking for doesn't exist.</p>
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/learn/course/${courseId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${
                  userProgress?.status === 'COMPLETED' 
                    ? 'bg-green-100 text-green-600' 
                    : userProgress?.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {getLessonIcon(lesson.type)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{lesson.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4" />
                      <span>{lesson.xpReward} XP</span>
                    </div>
                    <span className="capitalize">{lesson.difficulty}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Study Time</div>
                <div className="font-mono text-lg">{formatTime(studyTime)}</div>
              </div>
              
              {userProgress?.status === 'COMPLETED' ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </Badge>
              ) : userProgress?.status === 'IN_PROGRESS' ? (
                <Button 
                  onClick={handleCompleteLesson}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              ) : (
                <Button 
                  onClick={handleStartLesson}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Lesson
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Lesson Content */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                {renderContent()}
                {renderInteractiveElements()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              {prevLesson ? (
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/learn/course/${courseId}/lesson/${prevLesson.id}`)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous Lesson
                </Button>
              ) : (
                <div></div>
              )}
              
              {nextLesson ? (
                <Button 
                  onClick={() => router.push(`/learn/course/${courseId}/lesson/${nextLesson.id}`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next Lesson
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : lesson.quiz ? (
                <Button 
                  onClick={() => router.push(`/learn/course/${courseId}/quiz/${lesson.quiz.id}`)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Take Quiz
                  <Target className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={() => router.push(`/learn/course/${courseId}`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Course
                  <Award className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lesson Info */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Lesson Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{lesson.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty</span>
                  <Badge className={`${
                    lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    lesson.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {lesson.difficulty}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">XP Reward</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{lesson.xpReward}</span>
                  </div>
                </div>
                {lesson.quiz && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quiz</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      <Target className="h-3 w-3 mr-1" />
                      {lesson.quiz.passingScore}% to pass
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status</span>
                    <Badge className={`${
                      userProgress?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      userProgress?.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {userProgress?.status?.replace('_', ' ') || 'NOT STARTED'}
                    </Badge>
                  </div>
                  
                  {userProgress?.timeSpent && (
                    <div className="flex justify-between text-sm">
                      <span>Time Spent</span>
                      <span className="font-medium">{userProgress.timeSpent} min</span>
                    </div>
                  )}
                  
                  {userProgress?.quizScore && (
                    <div className="flex justify-between text-sm">
                      <span>Quiz Score</span>
                      <span className="font-medium">{userProgress.quizScore}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Course Progress */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-medium">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
