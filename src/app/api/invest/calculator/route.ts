import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { calculationType, data } = body;

    switch (calculationType) {
      case 'sip_calculator':
        return calculateSIP(data);
      
      case 'lumpsum_calculator':
        return calculateLumpsum(data);
      
      case 'goal_calculator':
        return calculateGoal(data);
      
      case 'retirement_calculator':
        return calculateRetirement(data);
      
      case 'compound_interest':
        return calculateCompoundInterest(data);
      
      case 'emi_calculator':
        return calculateEMI(data);
      
      case 'present_value':
        return calculatePresentValue(data);
      
      case 'future_value':
        return calculateFutureValue(data);
      
      case 'risk_assessment':
        return performRiskAssessment(data);
      
      case 'portfolio_risk':
        return calculatePortfolioRisk(data);
      
      case 'diversification':
        return calculateDiversification(data);
      
      case 'correlation':
        return calculateCorrelation(data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid calculation type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Investment calculator error:', error);
    return NextResponse.json(
      { error: 'Calculation failed' },
      { status: 500 }
    );
  }
}

// SIP Calculator
function calculateSIP(data: any) {
  const { monthlyAmount, duration, expectedReturn, inflationRate } = data;

  if (!monthlyAmount || !duration || !expectedReturn) {
    return NextResponse.json(
      { error: 'Monthly amount, duration, and expected return are required' },
      { status: 400 }
    );
  }

  const monthlyRate = expectedReturn / 100 / 12;
  const months = duration * 12;
  const adjustedInflation = inflationRate || 0;

  // Future Value calculation
  const futureValue = monthlyAmount * 
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * 
    (1 + monthlyRate);

  // Real rate of return (adjusting for inflation)
  const realRate = (expectedReturn - adjustedInflation) / 100;
  const realMonthlyRate = realRate / 12;
  const realFutureValue = monthlyAmount * 
    ((Math.pow(1 + realMonthlyRate, months) - 1) / realMonthlyRate) * 
    (1 + realMonthlyRate);

  // Total investment
  const totalInvestment = monthlyAmount * months;

  // Estimated returns
  const estimatedReturns = futureValue - totalInvestment;

  // Year-wise breakdown
  const yearlyBreakdown = [];
  let runningValue = 0;
  let runningInvestment = 0;

  for (let year = 1; year <= duration; year++) {
    const yearEndMonth = year * 12;
    const yearInvestment = monthlyAmount * 12;
    runningInvestment += yearInvestment;
    
    const yearFutureValue = monthlyAmount * 
      ((Math.pow(1 + monthlyRate, yearEndMonth) - 1) / monthlyRate) * 
      (1 + monthlyRate);
    
    runningValue = yearFutureValue;
    
    yearlyBreakdown.push({
      year,
      investment: runningInvestment,
      value: runningValue,
      returns: runningValue - runningInvestment,
      returnsPercent: runningInvestment > 0 ? 
        ((runningValue - runningInvestment) / runningInvestment) * 100 : 0
    });
  }

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'sip_calculator',
      input: {
        monthlyAmount,
        duration,
        expectedReturn,
        inflationRate: adjustedInflation
      },
      result: {
        totalInvestment,
        futureValue: Math.round(futureValue),
        realFutureValue: Math.round(realFutureValue),
        estimatedReturns: Math.round(estimatedReturns),
        wealthGained: Math.round(estimatedReturns),
        maturityValue: Math.round(futureValue),
        yearlyBreakdown
      }
    }
  });
}

