import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/recommendations - Get personalized learning recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // all, lessons, courses
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeViewed = searchParams.get('includeViewed') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's learning profile
    const profile = await prisma.learningProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Learning profile not found' },
        { status: 404 }
      );
    }

    // Get existing recommendations
    let whereClause: any = { 
      userId, 
      profileId: profile.id,
      expiresAt: {
        gt: new Date()
      }
    };

    if (!includeViewed) {
      whereClause.isViewed = false;
    }

    if (type && type !== 'all') {
      whereClause.contentType = type;
    }

    const recommendations = await prisma.contentRecommendation.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'asc' },
        { confidence: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Get content details for recommendations
    const recommendationsWithContent = await Promise.all(
      recommendations.map(async (rec) => {
        let content = null;
        
        if (rec.contentType === 'lesson') {
          content = await prisma.lesson.findUnique({
            where: { id: rec.contentId },
            include: {
              course: true,
              progress: {
                where: { userId }
              }
            }
          });
        } else if (rec.contentType === 'course') {
          content = await prisma.courseCategory.findUnique({
            where: { id: rec.contentId },
            include: {
              lessons: {
                include: {
                  progress: {
                    where: { userId }
                  }
                }
              },
              enrollments: {
                where: { userId }
              }
            }
          });
        }

        return {
          ...rec,
          content
        };
      })
    );

    return NextResponse.json({
      recommendations: recommendationsWithContent,
      profile: {
        id: profile.id,
        learningStyle: profile.learningStyle,
        difficultyLevel: profile.difficultyLevel,
        interests: profile.interests ? JSON.parse(profile.interests) : []
      }
    });

  } catch (error) {
    console.error('Recommendations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'generate':
        return await generateRecommendations(userId);
      
      case 'refresh':
        return await refreshRecommendations(userId);
      
      case 'mark_viewed':
        const { recommendationId } = body;
        return await markRecommendationViewed(recommendationId);
      
      case 'mark_accepted':
        const { recommendationId: acceptedId } = body;
        return await markRecommendationAccepted(acceptedId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Recommendations action error:', error);
    return NextResponse.json(
      { error: 'Failed to process recommendations action' },
      { status: 500 }
    );
  }
}

async function generateRecommendations(userId: string) {
  try {
    const profile = await prisma.learningProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Learning profile not found' },
        { status: 404 }
      );
    }

    // Clear old recommendations
    await prisma.contentRecommendation.deleteMany({
      where: {
        userId,
        profileId: profile.id
      }
    });

    // Get user's learning history
    const userProgress = await prisma.userLessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: { course: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const userEnrollments = await prisma.courseEnrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            lessons: true
          }
        }
      }
    });

    // Generate recommendations based on profile and history
    const recommendations = await generateSmartRecommendations(profile, userProgress, userEnrollments);

    // Save recommendations to database
    const savedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        return await prisma.contentRecommendation.create({
          data: {
            userId,
            profileId: profile.id,
            contentId: rec.contentId,
            contentType: rec.contentType,
            reason: rec.reason,
            confidence: rec.confidence,
            priority: rec.priority,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire in 7 days
          }
        });
      })
    );

    return NextResponse.json({
      success: true,
      recommendations: savedRecommendations,
      message: `Generated ${savedRecommendations.length} recommendations`
    });

  } catch (error) {
    console.error('Generate recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

async function refreshRecommendations(userId: string) {
  try {
    // Mark existing recommendations as viewed
    await prisma.contentRecommendation.updateMany({
      where: { userId },
      data: { isViewed: true }
    });

    // Generate new recommendations
    return await generateRecommendations(userId);

  } catch (error) {
    console.error('Refresh recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh recommendations' },
      { status: 500 }
    );
  }
}

async function markRecommendationViewed(recommendationId: string) {
  try {
    await prisma.contentRecommendation.update({
      where: { id: recommendationId },
      data: { isViewed: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Recommendation marked as viewed'
    });

  } catch (error) {
    console.error('Mark recommendation viewed error:', error);
    return NextResponse.json(
      { error: 'Failed to mark recommendation as viewed' },
      { status: 500 }
    );
  }
}

async function markRecommendationAccepted(recommendationId: string) {
  try {
    await prisma.contentRecommendation.update({
      where: { id: recommendationId },
      data: { isAccepted: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Recommendation accepted'
    });

  } catch (error) {
    console.error('Mark recommendation accepted error:', error);
    return NextResponse.json(
      { error: 'Failed to mark recommendation as accepted' },
      { status: 500 }
    );
  }
}

async function generateSmartRecommendations(profile: any, userProgress: any[], userEnrollments: any[]) {
  const recommendations = [];
  
  try {
    // Get all available content
    const allLessons = await prisma.lesson.findMany({
      where: { isActive: true },
      include: {
        course: true,
        progress: {
          where: { userId: profile.userId }
        }
      }
    });

    const allCourses = await prisma.courseCategory.findMany({
      where: { isActive: true },
      include: {
        lessons: {
          include: {
            progress: {
              where: { userId: profile.userId }
            }
          }
        },
        enrollments: {
          where: { userId: profile.userId }
        }
      }
    });

    // Analyze user preferences
    const userInterests = profile.interests ? JSON.parse(profile.interests) : [];
    const completedLessons = userProgress.filter(p => p.status === 'COMPLETED');
    const completedCourses = userEnrollments.filter(e => e.progress === 100);

    // Generate lesson recommendations
    for (const lesson of allLessons) {
      if (lesson.progress.length > 0) continue; // Skip already started lessons

      let confidence = 0;
      let reason = '';

      // Check difficulty match
      if (lesson.difficulty === profile.difficultyLevel.toLowerCase()) {
        confidence += 0.3;
      }

      // Check course interest
      if (userInterests.includes(lesson.course.category)) {
        confidence += 0.4;
        reason = `Matches your interest in ${lesson.course.category}`;
      }

      // Check learning style match
      if (lesson.type === 'VIDEO' && profile.learningStyle === 'VISUAL') {
        confidence += 0.2;
      } else if (lesson.type === 'TEXT' && profile.learningStyle === 'READING') {
        confidence += 0.2;
      }

      // Check for prerequisite completion
      const hasPrerequisites = lesson.prerequisites && JSON.parse(lesson.prerequisites).length > 0;
      if (!hasPrerequisites) {
        confidence += 0.1; // Bonus for accessible content
      }

      // Check for progression from completed content
      const relatedCompleted = completedLessons.find(p => 
        p.lesson.course.id === lesson.course.id
      );
      if (relatedCompleted) {
        confidence += 0.3;
        reason = reason || 'Continues your learning in this topic';
      }

      if (confidence > 0.5) {
        recommendations.push({
          contentId: lesson.id,
          contentType: 'lesson',
          confidence,
          reason: reason || 'Recommended based on your learning profile',
          priority: confidence > 0.8 ? 1 : confidence > 0.6 ? 2 : 3
        });
      }
    }

    // Generate course recommendations
    for (const course of allCourses) {
      if (course.enrollments.length > 0) continue; // Skip already enrolled courses

      let confidence = 0;
      let reason = '';

      // Check course category interest
      if (userInterests.includes(course.category)) {
        confidence += 0.4;
        reason = `Matches your interest in ${course.category}`;
      }

      // Check difficulty match
      if (course.level === profile.difficultyLevel.toLowerCase()) {
        confidence += 0.3;
      }

      // Check for completed related courses
      const relatedCompleted = completedCourses.find(e => e.course.category === course.category);
      if (relatedCompleted) {
        confidence += 0.3;
        reason = reason || 'Advanced course in your area of interest';
      }

      // Check lesson completion rate for recommendations
      const totalLessons = course.lessons.length;
      const completedLessonCount = course.lessons.filter(l => 
        l.progress.some(p => p.status === 'COMPLETED')
      ).length;

      if (completedLessonCount > 0 && completedLessonCount < totalLessons) {
        confidence += 0.2; // Bonus for partially completed courses
        reason = reason || 'Continue your progress in this course';
      }

      if (confidence > 0.5) {
        recommendations.push({
          contentId: course.id,
          contentType: 'course',
          confidence,
          reason: reason || 'Recommended based on your learning profile',
          priority: confidence > 0.8 ? 1 : confidence > 0.6 ? 2 : 3
        });
      }
    }

    // Sort by confidence and priority
    recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.confidence - a.confidence;
    });

    // Return top 20 recommendations
    return recommendations.slice(0, 20);

  } catch (error) {
    console.error('Smart recommendations generation error:', error);
    return [];
  }
}

// Additional endpoint for recommendation feedback
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { recommendationId, feedback, rating } = body;

    if (!recommendationId) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }

    // Update recommendation with feedback
    const updateData: any = {};
    if (feedback !== undefined) updateData.feedback = feedback;
    if (rating !== undefined) updateData.rating = rating;

    await prisma.contentRecommendation.update({
      where: { id: recommendationId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    console.error('Recommendation feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}

// ========================================
// PHASE 4: ENHANCED RECOMMENDATIONS
// ========================================

// GET /api/recommendations/enhanced - Get enhanced AI-powered recommendations
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Filter by recommendation type
    const priority = searchParams.get('priority'); // Filter by priority
    const status = searchParams.get('status') || 'PENDING'; // Filter by status
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {
      userId: user.id,
      status
    };

    if (type) whereClause.type = type;
    if (priority) whereClause.priority = priority;

    const recommendations = await prisma.learningRecommendation.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    const total = await prisma.learningRecommendation.count({ where: whereClause });

    // Get recommendation statistics
    const stats = await prisma.learningRecommendation.groupBy({
      by: ['type'],
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'VIEWED', 'CLICKED'] }
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      recommendations,
      statistics: {
        total,
        byType: stats.map(stat => ({
          type: stat.type,
          count: stat._count.id
        })),
        pending: await prisma.learningRecommendation.count({
          where: { userId: user.id, status: 'PENDING' }
        }),
        highPriority: await prisma.learningRecommendation.count({
          where: { userId: user.id, priority: 'HIGH', status: 'PENDING' }
        })
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching enhanced recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enhanced recommendations' },
      { status: 500 }
    );
  }
}

// POST /api/recommendations/enhanced - Create new enhanced recommendation
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      title,
      description,
      contentId,
      reason,
      confidence = 0.5,
      priority = 'MEDIUM',
      expiresIn // hours
    } = body;

    if (!type || !title || !description || !reason) {
      return NextResponse.json(
        { error: 'Type, title, description, and reason are required' },
        { status: 400 }
      );
    }

    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
      : null;

    const recommendation = await prisma.learningRecommendation.create({
      data: {
        userId: user.id,
        type,
        title,
        description,
        contentId,
        reason,
        confidence,
        priority,
        expiresAt
      }
    });

    return NextResponse.json({
      recommendation,
      message: 'Enhanced recommendation created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating enhanced recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to create enhanced recommendation' },
      { status: 500 }
    );
  }
}

