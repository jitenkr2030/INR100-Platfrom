# Lesson 3: Risk Measurement Techniques

## Learning Objectives
By the end of this lesson, you will be able to:
- Use various metrics to measure investment risk
- Calculate and interpret key risk indicators
- Apply risk measurement tools to assess portfolio risk
- Make informed decisions based on risk metrics

## Why Measure Risk?

Risk measurement provides objective tools to:
- **Quantify Uncertainty**: Put numbers to potential losses
- **Compare Investments**: Evaluate different options objectively
- **Monitor Portfolios**: Track risk changes over time
- **Make Decisions**: Data-driven investment choices
- **Communicate**: Discuss risk with advisors and family

### The Problem with "Feelings"
- **Subjective**: Different people perceive risk differently
- **Emotional**: Fear and greed distort risk perception
- **Unreliable**: Same person may feel differently at different times
- **Incomparable**: Hard to compare different investments

## Key Risk Measurement Metrics

### 1. Standard Deviation

#### Definition
Statistical measure showing how much returns vary from the average return.

#### Calculation
- **Data Points**: Historical returns over time period
- **Average Return**: Mean of all returns
- **Deviation**: Difference between each return and average
- **Standard Deviation**: Root mean square of deviations

#### Interpretation
- **Low Std Dev (5-10%)**: Stable, predictable returns
- **Medium Std Dev (10-20%)**: Moderate fluctuation
- **High Std Dev (20%+)**: High volatility, unpredictable

#### Real-World Examples

**Fixed Deposit:**
- **Standard Deviation**: 0% (guaranteed return)
- **Interpretation**: No volatility, but low returns

**Large Cap Mutual Fund:**
- **Standard Deviation**: 15-20%
- **Interpretation**: Moderate fluctuation, potential for growth

**Small Cap Fund:**
- **Standard Deviation**: 25-35%
- **Interpretation**: High volatility, higher potential returns

#### Standard Deviation Calculation Example

**Monthly Returns Data:**
- Jan: +2%, Feb: -1%, Mar: +3%, Apr: -2%, May: +1%
- **Average Return**: (2-1+3-2+1)/5 = 0.6%
- **Deviations**: +1.4, -1.6, +2.4, -2.6, +0.4
- **Squared Deviations**: 1.96, 2.56, 5.76, 6.76, 0.16
- **Average Squared Deviation**: 17.2/5 = 3.44
- **Standard Deviation**: √3.44 = 1.85%

### 2. Beta (Systematic Risk)

#### Definition
Measures how much a stock or fund moves relative to the market index.

#### Beta Interpretation
- **Beta = 1**: Moves in line with market
- **Beta > 1**: More volatile than market
- **Beta < 1**: Less volatile than market
- **Beta = 0**: No correlation with market

#### Beta Examples

**Reliance Industries (Beta ~1.2):**
- **Market Moves 10%**: Reliance typically moves 12%
- **Market Risk**: Highly sensitive to market movements
- **Systematic Risk**: Cannot be diversified away

**HDFC Bank (Beta ~0.9):**
- **Market Moves 10%**: HDFC Bank typically moves 9%
- **Lower Volatility**: Smoother than market
- **Defensive Nature**: More stable during market stress

**Gold ETF (Beta ~0.1):**
- **Market Moves 10%**: Gold ETF typically moves 1%
- **Low Correlation**: Moves independently of stocks
- **Diversification Benefit**: Reduces portfolio volatility

#### Beta Calculation

**Method: Linear Regression**
- **X-axis**: Market returns
- **Y-axis**: Stock/fund returns
- **Slope**: Beta coefficient
- **Interpretation**: Slope of best-fit line

**Example Data:**
| Month | Sensex Return | Stock Return |
|-------|---------------|--------------|
| Jan   | +2%           | +2.4%        |
| Feb   | -1%           | -1.2%        |
| Mar   | +3%           | +3.6%        |
| Apr   | -2%           | -2.4%        |
| May   | +1%           | +1.2%        |

**Beta Calculation**: Slope ≈ 1.2
**Interpretation**: Stock moves 20% more than market

### 3. Alpha (Excess Return)

#### Definition
Measures risk-adjusted performance above or below the expected return.

