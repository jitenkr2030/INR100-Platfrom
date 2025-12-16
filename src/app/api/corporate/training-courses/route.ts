import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');
    const corporateClientId = searchParams.get('corporateClientId');
    const compliance = searchParams.get('compliance');

    const skip = (page - 1) * limit;
    const where: any = {
      isActive: true
    };

    if (category) where.category = category;
    if (industry) where.industry = industry;
    if (compliance) where.complianceType = compliance;
    if (corporateClientId) {
      where.corporateClients = {
        some: {
          corporateClientId
        }
      };
    }

    const [courses, total] = await Promise.all([
      prisma.corporateTrainingCourse.findMany({
        where,
        skip,
        take: limit,
        include: {
          corporateClients: {
            include: {
              corporateClient: {
                select: {
                  companyName: true,
                  industry: true
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true,
              modules: true
            }
          },
          modules: {
            select: {
              id: true,
              title: true,
              duration: true,
              order: true
            },
            orderBy: {
              order: 'asc'
            },
            take: 5
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.corporateTrainingCourse.count({ where })
    ]);

    const response = {
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching corporate training courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch corporate training courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      industry,
      difficultyLevel,
      duration,
      maxParticipants,
      price,
      corporateClients,
      complianceType,
      learningObjectives,
      prerequisites,
      modules,
      assessments,
      certificateTemplate,
      isActive = true,
      isCustom = false
    } = body;

    // Validate required fields
    if (!title || !description || !category || !industry || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const course = await prisma.$transaction(async (tx) => {
      // Create course
      const newCourse = await tx.corporateTrainingCourse.create({
        data: {
          title,
          description,
          category,
          industry,
          difficultyLevel,
          duration: parseInt(duration),
          maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
          price: price ? parseFloat(price) : null,
          complianceType,
          learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : [],
          prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
          certificateTemplate,
          isActive,
          isCustom
        }
      });

      // Create modules if provided
      if (Array.isArray(modules) && modules.length > 0) {
        for (const [index, module] of modules.entries()) {
          await tx.corporateTrainingModule.create({
            data: {
              courseId: newCourse.id,
              title: module.title,
              description: module.description,
              content: typeof module.content === 'object' ? module.content : {},
              duration: module.duration ? parseInt(module.duration) : null,
              order: index + 1,
              isActive: true
            }
          });
        }
      }

      // Create assessments if provided
      if (Array.isArray(assessments) && assessments.length > 0) {
        for (const assessment of assessments) {
          await tx.corporateAssessment.create({
            data: {
              courseId: newCourse.id,
              title: assessment.title,
              type: assessment.type,
              questions: Array.isArray(assessment.questions) ? assessment.questions : [],
              passingScore: assessment.passingScore ? parseInt(assessment.passingScore) : 80,
              timeLimit: assessment.timeLimit ? parseInt(assessment.timeLimit) : null,
              attempts: assessment.attempts ? parseInt(assessment.attempts) : 3,
              isActive: true
            }
          });
        }
      }

      // Associate with corporate clients if provided
      if (Array.isArray(corporateClients) && corporateClients.length > 0) {
        for (const clientId of corporateClients) {
          await tx.corporateTrainingCourseClient.create({
            data: {
              courseId: newCourse.id,
              corporateClientId: clientId
            }
          });
        }
      }

      return newCourse;
    });

    const courseWithDetails = await prisma.corporateTrainingCourse.findUnique({
      where: { id: course.id },
      include: {
        modules: {
          orderBy: {
            order: 'asc'
          }
        },
        assessments: true,
        corporateClients: {
          include: {
            corporateClient: {
              select: {
                companyName: true,
                industry: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: courseWithDetails,
      message: 'Corporate training course created successfully'
    });
  } catch (error) {
    console.error('Error creating corporate training course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create corporate training course' },
      { status: 500 }
    );
  }
}