// Lumpsum Calculator
function calculateLumpsum(data: any) {
  const { amount, duration, expectedReturn, inflationRate } = data;

  if (!amount || !duration || !expectedReturn) {
    return NextResponse.json(
      { error: 'Amount, duration, and expected return are required' },
      { status: 400 }
    );
  }

  const annualRate = expectedReturn / 100;
  const adjustedInflation = inflationRate || 0;

  // Future Value calculation
  const futureValue = amount * Math.pow(1 + annualRate, duration);
  const realRate = (expectedReturn - adjustedInflation) / 100;
  const realFutureValue = amount * Math.pow(1 + realRate, duration);

  const estimatedReturns = futureValue - amount;

  // Year-wise breakdown
  const yearlyBreakdown = [];
  for (let year = 1; year <= duration; year++) {
    const yearValue = amount * Math.pow(1 + annualRate, year);
    yearlyBreakdown.push({
      year,
      investment: amount,
      value: Math.round(yearValue),
      returns: Math.round(yearValue - amount),
      returnsPercent: ((yearValue - amount) / amount) * 100
    });
  }

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'lumpsum_calculator',
      input: {
        amount,
        duration,
        expectedReturn,
        inflationRate: adjustedInflation
      },
      result: {
        totalInvestment: amount,
        futureValue: Math.round(futureValue),
        realFutureValue: Math.round(realFutureValue),
        estimatedReturns: Math.round(estimatedReturns),
        wealthGained: Math.round(estimatedReturns),
        maturityValue: Math.round(futureValue),
        yearlyBreakdown
      }
    }
  });
}

// Goal Calculator
function calculateGoal(data: any) {
  const { goalAmount, currentAge, goalAge, existingAmount, expectedReturn, inflationRate } = data;

  if (!goalAmount || !currentAge || !goalAge || !expectedReturn) {
    return NextResponse.json(
      { error: 'Goal amount, current age, goal age, and expected return are required' },
      { status: 400 }
    );
  }

  const yearsToGoal = goalAge - currentAge;
  const annualRate = expectedReturn / 100;
  const inflation = inflationRate || 6;

  // Adjust goal amount for inflation
  const inflationAdjustedGoal = goalAmount * Math.pow(1 + inflation / 100, yearsToGoal);

  // Calculate required SIP
  const requiredSIP = (inflationAdjustedGoal - (existingAmount || 0) * Math.pow(1 + annualRate, yearsToGoal)) * 
    annualRate / (Math.pow(1 + annualRate, yearsToGoal * 12) - 1);

  const monthlyRequired = Math.max(0, requiredSIP);

  // Alternative: Required lumpsum
  const requiredLumpsum = inflationAdjustedGoal / Math.pow(1 + annualRate, yearsToGoal);

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'goal_calculator',
      input: {
        goalAmount,
        currentAge,
        goalAge,
        yearsToGoal,
        existingAmount: existingAmount || 0,
        expectedReturn,
        inflationRate: inflation
      },
      result: {
        inflationAdjustedGoal: Math.round(inflationAdjustedGoal),
        requiredSIP: Math.round(monthlyRequired),
        requiredLumpsum: Math.round(requiredLumpsum),
        shortfall: Math.round(inflationAdjustedGoal - (existingAmount || 0) * Math.pow(1 + annualRate, yearsToGoal)),
        recommendations: {
          sipAmount: Math.round(monthlyRequired),
          lumpsumAmount: Math.round(requiredLumpsum),
          goalAchievable: monthlyRequired <= (existingAmount ? existingAmount / yearsToGoal / 12 : 5000)
        }
      }
    }
  });
}

// Retirement Calculator
function calculateRetirement(data: any) {
  const { currentAge, retirementAge, lifeExpectancy, currentIncome, expenseRatio, inflationRate, expectedReturn } = data;

  if (!currentAge || !retirementAge || !lifeExpectancy || !currentIncome || !expenseRatio) {
    return NextResponse.json(
      { error: 'All retirement parameters are required' },
      { status: 400 }
    );
  }

  const yearsToRetirement = retirementAge - currentAge;
  const retirementYears = lifeExpectancy - retirementAge;
  const inflation = inflationRate || 6;
  const returns = expectedReturn || 8;

  // Calculate retirement corpus required
  const annualExpenseAtRetirement = currentIncome * (expenseRatio / 100) * Math.pow(1 + inflation / 100, yearsToRetirement);
  const totalRetirementCorpus = annualExpenseAtRetirement * 
    ((1 - Math.pow(1 + returns / 100, -retirementYears)) / (returns / 100));

  // Required SIP
  const requiredSIP = totalRetirementCorpus * (returns / 100 / 12) / 
    (Math.pow(1 + returns / 100 / 12, yearsToRetirement * 12) - 1);

  // Alternative lumpsum required
  const requiredLumpsum = totalRetirementCorpus / Math.pow(1 + returns / 100, yearsToRetirement);

  // Current savings needed
  const currentSavingsNeeded = requiredLumpsum;

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'retirement_calculator',
      input: {
        currentAge,
        retirementAge,
        lifeExpectancy,
        currentIncome,
        expenseRatio,
        inflationRate: inflation,
        expectedReturn: returns
      },
      result: {
        yearsToRetirement,
        annualExpenseAtRetirement: Math.round(annualExpenseAtRetirement),
        totalRetirementCorpus: Math.round(totalRetirementCorpus),
        requiredSIP: Math.round(requiredSIP),
        requiredLumpsum: Math.round(requiredLumpsum),
        currentSavingsNeeded: Math.round(currentSavingsNeeded),
        monthlyIncomeNeeded: Math.round(annualExpenseAtRetirement / 12)
      }
    }
  });
}

