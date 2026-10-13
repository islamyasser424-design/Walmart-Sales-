# Walmart Sales Dashboard

Responsive static sales analytics dashboard in Walmart blue and yellow, built with HTML/CSS/JavaScript + Chart.js + Papa Parse. Uses the logo supplied by the user.

## Run on GitHub Pages

1. Create a new **public** GitHub repository (for example `walmart-sales-dashboard`).
2. Upload **all files/folders** from this project to the repository root, including `index.html`, `pages.js`, `pages.css` and `assets/walmart-logo.png`.
3. In repository **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/(root)**, then Save.
4. Open `https://YOUR_USERNAME.github.io/walmart-sales-dashboard/` once deployed.
5. The real sales data from `data/walmart_sales.csv` loads automatically. You can also click **Upload CSV** to analyze a different dataset locally.

### Included Walmart data

The provided workbook is included as `data/Walmart_Sales.xlsx`; its exported CSV `data/walmart_sales.csv` automatically loads on launch. **Important:** Committing these files to a public repository makes both datasets publicly accessible. Confirm you have permission to publish the data before deployment.

Expected headers exactly:

```csv
Store,Date,Weekly_Sales,Holiday_Flag,Temperature,Fuel_Price,CPI,Unemployment
1,02/05/2010,1643690.90,0,42.31,2.572,211.096,8.106
```

- Supported dates: `MM/DD/YYYY` or `YYYY-MM-DD`.
- Holiday_Flag: `0/1` or `true/false`.
- Weekly_Sales: US dollars; each row is assumed to represent a store-week record.
- The demo button generates *simulated* data for design/testing, not real Walmart sales.
- Google Fonts, Chart.js and Papa Parse are loaded via CDNs; internet access is needed.
- GitHub Pages is static hosting. Google Apps Script code is **not** needed; data is read client-side.

## Insights

- Total sales, average sales per store-week, top store, store count
- Weekly, monthly, quarterly and yearly sales trends, selectable directly above the Sales Trend chart; each period sums the filtered weekly records
- Top stores, holiday impact and monthly seasonality
- Interactive sales decomposition tree: break down total sales by year, quarter, month, store and holiday week in any order. Select a branch to add another level, or use Reset tree to start again. Each node shows its sales total, record count and share of its parent; all dashboard filters apply.
- Light and dark themes with an accessible toggle. The initial theme follows the device preference, and an explicit choice is remembered in this browser when local storage is available.
- Dynamic narrative insights and store/year/month/holiday filters


Quarter and month splits use calendar quarter/month across the selected records. Add a Year level or use the Year filter to inspect one year.

## Pages and navigation

The sidebar opens seven views without reloading the dataset. The current page has an Active style and `aria-current="page"`. Hash links support direct opening, browser Back/Forward and refresh on GitHub Pages. On mobile, the navigation scrolls horizontally.

| Page | Link | Features |
| --- | --- | --- |
| Sales Overview | `#overview` | KPIs, trend granularity, store ranking and interactive decomposition tree |
| Store Details | `#stores` | Store selector, sales trend, rank, best week, benchmark and monthly table |
| Compare Stores | `#compare-stores` | Select all or individual stores, quick Top 5, search filtering, dynamic palette, separate trend lines, revenue totals and comparison table |
| Period Analysis | `#periods` | Monthly, quarterly or yearly totals, prior-period changes and record coverage |
| Seasons & Holidays | `#seasonality` | Holiday/regular averages, relative difference and monthly/yearly comparisons |
| Economic Factors | `#economics` | Factor selector, binned sales trend with linear regression trendline, dual-axis timeline, Pearson correlation and sales by factor range |
| Data Explorer | `#data` | Search, sorting, pagination and download of every matching CSV row |

Year, month and holiday filters apply across pages. Store Details and Compare Stores use their own store selectors; the global store choice is retained for the other pages. Page choices and uploaded data stay in memory while navigating; the theme preference is also remembered between visits.

Period changes use the immediately preceding calendar period within the selected data. Missing prior periods or a zero prior total show no percentage. Totals reflect available records, so the comparison table includes week, store and record counts to help identify partial periods. Missing store periods appear as gaps in comparison lines.

Economic analysis excludes blank or nonnumeric factor values. Correlation shows association, not causation, and is unavailable with fewer than two valid observations or a constant variable. CSV export uses the current filters, search and sort order across all result pages, preserves blank factor values and escapes spreadsheet formula prefixes.

## Note

This is an educational/unofficial dashboard. Walmart and its logo are trademarks of their owner.
