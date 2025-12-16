import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/quiz/[quizId] - Get quiz details
export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const { quizId } = params;
    const userId = request.headers.get('x-user-id') || '';

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            courseId: true
          }
        },
        questions: {
          orderBy: { order: 'asc' }
        },
        ...(userId && {
          attempts: {
            where: { userId },
            orderBy: { completedAt: 'desc' },
            take: 1
          }
        })
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Remove correct answers from questions for user view
    const sanitizedQuestions = quiz.questions.map(question => ({
      id: question.id,
      question: question.question,
      type: question.type,
      options: question.options,
      points: question.points,
      order: question.order
    }));

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions: sanitizedQuestions
      }
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

// POST /api/quiz/[quizId]/submit - Submit quiz answers
export async function POST(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const { quizId } = params;
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { answers, timeSpent } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Get quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        lesson: true
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check attempt limit
    const previousAttempts = await prisma.userQuizAttempt.count({
      where: {
        userId,
        quizId
      }
    });

    if (previousAttempts >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: 'Maximum attempts exceeded' },
        { status: 400 }
      );
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions.forEach(question => {
      totalPoints += question.points;
      const userAnswer = answers.find((a: any) => a.questionId === question.id);
      
      if (userAnswer && userAnswer.answer === question.correctAnswer) {
        earnedPoints += question.points;
      }
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const passed = score >= quiz.passingScore;

    // Save attempt
    const attempt = await prisma.userQuizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        answers: JSON.stringify(answers),
        attempt: previousAttempts + 1,
        passed,
        timeSpent: timeSpent || 0
      }
    });

    // If quiz passed, update lesson progress
    if (passed) {
      await prisma.userLessonProgress.updateMany({
        where: {
          userId,
          lessonId: quiz.lessonId
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          quizScore: score
        }
      });

      // Check if course should be completed
      const allLessons = await prisma.lesson.findMany({
        where: {
          courseId: quiz.lesson.courseId
        }
      });

      const completedLessons = await prisma.userLessonProgress.findMany({
        where: {
          userId,
          lessonId: { in: allLessons.map(l => l.id) },
          status: 'COMPLETED'
        }
      });

      // Update course enrollment
      await prisma.courseEnrollment.updateMany({
        where: {
          userId,
          courseId: quiz.lesson.courseId
        },
        data: {
          progress: (completedLessons.length / allLessons.length) * 100
        }
      });

      // Award XP
      const lesson = await prisma.lesson.findUnique({
        where: { id: quiz.lessonId }
      });

      if (lesson) {
        const xpEarned = Math.round(lesson.xpReward * (score / 100));
        
        await prisma.user.update({
          where: { id: userId },
          data: {
            xp: {
              increment: xpEarned
            }
          }
        });
      }
    }

    return NextResponse.json({
      attempt: {
        score,
        passed,
        correctAnswers: quiz.questions.map(q => q.correctAnswer),
        explanations: quiz.questions.reduce((acc, q) => {
          acc[q.id] = q.explanation;
          return acc;
        }, {} as Record<string, string>)
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
