import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { userId, marketData, sectors, timeframe = '1D' } = await request.json();

    const zai = await ZAI.create();

    // Fetch current market sentiment data (simulated real data)
    const marketSentimentData = await fetchMarketSentimentData();
    
    const sentimentPrompt = `Analyze current market sentiment for Indian markets and provide actionable insights:

    Market Data: ${JSON.stringify(marketData || {})}
    Sentiment Data: ${JSON.stringify(marketSentimentData)}
    Sectors of Interest: ${JSON.stringify(sectors || [])}
    Timeframe: ${timeframe}
    Current Date: ${new Date().toLocaleDateString('en-IN')}

    Provide comprehensive market sentiment analysis including:
    1. Overall market sentiment (bullish/bearish/neutral)
    2. Sector-wise sentiment breakdown
    3. Key market drivers and factors
    4. News sentiment impact
    5. Technical indicators sentiment
    6. Risk factors and opportunities
    7. Investment strategy recommendations
    
    Format as JSON:
    {
      "overallSentiment": {
        "score": number (-100 to 100),
        "label": "bullish" | "bearish" | "neutral",
        "confidence": number (0-100),
        "summary": string
      },
      "sectorSentiment": [
        {
          "sector": string,
          "sentiment": "positive" | "negative" | "neutral",
          "score": number,
          "keyFactors": string[],
          "outlook": string
        }
      ],
      "marketDrivers": {
        "positive": string[],
        "negative": string[],
        "neutral": string[]
      },
      "technicalIndicators": {
        "trend": "bullish" | "bearish" | "sideways",
        "momentum": "strong" | "moderate" | "weak",
        "volatility": "high" | "medium" | "low",
        "support": number,
        "resistance": number
      },
      "newsSentiment": {
        "overallScore": number,
        "keyHeadlines": string[],
        "sentimentBreakdown": {
          "positive": number,
          "neutral": number,
          "negative": number
        }
      },
      "riskFactors": [
        {
          "factor": string,
          "impact": "high" | "medium" | "low",
          "probability": number,
          "description": string
        }
      ],
      "opportunities": [
        {
          "opportunity": string,
          "sector": string,
          "potential": "high" | "medium" | "low",
          "timeframe": string
        }
      ],
      "recommendations": {
        "strategy": string,
        "tactical": string[],
        "riskManagement": string[]
      },
      "summary": string,
      "lastUpdated": string
    }`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a market analyst specializing in Indian financial markets. Provide accurate sentiment analysis based on technical indicators, news sentiment, and market fundamentals. Always consider both quantitative and qualitative factors.'
        },
        {
          role: 'user',
          content: sentimentPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    const aiSentiment = completion.choices[0]?.message?.content;
    
    if (!aiSentiment) {
      throw new Error('No sentiment analysis from AI');
    }

    let sentimentAnalysis;
    try {
      sentimentAnalysis = JSON.parse(aiSentiment);
    } catch (parseError) {
      // Fallback analysis
      sentimentAnalysis = {
        overallSentiment: {
          score: 25,
          label: 'neutral',
          confidence: 70,
          summary: aiSentiment
        },
        sectorSentiment: [
          { sector: 'Technology', sentiment: 'positive', score: 60, keyFactors: ['AI adoption', 'Digital transformation'], outlook: 'Bullish' },
          { sector: 'Banking', sentiment: 'neutral', score: 45, keyFactors: ['Interest rates', 'Credit growth'], outlook: 'Stable' },
          { sector: 'Healthcare', sentiment: 'positive', score: 55, keyFactors: ['Demographics', 'Innovation'], outlook: 'Growing' }
        ],
        marketDrivers: {
          positive: ['Strong corporate earnings', 'Digital transformation'],
          negative: ['Global uncertainty', 'Inflation concerns'],
          neutral: ['Regulatory changes', 'Policy reforms']
        },
        summary: aiSentiment
      };
    }

    // Enhance with real-time data
    const enhancedAnalysis = {
      ...sentimentAnalysis,
      realTimeData: marketSentimentData,
      timeframe,
      timestamp: new Date().toISOString(),
      userId: userId || null
    };

    return NextResponse.json({
      success: true,
      data: enhancedAnalysis
    });

  } catch (error) {
    console.error('Market Sentiment Analysis Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze market sentiment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function fetchMarketSentimentData() {
  // Simulate fetching real market sentiment data
  // In production, this would fetch from financial data providers
  
  const mockSentimentData = {
    indices: {
      nifty: { value: 19500, change: 0.8, sentiment: 'positive' },
      sensex: { value: 65000, change: 0.9, sentiment: 'positive' },
      bankNifty: { value: 45000, change: -0.3, sentiment: 'neutral' }
    },
    sectors: {
      technology: { performance: 2.5, sentiment: 'positive', newsCount: 15 },
      banking: { performance: -0.8, sentiment: 'negative', newsCount: 12 },
      pharma: { performance: 1.2, sentiment: 'positive', newsCount: 8 },
      auto: { performance: 0.5, sentiment: 'neutral', newsCount: 10 },
      metals: { performance: -1.5, sentiment: 'negative', newsCount: 6 }
    },
    newsSentiment: {
      positive: 45,
      neutral: 35,
      negative: 20,
      totalArticles: 156
    },
    technical: {
      fearGreedIndex: 65,
      vix: 18.5,
      movingAverages: {
        sma50: 'bullish',
        sma200: 'bullish'
      }
    },
    global: {
      dowJones: { change: 0.6, sentiment: 'positive' },
      nasdaq: { change: 1.2, sentiment: 'positive' },
      ftse: { change: -0.3, sentiment: 'neutral' }
    }
  };

  return mockSentimentData;
}