import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { userId, portfolioData, marketData, userPreferences } = await request.json();

    if (!portfolioData) {
      return NextResponse.json({ error: 'Portfolio data is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Calculate portfolio metrics
    const portfolioMetrics = calculatePortfolioMetrics(portfolioData);
    
    // Get AI-powered analysis
    const analysisPrompt = `You are an expert financial analyst. Analyze the following portfolio data and provide comprehensive insights:

    Portfolio Data: ${JSON.stringify(portfolioData)}
    Calculated Metrics: ${JSON.stringify(portfolioMetrics)}
    Market Data: ${JSON.stringify(marketData || {})}
    User Preferences: ${JSON.stringify(userPreferences || {})}
    
    Current Date: ${new Date().toLocaleDateString('en-IN')}

    Provide a detailed analysis including:
    1. Portfolio performance assessment
    2. Risk-return analysis
    3. Diversification evaluation
    4. Asset allocation optimization
    5. Specific actionable recommendations
    6. Risk factors and mitigation strategies
    7. Performance benchmarking
    
    Format as JSON:
    {
      "overallScore": number (0-100),
      "performance": {
        "score": number,
        "summary": string,
        "benchmarkComparison": string
      },
      "riskAnalysis": {
        "riskScore": number,
        "riskLevel": "low" | "medium" | "high",
        "keyRisks": string[],
        "mitigationStrategies": string[]
      },
      "diversification": {
        "diversificationScore": number,
        "allocationAnalysis": string,
        "recommendations": string[]
      },
      "recommendations": [
        {
          "priority": "high" | "medium" | "low",
          "category": string,
          "action": string,
          "rationale": string,
          "expectedImpact": string
        }
      ],
      "assetAllocation": {
        "currentAllocation": object,
        "targetAllocation": object,
        "rebalancingSuggestions": string[]
      },
      "summary": string,
      "keyInsights": string[]
    }`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a certified financial analyst with expertise in Indian markets. Provide data-driven, actionable portfolio analysis with specific metrics and recommendations.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.6,
      max_tokens: 2500
    });

    const aiAnalysis = completion.choices[0]?.message?.content;
    
    if (!aiAnalysis) {
      throw new Error('No analysis from AI');
    }

    let analysis;
    try {
      analysis = JSON.parse(aiAnalysis);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      analysis = {
        overallScore: portfolioMetrics.healthScore || 75,
        performance: { score: 75, summary: aiAnalysis },
        riskAnalysis: { riskScore: 30, riskLevel: 'medium', keyRisks: ['Market volatility'], mitigationStrategies: ['Diversification'] },
        diversification: { diversificationScore: 65, allocationAnalysis: 'Moderate diversification', recommendations: ['Add international exposure'] },
        recommendations: [{ priority: 'medium', category: 'Diversification', action: 'Add international funds', rationale: 'Improve diversification', expectedImpact: 'Risk reduction' }],
        summary: aiAnalysis
      };
    }

    // Enhance with calculated metrics
    const enhancedAnalysis = {
      ...analysis,
      calculatedMetrics: portfolioMetrics,
      timestamp: new Date().toISOString(),
      userId: userId || null
    };

    return NextResponse.json({
      success: true,
      data: enhancedAnalysis
    });

  } catch (error) {
    console.error('Portfolio Analysis Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze portfolio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function calculatePortfolioMetrics(portfolioData: any) {
  try {
    const totalValue = portfolioData.totalValue || 0;
    const totalInvested = portfolioData.totalInvested || 0;
    const returns = totalValue - totalInvested;
    const returnsPercentage = totalInvested > 0 ? (returns / totalInvested) * 100 : 0;
    
    // Asset allocation analysis
    const assetAllocation = portfolioData.assetAllocation || [];
    const allocationCount = assetAllocation.length;
    const maxAllocation = Math.max(...assetAllocation.map((asset: any) => asset.percentage || 0), 0);
    
    // Risk assessment based on allocation
    let riskScore = 30; // Base risk
    if (maxAllocation > 40) riskScore += 20; // High concentration risk
    if (maxAllocation > 60) riskScore += 20; // Very high concentration risk
    if (allocationCount < 3) riskScore += 15; // Low diversification
    if (returnsPercentage > 30) riskScore += 10; // High returns might indicate high risk
    
    riskScore = Math.min(Math.max(riskScore, 0), 100);
    
    // Health score calculation
    let healthScore = 50; // Base score
    
    // Diversification bonus
    if (allocationCount >= 4) healthScore += 20;
    else if (allocationCount >= 3) healthScore += 15;
    else if (allocationCount >= 2) healthScore += 10;
    
    // Performance bonus
    if (returnsPercentage > 0) healthScore += Math.min(returnsPercentage * 2, 25);
    else if (returnsPercentage < -20) healthScore -= 20;
    
    // Concentration penalty
    if (maxAllocation > 50) healthScore -= 15;
    else if (maxAllocation > 40) healthScore -= 10;
    
    healthScore = Math.min(Math.max(healthScore, 0), 100);
    
    return {
      totalValue,
      totalInvested,
      returns,
      returnsPercentage: Math.round(returnsPercentage * 100) / 100,
      assetCount: allocationCount,
      maxAllocation: Math.round(maxAllocation),
      riskScore: Math.round(riskScore),
      healthScore: Math.round(healthScore),
      diversificationScore: allocationCount >= 4 ? 80 : allocationCount >= 3 ? 65 : 50,
      performanceRating: returnsPercentage > 20 ? 'excellent' : 
                       returnsPercentage > 10 ? 'good' : 
                       returnsPercentage > 0 ? 'average' : 'poor'
    };
  } catch (error) {
    console.error('Error calculating portfolio metrics:', error);
    return {
      totalValue: 0,
      totalInvested: 0,
      returns: 0,
      returnsPercentage: 0,
      assetCount: 0,
      maxAllocation: 0,
      riskScore: 50,
      healthScore: 50,
      diversificationScore: 50,
      performanceRating: 'unknown'
    };
  }
}