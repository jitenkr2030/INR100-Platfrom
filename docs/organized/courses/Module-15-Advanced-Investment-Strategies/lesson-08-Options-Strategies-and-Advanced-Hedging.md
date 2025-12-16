# Lesson 08: Options Strategies and Advanced Hedging

## Learning Objectives

By the end of this lesson, you will be able to:
- Master advanced options strategies for different market conditions
- Understand complex hedging techniques using options and derivatives
- Analyze Greeks and their impact on options pricing and risk management
- Implement covered calls, protective puts, and collar strategies
- Create synthetic positions and understand put-call parity
- Design multi-leg options strategies for specific risk-reward profiles

## Table of Contents

1. [Advanced Options Fundamentals](#advanced-options-fundamentals)
2. [Covered Call Strategies](#covered-call-strategies)
3. [Protective Put and Collar Strategies](#protective-put-and-collar-strategies)
4. [Complex Multi-Leg Strategies](#complex-multi-leg-strategies)
5. [Greeks and Risk Management](#greeks-and-risk-management)
6. [Synthetic Positions and Put-Call Parity](#synthetic-positions-and-put-call-parity)
7. [Volatility-Based Strategies](#volatility-based-strategies)
8. [Real-World Applications in Indian Markets](#real-world-applications-in-indian-markets)
9. [Practical Exercises](#practical-exercises)

## Advanced Options Fundamentals

### Options on Indian Securities

Options trading in India is conducted on NSE (National Stock Exchange) with standardized contract specifications:

#### Contract Specifications
- **Underlying Assets**: Individual stocks, indices (Nifty, Bank Nifty), commodities
- **Contract Size**: Typically 75, 150, 250 shares per contract (varies by stock)
- **Exercise Types**: European (indices) and American (stocks)
- **Expiration**: Monthly contracts with weekly options for popular instruments
- **Strike Intervals**: ₹1 to ₹10 depending on stock price

#### Settlement Mechanism
```
Cash Settlement Formula:
Settlement Amount = (Closing Price - Strike Price) × Lot Size × Number of Contracts
```

### Advanced Greeks and Risk Metrics

#### Delta (Δ) - Price Sensitivity
Delta measures the change in option price for a ₹1 change in underlying price.

**Call Option Delta**: 
```
Δ_call = e^(-rT) × N(d1)
```
Where N(d1) is the cumulative standard normal distribution.

**Put Option Delta**:
```
Δ_put = e^(-rT) × (N(d1) - 1)
```

#### Gamma (Γ) - Rate of Delta Change
Gamma measures how much delta changes for a ₹1 change in underlying price.

```
Γ = (N'(d1)) / (S × σ × √T × e^(-rT))
```

#### Theta (Θ) - Time Decay
Theta measures the change in option value as time passes (time decay).

```
Θ_call = -[S × N'(d1) × σ / (2√T)] - r × K × e^(-rT) × N(d2)
Θ_put = -[S × N'(d1) × σ / (2√T)] + r × K × e^(-rT) × N(-d2)
```

#### Vega (ν) - Volatility Sensitivity
Vega measures sensitivity to changes in implied volatility.

```
ν = S × √T × N'(d1)
```

#### Rho (ρ) - Interest Rate Sensitivity
Rho measures sensitivity to interest rate changes.

```
ρ_call = K × T × e^(-rT) × N(d2)
ρ_put = -K × T × e^(-rT) × N(-d2)
```

### Implied Volatility Smile and Skew

#### Volatility Smile
Shows higher implied volatility for deep out-of-the-money (OTM) puts and calls.

**Causes**:
- Supply and demand imbalances
- Fear of extreme market movements
- Risk premiums for tail events

#### Volatility Skew/Smirk
Common pattern where OTM puts have higher implied volatility than OTM calls.

**Market Implications**:
- Indicates put/call imbalance
- Reflects market's expectation of downside risk
- Influences pricing of protective puts

## Covered Call Strategies

### Basic Covered Call Construction

#### Setup
- **Long Position**: 100 shares of underlying stock
- **Short Position**: 1 OTM call option

#### Profit and Loss Profile
```
Maximum Profit = (Strike Price - Purchase Price + Premium Received) × Shares
Maximum Loss = (Purchase Price - Strike Price) × Shares
Breakeven Point = Purchase Price - Premium Received
```

#### Example: Infosys Covered Call
**Current Stock Price**: ₹1,500
**Purchase Price**: ₹1,450
**Call Strike**: ₹1,550
**Premium Received**: ₹25

```
Maximum Profit = (1,550 - 1,450 + 25) × 100 = ₹12,500
Maximum Loss = (1,450 - Strike if assigned) × 100 = Potential stock loss
Breakeven = 1,450 - 25 = ₹1,425
```

### Rolling Covered Calls

#### Rolling Up
When stock price increases above strike, roll to higher strike.

**Rolling Decision Framework**:
1. **Time Remaining**: More than 15 days to expiration
2. **Delta Threshold**: Call delta > 0.25
3. **Assignment Risk**: High probability of assignment

#### Rolling Down
When stock price falls, roll to lower strike.

**Benefits**:
- Maintain income generation
- Reduce breakeven point
- Extend option duration

### Rolling Strategies

#### The "SMART" Roll Method
- **S**top: At specific delta or time thresholds
- **M**ove: To next expiration cycle
- **A**dvance: Strike price appropriately
- **R**ecognize: Market conditions and volatility
- **T**rack: Greeks and portfolio metrics

#### Calendar Roll Example
**Current Position**: Infosys Jan 1550 Call (-1)
**Action**: Buy back Jan call and sell Feb 1550 call

**Net Cash Flow**: Roll premium difference
**Risk Profile**: Extended time decay benefit

### Naked vs. Covered Call Risks

#### Naked Call Risks
- **Unlimited Loss**: Stock can rise indefinitely
- **Margin Requirements**: High capital requirements
- **Assignment Risk**: Cannot be hedged effectively

#### Covered Call Benefits
- **Limited Risk**: Downside protected by stock position
- **Income Generation**: Premium income regardless of market direction
- **Lower Margin**: Minimal margin requirements

## Protective Put and Collar Strategies

### Protective Put Strategy

#### Basic Structure
- **Long Position**: Stock shares
- **Long Position**: OTM put option (insurance)

#### Risk-Return Profile
```
Maximum Loss = (Purchase Price - Put Strike + Put Premium) × Shares
Maximum Profit = Unlimited
Breakeven Point = Purchase Price + Put Premium
```

#### Protective Put Example: TCS
**Current Price**: ₹3,500
**Purchase Price**: ₹3,200
**Put Strike**: ₹3,000
**Put Premium**: ₹50

```
Maximum Loss = (3,200 - 3,000 + 50) × 100 = ₹25,000
Breakeven = 3,200 + 50 = ₹3,250
Profit Potential = Unlimited above ₹3,500
```

### Collar Strategy Construction

#### Setup Components
1. **Long Stock Position**: Core holdings
2. **Long OTM Put**: Downside protection
3. **Short OTM Call**: Income generation to offset put cost

#### Profit Profile Analysis
```
Maximum Profit = (Call Strike - Purchase Price - Net Premium) × Shares
Maximum Loss = (Purchase Price - Put Strike + Net Premium) × Shares
```

#### Collar Example: ICICI Bank
**Current Price**: ₹950
**Purchase Price**: ₹850
**Put Strike**: ₹800
**Call Strike**: ₹1,050
**Put Premium**: ₹15
**Call Premium**: ₹12
**Net Premium Cost**: ₹3

```
Maximum Profit = (1,050 - 850 - 3) × 100 = ₹19,700
Maximum Loss = (850 - 800 + 3) × 100 = ₹5,300
Net Position**: Capped upside with limited downside protection
```

### Collar Variations

#### Costless Collar
**Goal**: Zero net premium cost
**Structure**: Balance put and call premiums

**Construction Process**:
1. Select protective put strike
2. Calculate put premium cost
3. Find call strike with equal premium received
4. Adjust strike prices for perfect cost balance

#### Yield Enhancement Collar
**Objective**: Generate positive net premium income
**Method**: Choose OTM call strikes with higher premiums

**Risk**: Reduced upside participation
**Benefit**: Enhanced income generation

### Dynamic Collar Management

#### Delta-Based Adjustments
**Call Delta Monitoring**:
- Call delta > 0.35: Consider rolling up
- Call delta < 0.15: Consider rolling down
- Time decay consideration: Adjust 15+ days to expiration

#### Time-Based Adjustments
**Monthly Review Cycle**:
1. Evaluate current Greeks
2. Assess assignment probability
3. Calculate potential roll returns
4. Consider portfolio rebalancing needs

## Complex Multi-Leg Strategies

### Vertical Spreads

#### Bull Call Spread
**Setup**: Buy lower strike call, sell higher strike call
**Market Outlook**: Moderately bullish
**Maximum Profit**: (Higher Strike - Lower Strike - Net Debit) × Contract Size
**Maximum Loss**: Net Debit × Contract Size

**Example**: Reliance Bull Call Spread
- Buy 2100 Call @ ₹75
- Sell 2150 Call @ ₹45
- Net Debit: ₹30

```
Maximum Profit = (2150 - 2100 - 30) × 75 = ₹1,500
Maximum Loss = 30 × 75 = ₹2,250
```

#### Bear Put Spread
**Setup**: Buy higher strike put, sell lower strike put
**Market Outlook**: Moderately bearish
**Profit Profile**: Inverted version of bull call spread

#### Risk-Reward Comparison
```
Bull Call Spread Breakeven = Lower Strike + Net Debit
Bear Put Spread Breakeven = Higher Strike - Net Debit
```

### Calendar Spreads

#### Front Calendar Spread
**Structure**: Buy longer-term option, sell near-term option
**Volatility Play**: Expect volatility increase before near-term expiration

#### Back Calendar Spread
**Structure**: Sell longer-term option, buy near-term option
**Volatility Play**: Expect volatility decrease before near-term expiration

#### Calendar Spread Greeks
**Delta**: Approximately zero at initiation
**Gamma**: Negative (beneficial for volatility strategies)
**Theta**: Positive (time decay benefit)
**Vega**: Positive (volatility increase benefits)

### Butterfly Spreads

#### Long Butterfly
**Setup**: Buy 2 ATM options, sell 1 ITM and 1 OTM option
**Structure**: 
- Buy 1 ITM Call (Strike A)
- Buy 1 OTM Call (Strike C)  
- Sell 2 ATM Calls (Strike B)

**Profit Zone**: Stock stays near middle strike
**Maximum Profit**: Middle Strike - Lower Strike - Net Debit

#### Butterfly Example: SBI
**Current Price**: ₹600
**Structure**:
- Buy 580 Call @ ₹30
- Buy 620 Call @ ₹15
- Sell 600 Calls (2) @ ₹22 each

**Net Debit**: ₹30 + ₹15 - ₹44 = ₹1
**Maximum Profit**: ₹20 - ₹1 = ₹19 per share

### Iron Condor Strategy

#### Construction
1. **Sell OTM Call** (Upper Strike)
2. **Buy Further OTM Call** (Protection)
3. **Sell OTM Put** (Lower Strike)
4. **Buy Further OTM Put** (Protection)

#### Profit Profile
**Maximum Profit**: Net Credit Received
**Maximum Loss**: Width of Call Spread + Net Credit OR Width of Put Spread + Net Credit

#### Iron Condor Example: Axis Bank
**Current Price**: ₹1,050
**Structure**:
- Sell 1100 Call @ ₹15
- Buy 1120 Call @ ₹8
- Sell 1000 Put @ ₹12
- Buy 980 Put @ ₹6

**Net Credit**: ₹15 - ₹8 + ₹12 - ₹6 = ₹13
**Maximum Profit**: ₹13 × 75 = ₹975
**Maximum Loss**: ₹20 × 75 - ₹975 = ₹525

## Greeks and Risk Management

### Delta Hedging Strategies

#### Delta-Neutral Portfolio
**Objective**: Maintain portfolio delta close to zero
**Method**: Adjust option positions based on underlying price changes

**Rebalancing Triggers**:
- Delta exceeds ±0.05 threshold
- Time decay consideration
- Volatility changes

#### Dynamic Hedging Example
**Portfolio**: 10 Nifty Futures + Various Options
**Target Delta**: 0
**Current Delta**: +15

**Hedging Action**: 
- Sell 15 Nifty Futures
- Or adjust option positions to reduce delta

### Gamma Trading

#### High Gamma Strategies
**Long Options Position**: Positive gamma benefits from volatility
**Market View**: Expect increased price movement

#### Low Gamma Strategies  
**Short Options Position**: Benefits from time decay
**Market View**: Expect reduced volatility

#### Gamma Scalping
**Process**: Continuously hedge delta to capture volatility premium
**Requirements**: 
- Active monitoring
- Transaction cost management
- Adequate capital for hedging

### Vega Risk Management

#### Volatility Risk Assessment
**Vega Exposure**: Measure of volatility sensitivity
**Portfolio Vega**: Sum of individual option vegas

#### Volatility Hedging
**Long Vega Position**: Benefit from volatility increases
**Short Vega Position**: Benefit from volatility decreases

**Hedging Example**:
- Long 100 Nifty 17000 Calls (vega = 15 each)
- Short 50 Nifty 17000 Puts (vega = 12 each)
- Net Vega: 1500 - 600 = +900

### Theta Optimization

#### Time Decay Strategies
**Short Options**: Benefit from theta decay
**Long Options**: Suffer from theta decay

#### Theta Decay Optimization
**Optimal Strategy Selection**:
1. Analyze time to expiration
2. Assess implied volatility levels
3. Consider transaction costs
4. Evaluate assignment risks

## Synthetic Positions and Put-Call Parity

### Put-Call Parity Theory

#### Mathematical Relationship
```
C - P = S - PV(K)
```
Where:
- C = Call option price
- P = Put option price  
- S = Current stock price
- PV(K) = Present value of strike price

#### Arbitrage Opportunity
**When**: C - P ≠ S - PV(K)
**Action**: Execute trades to profit from mispricing
**Risk**: Minimal (cash and carry arbitrage)

### Synthetic Long Stock

#### Construction
**Components**:
- Long Call Option
- Short Put Option
- Long T-Bill (present value of strike)

**Payoff Profile**: Identical to owning stock
**Advantages**: Lower capital requirement
**Disadvantages**: Time decay, margin requirements

#### Example: Synthetic SBI
**Current Price**: ₹600
**Strike**: ₹620
**Call Premium**: ₹25
**Put Premium**: ₹35
**Risk-free Rate**: 6%

**Synthetic Cost**: ₹25 - ₹35 + PV(₹620) = ₹584.12
**Actual Stock Cost**: ₹600
**Arbitrage Opportunity**: ₹15.88 per share

### Synthetic Short Stock

#### Structure
- Short Call
- Long Put
- Short T-Bill

**Use Cases**:
- Capital preservation
- Income generation
- Tax optimization

### Conversion and Reversal Strategies

#### Conversion
**Setup**: Long Stock + Short Call + Long Put
**Result**: Risk-free profit if mispricing exists

#### Reversal  
**Setup**: Short Stock + Long Call + Short Put
**Purpose**: Exploit put-call parity violations

#### Conversion Example
**Current Price**: ₹500
**Strike**: ₹520
**Call**: ₹15
**Put**: ₹25
**Risk-free Rate**: 6%

**Conversion Cost**: ₹500 + ₹15 - ₹25 = ₹490
**Risk-free Value**: PV(₹520) = ₹490.57
**Profit**: ₹0.57 per share

## Volatility-Based Strategies

### Straddle Strategies

#### Long Straddle
**Setup**: Buy Call and Put at same strike
**Market View**: Expect significant price movement (either direction)
**Profit Zone**: Price moves beyond breakeven points

**Breakeven Points**:
- Upper: Strike + Total Premium
- Lower: Strike - Total Premium

#### Short Straddle
**Setup**: Sell Call and Put at same strike
**Market View**: Expect minimal price movement
**Risk**: Unlimited (in both directions)

### Strangle Strategies

#### Long Strangle
**Components**: Buy OTM Call and OTM Put
**Advantage**: Lower cost than straddle
**Requirement**: Larger price movement for profitability

#### Strangle vs. Straddle Comparison
```
Straddle Cost: Higher
Strangle Cost: Lower
Straddle Breakeven: Closer to current price
Strangle Breakeven: Further from current price
```

### Ratio Spreads

#### Call Ratio Spread
**Structure**: Sell more calls than bought at higher strikes
**Market View**: Moderately bullish with capped upside

#### Put Ratio Spread
**Structure**: Sell more puts than bought at lower strikes  
**Market View**: Moderately bearish with capped downside

### Volatility Trading Strategies

#### Volatility Crush
**Strategy**: Short options before earnings announcements
**Timing**: 2-3 days before earnings
**Risk**: Post-earnings volatility expansion

#### Volatility Expansion
**Strategy**: Long options before major announcements
**Timing**: 1-2 weeks before events
**Benefit**: Potential volatility increase

## Real-World Applications in Indian Markets

### Sector-Specific Options Strategies

#### Banking Sector (Nifty Bank)
**Characteristics**: 
- High correlation with interest rates
- Regulatory announcement sensitivity
- Seasonal patterns

**Recommended Strategies**:
- Covered calls on banking stocks
- Protective puts during rate hike cycles
- Calendar spreads around RBI policy meetings

#### IT Sector (Nifty IT)
**Characteristics**:
- USD-INR correlation
- Global market sensitivity
- Earnings season volatility

**Strategy Applications**:
- Volatility strategies during earnings
- Currency hedging with options
- International correlation plays

#### FMCG Sector
**Characteristics**:
- Defensive nature
- Stable cash flows
- Lower volatility

**Optimal Approaches**:
- Conservative covered calls
- Long-term protective puts
- Income-focused strategies

### Market Event Strategies

#### Budget Day Options Trading
**Pre-Budget**:
- Long straddles/strangles
- Volatility expansion plays
- Calendar spreads

**Post-Budget**:
- Volatility crush strategies
- Directional bets on market reaction
- Sector-specific plays

#### Earnings Season Strategies
**Pre-Earnings**:
- Long volatility strategies
- Iron condors (short volatility)
- Calendar spreads

**Post-Earnings**:
- Directional strategies
- Volatility mean reversion
- Gap-filling strategies

### Regulatory Considerations

#### SEBI Guidelines
**Position Limits**:
- Individual stock: 1% of free float
- Index derivatives: Specific limits per category

**Margin Requirements**:
- Initial margin: Based on VaR methodology
- Exposure-based margins for naked positions

**Reporting Requirements**:
- Large position reporting
- Daily position monitoring
- Risk management compliance

#### Tax Implications
**Options Trading**:
- Speculative business income
- STT (Securities Transaction Tax) applicable
- GST implications for service providers

**Hedging Transactions**:
- Business purpose justification
- Documentation requirements
- Hedging vs. speculation classification

### Risk Management Framework

#### Position Sizing Rules
```
Maximum Single Position: 2% of portfolio
Maximum Sector Exposure: 10% of portfolio
Maximum Options Exposure: 5% of portfolio
```

#### Stop-Loss Mechanisms
**Options Positions**:
- Time-based stops (30 days to expiration)
- Delta-based stops (delta > 0.7)
- Volatility-based stops (IV increase > 50%)

**Portfolio Level**:
- Daily VaR limits
- Stress testing scenarios
- Correlation monitoring

## Practical Exercises

### Exercise 1: Covered Call Analysis

**Scenario**: You own 200 shares of Wipro bought at ₹450
**Current Price**: ₹520
**Available Options**:
- 540 Call: ₹8
- 560 Call: ₹15
- 580 Call: ₹25

**Tasks**:
1. Calculate maximum profit for each strike
2. Determine breakeven points
3. Assess assignment probabilities
4. Recommend optimal strategy

**Solution Approach**:
- Analyze delta values for each call
- Consider time to expiration
- Evaluate income generation potential
- Factor in dividend expectations

### Exercise 2: Protective Put Design

**Portfolio**: ₹10 lakh equity portfolio
**Risk Tolerance**: Maximum 15% drawdown
**Time Horizon**: 6 months

**Requirements**:
1. Design protective put strategy
2. Calculate put premium costs
3. Determine optimal strike selection
4. Analyze portfolio insurance effectiveness

### Exercise 3: Iron Condor Construction

**Underlying**: Nifty @ 17,500
**Market Outlook**: Range-bound between 17,200-17,800
**Available Strikes**: Every 100 points
**IV Level**: 20%

**Construction Tasks**:
1. Select appropriate strikes
2. Calculate potential profit/loss
3. Assess probability of profit
4. Determine optimal position size

### Exercise 4: Greeks Analysis

**Portfolio Composition**:
- Long 50 Nifty 17500 Calls
- Short 30 Nifty 17500 Puts
- Long 20 Nifty 17200 Calls
- Short 15 Nifty 17800 Puts

**Analysis Requirements**:
1. Calculate net Greeks
2. Assess portfolio risk profile
3. Recommend hedging adjustments
4. Evaluate time decay impact

### Exercise 5: Volatility Strategy

**Market Context**: 
- Pre-earnings season
- Current IV: 25%
- Historical IV: 35%
- Expected move: 4%

**Strategy Selection**:
1. Choose between straddle/strangle
2. Calculate optimal strikes
3. Assess risk-reward profile
4. Plan exit strategy

## Advanced Portfolio Applications

### Options-Based Asset Allocation

#### Dynamic Asset Allocation
**Core Holdings**: 70% equities via covered calls
**Satellite Positions**: 20% volatility strategies
**Cash Reserve**: 10% for opportunities

**Rebalancing Triggers**:
- Market volatility expansion
- Sector rotation opportunities
- Yield enhancement needs

#### Risk Parity with Options
**Concept**: Equal risk contribution across asset classes
**Options Role**: Tail risk hedging
**Implementation**: Put options on correlation-sensitive portfolios

### Tax-Efficient Options Strategies

#### Harvesting Tax Losses
**Mechanism**: Close losing options positions before year-end
**Benefits**: Offset capital gains
**Considerations**: Wash sale rules

#### Tax-Loss Harvesting with Options
**Strategy**: Use options to lock in losses
**Timing**: End of financial year
**Documentation**: Maintain trade records

### Institutional-Scale Applications

#### Market Making Strategies
**Objective**: Profit from bid-ask spreads
**Risk Management**: Delta hedging
**Capital Requirements**: Significant for inventory management

#### Risk Arbitrage
**Merger Arbitrage**: Options on target companies
**Spin-off Strategies**: Options on parent and subsidiary
**Special Situations**: Rights offerings, buybacks

## Technology and Trading Systems

### Options Trading Platforms

#### Key Features
- Real-time Greeks calculation
- Strategy builders
- Risk management tools
- Backtesting capabilities

#### Indian Platform Comparison
**NSE NOW**:
- Direct exchange connectivity
- Advanced order types
- Real-time data feeds

**Zerodha Kite**:
- User-friendly interface
- Strategy analysis tools
- Mobile trading support

### Algorithmic Options Trading

#### Strategy Automation
**Trend Following**: Options momentum strategies
**Mean Reversion**: Options reversion plays
**Volatility**: Systematic volatility trading

#### Implementation Considerations
- Latency requirements
- Market impact
- Regulatory compliance
- Risk management protocols

### Risk Management Systems

#### Real-Time Monitoring
**Position Tracking**: Continuous Greeks calculation
**Alert Systems**: Threshold-based notifications
**Stress Testing**: Scenario analysis tools

#### Portfolio Optimization
**Modern Portfolio Theory**: Options-enhanced efficient frontier
**Black-Litterman Model**: Incorporating options views
**Risk Budgeting**: Options allocation framework

## Conclusion

Mastering options strategies and advanced hedging techniques provides sophisticated tools for risk management and return enhancement in the Indian financial markets. Key takeaways include:

1. **Strategy Selection**: Choose appropriate strategies based on market outlook, risk tolerance, and capital constraints
2. **Risk Management**: Utilize Greeks for precise risk assessment and hedging decisions
3. **Volatility Trading**: Understand volatility dynamics for timing strategy execution
4. **Tax Optimization**: Consider tax implications in strategy design and implementation
5. **Regulatory Compliance**: Adhere to SEBI guidelines and margin requirements

The integration of options strategies with traditional portfolio management creates opportunities for enhanced risk-adjusted returns while providing downside protection and income generation capabilities.

## Key Takeaways

- **Greeks Mastery**: Understanding delta, gamma, theta, vega, and rho for precise risk management
- **Strategy Diversity**: Covered calls, protective puts, collars, and multi-leg spreads for various market conditions
- **Volatility Expertise**: Trading both implied and realized volatility for profit opportunities
- **Risk Management**: Position sizing, hedging techniques, and portfolio-level risk controls
- **Market Applications**: Real-world implementation in Indian markets with regulatory considerations

## Next Steps

In the next lesson, we will explore Private Equity and Venture Capital, understanding alternative investment strategies that offer unique risk-return profiles beyond traditional public market investments.

---

**Author**: MiniMax Agent  
**Course**: Advanced Investment Strategies  
**Module**: Options Strategies and Advanced Hedging  
**Lesson**: 08 of 10