#### Alpha Formula
**Alpha = Actual Return - [Risk-free Rate + Beta × (Market Return - Risk-free Rate)]**

#### Interpretation
- **Positive Alpha**: Outperforming risk-adjusted expectations
- **Negative Alpha**: Underperforming risk-adjusted expectations
- **Zero Alpha**: Meeting risk-adjusted expectations

#### Alpha Examples

**Fund A:**
- **Actual Return**: 15%
- **Risk-free Rate**: 6%
- **Market Return**: 10%
- **Beta**: 1.2
- **Expected Return**: 6 + 1.2 × (10-6) = 10.8%
- **Alpha**: 15 - 10.8 = 4.2% (Good)

**Fund B:**
- **Actual Return**: 8%
- **Risk-free Rate**: 6%
- **Market Return**: 10%
- **Beta**: 1.2
- **Expected Return**: 6 + 1.2 × (10-6) = 10.8%
- **Alpha**: 8 - 10.8 = -2.8% (Poor)

### 4. Maximum Drawdown

#### Definition
Largest peak-to-trough decline in portfolio value.

#### Calculation Steps
1. **Identify Peaks**: Highest portfolio values
2. **Find Troughs**: Lowest values after each peak
3. **Calculate Drawdowns**: (Peak - Trough) / Peak
4. **Find Maximum**: Largest drawdown over period

#### Drawdown Categories
- **Minor Drawdown**: 5-10% decline
- **Moderate Drawdown**: 10-20% decline
- **Major Drawdown**: 20-30% decline
- **Severe Drawdown**: 30%+ decline

#### Real Drawdown Examples

**Sensex Historical Drawdowns:**
- **2008 Crisis**: -60% from peak to trough
- **2020 COVID**: -37% decline in one month
- **2013 Taper Tantrum**: -15% over 3 months
- **Normal Correction**: -10% to -15% (common)

**Recovery Times:**
- **2008 Crisis**: 4 years to recover
- **2020 COVID**: 6 months to recover
- **2013 Event**: 1 year to recover

### 5. Value at Risk (VaR)

#### Definition
Maximum expected loss over a specific time period at a given confidence level.

#### VaR Interpretation
- **95% VaR**: 5% chance of losing more than this amount
- **99% VaR**: 1% chance of losing more than this amount
- **Time Horizon**: Usually daily, monthly, or annual

#### VaR Calculation Example

**Investment: ₹1,00,000**
- **95% VaR (1 day)**: ₹2,500
- **Interpretation**: 95% confident that daily loss won't exceed ₹2,500
- **Alternative**: 5% chance of losing more than ₹2,500 in one day

#### VaR Applications
- **Portfolio Risk**: Overall portfolio maximum expected loss
- **Position Sizing**: How much to invest in risky assets
- **Risk Limits**: Set maximum acceptable losses
- **Stress Testing**: How portfolio performs in extreme scenarios

### 6. Sharpe Ratio

#### Definition
Measures risk-adjusted return by comparing excess return to volatility.

#### Sharpe Ratio Formula
**Sharpe Ratio = (Portfolio Return - Risk-free Rate) / Portfolio Standard Deviation**

#### Interpretation
- **Sharpe Ratio > 1**: Good risk-adjusted performance
- **Sharpe Ratio 0.5-1**: Average risk-adjusted performance
- **Sharpe Ratio < 0.5**: Poor risk-adjusted performance
- **Negative**: Better to hold risk-free assets

#### Sharpe Ratio Examples

**Fund A:**
- **Return**: 15%
- **Risk-free Rate**: 6%
- **Standard Deviation**: 18%
- **Sharpe Ratio**: (15-6)/18 = 0.5 (Average)

**Fund B:**
- **Return**: 12%
- **Risk-free Rate**: 6%
- **Standard Deviation**: 10%
- **Sharpe Ratio**: (12-6)/10 = 0.6 (Good)

**Fund C:**
- **Return**: 18%
- **Risk-free Rate**: 6%
- **Standard Deviation**: 25%
- **Sharpe Ratio**: (18-6)/25 = 0.48 (Average)

## Risk Measurement Tools

### 1. Excel/Google Sheets Calculations

#### Standard Deviation Formula
```
=STDEV.P(range_of_returns)
```

