import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding learning system...');

  // Create course categories
  const courses = [
    {
      id: 'stock-foundations',
      title: 'Stock Market Foundations',
      description: 'Beginner friendly introduction to stock market basics',
      category: 'stock-foundations',
      level: 'beginner',
      duration: '2-3 hours',
      lessons: 5,
      xpReward: 150,
      importance: 'high',
      icon: 'TrendingUp',
      color: 'bg-blue-100 text-blue-600',
      order: 1
    },
    {
      id: 'sip-wealth',
      title: 'SIP & Wealth Building',
      description: 'Master systematic investment and wealth creation',
      category: 'sip-wealth',
      level: 'beginner',
      duration: '2-3 hours',
      lessons: 4,
      xpReward: 175,
      importance: 'high',
      icon: 'PiggyBank',
      color: 'bg-purple-100 text-purple-600',
      order: 2
    },
    {
      id: 'scam-awareness',
      title: 'Scam Awareness',
      description: 'VERY IMPORTANT - Protect yourself from fraud',
      category: 'scam-awareness',
      level: 'beginner',
      duration: '1-2 hours',
      lessons: 3,
      xpReward: 100,
      importance: 'critical',
      icon: 'AlertTriangle',
      color: 'bg-yellow-100 text-yellow-800',
      order: 3
    }
  ];

  for (const courseData of courses) {
    await prisma.courseCategory.upsert({
      where: { id: courseData.id },
      update: {},
      create: courseData
    });
  }

  // Create lessons for Stock Market Foundations
  const stockFoundationsCourse = await prisma.courseCategory.findUnique({
    where: { id: 'stock-foundations' }
  });

  if (stockFoundationsCourse) {
    const stockLessons = [
      {
        id: 'stock-lesson-1',
        courseId: stockFoundationsCourse.id,
        title: 'What is a Stock Market?',
        content: `# What is a Stock Market?

## Introduction
A stock market is a marketplace where shares of publicly traded companies are bought and sold. Think of it as a massive digital auction house where buyers and sellers meet to trade ownership pieces of companies.

## How It Works
When you buy a stock, you're purchasing a small piece of ownership in that company. The price of stocks changes based on:
- Company performance
- Market demand and supply
- Economic conditions
- Investor sentiment

## Why Companies Issue Stocks
Companies issue stocks to:
- Raise capital for business growth
- Pay off debts
- Fund new projects
- Expand operations

## Key Players
- **Individual Investors**: People like you buying stocks
- **Institutional Investors**: Banks, pension funds, insurance companies
- **Market Makers**: Firms that provide liquidity
- **Regulators**: SEBI (Securities and Exchange Board of India)

## Benefits of Stock Market Investing
- **Ownership**: You become a part-owner of companies
- **Growth Potential**: Stocks can grow significantly over time
- **Dividends**: Some companies pay regular income
- **Liquidity**: Easy to buy and sell
- **Diversification**: Invest in different industries`,
        type: 'TEXT',
        order: 1,
        duration: 15,
        difficulty: 'beginner',
        xpReward: 30
      },
      {
        id: 'stock-lesson-2',
        courseId: stockFoundationsCourse.id,
        title: 'Understanding Market Indices',
        content: `# Understanding Market Indices

## What are Market Indices?
Market indices are statistical measures that track the performance of a group of stocks. They give us a snapshot of how the overall market is performing.

## Major Indian Indices

### NIFTY 50
- Tracks the top 50 companies listed on NSE
- Represents about 65% of total market capitalization
- Considered the benchmark for Indian equity market

### SENSEX (BSE 30)
- Tracks 30 well-established companies on BSE
- Oldest index in India (since 1986)
- Also called "Sensitive Index"

## How Indices Work
Indices are calculated using different methods:
- **Price Weighted**: Based on stock prices (like SENSEX)
- **Market Cap Weighted**: Based on company size (like NIFTY 50)
- **Equal Weighted**: All stocks get equal importance

## Why Indices Matter
- **Benchmark**: Compare your portfolio performance
- **Market Sentiment**: Shows overall market mood
- **Investment Decisions**: Help in asset allocation
- **Risk Assessment**: Understand market volatility

## Tips for Beginners
- Don't invest based on index movements alone
- Understand what each index represents
- Use indices for long-term perspective
- Focus on individual stock research`,
        type: 'TEXT',
        order: 2,
        duration: 12,
        difficulty: 'beginner',
        xpReward: 25
      },
      {
        id: 'stock-lesson-3',
        courseId: stockFoundationsCourse.id,
        title: 'Types of Market Orders',
        content: `# Types of Market Orders

## What is a Market Order?
A market order is an instruction to buy or sell a stock immediately at the current market price. It's the simplest type of order.

## Types of Orders

### 1. Market Order
**Buy/Sell immediately at current price**
- **Advantage**: Execution is guaranteed
- **Disadvantage**: Price may vary from quoted price
- **Best for**: Liquid stocks, urgent transactions

### 2. Limit Order
**Buy/Sell at specific price or better**
- **Advantage**: Price control
- **Disadvantage**: May not execute
- **Best for**: Price-sensitive investors

### 3. Stop Loss Order
**Sell when stock reaches trigger price**
- **Advantage**: Limits losses
- **Disadvantage**: Triggers automatic selling
- **Best for**: Risk management

## Order Execution Process
1. Place order through broker
2. Order sent to exchange
3. Matching engine finds counterparty
4. Trade executes
5. Settlement happens (T+2 for stocks)

## Tips for Beginners
- Start with market orders for simplicity
- Use limit orders for better prices
- Understand order types before trading
- Practice with small amounts`,
        type: 'TEXT',
        order: 3,
        duration: 10,
        difficulty: 'beginner',
        xpReward: 20
      }
    ];

    for (const lessonData of stockLessons) {
      await prisma.lesson.upsert({
        where: { id: lessonData.id },
        update: {},
        create: lessonData
      });
    }

    // Create a quiz for the first lesson
    const quiz = await prisma.quiz.upsert({
      where: { id: 'stock-quiz-1' },
      update: {},
      create: {
        id: 'stock-quiz-1',
        lessonId: 'stock-lesson-1',
        title: 'Stock Market Basics Quiz',
        description: 'Test your understanding of stock market fundamentals',
        passingScore: 70,
        timeLimit: 10,
        maxAttempts: 3
      }
    });

    // Create quiz questions
    const questions = [
      {
        id: 'stock-q1',
        quizId: quiz.id,
        question: 'What do you get when you buy a stock?',
        type: 'MULTIPLE_CHOICE',
        options: [
          'A loan from the company',
          'A small piece of ownership in the company',
          'A promise to pay you dividends',
          'A fixed return on investment'
        ],
        correctAnswer: 'A small piece of ownership in the company',
        explanation: 'When you buy a stock, you purchase a share of ownership in that company. You become a part-owner and share in both profits and losses.',
        points: 1,
        order: 1
      },
      {
        id: 'stock-q2',
        quizId: quiz.id,
        question: 'What is the main purpose of a stock market?',
        type: 'MULTIPLE_CHOICE',
        options: [
          'To help companies raise money',
          'To provide gambling opportunities',
          'To tax wealthy people',
          'To control inflation'
        ],
        correctAnswer: 'To help companies raise money',
        explanation: 'The primary purpose of a stock market is to provide a platform where companies can raise capital by selling shares to investors.',
        points: 1,
        order: 2
      },
      {
        id: 'stock-q3',
        quizId: quiz.id,
        question: 'True or False: Stock prices only go up over time.',
        type: 'TRUE_FALSE',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Stock prices can go up or down based on company performance, market conditions, and investor sentiment. They are not guaranteed to always increase.',
        points: 1,
        order: 3
      }
    ];

    for (const questionData of questions) {
      await prisma.question.upsert({
        where: { id: questionData.id },
        update: {},
        create: questionData
      });
    }
  }

  // Create lessons for SIP & Wealth Building
  const sipCourse = await prisma.courseCategory.findUnique({
    where: { id: 'sip-wealth' }
  });

  if (sipCourse) {
    const sipLessons = [
      {
        id: 'sip-lesson-1',
        courseId: sipCourse.id,
        title: 'What is SIP (Systematic Investment Plan)?',
        content: `# What is SIP (Systematic Investment Plan)?

## Definition
A Systematic Investment Plan (SIP) is an investment strategy where you invest a fixed amount regularly in mutual funds or ETFs at predetermined intervals.

## How SIP Works
1. **Fixed Amount**: You decide how much to invest (e.g., ₹1,000 per month)
2. **Regular Intervals**: Invest monthly, quarterly, or weekly
3. **Automatic**: Money is debited automatically from your account
4. **Long-term**: Best for 5+ year investments

## Benefits of SIP

### 1. Discipline
- Forces regular saving
- No need to time the market
- Builds investment habit

### 2. Rupee Cost Averaging
- Buy more units when prices are low
- Buy fewer units when prices are high
- Average out your purchase price over time

### 3. Compounding Power
- Returns generate returns
- Long-term wealth creation
- "Power of compounding" effect

### 4. Flexibility
- Start with small amounts (₹500)
- Increase/decrease SIP amount
- Pause or stop anytime
- No lock-in period (most SIPs)

## SIP vs Lump Sum
- **SIP**: Regular investing, reduces timing risk
- **Lump Sum**: One-time investment, requires market timing

## Best Practices
- Start early, even with small amounts
- Increase SIP amount annually
- Stay invested for long term
- Choose quality funds`,
        type: 'TEXT',
        order: 1,
        duration: 18,
        difficulty: 'beginner',
        xpReward: 40
      }
    ];

    for (const lessonData of sipLessons) {
      await prisma.lesson.upsert({
        where: { id: lessonData.id },
        update: {},
        create: lessonData
      });
    }
  }

  // Create lessons for Scam Awareness
  const scamCourse = await prisma.courseCategory.findUnique({
    where: { id: 'scam-awareness' }
  });

  if (scamCourse) {
    const scamLessons = [
      {
        id: 'scam-lesson-1',
        courseId: scamCourse.id,
        title: 'Common Investment Scams',
        content: `# Common Investment Scams

## 🚨 WARNING: Protect Your Money!

Investment scams cost Indians thousands of crores every year. Learn to spot and avoid these fraudulent schemes.

## Types of Investment Scams

### 1. Ponzi Schemes
**What it is**: New investors' money pays returns to earlier investors
- **Red Flags**: Guaranteed high returns, irregular payments
- **Example**: Companies promising 2-3% monthly returns
- **Reality**: Eventually collapses when new money stops

### 2. Pump and Dump
**What it is**: Artificially inflate stock price, then sell
- **Red Flags**: Sudden price surge, fake news, social media hype
- **Reality**: Small investors lose money when operators sell

### 3. Fake Investment Advisory
**What it is**: Unregistered advisors selling "guaranteed" tips
- **Red Flags**: No SEBI registration, upfront fees, pressure tactics
- **Reality**: They profit from your fees, not tips

### 4. Pyramid Schemes
**What it is**: Money comes from recruiting new members
- **Red Flags**: Focus on recruitment over products
- **Reality**: Most people lose money, only top creators benefit

## How to Verify Legitimacy

### Check SEBI Registration
- All investment advisors must register with SEBI
- Verify registration number on SEBI website
- Never invest with unregistered entities

### Research the Company
- Check company background and management
- Verify business model and revenue source
- Look for online reviews and complaints

### Red Flags Checklist
- ✅ Guaranteed returns
- ✅ High returns with low risk
- ✅ Pressure to invest quickly
- ✅ Unregistered advisors
- ✅ No proper documentation
- ✅ Cash-only transactions
- ✅ Overly complex explanations

## Safe Investing Practices
1. **Verify before investing**: Always check credentials
2. **Start small**: Test with small amounts first
3. **Read documents**: Understand what you're signing
4. **Keep records**: Save all transaction receipts
5. **Stay informed**: Learn about legitimate investments`,
        type: 'TEXT',
        order: 1,
        duration: 20,
        difficulty: 'beginner',
        xpReward: 35
      }
    ];

    for (const lessonData of scamLessons) {
      await prisma.lesson.upsert({
        where: { id: lessonData.id },
        update: {},
        create: lessonData
      });
    }
  }

  console.log('✅ Learning system seeded successfully!');
  console.log(`
📚 Created:
- 3 Course Categories
- 6+ Lessons with content
- 1 Quiz with 3 questions
- Sample course data ready for testing

🚀 The learning system is now ready!
Visit /learn to see the enhanced course catalog.
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
