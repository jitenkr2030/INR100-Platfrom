---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3045022100f97e65015cbe7acb0d44dec0f7ea18213682fd0df2845d0c9a99a5ae203d3311022040a33db533d0d947e523bb2c8d11644525e57b5c20807abd0fb96ec947b1a5f7
    ReservedCode2: 30440220213ecfec7e1f8cb9bdac08ada16e6509ee201ff947b2a1136b30bff714021946022009ca5b61c8bed3168069319f54bedda2866233648c724c5719c55dd064e6ddb0
---

# Production Monitoring Guide

## Overview
This guide covers the production monitoring setup for INR100 Platform.

## Features Implemented

### 1. Core Web Vitals Monitoring
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP) 
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)
- Time to First Byte (TTFB)

### 2. API Performance Monitoring
- Response time tracking
- Error rate monitoring
- Slow query detection

### 3. Error Tracking
- JavaScript errors
- Unhandled promise rejections
- API failures

### 4. Health Checks
- Database connectivity
- Memory usage monitoring
- Service availability

## Usage

### Enable Performance Monitoring
Add to your root layout:
```tsx
import './lib/monitoring/performance';
```

### Monitor Health
Visit `/api/health` endpoint for system health.

### View Performance Dashboard
Add `<PerformanceDashboard />` to admin pages.

## Alerting Thresholds

- FCP > 3000ms: Warning
- LCP > 4000ms: Warning  
- CLS > 0.25: Warning
- FID > 300ms: Warning
- API response > 2000ms: Warning

## Next Steps

1. Set up external monitoring service (DataDog, New Relic)
2. Configure alerting rules
3. Implement log aggregation
4. Set up uptime monitoring