#### Beta Calculation
```
=SLOPE(stock_returns, market_returns)
```

#### Sharpe Ratio
```
=(AVERAGE(returns) - risk_free_rate) / STDEV(returns)
```

#### Maximum Drawdown
```
=MIN((running_max - current_value) / running_max)
```

### 2. Online Risk Calculators

#### Mutual Fund Risk Calculators
- **ValueResearch**: Fund risk metrics
- **Moneycontrol**: Portfolio risk analysis
- **Morningstar**: Risk-adjusted ratings
- **Fund Fact Sheets**: Standard risk measures

#### Portfolio Risk Tools
- **CAMS Risk Profiler**: Online risk assessment
- **KFintech Analyzer**: Portfolio risk metrics
- **MF Utility**: Unified risk analysis
- **BSE Risk Calculator**: Market risk tools

### 3. Professional Risk Management Software

#### Portfolio Management Systems
- **Risk Metrics**: Real-time risk monitoring
- **Stress Testing**: Scenario analysis
- **Correlation Analysis**: Relationship mapping
- **VaR Calculation**: Maximum expected loss

## Applying Risk Measurements

### 1. Individual Investment Analysis

#### Stock Risk Profile
**Reliance Industries Example:**
- **Standard Deviation**: 25% annually
- **Beta**: 1.2 (above-market volatility)
- **Maximum Drawdown**: -40% (2008 crisis)
- **VaR (95%)**: ₹2,500 per ₹1,00,000 investment daily

#### Mutual Fund Risk Profile
**Large Cap Fund Example:**
- **Standard Deviation**: 18% annually
- **Beta**: 0.95 (close to market)
- **Alpha**: +2% (slight outperformance)
- **Sharpe Ratio**: 0.55 (good risk-adjusted returns)

### 2. Portfolio Risk Assessment

#### Diversified Portfolio Example

**Portfolio Composition:**
- **40% Large Cap Fund**: Std Dev 18%
- **30% Debt Fund**: Std Dev 6%
- **20% Mid Cap Fund**: Std Dev 28%
- **10% Gold**: Std Dev 15%

**Portfolio Calculations:**
- **Weighted Average Std Dev**: 
  = (0.4×18) + (0.3×6) + (0.2×28) + (0.1×15)
  = 7.2 + 1.8 + 5.6 + 1.5 = 16.1%

**Benefits of Diversification:**
- **Individual Asset Risks**: 18%, 6%, 28%, 15%
- **Portfolio Risk**: 16.1%
- **Risk Reduction**: Through correlation benefits

### 3. Risk Comparison Analysis

#### Comparing Investment Options

**Investment A (Large Cap Fund):**
- **Return**: 12%
- **Standard Deviation**: 16%
- **Beta**: 0.9
- **Sharpe Ratio**: 0.38

**Investment B (Mid Cap Fund):**
- **Return**: 15%
- **Standard Deviation**: 25%
- **Beta**: 1.3
- **Sharpe Ratio**: 0.36

**Investment C (Balanced Fund):**
- **Return**: 10%
- **Standard Deviation**: 12%
- **Beta**: 0.7
- **Sharpe Ratio**: 0.33

**Analysis:**
- **Highest Return**: Investment B (15%)
- **Lowest Risk**: Investment C (12% std dev)
- **Best Risk-Adjusted**: Investment A (0.38 Sharpe)

## Risk Monitoring and Alerts

### 1. Regular Risk Assessment

#### Monthly Risk Check
- **Portfolio Volatility**: Current vs historical
- **Maximum Drawdown**: Current decline from peak
- **VaR Levels**: Risk within acceptable limits
- **Correlation Changes**: Asset relationships

#### Quarterly Risk Review
- **Beta Drift**: Portfolio sensitivity to market
- **Alpha Generation**: Risk-adjusted performance
- **Stress Test Results**: Performance in scenarios
- **Risk Limit Compliance**: Within predefined limits

### 2. Risk Alert Systems

#### Automated Alerts
- **Drawdown Limits**: Alert when portfolio down 10%
- **Volatility Spikes**: When std dev increases 50%
- **Correlation Changes**: When assets move together
- **VaR Breaches**: When risk exceeds limits

