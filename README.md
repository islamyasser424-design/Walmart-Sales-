# Walmart Sales Dashboard

Responsive static sales analytics dashboard in Walmart blue and yellow, built with HTML/CSS/JavaScript + Chart.js + Papa Parse. Uses the logo supplied by the user.

## Run on GitHub Pages

1. Create a new **public** GitHub repository (for example `walmart-sales-dashboard`).
2. Upload **all files/folders** from this project to the repository root, including `index.html` and `assets/walmart-logo.png`.
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

## Note

This is an educational/unofficial dashboard. Walmart and its logo are trademarks of their owner.
