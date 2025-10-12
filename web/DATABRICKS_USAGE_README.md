# Databricks Usage Dashboard

## Overview

The Databricks Usage Dashboard displays usage metrics from BigQuery with year-over-year comparisons and visualizations broken down by Business Unit (BU).

## Features

- **KPI Card**: Shows current year total usage with year-over-year percentage comparison
- **BU Filter**: Dropdown to filter by specific Business Unit or view all BUs
- **Line Chart**: Visualizes usage trends over time for the current year, with separate lines for each BU

## Setup

### Prerequisites

- Service account credentials file at `../../everyday-health-pro.json` (two levels up from web folder)
- Access to BigQuery project `everyday-health-pro`
- Node.js and npm installed

### Installation

Dependencies are already installed:
- `@google-cloud/bigquery` - BigQuery client
- `recharts` - Chart library
- `@radix-ui/react-select` - Select component

## Usage

### Fetching Data

The dashboard uses static JSON data fetched from BigQuery. There are two ways to fetch data:

#### Manual Fetch
```bash
cd web
npm run fetch-databricks-data
```

#### Automatic Fetch (on Build)
Data is automatically fetched before each production build:
```bash
cd web
npm run build
```

The `prebuild` script runs automatically before `build` to ensure fresh data.

### Data Location

Fetched data is stored at:
```
web/public/data/databricks-usage.json
```

### Running in Development

```bash
cd web
npm run dev
```

Then navigate to: `http://localhost:3000/databricks-usage`

## Dashboard Features

### KPI Metrics

The KPI card displays:
- Current year total usage amount
- Last year total (same period comparison)
- Percentage change with visual indicator:
  - 🔴 Red/Up arrow = Cost increase
  - 🟢 Green/Down arrow = Cost decrease

### Filtering

Use the BU dropdown to:
- View all BUs combined
- Filter to a specific BU

When filtered, both the KPI and chart update to show only the selected BU's data.

### Chart Visualization

The line chart shows:
- X-axis: Months of the current year
- Y-axis: Usage amount in dollars
- Multiple lines: One per BU (color-coded)
- Hover over data points for detailed values

## Data Structure

The BigQuery query returns data in this format:

```json
{
  "year": "2025",
  "year_mon": "2025-Jan",
  "yyyymm": "202501",
  "bu": "HeC",
  "usage_amount": 1050.94
}
```

## Files

- `scripts/fetch-databricks-usage.js` - BigQuery data fetch script
- `src/app/(dashboard)/databricks-usage/page.tsx` - Dashboard page component
- `public/data/databricks-usage.json` - Static data file
- `src/components/app-sidebar.tsx` - Updated with navigation link

## Troubleshooting

### Data Not Loading

1. Check if `public/data/databricks-usage.json` exists
2. Verify the file contains valid JSON
3. Check browser console for errors

### BigQuery Connection Issues

1. Verify `everyday-health-pro.json` exists at correct location
2. Check service account has proper permissions
3. Ensure network access to BigQuery API
4. Review error messages in terminal when running fetch script

### Chart Not Displaying

1. Ensure data contains records for current year
2. Check that BU values are not empty
3. Verify browser console for rendering errors

## Customization

### Adding More BUs

BUs are automatically detected from the data. No code changes needed.

### Changing Colors

Edit the `buColors` array in `page.tsx`:

```typescript
const buColors = [
  "#8884d8", "#82ca9d", "#ffc658", // Add more colors
]
```

### Modifying the Query

Edit `scripts/fetch-databricks-usage.js` to modify the SQL query.

## Performance

- Data is fetched at build time, not runtime
- Dashboard is fully client-side, no server requests during browsing
- Chart rendering is optimized with Recharts' ResponsiveContainer
- Computations are memoized with React's useMemo