// Compound Interest Calculator
function calculateCompoundInterest(data: any) {
  const { principal, rate, time, compoundingFrequency } = data;

  if (!principal || !rate || !time) {
    return NextResponse.json(
      { error: 'Principal, rate, and time are required' },
      { status: 400 }
    );
  }

  const n = compoundingFrequency || 1; // 1 = annually, 4 = quarterly, 12 = monthly, 365 = daily
  const r = rate / 100;

  const amount = principal * Math.pow(1 + r / n, n * time);
  const compoundInterest = amount - principal;

  // Time periods breakdown
  const breakdown = [];
  for (let period = 1; period <= time; period++) {
    const periodAmount = principal * Math.pow(1 + r / n, n * period);
    breakdown.push({
      period,
      amount: Math.round(periodAmount),
      interest: Math.round(periodAmount - principal),
      totalInterest: Math.round(periodAmount - principal)
    });
  }

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'compound_interest',
      input: { principal, rate, time, compoundingFrequency: n },
      result: {
        finalAmount: Math.round(amount),
        compoundInterest: Math.round(compoundInterest),
        breakdown
      }
    }
  });
}

// EMI Calculator
function calculateEMI(data: any) {
  const { loanAmount, interestRate, loanTenure, loanType } = data;

  if (!loanAmount || !interestRate || !loanTenure) {
    return NextResponse.json(
      { error: 'Loan amount, interest rate, and tenure are required' },
      { status: 400 }
    );
  }

  const P = loanAmount;
  const r = interestRate / (12 * 100); // Monthly interest rate
  const n = loanTenure * 12; // Total number of installments

  const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const totalInterest = emi * n - P;
  const totalAmount = emi * n;

  // Year-wise breakdown
  const yearlyBreakdown = [];
  let remainingPrincipal = P;

  for (let year = 1; year <= loanTenure; year++) {
    const yearEMI = emi * 12;
    const yearInterest = Math.min(totalInterest - (yearlyBreakdown.reduce((sum, y) => sum + y.interest, 0) || 0), yearEMI * 0.3);
    const yearPrincipal = yearEMI - yearInterest;
    
    remainingPrincipal -= yearPrincipal;

    yearlyBreakdown.push({
      year,
      emi: Math.round(yearEMI),
      principal: Math.round(yearPrincipal),
      interest: Math.round(yearInterest),
      balance: Math.max(0, Math.round(remainingPrincipal))
    });
  }

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'emi_calculator',
      input: { loanAmount, interestRate, loanTenure, loanType },
      result: {
        emi: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalAmount: Math.round(totalAmount),
        yearlyBreakdown
      }
    }
  });
}

// Present Value Calculator
function calculatePresentValue(data: any) {
  const { futureValue, discountRate, time } = data;

  if (!futureValue || !discountRate || !time) {
    return NextResponse.json(
      { error: 'Future value, discount rate, and time are required' },
      { status: 400 }
    );
  }

  const pv = futureValue / Math.pow(1 + discountRate / 100, time);

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'present_value',
      input: { futureValue, discountRate, time },
      result: {
        presentValue: Math.round(pv),
        discountAmount: Math.round(futureValue - pv)
      }
    }
  });
}

