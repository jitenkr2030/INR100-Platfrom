# Lesson 190: Derivatives and Risk Management Strategies

## Learning Objectives
By the end of this lesson, you will be able to:
- Understand the fundamentals of derivatives and their role in risk management
- Master options, futures, and swaps strategies for portfolio protection
- Apply advanced hedging techniques for various market scenarios
- Analyze the risks and rewards of derivatives trading
- Build comprehensive risk management frameworks using derivatives

## Core Content

### 1. Introduction to Derivatives and Risk Management

Derivatives are financial instruments whose value is derived from underlying assets, indices, or rates. They serve as powerful tools for risk management, speculation, and arbitrage. In the context of portfolio management, derivatives help investors hedge risks, enhance returns, and achieve specific investment objectives.

**Key Principle**: "Derivatives are tools, not weapons - proper use enhances portfolio performance while improper use amplifies risks"

### 2. Types of Derivatives

#### 2.1 Forwards and Futures
**Forward Contracts:**
- **Customized Agreements**: Bilateral contracts with specific terms
- **Over-the-Counter (OTC)**: Negotiated between parties
- **Settlement**: Physical or cash delivery at maturity
- **Credit Risk**: Counterparty default risk

**Futures Contracts:**
- **Standardized Contracts**: Exchange-traded with uniform terms
- **Mark-to-Market**: Daily settlement of gains and losses
- **Margin Requirements**: Initial and maintenance margins
- **Clearing House**: Counterparty risk mitigation

**Indian Futures Market:**
- **NSE Futures**: Equity, index, and commodity futures
- **MCX Futures**: Commodity derivatives
- **Currency Futures**: USD/INR and other currency pairs
- **Interest Rate Futures**: Government securities futures

#### 2.2 Options
**Option Basics:**
- **Call Options**: Right to buy underlying asset
- **Put Options**: Right to sell underlying asset
- **Strike Price**: Exercise price of the option
- **Expiration**: Time until option expires

**Option Styles:**
- **European Options**: Exercise only at expiration
- **American Options**: Exercise anytime before expiration
- **Bermudan Options**: Exercise on specific dates
- **Asian Options**: Payoff based on average price

**Greeks - Risk Measures:**
- **Delta**: Price sensitivity to underlying movement
- **Gamma**: Rate of change of delta
- **Theta**: Time decay of option value
- **Vega**: Sensitivity to volatility changes
- **Rho**: Sensitivity to interest rate changes

#### 2.3 Swaps
**Interest Rate Swaps:**
- **Fixed-for-Floating**: Exchange fixed for floating payments
- **Currency Swaps**: Exchange principal and interest in different currencies
- **Basis Swaps**: Exchange floating rates based on different indices
- **Commodity Swaps**: Exchange fixed for floating commodity prices

### 3. Risk Management Applications

#### 3.1 Portfolio Hedging Strategies
**Equity Portfolio Protection:**
- **Protective Put**: Buy puts to protect against downside
- **Collar Strategy**: Buy puts and sell calls
- **Index Futures Hedge**: Short index futures to hedge equity exposure
- **Sector Rotation**: Use sector futures for sector hedging

**Example: Protective Put Strategy**
```
Portfolio Value: ₹1 crore
Current NIFTY Level: 17,500
Buy NIFTY Put (Strike: 17,000, Premium: ₹150)
Hedge Cost: ₹150 per NIFTY point
Maximum Loss Protection: ₹500 per point below strike
```

#### 3.2 Currency Risk Management
**Import-Export Hedging:**
- **Forward Contracts**: Lock in exchange rates
- **Options**: Right but not obligation to exchange
- **Currency Swaps**: Long-term exchange rate hedging

**Portfolio Currency Risk:**
- **Foreign Investment Hedging**: Hedge international exposure
- **Revenue Hedging**: Hedge foreign currency receipts
- **Cost Hedging**: Hedge foreign currency payments

