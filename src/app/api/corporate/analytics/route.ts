import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const corporateClientId = searchParams.get('corporateClientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const department = searchParams.get('department');

    if (!corporateClientId) {
      return NextResponse.json(
        { success: false, error: 'Corporate client ID is required' },
        { status: 400 }
      );
    }

    // Date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Get basic metrics
    const [
      totalEmployees,
      activeEmployees,
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalTrainingHours,
      averageCompletionRate,
      departmentStats,
      topPerformers,
      complianceStats
    ] = await Promise.all([
      // Total employees
      prisma.corporateEmployee.count({
        where: { corporateClientId }
      }),

      // Active employees (enrolled in at least one course)
      prisma.corporateEnrollment.count({
        where: {
          corporateClientId,
          status: 'ACTIVE'
        },
        distinct: ['employeeId']
      }),

      // Total courses available
      prisma.corporateTrainingCourse.count({
        where: {
          corporateClients: {
            some: { corporateClientId }
          }
        }
      }),

      // Completed courses
      prisma.corporateEnrollment.count({
        where: {
          corporateClientId,
          status: 'COMPLETED',
          ...(Object.keys(dateFilter).length > 0 && { 
            completedAt: dateFilter 
          })
        }
      }),

      // In-progress courses
      prisma.corporateEnrollment.count({
        where: {
          corporateClientId,
          status: 'IN_PROGRESS'
        }
      }),

      // Total training hours
      prisma.corporateEnrollment.aggregate({
        where: {
          corporateClientId,
          status: { in: ['COMPLETED', 'IN_PROGRESS'] }
        },
        _sum: {
          timeSpent: true
        }
      }),

      // Average completion rate
      prisma.corporateEnrollment.aggregate({
        where: {
          corporateClientId,
          status: { in: ['COMPLETED', 'IN_PROGRESS'] }
        },
        _avg: {
          progress: true
        }
      }),

      // Department statistics
      prisma.corporateEmployee.groupBy({
        by: ['department'],
        where: { corporateClientId },
        _count: {
          id: true
        }
      }),

      // Top performers
      prisma.corporateEmployee.findMany({
        where: { corporateClientId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          department: true,
          role: true,
          enrollments: {
            where: {
              status: 'COMPLETED'
            },
            select: {
              progress: true,
              score: true,
              timeSpent: true
            }
          }
        },
        take: 10
      }),

      // Compliance statistics
      prisma.corporateComplianceStatus.findMany({
        where: {
          corporateClientId
        },
        include: {
          course: {
            select: {
              title: true,
              complianceType: true
            }
          }
        }
      })
    ]);

    // Process top performers
    const processedTopPerformers = topPerformers
      .map(employee => {
        const completedEnrollments = employee.enrollments.filter(e => e.status === 'COMPLETED');
        const avgScore = completedEnrollments.length > 0 
          ? completedEnrollments.reduce((sum, e) => sum + (e.score || 0), 0) / completedEnrollments.length
          : 0;
        const totalTimeSpent = completedEnrollments.reduce((sum, e) => sum + (e.timeSpent || 0), 0);
        
        return {
          ...employee,
          completedCourses: completedEnrollments.length,
          averageScore: Math.round(avgScore),
          totalTimeSpent,
          performanceScore: Math.round((avgScore + (completedEnrollments.length * 10)) / 2)
        };
      })
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 10);

    // Process compliance stats
    const processedComplianceStats = {
      total: complianceStats.length,
      compliant: complianceStats.filter(c => c.status === 'COMPLIANT').length,
      nonCompliant: complianceStats.filter(c => c.status === 'NON_COMPLIANT').length,
      pending: complianceStats.filter(c => c.status === 'PENDING').length,
      complianceRate: complianceStats.length > 0 
        ? Math.round((complianceStats.filter(c => c.status === 'COMPLIANT').length / complianceStats.length) * 100)
        : 0
    };

    // Monthly progress data
    const monthlyProgress = await prisma.corporateEnrollment.groupBy({
      by: ['enrolledAt'],
      where: {
        corporateClientId,
        ...(Object.keys(dateFilter).length > 0 && { enrolledAt: dateFilter })
      },
      _count: {
        id: true
      },
      orderBy: {
        enrolledAt: 'asc'
      }
    });

    const response = {
      success: true,
      data: {
        overview: {
          totalEmployees,
          activeEmployees,
          totalCourses,
          completedCourses,
          inProgressCourses,
          totalTrainingHours: totalTrainingHours._sum.timeSpent || 0,
          averageCompletionRate: Math.round(averageCompletionRate._avg.progress || 0)
        },
        departmentStats: departmentStats.map(dept => ({
          department: dept.department,
          employeeCount: dept._count.id
        })),
        topPerformers: processedTopPerformers,
        compliance: processedComplianceStats,
        monthlyProgress: monthlyProgress.map(month => ({
          month: month.enrolledAt,
          enrollments: month._count.id
        }))
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching corporate analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch corporate analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      corporateClientId,
      employeeId,
      courseId,
      action,
      metadata
    } = body;

    if (!corporateClientId || !employeeId || !courseId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create analytics event
    const analyticsEvent = await prisma.corporateAnalytics.create({
      data: {
        corporateClientId,
        employeeId,
        courseId,
        action,
        metadata: typeof metadata === 'object' ? metadata : {},
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: analyticsEvent,
      message: 'Analytics event recorded successfully'
    });
  } catch (error) {
    console.error('Error recording analytics event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record analytics event' },
      { status: 500 }
    );
  }
}