// PUT /api/recommendations/enhanced/:id - Update enhanced recommendation status
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    // Verify recommendation belongs to user
    const existingRecommendation = await prisma.learningRecommendation.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingRecommendation) {
      return NextResponse.json(
        { error: 'Enhanced recommendation not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'CLICKED') {
      updateData.clickedAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const recommendation = await prisma.learningRecommendation.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      recommendation,
      message: 'Enhanced recommendation updated successfully'
    });

  } catch (error) {
    console.error('Error updating enhanced recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to update enhanced recommendation' },
      { status: 500 }
    );
  }
}

// GET /api/recommendations/ai-generate - Generate AI-powered recommendations
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's learning history and preferences
    const [learningProgress, quizAttempts, completedCourses, userPreferences] = await Promise.all([
      prisma.learnProgress.findMany({
        where: { userId: user.id },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              type: true,
              difficulty: true,
              category: true
            }
          }
        }
      }),
      prisma.userQuizAttempt.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.courseEnrollment.findMany({
        where: { 
          userId: user.id,
          status: 'COMPLETED'
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              category: true
            }
          }
        }
      }),
      prisma.userPreferences.findUnique({
        where: { userId: user.id }
      })
    ]);

    // Generate personalized recommendations based on user data
    const recommendations = [];

    // 1. Skill gap recommendations based on quiz performance
    const weakAreas = analyzeWeakAreas(quizAttempts);
    for (const weakArea of weakAreas) {
      recommendations.push({
        type: 'SKILL',
        title: `Improve ${weakArea.topic}`,
        description: `Based on your quiz performance, we recommend focusing on ${weakArea.topic}`,
        reason: `Your average score in ${weakArea.topic} is ${weakArea.averageScore}%, below the recommended 80%`,
        confidence: 0.8,
        priority: 'HIGH',
        contentId: weakArea.suggestedContentId
      });
    }

    // 2. Next course recommendations
    const suggestedCourses = suggestNextCourses(completedCourses, learningProgress);
    for (const course of suggestedCourses) {
      recommendations.push({
        type: 'COURSE',
        title: `Continue with ${course.title}`,
        description: course.description,
        reason: `You've completed similar courses and this matches your learning pattern`,
        confidence: 0.7,
        priority: 'MEDIUM',
        contentId: course.id
      });
    }

    // 3. Learning style recommendations
    if (userPreferences?.voiceEnabled) {
      recommendations.push({
        type: 'LEARNING_STYLE',
        title: 'Try Audio Learning',
        description: 'Enable voice learning to consume content while commuting or exercising',
        reason: 'Your preferences indicate interest in audio content',
        confidence: 0.6,
        priority: 'MEDIUM'
      });
    }

    // 4. Review recommendations
    const needsReview = identifyContentNeedingReview(learningProgress);
    for (const content of needsReview) {
      recommendations.push({
        type: 'REVIEW_CONTENT',
        title: `Review: ${content.title}`,
        description: 'Time for a quick review to reinforce your learning',
        reason: `You completed this content ${content.daysSinceCompletion} days ago`,
        confidence: 0.75,
        priority: 'MEDIUM',
        contentId: content.id
      });
    }

    // 5. Study schedule recommendations
    if (learningProgress.length > 0) {
      recommendations.push({
        type: 'STUDY_SCHEDULE',
        title: 'Optimize Your Study Schedule',
        description: 'Based on your learning patterns, we suggest studying at different times',
        reason: 'Your completion rates vary throughout the day',
        confidence: 0.6,
        priority: 'LOW'
      });
    }

    // Save recommendations to database
    const savedRecommendations = [];
    for (const rec of recommendations.slice(0, 10)) { // Limit to 10 recommendations
      const saved = await prisma.learningRecommendation.create({
        data: {
          userId: user.id,
          ...rec,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire in 7 days
        }
      });
      savedRecommendations.push(saved);
    }

    return NextResponse.json({
      generatedRecommendations: savedRecommendations,
      analysis: {
        weakAreas: weakAreas.length,
        suggestedCourses: suggestedCourses.length,
        needsReview: needsReview.length,
        totalGenerated: savedRecommendations.length
      },
      message: 'AI recommendations generated successfully'
    });

  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI recommendations' },
      { status: 500 }
    );
  }
}