#### 3.3 Commodity Risk Management
**Price Risk Hedging:**
- **Producers**: Use futures to lock in selling prices
- **Consumers**: Use futures to lock in buying costs
- **Processors**: Hedge processing margins

**Agricultural Hedging:**
- **Crop Insurance**: Weather and price protection
- **Storage Hedging**: Inventory value protection
- **Basis Risk**: Local vs. futures price differences

### 4. Advanced Options Strategies

#### 4.1 Income Generation Strategies
**Covered Call Writing:**
- **Strategy**: Own underlying, sell call options
- **Objective**: Generate additional income
- **Risk**: Limited upside potential
- **Breakeven**: Purchase price minus premium received

**Cash-Secured Put Writing:**
- **Strategy**: Sell put options with cash collateral
- **Objective**: Generate income or acquire stock at discount
- **Risk**: Obligation to buy at strike price
- **Maximum Gain**: Premium received

#### 4.2 Volatility Strategies
**Long Straddle:**
- **Strategy**: Buy call and put at same strike
- **Objective**: Profit from large price movements
- **Breakeven**: Strike ± total premium paid
- **Best Case**: Large price move in either direction

**Long Strangle:**
- **Strategy**: Buy call and put at different strikes
- **Objective**: Cheaper than straddle with larger moves
- **Breakeven**: Lower strike - premium or upper strike + premium
- **Risk**: Premium loss if price doesn't move enough

#### 4.3 Directional Strategies
**Bull Call Spread:**
- **Strategy**: Buy lower strike call, sell higher strike call
- **Objective**: Limited risk, limited reward bullish play
- **Maximum Loss**: Net premium paid
- **Maximum Gain**: Strike difference minus premium paid

**Bear Put Spread:**
- **Strategy**: Buy higher strike put, sell lower strike put
- **Objective**: Limited risk, limited reward bearish play
- **Maximum Loss**: Net premium paid
- **Maximum Gain**: Strike difference minus premium paid

### 5. Risk Management Framework

#### 5.1 Value at Risk (VaR) and Stress Testing
**VaR Calculation:**
- **Historical Simulation**: Use past returns distribution
- **Parametric Method**: Assume normal distribution
- **Monte Carlo**: Simulate thousands of scenarios
- **Confidence Levels**: 95% or 99% VaR

**Stress Testing:**
- **Historical Scenarios**: Previous market crashes
- **Hypothetical Scenarios**: Extreme but plausible events
- **Reverse Stress Testing**: Identify events causing losses
- **Liquidity Stress**: Market impact during stress

#### 5.2 Position Sizing and Risk Limits
**Position Sizing Models:**
- **Fixed Fractional**: Fixed percentage of capital per trade
- **Kelly Criterion**: Optimal position sizing
- **Risk Parity**: Equal risk contribution
- **Volatility-Based**: Adjust for volatility differences

**Risk Limits:**
- **Position Limits**: Maximum position size
- **Sector Limits**: Concentration limits by sector
- **Counterparty Limits**: Credit exposure limits
- **VaR Limits**: Maximum acceptable VaR

#### 5.3 Hedging Effectiveness
**Hedge Ratio Calculation:**
- **Minimum Variance Hedge**: Optimal hedge ratio
- **Regression-Based**: Statistical hedge ratio
- **Duration-Based**: Interest rate hedging
- **Beta-Based**: Systematic risk hedging

**Hedge Performance Monitoring:**
- **Hedge Effectiveness**: Percentage of risk eliminated
- **Basis Risk**: Imperfect correlation between hedge and exposure
- **Roll Costs**: Cost of maintaining hedge positions
- **P&L Attribution**: Source of hedging profits/losses

### 6. Derivatives in Indian Markets

#### 6.1 Exchange-Traded Derivatives
**NSE Derivatives:**
- **NIFTY 50 Futures**: Index futures and options
- **Bank NIFTY**: Banking sector derivatives
- **Stock Futures**: Individual stock derivatives
- **Interest Rate Futures**: Government securities

