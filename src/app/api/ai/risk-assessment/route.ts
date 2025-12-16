import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { userId, portfolioData, marketData, riskTolerance = 'moderate' } = await request.json();

    if (!portfolioData) {
      return NextResponse.json({ error: 'Portfolio data is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Calculate comprehensive risk metrics
    const riskMetrics = calculateRiskMetrics(portfolioData, marketData);
    
    const riskPrompt = `Conduct a comprehensive risk assessment for the following investment portfolio:

    Portfolio Data: ${JSON.stringify(portfolioData)}
    Calculated Risk Metrics: ${JSON.stringify(riskMetrics)}
    Market Data: ${JSON.stringify(marketData || {})}
    User Risk Tolerance: ${riskTolerance}
    Current Date: ${new Date().toLocaleDateString('en-IN')}

    Provide detailed risk analysis including:
    1. Overall portfolio risk score and level
    2. Specific risk categories assessment
    3. Concentration risk analysis
    4. Market risk factors
    5. Liquidity risk evaluation
    6. Volatility analysis
    7. Credit/default risk
    8. Operational risk factors
    9. Regulatory risk considerations
    10. Risk mitigation strategies
    
    Format as JSON:
    {
      "overallRisk": {
        "score": number (0-100),
        "level": "low" | "medium" | "high" | "very_high",
        "rating": "conservative" | "moderate" | "aggressive" | "very_aggressive",
        "summary": string
      },
      "riskCategories": {
        "concentration": {
          "score": number,
          "level": "low" | "medium" | "high",
          "description": string,
          "assetsAtRisk": string[]
        },
        "market": {
          "score": number,
          "level": "low" | "medium" | "high",
          "beta": number,
          "description": string,
          "factors": string[]
        },
        "liquidity": {
          "score": number,
          "level": "low" | "medium" | "high",
          "description": string,
          "illiquidAssets": string[]
        },
        "volatility": {
          "score": number,
          "level": "low" | "medium" | "high",
          "annualVolatility": number,
          "description": string
        },
        "credit": {
          "score": number,
          "level": "low" | "medium" | "high",
          "description": string,
          "ratingDistribution": object
        },
        "operational": {
          "score": number,
          "level": "low" | "medium" | "high",
          "description": string,
          "factors": string[]
        }
      },
      "stressTests": {
        "marketCrash": {
          "scenario": "30% market decline",
          "portfolioImpact": number,
          "timeframe": "3 months",
          "recoveryTime": string
        },
        "interestRate": {
          "scenario": "2% rate increase",
          "portfolioImpact": number,
          "affectedAssets": string[]
        },
        "inflation": {
          "scenario": "8% inflation",
          "realReturn": number,
          "impactOnGoals": string
        }
      },
      "correlations": {
        "highCorrelations": string[],
        "lowCorrelations": string[],
        "diversificationEffectiveness": number
      },
      "riskAlerts": [
        {
          "severity": "high" | "medium" | "low",
          "category": string,
          "title": string,
          "description": string,
          "recommendation": string
        }
      ],
      "mitigationStrategies": [
        {
          "category": string,
          "strategy": string,
          "priority": "high" | "medium" | "low",
          "implementation": string,
          "expectedRiskReduction": number
        }
      ],
      "riskToleranceMatch": {
        "alignment": number,
        "recommendation": string,
        "adjustments": string[]
      },
      "summary": string,
      "keyInsights": string[]
    }`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a certified risk management expert specializing in investment portfolio risk assessment. Provide comprehensive, quantitative risk analysis with actionable mitigation strategies. Consider Indian market conditions and regulatory framework.'
        },
        {
          role: 'user',
          content: riskPrompt
        }
      ],
      temperature: 0.6,
      max_tokens: 3000
    });

    const aiRiskAssessment = completion.choices[0]?.message?.content;
    
    if (!aiRiskAssessment) {
      throw new Error('No risk assessment from AI');
    }

    let riskAssessment;
    try {
      riskAssessment = JSON.parse(aiRiskAssessment);
    } catch (parseError) {
      // Fallback assessment
      riskAssessment = {
        overallRisk: {
          score: riskMetrics.riskScore || 50,
          level: 'medium',
          rating: 'moderate',
          summary: aiRiskAssessment
        },
        riskCategories: {
          concentration: { score: 60, level: 'medium', description: 'Moderate concentration risk' },
          market: { score: 55, level: 'medium', beta: 1.1, description: 'Market risk aligned with tolerance' },
          liquidity: { score: 70, level: 'low', description: 'Good liquidity profile' },
          volatility: { score: 50, level: 'medium', annualVolatility: 18, description: 'Moderate volatility' }
        },
        summary: aiRiskAssessment
      };
    }

    // Enhance with calculated metrics and stress testing
    const enhancedAssessment = {
      ...riskAssessment,
      calculatedMetrics: riskMetrics,
      stressTestResults: performStressTests(portfolioData),
      timestamp: new Date().toISOString(),
      userId: userId || null
    };

    return NextResponse.json({
      success: true,
      data: enhancedAssessment
    });

  } catch (error) {
    console.error('Risk Assessment Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to assess risk',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function calculateRiskMetrics(portfolioData: any, marketData?: any) {
  try {
    const totalValue = portfolioData.totalValue || 0;
    const assetAllocation = portfolioData.assetAllocation || [];
    
    // Concentration risk
    const maxAllocation = Math.max(...assetAllocation.map((asset: any) => asset.percentage || 0), 0);
    const concentrationRisk = maxAllocation > 60 ? 90 : maxAllocation > 40 ? 70 : maxAllocation > 25 ? 50 : 30;
    
    // Diversification score
    const diversificationScore = assetAllocation.length >= 5 ? 90 : 
                                assetAllocation.length >= 4 ? 80 : 
                                assetAllocation.length >= 3 ? 65 : 45;
    
    // Market risk (simplified beta calculation)
    const marketRisk = marketData?.beta || 1.0;
    const betaRisk = marketRisk > 1.5 ? 80 : marketRisk > 1.2 ? 65 : marketRisk > 0.8 ? 45 : 35;
    
    // Volatility estimation
    const volatilityRisk = 50; // Base volatility risk
    
    // Liquidity risk (assuming most Indian assets have good liquidity)
    const liquidityRisk = 30; // Low liquidity risk for Indian market
    
    // Overall risk score (weighted average)
    const riskScore = Math.round(
      (concentrationRisk * 0.3) + 
      ((100 - diversificationScore) * 0.2) + 
      (betaRisk * 0.3) + 
      (volatilityRisk * 0.1) + 
      (liquidityRisk * 0.1)
    );
    
    return {
      concentrationRisk,
      diversificationScore,
      betaRisk,
      volatilityRisk,
      liquidityRisk,
      riskScore: Math.min(Math.max(riskScore, 0), 100),
      maxAllocation,
      assetCount: assetAllocation.length,
      riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low'
    };
  } catch (error) {
    console.error('Error calculating risk metrics:', error);
    return {
      concentrationRisk: 50,
      diversificationScore: 50,
      betaRisk: 50,
      volatilityRisk: 50,
      liquidityRisk: 50,
      riskScore: 50,
      maxAllocation: 0,
      assetCount: 0,
      riskLevel: 'medium'
    };
  }
}

function performStressTests(portfolioData: any) {
  // Simplified stress testing
  const totalValue = portfolioData.totalValue || 100000;
  
  return {
    marketCrash: {
      portfolioImpact: -0.30, // 30% decline
      potentialLoss: totalValue * 0.30,
      recoveryTime: '12-18 months'
    },
    interestRateShock: {
      portfolioImpact: -0.15, // 15% impact from rate changes
      potentialLoss: totalValue * 0.15,
      affectedAssets: ['Bonds', 'Banking stocks']
    },
    inflationSpike: {
      realReturn: -0.08, // 8% inflation impact
      purchasingPowerLoss: totalValue * 0.08
    }
  };
}