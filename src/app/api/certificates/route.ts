import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/certificates - Get user certificates
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // course, skill, achievement
    const status = searchParams.get('status') || 'all'; // completed, pending, expired
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {
      userId: user.id
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    let certificates;
    let total;

    switch (type) {
      case 'course':
        certificates = await prisma.courseCertificate.findMany({
          where: whereClause,
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true
              }
            }
          },
          orderBy: { issuedAt: 'desc' },
          take: limit,
          skip: offset
        });
        total = await prisma.courseCertificate.count({ where: whereClause });
        break;

      case 'skill':
        certificates = await prisma.userSkillBadge.findMany({
          where: { userId: user.id },
          include: {
            skillBadge: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                skillType: true,
                level: true
              }
            }
          },
          orderBy: earnedAt: 'desc' }
        });
        total = await prisma.userSkillBadge.count({ where: { userId: user.id } });
        break;

      case 'achievement':
        certificates = await prisma.userBadge.findMany({
          where: { userId: user.id },
          include: {
            badge: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                icon: true
              }
            }
          },
          orderBy: { earnedAt: 'desc' }
        });
        total = await prisma.userBadge.count({ where: { userId: user.id } });
        break;

      default:
        // Get all types combined
        const [courseCerts, skillBadges, achievements] = await Promise.all([
          prisma.courseCertificate.findMany({
            where: { userId: user.id },
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  category: true
                }
              }
            },
            orderBy: { issuedAt: 'desc' },
            take: Math.ceil(limit / 3),
            skip: Math.floor(offset / 3)
          }),
          prisma.userSkillBadge.findMany({
            where: { userId: user.id },
            include: {
              skillBadge: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  skillType: true,
                  level: true
                }
              }
            },
            orderBy: { earnedAt: 'desc' },
            take: Math.ceil(limit / 3),
            skip: Math.floor(offset / 3)
          }),
          prisma.userBadge.findMany({
            where: { userId: user.id },
            include: {
              badge: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  icon: true
                }
              }
            },
            orderBy: { earnedAt: 'desc' },
            take: Math.ceil(limit / 3),
            skip: Math.floor(offset / 3)
          })
        ]);

        // Combine and sort by date
        certificates = [
          ...courseCerts.map(c => ({ ...c, type: 'course', date: c.issuedAt })),
          ...skillBadges.map(c => ({ ...c, type: 'skill', date: c.earnedAt })),
          ...achievements.map(c => ({ ...c, type: 'achievement', date: c.earnedAt }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
         .slice(0, limit);

        total = await Promise.all([
          prisma.courseCertificate.count({ where: { userId: user.id } }),
          prisma.userSkillBadge.count({ where: { userId: user.id } }),
          prisma.userBadge.count({ where: { userId: user.id } })
        ]).then(([courseCount, skillCount, achievementCount]) => 
          courseCount + skillCount + achievementCount
        );
    }

    return NextResponse.json({
      certificates,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}

// POST /api/certificates - Issue new certificate
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type, // course, skill, achievement
      courseId,
      skillBadgeId,
      badgeId,
      score,
      completionTime
    } = body;

    let certificate;

    switch (type) {
      case 'course':
        if (!courseId) {
          return NextResponse.json(
            { error: 'Course ID is required for course certificates' },
            { status: 400 }
          );
        }

        // Check if certificate already exists
        const existingCourseCert = await prisma.courseCertificate.findUnique({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId
            }
          }
        });

        if (existingCourseCert) {
          return NextResponse.json(
            { error: 'Certificate already exists for this course' },
            { status: 400 }
          );
        }

        // Generate unique verification code
        const verificationCode = `INR100-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        certificate = await prisma.courseCertificate.create({
          data: {
            userId: user.id,
            courseId,
            score: score || 0,
            completionTime: completionTime || 0,
            verificationCode,
            issuedAt: new Date()
          },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true
              }
            }
          }
        });
        break;

      case 'skill':
        if (!skillBadgeId) {
          return NextResponse.json(
            { error: 'Skill badge ID is required' },
            { status: 400 }
          );
        }

        // Check if skill badge already earned
        const existingSkillBadge = await prisma.userSkillBadge.findUnique({
          where: {
            userId_skillBadgeId: {
              userId: user.id,
              skillBadgeId
            }
          }
        });

        if (existingSkillBadge) {
          return NextResponse.json(
            { error: 'Skill badge already earned' },
            { status: 400 }
          );
        }

        certificate = await prisma.userSkillBadge.create({
          data: {
            userId: user.id,
            skillBadgeId,
            earnedAt: new Date()
          },
          include: {
            skillBadge: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                skillType: true,
                level: true
              }
            }
          }
        });
        break;

      case 'achievement':
        if (!badgeId) {
          return NextResponse.json(
            { error: 'Badge ID is required' },
            { status: 400 }
          );
        }

        // Check if badge already earned
        const existingBadge = await prisma.userBadge.findUnique({
          where: {
            userId_badgeId: {
              userId: user.id,
              badgeId
            }
          }
        });

        if (existingBadge) {
          return NextResponse.json(
            { error: 'Badge already earned' },
            { status: 400 }
          );
        }

        certificate = await prisma.userBadge.create({
          data: {
            userId: user.id,
            badgeId,
            earnedAt: new Date()
          },
          include: {
            badge: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                icon: true
              }
            }
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid certificate type' },
          { status: 400 }
        );
    }

    // Create shareable credential
    await prisma.shareableCredential.create({
      data: {
        userId: user.id,
        credentialType: type.toUpperCase() as any,
        credentialId: certificate.id,
        platform: 'COPY_LINK',
        shareCode: `SHARE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        isPublic: true
      }
    });

    return NextResponse.json({
      certificate,
      message: `${type} certificate issued successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json(
      { error: 'Failed to issue certificate' },
      { status: 500 }
    );
  }
}

// GET /api/certificates/verify/:code - Verify certificate by code
export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { code } = params;

    // Search in course certificates
    let certificate = await prisma.courseCertificate.findUnique({
      where: { verificationCode: code },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true
          }
        }
      }
    });

    if (certificate) {
      return NextResponse.json({
        type: 'course',
        certificate: {
          ...certificate,
          verificationStatus: 'verified'
        },
        message: 'Certificate verified successfully'
      });
    }

    // Search in shareable credentials
    const shareableCredential = await prisma.shareableCredential.findUnique({
      where: { shareCode: code },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (shareableCredential) {
      return NextResponse.json({
        type: shareableCredential.credentialType.toLowerCase(),
        certificate: shareableCredential,
        message: 'Credential verified successfully'
      });
    }

    return NextResponse.json(
      { error: 'Certificate or credential not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Failed to verify certificate' },
      { status: 500 }
    );
  }
}

// POST /api/certificates/share - Create shareable link
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      certificateId,
      certificateType,
      platform,
      isPublic = true,
      expiresAt
    } = body;

    if (!certificateId || !certificateType) {
      return NextResponse.json(
        { error: 'Certificate ID and type are required' },
        { status: 400 }
      );
    }

    // Verify certificate belongs to user
    let certificate;
    switch (certificateType) {
      case 'course':
        certificate = await prisma.courseCertificate.findFirst({
          where: {
            id: certificateId,
            userId: user.id
          }
        });
        break;
      case 'skill':
        certificate = await prisma.userSkillBadge.findFirst({
          where: {
            id: certificateId,
            userId: user.id
          }
        });
        break;
      case 'achievement':
        certificate = await prisma.userBadge.findFirst({
          where: {
            id: certificateId,
            userId: user.id
          }
        });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid certificate type' },
          { status: 400 }
        );
    }

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found or access denied' },
        { status: 404 }
      );
    }

    // Create shareable credential
    const shareableCredential = await prisma.shareableCredential.create({
      data: {
        userId: user.id,
        credentialType: certificateType.toUpperCase() as any,
        credentialId: certificateId,
        platform: platform || 'COPY_LINK',
        shareCode: `SHARE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        isPublic,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    return NextResponse.json({
      shareableCredential,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/verify/${shareableCredential.shareCode}`,
      message: 'Shareable credential created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating shareable credential:', error);
    return NextResponse.json(
      { error: 'Failed to create shareable credential' },
      { status: 500 }
    );
  }
}