**MCX Derivatives:**
- **Commodity Futures**: Gold, silver, crude oil, natural gas
- **Agricultural Commodities**: Wheat, cotton, sugar
- **Base Metals**: Copper, aluminum, zinc
- **Energy**: Crude oil, natural gas, heating oil

#### 6.2 Over-the-Counter (OTC) Derivatives
**Currency Derivatives:**
- **Forward Contracts**: Customized currency hedging
- **Currency Swaps**: Long-term currency exchange
- **Non-Deliverable Forwards**: Offshore rupee trading

**Interest Rate Derivatives:**
- **Interest Rate Swaps**: Corporate and institutional hedging
- **Forward Rate Agreements**: Short-term rate hedging
- **Caps and Floors**: Interest rate ceiling and floor

### 7. Regulatory Framework

#### 7.1 SEBI Regulations
**Derivatives Trading:**
- **Eligibility Criteria**: Stock and index eligibility
- **Position Limits**: Speculative and hedge limits
- **Margin Requirements**: Initial and maintenance margins
- **Risk Management**: Exchange and broker risk controls

**Investor Protection:**
- **Settlement Guarantee**: Exchange guarantee fund
- **Disclosure Requirements**: Risk disclosure documents
- **Investor Grievances**: Redressal mechanisms
- **Surveillance**: Market monitoring and surveillance

#### 7.2 International Standards
**Basel III Impact:**
- **Capital Requirements**: Higher capital for derivatives
- **Liquidity Requirements**: LCR and NSFR impact
- **Risk Weights**: Counterparty credit risk
- **Operational Risk**: Process and system risks

**ISDA Documentation:**
- **Master Agreement**: Framework for OTC trades
- **Credit Support Annex**: Collateral requirements
- **Confirmations**: Trade-specific terms
- **Close-out Netting**: Termination rights

### 8. Advanced Risk Management Techniques

#### 8.1 Dynamic Hedging
**Rebalancing Strategies:**
- **Time-Based**: Regular hedge rebalancing
- **Trigger-Based**: Hedge when thresholds breached
- **Volatility-Based**: Adjust based on volatility changes
- **Cost-Benefit**: Balance hedging costs vs benefits

**Option Greeks Management:**
- **Delta Hedging**: Maintain delta neutrality
- **Gamma Trading**: Profit from volatility changes
- **Theta Harvesting**: Time decay income
- **Vega Management**: Volatility exposure control

#### 8.2 Portfolio Insurance
**CPPI Strategy:**
- **Constant Proportion Portfolio Insurance**
- **Floor Value**: Minimum portfolio value
- **Multiplier**: Risk exposure factor
- **Rebalancing**: Maintain constant proportion

**OBPI Strategy:**
- **Option-Based Portfolio Insurance**
- **Protective Put**: Buy puts for floor protection
- **Dynamic**: Adjust strike prices over time
- **Guaranteed**: Floor value protection

### 9. Practical Applications

#### 9.1 Corporate Treasury Management
**Foreign Exchange Hedging:**
- **Transaction Risk**: Hedge specific transactions
- **Translation Risk**: Hedge accounting exposures
- **Economic Risk**: Hedge competitive positions
- **Internal Hedging**: Netting and matching

**Interest Rate Risk:**
- **Debt Hedging**: Hedge floating rate debt
- **Asset-Liability Matching**: Match asset and liability durations
- **Cash Flow Hedging**: Hedge future interest payments
- **Fair Value Hedging**: Hedge fixed rate debt value

#### 9.2 Institutional Portfolio Management
**Pension Fund Strategies:**
- **LDI**: Liability-driven investment strategies
- **Duration Matching**: Match asset duration to liabilities
- **Inflation Hedging**: Real return requirements
- **Glide Path**: Risk reduction over time

