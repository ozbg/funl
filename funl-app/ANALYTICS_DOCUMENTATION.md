# FunL Analytics System Documentation

## Overview

The FunL Analytics System provides comprehensive insights into QR code funnel performance, user engagement, and conversion metrics. Built as a complete analytics dashboard, it transforms raw tracking data into actionable business intelligence.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Features Overview](#features-overview)
3. [User Interface](#user-interface)
4. [API Documentation](#api-documentation)
5. [Components Reference](#components-reference)
6. [Data Models](#data-models)
7. [Usage Guide](#usage-guide)
8. [Technical Implementation](#technical-implementation)

---

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend APIs  │    │   Database      │
│   Dashboard     │◄──►│   Analytics     │◄──►│   Supabase      │
│   Components    │    │   Endpoints     │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **Data Collection**: `useTracking` hook captures user interactions
2. **Storage**: Events stored in `click_events` table via `/api/tracking`
3. **Processing**: Analytics APIs aggregate and process raw data
4. **Visualization**: Dashboard components render insights and charts
5. **Export**: Users can download processed data as CSV

### Technology Stack
- **Frontend**: React, TypeScript, Panda CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Charts**: Custom CSS-based visualizations
- **State Management**: React hooks with client-side caching

---

## Features Overview

### 🏠 Dashboard Overview
**Location**: `/dashboard/analytics`

The main analytics dashboard provides a comprehensive view of funnel performance with:

#### Key Metrics Cards
- **Total Scans**: Lifetime QR code scans across all funnels
- **Unique Visitors**: Distinct user sessions (time-period filtered)
- **Conversion Rate**: Percentage of scans resulting in callbacks/downloads
- **Active Funnels**: Total number of created funnels

#### Interactive Controls
- **Period Selector**: Switch between 24h, 7d, 30d, and all-time views
- **Export Button**: Download analytics data as CSV file
- **Real-time Updates**: Metrics refresh automatically when period changes

#### Visualizations
- **Time Series Chart**: Bar chart showing scan activity over time
- **Device Breakdown**: Pie chart of mobile vs desktop usage
- **Recent Activity Feed**: Real-time stream of user interactions

### 📊 Supported Metrics

#### Engagement Metrics
- **Page Views**: Funnel page loads (`view` action)
- **vCard Downloads**: Contact card downloads (`vcard_download` action)
- **Callback Requests**: Contact form submissions (`callback_request` action)
- **Link Clicks**: External link interactions (`link_click` action)

#### Device Analytics
- **Mobile Usage**: Smartphone and tablet interactions
- **Desktop Usage**: Computer-based interactions  
- **Device Distribution**: Percentage breakdown with visual charts

#### Time-based Analytics
- **Hourly Patterns**: Scan activity by hour (24h view)
- **Daily Trends**: Daily scan volumes (7d/30d views)
- **Peak Times**: Identification of high-activity periods
- **Historical Comparison**: All-time vs recent period analysis

#### Conversion Analytics
- **View-to-Download Rate**: vCard download conversion
- **View-to-Callback Rate**: Contact request conversion
- **Overall Conversion Rate**: Combined conversion metrics
- **Lead Quality Tracking**: Response and completion rates

---

## User Interface

### Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    Analytics Dashboard                      │
├─────────────────────────────────────────────────────────────┤
│  [24h] [7d] [30d] [All Time]              [📊 Export Data] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Total   │ │ Unique  │ │Convert  │ │ Active  │          │
│  │ Scans   │ │Visitors │ │ Rate    │ │Funnels  │          │
│  │  1,234  │ │   567   │ │  12.3%  │ │   8     │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌─────────────────────┐          │
│  │   Scans Over Time   │ │  Device Breakdown   │          │
│  │                     │ │                     │          │
│  │  ████ ██ ███ █████  │ │  📱 Mobile    70%   │          │
│  │  ████ ██ ███ █████  │ │  💻 Desktop   30%   │          │
│  │                     │ │                     │          │
│  └─────────────────────┘ └─────────────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                    Recent Activity                          │
│  👁️ Viewed funnel    "Property A"       2m ago            │
│  📇 Downloaded vCard  "Contact Card"    5m ago            │
│  📞 Requested callback "Sales Funnel"   8m ago            │
│  🔗 Clicked link      "Video Demo"      12m ago           │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Design

#### Desktop View (1024px+)
- 4-column metric cards
- Side-by-side chart layout
- Full navigation visible
- Detailed tooltips and interactions

#### Tablet View (768px - 1023px)
- 2-column metric cards
- Stacked chart layout
- Condensed navigation
- Touch-friendly controls

#### Mobile View (< 768px)
- Single-column metric cards
- Vertically stacked charts
- Collapsible navigation
- Optimized for thumb navigation

---

## API Documentation

### Base URL
All analytics endpoints are available under `/api/analytics`

### Authentication
All endpoints require valid user authentication via Supabase auth.

---

### GET `/api/analytics`

**Description**: Retrieve comprehensive analytics data for authenticated user's funnels.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `30d` | Time period: `24h`, `7d`, `30d`, `all` |
| `funnelId` | string | null | Optional: Filter for specific funnel |
| `export` | string | null | Export format: `csv`, `json` |

#### Response Format
```json
{
  "totalScans": 1234,
  "uniqueVisitors": 567,
  "conversionRate": 12.3,
  "activeFunnels": 8,
  "recentActivity": [
    {
      "action": "view",
      "timestamp": "2025-01-15T10:30:00Z",
      "funnelName": "Property Listing A",
      "deviceType": "mobile"
    }
  ],
  "deviceBreakdown": {
    "mobile": 850,
    "desktop": 384
  },
  "topFunnels": [
    {
      "id": "uuid-1",
      "name": "Property A",
      "scans": 456
    }
  ]
}
```

#### CSV Export
When `export=csv` is provided, returns CSV file with metrics:
```csv
Metric,Value
Total Scans,1234
Unique Visitors,567
Conversion Rate,12.3%
Active Funnels,8
Period,30d
Generated,2025-01-15T10:30:00Z
```

#### Error Responses
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Database or processing error

---

### GET `/api/analytics/timeseries`

**Description**: Retrieve time-series data for charts and trend analysis.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `7d` | Time period for data points |
| `metric` | string | `scans` | Metric type: `scans`, `visitors`, `conversions` |
| `funnelId` | string | null | Optional: Filter for specific funnel |

#### Response Format
```json
{
  "data": [
    {
      "timestamp": "2025-01-14T00:00:00.000Z",
      "value": 45,
      "label": "Jan 14"
    },
    {
      "timestamp": "2025-01-15T00:00:00.000Z", 
      "value": 67,
      "label": "Jan 15"
    }
  ]
}
```

#### Data Bucketing
- **24h period**: Hourly buckets (24 data points)
- **7d period**: Daily buckets (7 data points)
- **30d period**: Daily buckets (30 data points)

---

## Components Reference

### MetricCard
**File**: `components/MetricCard.tsx`

Displays individual KPI metrics with optional trend indicators.

#### Props
```typescript
interface MetricCardProps {
  title: string              // Card title
  value: string | number     // Main metric value
  subtitle?: string          // Period or description
  trend?: {                 // Optional trend indicator
    value: number           // Percentage change
    positive: boolean       // Trend direction
  }
  loading?: boolean         // Loading state
}
```

#### Usage
```tsx
<MetricCard
  title="Total Scans"
  value={1234}
  subtitle="Last 30 days"
  trend={{ value: 15.2, positive: true }}
/>
```

---

### TimeSeriesChart
**File**: `components/TimeSeriesChart.tsx`

Interactive bar chart for displaying time-based analytics data.

#### Props
```typescript
interface TimeSeriesChartProps {
  title: string                    // Chart title
  period: '24h' | '7d' | '30d'    // Time period
  metric: 'scans' | 'visitors' | 'conversions'  // Data type
  funnelId?: string               // Optional funnel filter
}
```

#### Features
- **Responsive bars**: Scale to container width
- **Hover tooltips**: Show exact values and timestamps
- **Dynamic scaling**: Automatically adjusts to data range
- **Loading states**: Skeleton loading during API calls

---

### DeviceBreakdown
**File**: `components/DeviceBreakdown.tsx`

Visual representation of device usage statistics.

#### Props
```typescript
interface DeviceBreakdownProps {
  data: { [key: string]: number }  // Device type counts
  loading?: boolean                // Loading state
}
```

#### Features
- **Horizontal bar chart**: Percentage-based visualization
- **Device icons**: Mobile, desktop, tablet representations
- **Percentage calculations**: Automatic ratio computation
- **Color coding**: Consistent device type colors

---

### RecentActivity
**File**: `components/RecentActivity.tsx`

Feed of recent user interactions across all funnels.

#### Props
```typescript
interface RecentActivityProps {
  events: ActivityEvent[]    // Array of recent events
  loading?: boolean          // Loading state
}

interface ActivityEvent {
  action: string            // Event type
  timestamp: string         // ISO timestamp
  funnelName: string       // Associated funnel
  deviceType?: string      // Device classification
}
```

#### Features
- **Action icons**: Visual indicators for event types (👁️📇📞🔗)
- **Relative timestamps**: "2m ago", "5h ago" format
- **Funnel context**: Shows which funnel generated the event
- **Device indicators**: Mobile/desktop classification

---

### PeriodSelector
**File**: `components/PeriodSelector.tsx`

Interactive time period selection controls.

#### Props
```typescript
interface PeriodSelectorProps {
  selected: '24h' | '7d' | '30d' | 'all'  // Current selection
  onChange: (period: string) => void       // Selection callback
}
```

#### Features
- **Button group**: Radio-button style selection
- **Visual feedback**: Active state highlighting
- **Keyboard navigation**: Accessible control focus
- **Responsive sizing**: Adapts to screen width

---

### InteractiveAnalytics
**File**: `components/InteractiveAnalytics.tsx`

Client-side state management and interactivity coordinator.

#### Props
```typescript
interface InteractiveAnalyticsProps {
  initialData: {
    totalScans: number
    uniqueVisitors: number
    conversionRate: number
    activeFunnels: number
    deviceBreakdown: { [key: string]: number }
  }
}
```

#### Features
- **State management**: Handles period changes and data fetching
- **Loading coordination**: Manages loading states across components
- **Export functionality**: Handles CSV download generation
- **Error handling**: Graceful fallbacks for API failures

---

## Data Models

### Database Tables

#### click_events
Primary analytics data table storing all user interactions.

```sql
CREATE TABLE click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);
```

**Indexes**:
- `funnel_id` for fast funnel-specific queries
- `created_at` for time-range filtering
- `session_id` for visitor deduplication

#### Tracked Actions
- `view`: Funnel page loaded
- `vcard_download`: Contact card downloaded  
- `callback_request`: Contact form submitted
- `link_click`: External link clicked

#### Metadata Structure
```json
{
  "user_agent": "Mozilla/5.0...",
  "ip_country": "AU",
  "device_type": "mobile",
  "referrer": "https://example.com"
}
```

---

### callback_requests
Conversion tracking table for contact form submissions.

```sql
CREATE TABLE callback_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  preferred_time text,
  message text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);
```

**Purpose**: Track conversion events and lead quality metrics.

---

## Usage Guide

### For End Users

#### Accessing Analytics
1. Navigate to **Dashboard** → **Analytics** tab
2. The dashboard loads with 30-day metrics by default
3. All data is automatically filtered to your funnels only

#### Changing Time Periods
1. Click period buttons: **24h**, **7d**, **30d**, or **All Time**
2. All metrics and charts update automatically
3. Export functionality adjusts to selected period

#### Exporting Data
1. Click **📊 Export Data** button (top right)
2. CSV file downloads automatically
3. File includes all current metrics for selected period
4. Filename format: `analytics-{period}-{date}.csv`

#### Understanding Metrics

**Total Scans**: 
- Count of QR code scans (funnel page views)
- Includes repeat visits from same user
- All-time cumulative unless period filtered

**Unique Visitors**:
- Distinct user sessions within time period
- Based on session IDs, not IP addresses
- Resets daily for privacy

**Conversion Rate**:
- Percentage of scans resulting in action
- Includes vCard downloads and callback requests
- Calculated as: (conversions / total_scans) × 100

**Device Breakdown**:
- Mobile vs Desktop usage patterns
- Based on User-Agent string analysis
- Helpful for optimizing funnel design

#### Reading Charts

**Scans Over Time**:
- Bar height represents scan volume
- Hover for exact values and timestamps
- 24h view: hourly buckets
- 7d/30d view: daily buckets

**Device Breakdown**:
- Horizontal bars show percentage split
- Numbers show actual scan counts
- Colors remain consistent across views

### For Developers

#### Adding New Metrics
1. **Backend**: Extend `/api/analytics` to include new calculations
2. **Frontend**: Add new `MetricCard` components
3. **Database**: Ensure required data is being tracked

#### Custom Visualizations
1. Create new chart components in `components/` directory
2. Follow existing patterns for API data fetching
3. Implement loading states and error handling

#### Performance Optimization
- Analytics queries are optimized with proper indexes
- Consider implementing caching for frequently accessed data
- Use time-range filtering to limit dataset size

---

## Technical Implementation

### Performance Considerations

#### Database Optimization
- **Indexes**: Key columns indexed for fast queries
- **Time Filtering**: Always filter by date ranges to limit data
- **Aggregation**: Use COUNT() and GROUP BY for efficiency
- **Cascade Deletes**: Automatic cleanup when funnels are deleted

#### Frontend Optimization
- **Server-Side Rendering**: Initial data loaded server-side
- **Client-Side Caching**: Prevent redundant API calls
- **Progressive Loading**: Charts load after core metrics
- **Responsive Images**: Optimized for different screen sizes

#### API Optimization
- **Single Queries**: Minimize database round-trips
- **Data Aggregation**: Process calculations server-side
- **Conditional Logic**: Skip unnecessary queries when possible
- **Error Boundaries**: Graceful handling of edge cases

### Security & Privacy

#### Data Protection
- **User Isolation**: Users can only access their own funnel data
- **Authentication**: All endpoints require valid session
- **Input Validation**: Sanitize all query parameters
- **Rate Limiting**: Prevent abuse of analytics endpoints

#### Privacy Compliance
- **IP Anonymization**: Store country only, not full IP
- **Session Management**: Rotate session IDs regularly
- **Data Retention**: Implement configurable retention policies
- **User Consent**: Respect tracking preferences

### Monitoring & Maintenance

#### Health Checks
- Monitor API response times
- Track database query performance
- Alert on error rate increases
- Monitor data quality and completeness

#### Regular Maintenance
- Archive old analytics data periodically
- Update device detection patterns
- Optimize database indexes based on usage
- Review and update security measures

### Extension Points

#### Adding New Chart Types
1. Create component in `components/` directory
2. Implement data fetching hook
3. Add to main dashboard layout
4. Consider mobile responsiveness

#### Geographic Analytics
- Extend metadata collection to include city/region
- Create map visualization components
- Add geographic filtering options
- Consider privacy implications

#### Real-time Updates
- Implement WebSocket connections
- Add real-time event streaming
- Update charts without page refresh
- Consider performance impact

---

## Troubleshooting

### Common Issues

#### No Data Showing
- **Check**: Ensure funnels exist and have been viewed
- **Verify**: User authentication is working correctly
- **Test**: API endpoints return data in browser dev tools

#### Charts Not Loading
- **Check**: Network tab for failed API requests
- **Verify**: Browser JavaScript console for errors
- **Test**: Manually visit `/api/analytics/timeseries`

#### Performance Issues
- **Monitor**: Database query execution times
- **Optimize**: Add indexes for slow queries
- **Cache**: Consider implementing Redis caching layer

### Debugging Tools

#### API Testing
```bash
# Test main analytics endpoint
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/analytics?period=7d"

# Test timeseries endpoint  
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/analytics/timeseries?period=24h&metric=scans"
```

#### Database Queries
```sql
-- Check recent analytics data
SELECT * FROM click_events 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Verify funnel ownership
SELECT f.name, COUNT(ce.*) as scans
FROM funnels f
LEFT JOIN click_events ce ON f.id = ce.funnel_id
WHERE f.business_id = 'user-uuid'
GROUP BY f.id, f.name;
```

---

## Future Enhancements

### Planned Features
- **Individual Funnel Analytics**: Dedicated pages for each funnel
- **A/B Testing**: Split testing analytics and reporting
- **Goal Tracking**: Custom conversion goal definitions
- **Email Reports**: Automated weekly/monthly summaries

### Advanced Analytics
- **Cohort Analysis**: User retention and behavior patterns
- **Funnel Analysis**: Step-by-step conversion tracking
- **Attribution Modeling**: Multi-touch conversion tracking
- **Predictive Analytics**: AI-powered insights and recommendations

### Integration Possibilities
- **Google Analytics**: Sync data for unified reporting
- **CRM Systems**: Push lead data to sales platforms
- **Marketing Tools**: Connect with email/SMS campaigns
- **Business Intelligence**: Export to BI tools like Tableau

---

## Support & Contact

For technical support or questions about the analytics system:
- **Documentation Issues**: Check this guide first
- **Bug Reports**: Create issues in project repository  
- **Feature Requests**: Submit via project issue tracker
- **Performance Issues**: Include relevant logs and metrics

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Compatibility**: Next.js 13+, React 18+, Supabase