#### Manual Monitoring
- **Daily Portfolio Check**: Basic risk overview
- **Weekly Analysis**: Detailed metrics review
- **Monthly Reports**: Comprehensive risk assessment
- **Quarterly Strategy**: Risk management review

## Advanced Risk Metrics

### 1. Conditional Value at Risk (CVaR)

#### Definition
Expected loss in worst-case scenarios beyond VaR.

#### CVaR Example
- **95% VaR**: ₹5,000
- **CVaR**: ₹8,000
- **Interpretation**: In worst 5% of cases, expect to lose ₹8,000

#### Applications
- **Tail Risk**: Focus on extreme losses
- **Stress Testing**: Worst-case scenario planning
- **Risk Management**: Prepare for severe market events

### 2. Tracking Error

#### Definition
Measure of how closely a fund follows its benchmark.

#### Tracking Error Interpretation
- **Low Tracking Error**: Close to benchmark performance
- **High Tracking Error**: Diverges significantly from benchmark
- **Zero**: Perfect benchmark replication

#### Example
**Index Fund Tracking Error:**
- **Target**: Nifty 50 Index
- **Tracking Error**: 0.5%
- **Interpretation**: Fund returns deviate 0.5% from index

### 3. Information Ratio

#### Definition
Measure of risk-adjusted active return.

#### Formula
**Information Ratio = Active Return / Tracking Error**

#### Interpretation
- **Higher is Better**: More return per unit of active risk
- **Benchmark Dependent**: Measures active management success

## Risk Measurement in Different Asset Classes

### 1. Equity Risk Metrics

#### Stock-Specific Measures
- **Beta**: Market sensitivity
- **Standard Deviation**: Price volatility
- **Maximum Drawdown**: Peak-to-trough decline
- **VaR**: Maximum expected loss

#### Equity Fund Measures
- **Tracking Error**: Deviation from benchmark
- **Alpha**: Risk-adjusted outperformance
- **Sharpe Ratio**: Return per unit of risk
- **Information Ratio**: Active return efficiency

### 2. Debt Risk Metrics

#### Interest Rate Risk
- **Duration**: Sensitivity to interest rate changes
- **Convexity**: Curvature of price-yield relationship
- **DV01**: Price change per basis point rate change

#### Credit Risk
- **Credit Rating**: Probability of default
- **Spread Duration**: Sensitivity to credit spread changes
- **Default Probability**: Statistical default likelihood

#### Liquidity Risk
- **Bid-Ask Spread**: Transaction cost measure
- **Market Depth**: Ability to trade without price impact
- **Settlement Risk**: Counterparty default probability

### 3. Real Estate Risk Metrics

#### Market Risk
- **Price Volatility**: Property value fluctuations
- **Liquidity Risk**: Time to sell property
- **Market Correlation**: Relationship with other assets

#### Property-Specific Risk
- **Location Risk**: Area-specific factors
- **Tenant Risk**: Rental income uncertainty
- **Maintenance Risk**: Repair and upkeep costs

## Practical Risk Measurement Implementation

### 1. Building a Risk Dashboard

#### Key Metrics to Track
- **Portfolio Standard Deviation**: Overall volatility
- **Maximum Drawdown**: Peak-to-trough decline
- **Beta**: Market sensitivity
- **VaR**: Maximum expected loss
- **Sharpe Ratio**: Risk-adjusted performance

#### Dashboard Template
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Portfolio Std Dev | 16% | <18% | ✓ Good |
| Maximum Drawdown | -8% | <-15% | ✓ Good |
| Portfolio Beta | 0.95 | 0.8-1.2 | ✓ Good |
| 95% VaR (Daily) | ₹3,200 | <₹5,000 | ✓ Good |
| Sharpe Ratio | 0.45 | >0.4 | ✓ Good |

### 2. Risk Limit Setting

#### Portfolio-Level Limits
- **Maximum Drawdown**: Never more than 20%
- **Volatility**: Standard deviation <20%
- **VaR**: Daily VaR <₹10,000 per ₹1,00,000
- **Beta**: Between 0.7 and 1.3

#### Position-Level Limits
- **Single Stock**: Maximum 5% of portfolio
- **Single Sector**: Maximum 20% of portfolio
- **Single Fund House**: Maximum 30% of portfolio