**Insurance Company Strategies:**
- **Asset-Liability Management**: Match duration and cash flows
- **Guarantee Hedging**: Hedge product guarantees
- **Surplus Optimization**: Maximize risk-adjusted returns
- **Regulatory Capital**: Optimize capital efficiency

### 10. Technology and Automation

#### 10.1 Risk Management Systems
**Real-Time Risk Monitoring:**
- **Position Tracking**: Real-time portfolio positions
- **Risk Metrics**: VaR, Greeks, stress scenarios
- **Alert Systems**: Risk limit breaches
- **Reporting**: Automated risk reports

**Derivative Pricing Models:**
- **Black-Scholes**: European option pricing
- **Binomial Models**: American option pricing
- **Monte Carlo**: Complex derivative pricing
- **Finite Difference**: PDE-based models

#### 10.2 Algorithmic Trading
**Program Trading:**
- **Index Arbitrage**: Index vs basket trading
- **Pairs Trading**: Relative value strategies
- **Momentum Trading**: Trend-following strategies
- **Mean Reversion**: Contrarian strategies

**High-Frequency Trading:**
- **Market Making**: Providing liquidity
- **Arbitrage**: Price discrepancies
- **Latency Arbitrage**: Speed advantages
- **Statistical Arbitrage**: Quantitative strategies

## Assessment Questions

### Multiple Choice Questions

1. **What is the primary purpose of buying a protective put option?**
   a) Generate income from existing holdings
   b) Protect against downside price movement
   c) Benefit from increased volatility
   d) Lock in a selling price for future sale

2. **In options terminology, what does "delta" measure?**
   a) Rate of change of option price with respect to time
   b) Rate of change of option price with respect to volatility
   c) Rate of change of option price with respect to underlying price
   d) Rate of change of option price with respect to interest rates

3. **What is the main advantage of futures contracts over forward contracts?**
   a) Lower transaction costs
   b) Daily mark-to-market settlement
   c) Customized terms and conditions
   d) Longer contract maturities

### Short Answer Questions

1. **Explain the difference between hedging and speculation in derivatives trading.**

2. **Describe how Value at Risk (VaR) is calculated and its limitations for risk management.**

3. **What is basis risk and how can it affect hedging effectiveness?**

### Application Questions

1. **Hedging Strategy**: You manage a ₹10 crore equity portfolio with a beta of 1.2 to NIFTY. Design a hedging strategy using NIFTY futures to reduce portfolio beta to 0.8. Calculate the number of futures contracts needed and explain the trade-offs involved.

2. **Options Strategy**: Create an options strategy for an investor who expects high volatility in a stock trading at ₹500 but is unsure of the direction. Compare the costs and risk-reward profiles of a straddle versus a strangle strategy.

## Key Takeaways

1. **Derivatives are powerful risk management tools** when used properly with clear objectives
2. **Understanding Greeks is essential** for managing options positions and risk
3. **Basis risk is a major concern** in hedging and requires careful monitoring
4. **Regulatory compliance is crucial** in derivatives trading and risk management
5. **Technology enables sophisticated risk management** but requires proper controls

## Next Steps

- Practice building and managing derivatives positions
- Study advanced options strategies and their applications
- Learn to use derivatives pricing and risk management software
- Understand regulatory requirements for derivatives trading
- Develop expertise in portfolio hedging and risk management

## Additional Resources

- **Books**: "Options, Futures, and Other Derivatives" by John Hull
- **Regulatory**: SEBI derivatives regulations, exchange rulebooks
- **Software**: Bloomberg, Reuters, specialized risk management platforms
- **Professional**: CFA derivatives curriculum, FRM certification
- **Exchange Resources**: NSE, MCX educational materials

---

*Derivatives and risk management are essential skills for sophisticated investors and financial professionals. Master these concepts to enhance portfolio performance and manage risk effectively.*