// Future Value Calculator
function calculateFutureValue(data: any) {
  const { presentValue, rate, time, compoundingFrequency } = data;

  if (!presentValue || !rate || !time) {
    return NextResponse.json(
      { error: 'Present value, rate, and time are required' },
      { status: 400 }
    );
  }

  const n = compoundingFrequency || 1;
  const r = rate / 100;

  const fv = presentValue * Math.pow(1 + r / n, n * time);

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'future_value',
      input: { presentValue, rate, time, compoundingFrequency: n },
      result: {
        futureValue: Math.round(fv),
        interestEarned: Math.round(fv - presentValue)
      }
    }
  });
}

// Risk Assessment
function performRiskAssessment(data: any) {
  const { age, income, investmentHorizon, riskTolerance, existingInvestments, goals } = data;

  if (!age || !income || !investmentHorizon || !riskTolerance) {
    return NextResponse.json(
      { error: 'Age, income, investment horizon, and risk tolerance are required' },
      { status: 400 }
    );
  }

  // Calculate risk score
  let riskScore = 0;

  // Age factor (younger = higher risk capacity)
  if (age < 30) riskScore += 30;
  else if (age < 40) riskScore += 20;
  else if (age < 50) riskScore += 10;
  else riskScore += 0;

  // Income factor
  if (income > 1000000) riskScore += 25;
  else if (income > 500000) riskScore += 20;
  else if (income > 300000) riskScore += 15;
  else riskScore += 10;

  // Investment horizon factor
  if (investmentHorizon > 10) riskScore += 25;
  else if (investmentHorizon > 5) riskScore += 20;
  else if (investmentHorizon > 3) riskScore += 15;
  else riskScore += 10;

  // Risk tolerance factor
  switch (riskTolerance.toLowerCase()) {
    case 'very high': riskScore += 20; break;
    case 'high': riskScore += 15; break;
    case 'moderate': riskScore += 10; break;
    case 'low': riskScore += 5; break;
    case 'very low': riskScore += 0; break;
  }

  // Determine risk profile
  let riskProfile = '';
  let assetAllocation = {};
  let recommendations = [];

  if (riskScore >= 80) {
    riskProfile = 'Aggressive';
    assetAllocation = {
      equity: 80,
      debt: 15,
      gold: 5
    };
    recommendations = [
      'Focus on growth-oriented equity funds',
      'Consider small and mid-cap funds',
      'Invest in sectoral and thematic funds',
      'Maintain long-term investment horizon'
    ];
  } else if (riskScore >= 60) {
    riskProfile = 'Moderately Aggressive';
    assetAllocation = {
      equity: 65,
      debt: 30,
      gold: 5
    };
    recommendations = [
      'Balanced equity funds recommended',
      'Include large-cap and multi-cap funds',
      'Some debt exposure for stability',
      'Regular rebalancing required'
    ];
  } else if (riskScore >= 40) {
    riskProfile = 'Balanced';
    assetAllocation = {
      equity: 50,
      debt: 45,
      gold: 5
    };
    recommendations = [
      'Balanced Advantage Funds',
      'Mix of equity and debt funds',
      'Systematic Investment Plans',
      'Gradual portfolio building'
    ];
  } else if (riskScore >= 20) {
    riskProfile = 'Conservative';
    assetAllocation = {
      equity: 30,
      debt: 65,
      gold: 5
    };
    recommendations = [
      'Debt funds and FDs',
      'Large-cap equity funds',
      'Capital protection focus',
      'Regular income focus'
    ];
  } else {
    riskProfile = 'Very Conservative';
    assetAllocation = {
      equity: 15,
      debt: 80,
      gold: 5
    };
    recommendations = [
      'Fixed Deposits and PPF',
      'Liquid and ultra-short term funds',
      'Capital preservation priority',
      'Steady returns focus'
    ];
  }

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'risk_assessment',
      input: { age, income, investmentHorizon, riskTolerance, existingInvestments, goals },
      result: {
        riskScore,
        riskProfile,
        assetAllocation,
        recommendations,
        riskFactors: {
          age: age < 30 ? 'High risk capacity' : age < 50 ? 'Moderate risk capacity' : 'Low risk capacity',
          income: income > 500000 ? 'High income stability' : 'Moderate income stability',
          horizon: investmentHorizon > 5 ? 'Long-term horizon' : 'Short-term horizon',
          tolerance: riskTolerance
        }
      }
    }
  });
}

