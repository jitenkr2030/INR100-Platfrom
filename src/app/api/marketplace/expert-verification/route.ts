import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, // 'apply' | 'verify' | 'reject' | 'update'
      credentials,
      documents,
      experience,
      specializations
    } = body;

    // Get user ID from headers
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'apply':
        return await applyForVerification(userId, credentials, documents, experience, specializations);
      
      case 'verify':
        return await verifyExpert(userId, credentials);
      
      case 'reject':
        return await rejectExpert(userId, credentials);
      
      case 'update':
        return await updateVerification(userId, credentials, documents, experience, specializations);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Expert verification error:', error);
    return NextResponse.json(
      { error: 'Expert verification failed' },
      { status: 500 }
    );
  }
}

async function applyForVerification(
  userId: string, 
  credentials: any, 
  documents: any[], 
  experience: any, 
  specializations: string[]
) {
  // Check if user already has expert profile
  let expertProfile = await db.expertProfile.findUnique({
    where: { userId }
  });

  if (expertProfile) {
    return NextResponse.json(
      { error: 'Expert profile already exists' },
      { status: 400 }
    );
  }

  // Create expert profile
  expertProfile = await db.expertProfile.create({
    data: {
      userId,
      credentials: JSON.stringify(credentials),
      documents: JSON.stringify(documents),
      experience: JSON.stringify(experience),
      specializations: specializations,
      status: 'PENDING',
      isVerified: false,
      appliedAt: new Date()
    }
  });

  // Create verification request
  const verificationRequest = await db.verificationRequest.create({
    data: {
      userId,
      type: 'EXPERT_VERIFICATION',
      status: 'PENDING',
      submittedData: JSON.stringify({
        credentials,
        documents,
        experience,
        specializations
      }),
      submittedAt: new Date()
    }
  });

  return NextResponse.json({
    message: 'Verification application submitted successfully',
    expertProfile,
    verificationRequest,
    nextSteps: [
      'Documents are under review',
      'Verification typically takes 3-5 business days',
      'You will be notified once the review is complete'
    ]
  });
}

async function verifyExpert(userId: string, credentials: any) {
  // Only admins can verify experts
  const adminId = userId; // In real app, check admin permissions
  
  // Get verification request
  const verificationRequest = await db.verificationRequest.findFirst({
    where: {
      userId,
      type: 'EXPERT_VERIFICATION',
      status: 'PENDING'
    },
    include: {
      user: {
        include: { expertProfile: true }
      }
    }
  });

  if (!verificationRequest) {
    return NextResponse.json(
      { error: 'No pending verification request found' },
      { status: 404 }
    );
  }

  // Update expert profile
  await db.expertProfile.update({
    where: { userId },
    data: {
      isVerified: true,
      status: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedBy: adminId
    }
  });

  // Update verification request
  await db.verificationRequest.update({
    where: { id: verificationRequest.id },
    data: {
      status: 'APPROVED',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      reviewNotes: credentials.reviewNotes || 'All documents verified successfully'
    }
  });

  // Update user role
  await db.user.update({
    where: { id: userId },
    data: {
      role: 'EXPERT',
      updatedAt: new Date()
    }
  });

  return NextResponse.json({
    message: 'Expert verified successfully',
    verifiedAt: new Date()
  });
}

async function rejectExpert(userId: string, credentials: any) {
  const adminId = userId; // In real app, check admin permissions
  
  const verificationRequest = await db.verificationRequest.findFirst({
    where: {
      userId,
      type: 'EXPERT_VERIFICATION',
      status: 'PENDING'
    }
  });

  if (!verificationRequest) {
    return NextResponse.json(
      { error: 'No pending verification request found' },
      { status: 404 }
    );
  }

  // Update expert profile
  await db.expertProfile.update({
    where: { userId },
    data: {
      isVerified: false,
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: adminId,
      rejectionReason: credentials.rejectionReason
    }
  });

  // Update verification request
  await db.verificationRequest.update({
    where: { id: verificationRequest.id },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      reviewNotes: credentials.rejectionReason
    }
  });

  return NextResponse.json({
    message: 'Expert verification rejected',
    rejectionReason: credentials.rejectionReason
  });
}

async function updateVerification(
  userId: string, 
  credentials: any, 
  documents: any[], 
  experience: any, 
  specializations: string[]
) {
  const expertProfile = await db.expertProfile.findUnique({
    where: { userId }
  });

  if (!expertProfile) {
    return NextResponse.json(
      { error: 'Expert profile not found' },
      { status: 404 }
    );
  }

  if (expertProfile.status === 'PENDING') {
    return NextResponse.json(
      { error: 'Cannot update while verification is pending' },
      { status: 400 }
    );
  }

  // Update expert profile
  await db.expertProfile.update({
    where: { userId },
    data: {
      credentials: JSON.stringify(credentials),
      documents: JSON.stringify(documents),
      experience: JSON.stringify(experience),
      specializations: specializations,
      updatedAt: new Date()
    }
  });

  return NextResponse.json({
    message: 'Expert profile updated successfully'
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const includeStats = searchParams.get('includeStats') === 'true';

    // Get user ID from headers if not provided
    const targetUserId = userId || request.headers.get('x-user-id');
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const expertProfile = await db.expertProfile.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    if (!expertProfile) {
      return NextResponse.json(
        { error: 'Expert profile not found' },
        { status: 404 }
      );
    }

    const result: any = { expertProfile };

    if (includeStats) {
      // Get expert stats
      const stats = await getExpertStats(targetUserId);
      result.stats = stats;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get expert profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expert profile' },
      { status: 500 }
    );
  }
}

async function getExpertStats(userId: string) {
  // Get portfolio templates
  const portfolioTemplates = await db.portfolioTemplate.findMany({
    where: { expertId: userId, isActive: true },
    include: {
      _count: {
        select: { copies: true }
      }
    }
  });

  // Get insights
  const insights = await db.expertInsight.findMany({
    where: { expertId: userId, isActive: true },
    include: {
      _count: {
        select: { purchases: true }
      }
    }
  });

  // Get newsletters
  const newsletters = await db.newsletter.findMany({
    where: { expertId: userId, isActive: true },
    include: {
      _count: {
        select: { subscribers: true }
      }
    }
  });

  // Calculate total earnings
  const commissions = await db.commission.findMany({
    where: { userId: userId }
  });

  const totalEarnings = commissions.reduce((sum, commission) => sum + commission.amount, 0);

  // Calculate average ratings
  const ratings = await db.expertRating.findMany({
    where: { expertId: userId }
  });

  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
    : 0;

  return {
    portfolioTemplates: portfolioTemplates.length,
    totalPortfolioCopies: portfolioTemplates.reduce((sum, template) => sum + template._count.copies, 0),
    insights: insights.length,
    totalInsightPurchases: insights.reduce((sum, insight) => sum + insight._count.purchases, 0),
    newsletters: newsletters.length,
    totalNewsletterSubscribers: newsletters.reduce((sum, newsletter) => sum + newsletter._count.subscribers, 0),
    totalEarnings,
    averageRating,
    totalRatings: ratings.length,
    verificationStatus: {
      isVerified: averageRating >= 4.0 && totalEarnings >= 10000,
      requirements: {
        minRating: 4.0,
        minEarnings: 10000,
        currentRating: averageRating,
        currentEarnings: totalEarnings
      }
    }
  };
}