### 3. Risk Reporting

#### Monthly Risk Report
- **Executive Summary**: Key risk metrics and changes
- **Portfolio Metrics**: Current risk measurements
- **Stress Test Results**: Performance in adverse scenarios
- **Compliance Status**: Risk limits adherence

#### Quarterly Risk Review
- **Risk Attribution**: Sources of portfolio risk
- **Performance Analysis**: Risk-adjusted returns
- **Correlation Analysis**: Asset relationship changes
- **Strategy Recommendations**: Risk management adjustments

## Case Study: Risk Measurement in Action

### Scenario: Portfolio Risk Assessment

#### Investor Profile
- **Age**: 35, aggressive investor
- **Portfolio**: ₹10 lakh diversified equity
- **Goal**: Wealth creation, 15+ year horizon
- **Risk Tolerance**: High, can handle 25% drawdowns

#### Current Portfolio Analysis

**Asset Allocation:**
- **50% Large Cap Fund**: ₹5 lakh
- **30% Mid Cap Fund**: ₹3 lakh
- **20% Small Cap Fund**: ₹2 lakh

**Risk Metrics Calculation:**

**Large Cap Component:**
- **Standard Deviation**: 18%
- **Beta**: 0.95
- **Weight**: 50%

**Mid Cap Component:**
- **Standard Deviation**: 25%
- **Beta**: 1.2
- **Weight**: 30%

**Small Cap Component:**
- **Standard Deviation**: 35%
- **Beta**: 1.4
- **Weight**: 20%

**Portfolio Risk Metrics:**

**Portfolio Standard Deviation:**
= √[(0.5²×18²) + (0.3²×25²) + (0.2²×35²)]
= √[(0.25×324) + (0.09×625) + (0.04×1225)]
= √[81 + 56.25 + 49] = √186.25 = 13.65%

**Portfolio Beta:**
= (0.5×0.95) + (0.3×1.2) + (0.2×1.4)
= 0.475 + 0.36 + 0.28 = 1.115

**Maximum Drawdown Estimate:**
- **Historical Average**: 30-40% for such portfolio
- **Expected Range**: -25% to -35%
- **Recovery Time**: 18-30 months

**VaR (95% Daily):**
- **Estimated Daily VaR**: ₹6,800 per ₹1,00,000
- **Portfolio VaR**: ₹68,000 (₹6,800 × 10)

#### Risk Assessment Results

**Strengths:**
- **Diversification**: Spread across market caps
- **High Return Potential**: Growth-oriented allocation
- **Long Horizon**: Time to recover from volatility

**Concerns:**
- **High Volatility**: 13.65% portfolio std dev
- **Market Sensitivity**: 1.115 beta (above market)
- **Drawdown Risk**: Could lose 30%+ in crisis

**Recommendations:**
1. **Monitor Closely**: Monthly risk metric review
2. **Rebalancing**: Reduce allocation if volatility increases
3. **Emergency Fund**: Maintain separate ₹6 lakh emergency fund
4. **Stress Testing**: Regular scenario analysis

## Assessment Questions

1. **Standard deviation measures:**
   - a) How much returns vary from the average
   - b) The maximum loss possible
   - c) The correlation with market
   - d) The guaranteed minimum return

2. **A Beta of 1.5 means the investment:**
   - a) Moves 50% less than the market
   - b) Moves in line with the market
   - c) Moves 50% more than the market
   - d) Has no correlation with the market

3. **The Sharpe Ratio helps investors:**
   - a) Calculate maximum possible loss
   - b) Measure risk-adjusted performance
   - c) Determine correlation between assets
   - d) Predict future returns

**Answers**: 1-a, 2-c, 3-b

## Key Takeaways

- Risk measurement provides objective tools to assess investment uncertainty
- Standard deviation measures return variability, Beta measures market sensitivity
- Maximum drawdown shows peak-to-trough declines
- VaR estimates maximum expected losses at given confidence levels
- Sharpe ratio measures risk-adjusted performance
- Regular monitoring and risk limits help maintain appropriate risk levels

## Next Lesson Preview
In the next lesson, we'll explore drawdowns in detail - understanding how to measure, manage, and recover from portfolio declines.