// Helper functions for AI recommendation generation
function analyzeWeakAreas(quizAttempts: any[]) {
  const topicScores: Record<string, { scores: number[], total: number }> = {};
  
  quizAttempts.forEach(attempt => {
    const topic = attempt.lesson?.category || 'General';
    if (!topicScores[topic]) {
      topicScores[topic] = { scores: [], total: 0 };
    }
    topicScores[topic].scores.push(attempt.score);
    topicScores[topic].total++;
  });

  const weakAreas = Object.entries(topicScores)
    .filter(([_, data]) => data.total >= 3) // At least 3 attempts
    .map(([topic, data]) => {
      const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
      return {
        topic,
        averageScore: Math.round(averageScore),
        attempts: data.total,
        suggestedContentId: null // This would be determined by your content mapping logic
      };
    })
    .filter(area => area.averageScore < 80)
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 5);

  return weakAreas;
}

function suggestNextCourses(completedCourses: any[], learningProgress: any[]) {
  // Simple recommendation logic - would be more sophisticated in real implementation
  const completedCategories = completedCourses.map(course => course.course.category);
  const uniqueCategories = [...new Set(completedCategories)];
  
  // This is a simplified version - in reality, you'd have a more complex recommendation engine
  const suggestions = [
    {
      id: 'advanced-investing',
      title: 'Advanced Investment Strategies',
      description: 'Take your investing knowledge to the next level with advanced strategies'
    },
    {
      id: 'portfolio-management',
      title: 'Portfolio Management Mastery',
      description: 'Learn professional portfolio management techniques'
    }
  ];

  return suggestions.filter(suggestion => 
    !completedCategories.includes(suggestion.id)
  ).slice(0, 3);
}

function identifyContentNeedingReview(learningProgress: any[]) {
  const now = new Date();
  const needsReview = learningProgress
    .filter(progress => 
      progress.status === 'COMPLETED' && 
      progress.completedAt &&
      (now.getTime() - new Date(progress.completedAt).getTime()) > (7 * 24 * 60 * 60 * 1000) // 7 days
    )
    .map(progress => ({
      id: progress.contentId,
      title: progress.lesson?.title || 'Completed Content',
      daysSinceCompletion: Math.floor(
        (now.getTime() - new Date(progress.completedAt!).getTime()) / (24 * 60 * 60 * 1000)
      )
    }))
    .slice(0, 5);

  return needsReview;
}