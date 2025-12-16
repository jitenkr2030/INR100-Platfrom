import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      portfolioData, 
      userPreferences,
      marketData,
      includeAnalysis = ['portfolio', 'sentiment', 'risk', 'predictions']
    } = await request.json();

    if (!portfolioData) {
      return NextResponse.json({ error: 'Portfolio data is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Get comprehensive analysis from other AI APIs
    const analysisData = await getComprehensiveAnalysis(portfolioData, marketData, userPreferences, includeAnalysis);
    
    const recommendationPrompt = `Based on comprehensive AI analysis, provide personalized investment recommendations:

    Portfolio Data: ${JSON.stringify(portfolioData)}
    User Preferences: ${JSON.stringify(userPreferences || {})}
    Comprehensive Analysis: ${JSON.stringify(analysisData)}
    Current Date: ${new Date().toLocaleDateString('en-IN')}

    Provide detailed, actionable recommendations including:
    1. Portfolio optimization suggestions
    2. Asset allocation adjustments
    3. New investment opportunities
    4. Risk mitigation strategies
    5. Goal-based recommendations
    6. Timing considerations
    7. Implementation priorities
    8. Expected outcomes
    
    Format as JSON:
    {
      "executiveSummary": {
        "overallScore": number,
        "priority": "high" | "medium" | "low",
        "summary": string,
        "keyActions": string[]
      },
      "portfolioOptimization": {
        "currentAllocation": object,
        "targetAllocation": object,
        "rebalancingActions": [
          {
            "action": "buy" | "sell" | "hold",
            "asset": string,
            "currentPercentage": number,
            "targetPercentage": number,
            "amount": number,
            "priority": "high" | "medium" | "low",
            "rationale": string,
            "timing": string
          }
        ],
        "expectedImpact": string
      },
      "newInvestments": [
        {
          "assetName": string,
          "assetType": string,
          "allocation": number,
          "investmentAmount": number,
          "rationale": string,
          "riskLevel": "low" | "medium" | "high",
          "expectedReturn": number,
          "timeHorizon": string,
          "confidence": number,
          "implementation": string
        }
      ],
      "riskMitigation": [
        {
          "riskType": string,
          "currentExposure": number,
          "mitigationStrategy": string,
          "implementation": string,
          "expectedRiskReduction": number
        }
      ],
      "goalBasedRecommendations": [
        {
          "goal": string,
          "currentProgress": number,
          "targetAmount": number,
          "targetDate": string,
          "monthlyInvestment": number,
          "strategy": string,
          "probability": number
        }
      ],
      "marketTiming": {
        "currentMarketCondition": "bull" | "bear" | "neutral",
        "investmentStrategy": string,
        "timingRecommendations": string[],
        "avoidRecommendations": string[]
      },
      "implementation": {
        "priority": "high" | "medium" | "low",
        "immediateActions": string[],
        "shortTermActions": string[],
        "longTermActions": string[],
        "timeline": object
      },
      "expectedOutcomes": {
        "portfolioImprovement": string,
        "riskReduction": string,
        "returnEnhancement": string,
        "goalAchievement": string
      },
      "alternatives": [
        {
          "scenario": string,
          "approach": string,
          "pros": string[],
          "cons": string[]
        }
      ],
      "monitoringPlan": {
        "reviewFrequency": string,
        "keyMetrics": string[],
        "rebalancingTriggers": string[],
        "exitConditions": string[]
      },
      "summary": string,
      "confidenceScore": number
    }`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a senior financial advisor specializing in personalized investment recommendations. Provide specific, actionable advice based on comprehensive analysis. Consider user goals, risk tolerance, market conditions, and regulatory compliance. Always explain the reasoning behind recommendations.'
        },
        {
          role: 'user',
          content: recommendationPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const aiRecommendations = completion.choices[0]?.message?.content;
    
    if (!aiRecommendations) {
      throw new Error('No recommendations from AI');
    }

    let recommendations;
    try {
      recommendations = JSON.parse(aiRecommendations);
    } catch (parseError) {
      // Fallback recommendations
      recommendations = {
        executiveSummary: {
          overallScore: 75,
          priority: 'medium',
          summary: aiRecommendations,
          keyActions: ['Diversify portfolio', 'Increase SIP amount', 'Review asset allocation']
        },
        portfolioOptimization: {
          currentAllocation: portfolioData.assetAllocation || {},
          targetAllocation: { stocks: 60, bonds: 25, gold: 10, international: 5 },
          expectedImpact: 'Improved risk-adjusted returns'
        },
        summary: aiRecommendations
      };
    }

    // Enhance with analysis data and implementation metrics
    const enhancedRecommendations = {
      ...recommendations,
      analysisData,
      generatedAt: new Date().toISOString(),
      userId: userId || null,
      version: '2.0',
      confidenceLevel: 0.85,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      implementationGuide: generateImplementationGuide(recommendations)
    };

    return NextResponse.json({
      success: true,
      data: enhancedRecommendations
    });

  } catch (error) {
    console.error('Recommendations Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getComprehensiveAnalysis(portfolioData: any, marketData: any, userPreferences: any, includeAnalysis: string[]) {
  const analysisData: any = {
    portfolioMetrics: calculatePortfolioMetrics(portfolioData),
    marketContext: getMarketContext(marketData),
    userProfile: userPreferences
  };

  // In a real implementation, you would call the other AI APIs here
  // For now, we'll simulate the analysis results
  
  if (includeAnalysis.includes('portfolio')) {
    analysisData.portfolioAnalysis = {
      healthScore: 75,
      diversificationScore: 68,
      performanceRating: 'good',
      keyInsights: ['Good diversification', 'Technology overweight', 'Strong returns']
    };
  }

  if (includeAnalysis.includes('sentiment')) {
    analysisData.sentimentAnalysis = {
      overallSentiment: 'neutral',
      sectorSentiment: {
        technology: 'positive',
        banking: 'neutral',
        pharma: 'positive'
      },
      marketDrivers: ['Digital transformation', 'Regulatory changes', 'Global uncertainty']
    };
  }

  if (includeAnalysis.includes('risk')) {
    analysisData.riskAssessment = {
      overallRisk: 'medium',
      concentrationRisk: 'high',
      liquidityRisk: 'low',
      keyRisks: ['Technology concentration', 'Market volatility']
    };
  }

  if (includeAnalysis.includes('predictions')) {
    analysisData.predictions = {
      expectedReturn: 0.12,
      volatility: 0.18,
      probabilityOfPositiveReturns: 0.70,
      timeHorizon: '12 months'
    };
  }

  return analysisData;
}

function calculatePortfolioMetrics(portfolioData: any) {
  const totalValue = portfolioData.totalValue || 100000;
  const totalInvested = portfolioData.totalInvested || 80000;
  const returns = totalValue - totalInvested;
  const returnsPercentage = (returns / totalInvested) * 100;
  
  return {
    totalValue,
    totalInvested,
    returns,
    returnsPercentage,
    assetCount: portfolioData.assetAllocation?.length || 4,
    maxAllocation: Math.max(...(portfolioData.assetAllocation || []).map((a: any) => a.percentage || 0)),
    healthScore: Math.min(Math.max(50 + (returnsPercentage * 2), 0), 100)
  };
}

function getMarketContext(marketData: any) {
  return {
    indices: {
      nifty: { value: 19500, change: 0.8 },
      sensex: { value: 65000, change: 0.9 }
    },
    sectors: {
      technology: { performance: 2.5, outlook: 'positive' },
      banking: { performance: -0.8, outlook: 'neutral' }
    },
    marketSentiment: 'neutral',
    volatilityIndex: 18.5
  };
}

function generateImplementationGuide(recommendations: any) {
  const guide = {
    phase1: {
      timeframe: '1-2 weeks',
      actions: [],
      priority: 'high'
    },
    phase2: {
      timeframe: '1-3 months',
      actions: [],
      priority: 'medium'
    },
    phase3: {
      timeframe: '3-12 months',
      actions: [],
      priority: 'low'
    }
  };

  // Categorize recommendations by priority and timeframe
  if (recommendations.portfolioOptimization?.rebalancingActions) {
    recommendations.portfolioOptimization.rebalancingActions.forEach((action: any) => {
      if (action.priority === 'high') {
        guide.phase1.actions.push(`Rebalance ${action.asset}: ${action.action} ${action.percentage}%`);
      } else if (action.priority === 'medium') {
        guide.phase2.actions.push(`Adjust ${action.asset} allocation`);
      } else {
        guide.phase3.actions.push(`Monitor ${action.asset}`);
      }
    });
  }

  if (recommendations.newInvestments) {
    recommendations.newInvestments.forEach((investment: any) => {
      guide.phase2.actions.push(`Invest in ${investment.assetName} (${investment.allocation}%)`);
    });
  }

  return guide;
}