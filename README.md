Walmart Sales Dashboard
Responsive static sales analytics dashboard in Walmart blue and yellow, built with HTML/CSS/JavaScript + Chart.js + Papa Parse. Uses the logo supplied by the user.
Run on GitHub Pages
Create a new public GitHub repository (for example `walmart-sales-dashboard`).
Upload all files/folders from this project to the repository root, including `index.html` and `assets/walmart-logo.png`.
In repository Settings → Pages → Build and deployment, choose Deploy from a branch, branch main, folder /(root), then Save.
Open `https://YOUR_USERNAME.github.io/walmart-sales-dashboard/` once deployed.
Click Upload CSV and select your dataset. Data stays inside your browser; you don't need a backend.
Optional: automatic data loading
Create `data/walmart_sales.csv` in the repository. The app tries to load that file on launch. Warning: A CSV committed into a public GitHub repo is publicly accessible. Do not commit private or proprietary data. For private CSVs, only use Upload CSV.
Expected headers exactly:
```csv
Store,Date,Weekly_Sales,Holiday_Flag,Temperature,Fuel_Price,CPI,Unemployment
1,02/05/2010,1643690.90,0,42.31,2.572,211.096,8.106
```
Supported dates: `MM/DD/YYYY` or `YYYY-MM-DD`.
Holiday_Flag: `0/1` or `true/false`.
Weekly_Sales: US dollars; each row is assumed to represent a store-week record.
The demo button generates simulated data for design/testing, not real Walmart sales.
Google Fonts, Chart.js and Papa Parse are loaded via CDNs; internet access is needed.
GitHub Pages is static hosting. Google Apps Script code is not needed; data is read client-side.
Insights
Total sales, average sales per store-week, top store, store count
Weekly/monthly sales trends, top stores, holiday impact, seasonality
Scatter plots for fuel price, temperature, CPI and unemployment
Dynamic narrative insights and store/year/month/holiday filters
Note
This is an educational/unofficial dashboard. Walmart and its logo are trademarks of their owner.# Walmart-Sales-