// Portfolio Risk Calculator
function calculatePortfolioRisk(data: any) {
  const { holdings, weights } = data;

  if (!holdings || !weights || holdings.length !== weights.length) {
    return NextResponse.json(
      { error: 'Holdings and weights arrays are required and must be of same length' },
      { status: 400 }
    );
  }

  // Calculate portfolio metrics
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const normalizedWeights = weights.map(weight => weight / totalWeight);

  // Simulate volatility and correlation
  const portfolioVolatility = calculatePortfolioVolatility(holdings, normalizedWeights);
  const sharpeRatio = calculateSharpeRatio(holdings, normalizedWeights);
  const beta = calculatePortfolioBeta(holdings, normalizedWeights);

  // Risk decomposition
  const riskDecomposition = holdings.map((holding, index) => ({
    asset: holding.symbol || holding.name,
    weight: normalizedWeights[index],
    contributionToRisk: portfolioVolatility * normalizedWeights[index],
    riskContribution: (portfolioVolatility * normalizedWeights[index] / portfolioVolatility) * 100
  }));

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'portfolio_risk',
      input: { holdings, weights },
      result: {
        portfolioVolatility: Math.round(portfolioVolatility * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        beta: Math.round(beta * 100) / 100,
        riskDecomposition,
        riskLevel: portfolioVolatility > 25 ? 'High' : portfolioVolatility > 15 ? 'Moderate' : 'Low',
        diversificationScore: calculateDiversificationScore(holdings, normalizedWeights)
      }
    }
  });
}

// Diversification Calculator
function calculateDiversification(data: any) {
  const { holdings, sectors, marketCaps } = data;

  if (!holdings) {
    return NextResponse.json(
      { error: 'Holdings data is required' },
      { status: 400 }
    );
  }

  // Calculate sector diversification
  const sectorAllocation = {};
  holdings.forEach(holding => {
    const sector = holding.sector || 'Unknown';
    sectorAllocation[sector] = (sectorAllocation[sector] || 0) + (holding.weight || 0);
  });

  // Calculate market cap diversification
  const marketCapAllocation = {};
  holdings.forEach(holding => {
    const category = holding.marketCap || 'Unknown';
    marketCapAllocation[category] = (marketCapAllocation[category] || 0) + (holding.weight || 0);
  });

  // Calculate diversification score
  const herfindahlIndex = Object.values(sectorAllocation).reduce((sum, weight) => sum + Math.pow(weight / 100, 2), 0);
  const diversificationScore = (1 - herfindahlIndex) * 100;

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'diversification',
      input: { holdings, sectors, marketCaps },
      result: {
        sectorAllocation,
        marketCapAllocation,
        diversificationScore: Math.round(diversificationScore),
        diversificationLevel: diversificationScore > 70 ? 'Well Diversified' : 
                           diversificationScore > 50 ? 'Moderately Diversified' : 'Poorly Diversified',
        recommendations: getDiversificationRecommendations(sectorAllocation, marketCapAllocation)
      }
    }
  });
}

// Correlation Calculator
function calculateCorrelation(data: any) {
  const { assets, returns } = data;

  if (!assets || !returns || assets.length !== returns.length) {
    return NextResponse.json(
      { error: 'Assets and returns arrays are required and must be of same length' },
      { status: 400 }
    );
  }

  const correlationMatrix = [];
  for (let i = 0; i < assets.length; i++) {
    correlationMatrix[i] = [];
    for (let j = 0; j < assets.length; j++) {
      if (i === j) {
        correlationMatrix[i][j] = 1;
      } else {
        correlationMatrix[i][j] = calculateCorrelationCoefficient(returns[i], returns[j]);
      }
    }
  }

  return NextResponse.json({
    success: true,
    calculation: {
      type: 'correlation',
      input: { assets, returns },
      result: {
        correlationMatrix,
        averageCorrelation: calculateAverageCorrelation(correlationMatrix),
        highlyCorrelatedPairs: findHighlyCorrelatedPairs(assets, correlationMatrix),
        diversificationBenefit: calculateDiversificationBenefit(correlationMatrix)
      }
    }
  });
}

