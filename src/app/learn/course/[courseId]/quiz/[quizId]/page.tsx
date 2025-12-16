"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Award,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Lightbulb
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  points: number;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  maxAttempts: number;
  lesson: {
    id: string;
    title: string;
    courseId: string;
  };
  questions: Question[];
}

interface QuizAttempt {
  score: number;
  passed: boolean;
  correctAnswers: string[];
  explanations: Record<string, string>;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  const { quizId } = params as { quizId: string };

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (quizStarted && timeLeft > 0 && !result) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [quizStarted, timeLeft, result]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/quiz/${quizId}`, {
        headers: {
          'x-user-id': 'demo-user-id' // Replace with actual user ID
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuiz(data.quiz);
        if (data.quiz.timeLimit) {
          setTimeLeft(data.quiz.timeLimit * 60); // Convert minutes to seconds
        }
      }

    } catch (error) {
      console.error('Failed to load quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-id' // Replace with actual user ID
        },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer
          })),
          timeSpent: 0 // Calculate actual time spent
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.attempt);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE': return <Target className="h-4 w-4" />;
      case 'TRUE_FALSE': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const canProceed = () => {
    if (!quiz) return false;
    const currentQ = quiz.questions[currentQuestion];
    return answers[currentQ.id] !== undefined;
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

  if (!quiz) {
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
          <h2 className="text-2xl font-bold text-gray-900">Quiz Not Found</h2>
          <p className="text-gray-600 mt-2">The quiz you're looking for doesn't exist.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Quiz Instructions Page
  if (!quizStarted && !result) {
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
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/learn/course/${quiz.lesson.courseId}/lesson/${quiz.lesson.id}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Lesson
              </Button>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                  <p className="text-gray-600">{quiz.lesson.title}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Instructions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-6 w-6 text-purple-600" />
                <span>Quiz Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Quiz Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Questions</span>
                      <span className="font-medium">{quiz.questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Passing Score</span>
                      <Badge className="bg-green-100 text-green-800">
                        {quiz.passingScore}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Limit</span>
                      <span className="font-medium">
                        {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No limit'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Attempts</span>
                      <span className="font-medium">{quiz.maxAttempts}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Instructions</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Read each question carefully</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Select the best answer for each question</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>You can review your answers before submitting</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Complete all questions to pass the quiz</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button 
                  onClick={startQuiz}
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Start Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Quiz Results Page
  if (result) {
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
          {/* Results Header */}
          <Card className={`border-2 ${
            result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <CardContent className="p-8 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                result.passed ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {result.passed ? (
                  <Award className="h-10 w-10 text-white" />
                ) : (
                  <XCircle className="h-10 w-10 text-white" />
                )}
              </div>
              
              <h1 className={`text-3xl font-bold mb-2 ${
                result.passed ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.passed ? 'Congratulations!' : 'Keep Learning!'}
              </h1>
              
              <p className={`text-lg mb-6 ${
                result.passed ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.passed 
                  ? `You scored ${result.score}% and passed the quiz!`
                  : `You scored ${result.score}%. You need ${quiz.passingScore}% to pass.`
                }
              </p>

              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => router.push(`/learn/course/${quiz.lesson.courseId}`)}
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
                
                {!result.passed && (
                  <Button 
                    onClick={startQuiz}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
              <CardDescription>
                Review your answers and see explanations for each question
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {quiz.questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const correctAnswer = result.correctAnswers[index];
                const isCorrect = userAnswer === correctAnswer;
                const explanation = result.explanations[question.id];

                return (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-3">
                          {index + 1}. {question.question}
                        </h4>
                        
                        {question.options && (
                          <div className="space-y-2 mb-4">
                            {question.options.map((option, optionIndex) => {
                              const isUserAnswer = userAnswer === option;
                              const isCorrectAnswer = correctAnswer === option;
                              
                              return (
                                <div 
                                  key={optionIndex}
                                  className={`p-3 rounded-lg border ${
                                    isCorrectAnswer 
                                      ? 'bg-green-50 border-green-200 text-green-800'
                                      : isUserAnswer && !isCorrect
                                      ? 'bg-red-50 border-red-200 text-red-800'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    {isCorrectAnswer && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                    {isUserAnswer && !isCorrect && (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <span>{option}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {explanation && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-2">
                              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h5 className="font-medium text-blue-800 mb-1">Explanation</h5>
                                <p className="text-blue-700">{explanation}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Quiz Taking Page
  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

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
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-gray-600">
                  Question {currentQuestion + 1} of {quiz.questions.length}
                </p>
              </div>
            </div>
            
            {timeLeft > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Time Remaining</div>
                <div className={`text-xl font-mono font-bold ${
                  timeLeft < 300 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="flex items-center space-x-2 text-purple-600">
                  {getQuestionTypeIcon(currentQ.type)}
                  <Badge className="bg-purple-100 text-purple-800">
                    {currentQ.points} point{currentQ.points !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {currentQ.question}
              </h2>
              
              {currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((option, index) => (
                    <label 
                      key={index}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        answers[currentQ.id] === option 
                          ? 'border-purple-200 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQ.id}`}
                        value={option}
                        checked={answers[currentQ.id] === option}
                        onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                        answers[currentQ.id] === option 
                          ? 'border-purple-600 bg-purple-600' 
                          : 'border-gray-300'
                      }`}>
                        {answers[currentQ.id] === option && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex space-x-3">
            {currentQuestion === quiz.questions.length - 1 ? (
              <Button 
                onClick={handleSubmitQuiz}
                disabled={submitting || Object.keys(answers).length !== quiz.questions.length}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                disabled={!canProceed()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