// Helper functions
function calculatePortfolioVolatility(holdings: any[], weights: number[]): number {
  // Simplified volatility calculation
  let portfolioVariance = 0;
  
  for (let i = 0; i < holdings.length; i++) {
    const weight = weights[i];
    const volatility = holdings[i].volatility || 20; // Default 20% volatility
    portfolioVariance += Math.pow(weight * volatility / 100, 2);
    
    // Add covariance terms (simplified)
    for (let j = i + 1; j < holdings.length; j++) {
      const covariance = (weights[i] * volatility / 100) * (weights[j] * (holdings[j].volatility || 20) / 100) * 0.3; // 30% correlation
      portfolioVariance += 2 * covariance;
    }
  }
  
  return Math.sqrt(portfolioVariance) * 100;
}

function calculateSharpeRatio(holdings: any[], weights: number[]): number {
  const riskFreeRate = 6; // 6% risk-free rate
  const portfolioReturn = holdings.reduce((sum, holding, index) => 
    sum + weights[index] * (holding.expectedReturn || 10), 0);
  const portfolioVolatility = calculatePortfolioVolatility(holdings, weights);
  
  return (portfolioReturn - riskFreeRate) / portfolioVolatility;
}

function calculatePortfolioBeta(holdings: any[], weights: number[]): number {
  const marketReturn = 12; // 12% market return
  const portfolioReturn = holdings.reduce((sum, holding, index) => 
    sum + weights[index] * (holding.expectedReturn || 10), 0);
  
  return portfolioReturn / marketReturn;
}

function calculateDiversificationScore(holdings: any[], weights: number[]): number {
  const herfindahlIndex = weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
  return (1 - herfindahlIndex) * 100;
}

function getDiversificationRecommendations(sectorAllocation: any, marketCapAllocation: any): string[] {
  const recommendations = [];
  
  // Check sector concentration
  const maxSectorWeight = Math.max(...Object.values(sectorAllocation));
  if (maxSectorWeight > 40) {
    recommendations.push('Reduce concentration in a single sector');
  }
  
  // Check market cap balance
  if (marketCapAllocation.largeCap > 70) {
    recommendations.push('Consider adding mid and small cap exposure');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Portfolio is well diversified');
  }
  
  return recommendations;
}

function calculateCorrelationCoefficient(returns1: number[], returns2: number[]): number {
  const n = Math.min(returns1.length, returns2.length);
  const mean1 = returns1.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  const mean2 = returns2.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  
  let numerator = 0;
  let sum1Sq = 0;
  let sum2Sq = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    sum1Sq += diff1 * diff1;
    sum2Sq += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sum1Sq * sum2Sq);
  return denominator === 0 ? 0 : numerator / denominator;
}

function calculateAverageCorrelation(correlationMatrix: number[][]): number {
  const n = correlationMatrix.length;
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      sum += correlationMatrix[i][j];
      count++;
    }
  }
  
  return count > 0 ? sum / count : 0;
}

function findHighlyCorrelatedPairs(assets: string[], correlationMatrix: number[][]): string[] {
  const pairs = [];
  
  for (let i = 0; i < assets.length; i++) {
    for (let j = i + 1; j < assets.length; j++) {
      if (Math.abs(correlationMatrix[i][j]) > 0.7) {
        pairs.push(`${assets[i]} - ${assets[j]}: ${correlationMatrix[i][j].toFixed(2)}`);
      }
    }
  }
  
  return pairs;
}

function calculateDiversificationBenefit(correlationMatrix: number[][]): number {
  const averageCorrelation = calculateAverageCorrelation(correlationMatrix);
  return (1 - averageCorrelation) * 100; // Higher benefit with lower correlation
}