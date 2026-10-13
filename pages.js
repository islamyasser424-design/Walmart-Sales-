'use strict';
window.createSalesPages = function({ $, money, number, avg, sum, group, fullMoney, periodKey, MONTHS, draw, chartPalette, getRows, getAllRows, renderOverview }) {
  const ROUTES = {
    overview: ['Sales Overview', 'Track weekly performance, store rankings and the factors shaping sales.'],
    stores: ['Store Details', 'Explore one store, its strongest weeks and its position among other stores.'],
    'compare-stores': ['Compare Stores', 'Compare stores using the same period and holiday filters. Select any number of stores or select all.'],
    periods: ['Period Analysis', 'Compare monthly, quarterly and yearly sales with the preceding calendar period.'],
    seasonality: ['Seasons & Holidays', 'Find seasonal patterns and compare holiday and regular store-week performance.'],
    economics: ['Economic Factors', 'Explore relationships between weekly sales and the available economic factors.'],
    data: ['Data Explorer', 'Search, sort and export the sales records behind the dashboard.']
  };

  const state = { page: 'overview', stores: [], dataPage: 1 };
  let availableStores = [];
  let rankedStores = [];

  const numeric = n => Number.isFinite(n) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(n) : '—';
  const sales = rows => sum(rows.map(r => r.Weekly_Sales));
  const averageSales = rows => rows.length ? avg(rows.map(r => r.Weekly_Sales)) : null;
  const pct = n => n === null || !Number.isFinite(n) ? '—' : (n > 0 ? '+' : '') + n.toFixed(1) + '%';
  const showMoney = n => n === null ? '—' : fullMoney(n);
  const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };

  const getStoreColor = (index, total) => {
    const p = chartPalette();
    const curated = [p.blue, '#ffc220', '#10b981', '#a855f7', '#f97316', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#84cc16'];
    if (index < curated.length && total <= curated.length) return curated[index];
    const hue = Math.round((index * 137.508) % 360);
    return `hsl(${hue}, 70%, 52%)`;
  };

  const optionsFor = (legend = false) => {
    const p = chartPalette();
    return {
      plugins: {
        legend: { display: legend, labels: { color: p.text, boxWidth: 11, usePointStyle: true } },
        tooltip: {
          backgroundColor: p.surface,
          titleColor: p.ink,
          bodyColor: p.ink,
          borderColor: p.grid,
          borderWidth: 1,
          callbacks: { label: c => (c.dataset.label || 'Sales') + ': ' + money(c.parsed.y) }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: p.text, maxRotation: 0, maxTicksLimit: 10 } },
        y: { grid: { color: p.grid }, ticks: { color: p.text, callback: v => money(v) } }
      }
    };
  };

  function periodTotals(rows, grain) {
    return [...group(rows, r => periodKey(r.date, grain))]
      .map(([key, records]) => ({ key, records, total: sales(records) }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  function table(id, columns, rows) {
    const el = document.createElement('table');
    el.className = 'data-table';
    const head = document.createElement('thead'), tr = document.createElement('tr');
    columns.forEach(c => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = c.label;
      if (c.numeric) th.className = 'numeric';
      tr.append(th);
    });
    head.append(tr);
    el.append(head);
    const body = document.createElement('tbody');
    if (!rows.length) {
      const row = document.createElement('tr'), td = document.createElement('td');
      td.colSpan = columns.length;
      td.className = 'table-empty';
      td.textContent = 'No matching records. Adjust the filters or load data.';
      row.append(td);
      body.append(row);
    }
    rows.forEach(values => {
      const row = document.createElement('tr');
      values.forEach((cell, i) => {
        const td = document.createElement('td'), object = cell !== null && typeof cell === 'object';
        td.textContent = object ? cell.text : String(cell ?? '—');
        td.className = [columns[i].numeric ? 'numeric' : '', object ? cell.className || '' : ''].filter(Boolean).join(' ');
        row.append(td);
      });
      body.append(row);
    });
    el.append(body);
    $(id).replaceChildren(el);
  }

  function changeCell(value) {
    return { text: pct(value), className: value > 0 ? 'change-up' : value < 0 ? 'change-down' : '' };
  }

  function updateCompareNote() {
    const count = state.stores.length;
    const total = availableStores.length;
    if (count === 0) {
      set('compareSelectionNote', '0 stores selected. Choose stores below or click "Select All" to compare.');
    } else if (count === total && total > 0) {
      set('compareSelectionNote', `All ${total} stores selected. Year, month and holiday filters apply to every store.`);
    } else {
      set('compareSelectionNote', `${count} of ${total} stores selected. Year, month and holiday filters apply to every store.`);
    }
  }

  function updateStoreChipUI() {
    const container = $('compareStoreOptions');
    if (!container) return;
    const chips = container.querySelectorAll('.store-chip');
    chips.forEach(chip => {
      const input = chip.querySelector('input');
      if (input) {
        const isSelected = state.stores.includes(input.value);
        input.checked = isSelected;
        chip.classList.toggle('selected', isSelected);
      }
    });
  }

  function resetData() {
    const all = getAllRows();
    rankedStores = [...group(all, r => r.Store)]
      .map(([id, rows]) => ({ id, total: sales(rows) }))
      .sort((a, b) => b.total - a.total);
    availableStores = rankedStores.map(r => r.id).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    $('focusStore').replaceChildren(...availableStores.map(id => new Option('Store ' + id, id)));
    if (rankedStores.length) $('focusStore').value = rankedStores[0].id;

    if (!state.stores.length) {
      state.stores = rankedStores.slice(0, 2).map(r => r.id);
    } else {
      state.stores = state.stores.filter(id => availableStores.includes(id));
      if (!state.stores.length && rankedStores.length) {
        state.stores = rankedStores.slice(0, 2).map(r => r.id);
      }
    }
    state.dataPage = 1;

    $('compareStoreOptions').replaceChildren(...availableStores.map(id => {
      const label = document.createElement('label');
      label.className = 'store-chip' + (state.stores.includes(id) ? ' selected' : '');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = id;
      input.checked = state.stores.includes(id);
      input.setAttribute('aria-label', 'Compare Store ' + id);
      const text = document.createElement('span');
      text.textContent = 'Store ' + id;
      label.append(input, text);

      input.addEventListener('change', () => {
        state.stores = input.checked ? [...state.stores, id] : state.stores.filter(s => s !== id);
        label.classList.toggle('selected', input.checked);
        updateCompareNote();
        if (state.page === 'compare-stores') renderCompare();
      });
      return label;
    }));

    updateCompareNote();
  }

  function renderStore() {
    const all = getRows({ ignoreStore: true }), id = $('focusStore').value, rows = all.filter(r => r.Store === id), mean = averageSales(rows);
    const ranking = [...group(all, r => r.Store)].map(([store, records]) => ({ store, total: sales(records) })).sort((a, b) => b.total - a.total || a.store.localeCompare(b.store, undefined, { numeric: true }));
    const position = ranking.findIndex(r => r.store === id), weeks = periodTotals(rows, 'week'), peak = [...weeks].sort((a, b) => b.total - a.total)[0];
    set('detailTotal', rows.length ? money(sales(rows)) : '—');
    set('detailAverage', mean === null ? '—' : money(mean));
    set('detailRecords', number(rows.length) + ' store-week records');
    set('detailRank', position >= 0 ? '#' + (position + 1) : '—');
    set('detailRankNote', 'Among ' + ranking.length + ' stores in the same period');
    set('detailPeak', peak ? money(peak.total) : '—');
    set('detailPeakDate', peak ? peak.key : 'No records in the selected period');
    const timeline = periodTotals(rows, $('storePeriod').value), p = chartPalette();
    draw('detailTrendChart', 'line', { labels: timeline.map(x => x.key), datasets: [{ label: 'Store ' + id, data: timeline.map(x => x.total), borderColor: p.blue, backgroundColor: p.fill, fill: true, tension: .2, pointRadius: timeline.length > 40 ? 0 : 2 }] }, optionsFor());
    draw('detailBenchmarkChart', 'bar', { labels: ['Store ' + (id || '—'), 'All stores'], datasets: [{ label: 'Average weekly sales', data: [mean, averageSales(all)], backgroundColor: [p.blue, '#ffc220'], borderRadius: 5 }] }, optionsFor());
    table('detailTable', [{ label: 'Month' }, { label: 'Total sales', numeric: true }, { label: 'Weekly average', numeric: true }, { label: 'Records', numeric: true }], periodTotals(rows, 'month').map(x => [x.key, fullMoney(x.total), showMoney(averageSales(x.records)), number(x.records.length)]));
  }

  function renderCompare() {
    const all = getRows({ ignoreStore: true });
    const selected = all.filter(r => state.stores.includes(r.Store));
    const grain = $('comparePeriod').value;
    const p = chartPalette();

    updateCompareNote();

    if (!state.stores.length) {
      draw('compareTrendChart', 'line', { labels: [], datasets: [] }, {
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'No stores selected. Choose stores above or click "Select All".', color: p.text, font: { size: 12, weight: '500' } }
        }
      });
      draw('compareTotalChart', 'bar', { labels: [], datasets: [] }, {
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'No stores selected.', color: p.text, font: { size: 12, weight: '500' } }
        }
      });
      table('compareTable', [
        { label: 'Store' },
        { label: 'Total sales', numeric: true },
        { label: 'Weekly average', numeric: true },
        { label: 'Records', numeric: true },
        { label: 'Share of selected stores', numeric: true }
      ], []);
      return;
    }

    const keys = [...new Set(selected.map(r => periodKey(r.date, grain)))].sort();
    const details = state.stores.map((id, i) => {
      const records = all.filter(r => r.Store === id);
      const buckets = new Map(periodTotals(records, grain).map(x => [x.key, x.total]));
      return {
        id,
        records,
        total: sales(records),
        color: getStoreColor(i, state.stores.length),
        data: keys.map(k => buckets.has(k) ? buckets.get(k) : null)
      };
    });

    const isMany = state.stores.length > 8;
    const isLots = state.stores.length > 15;
    const trendOpts = optionsFor(!isLots);

    draw('compareTrendChart', 'line', {
      labels: keys,
      datasets: details.map(x => ({
        label: 'Store ' + x.id,
        data: x.data,
        borderColor: x.color,
        backgroundColor: x.color,
        fill: false,
        tension: 0.16,
        borderWidth: isLots ? 1.5 : 2.5,
        spanGaps: false,
        pointRadius: keys.length > 35 || isMany ? 0 : 2.5
      }))
    }, trendOpts);

    const sortedDetails = [...details].sort((a, b) => b.total - a.total);
    draw('compareTotalChart', 'bar', {
      labels: sortedDetails.map(x => 'Store ' + x.id),
      datasets: [{
        label: 'Total sales',
        data: sortedDetails.map(x => x.records.length ? x.total : null),
        backgroundColor: sortedDetails.map(x => x.color),
        borderRadius: 4
      }]
    }, optionsFor(false));

    const combined = sales(selected);
    table('compareTable', [
      { label: 'Store' },
      { label: 'Total sales', numeric: true },
      { label: 'Weekly average', numeric: true },
      { label: 'Records', numeric: true },
      { label: 'Share of selected stores', numeric: true }
    ], sortedDetails.map(x => [
      'Store ' + x.id,
      x.records.length ? fullMoney(x.total) : '—',
      showMoney(averageSales(x.records)),
      number(x.records.length),
      combined !== 0 && x.records.length ? (x.total / combined * 100).toFixed(1) + '%' : '—'
    ]));
  }

  function previousPeriod(key, grain) {
    if (grain === 'year') return String(Number(key) - 1);
    if (grain === 'quarter') {
      const [y, q] = key.split('-Q').map(Number);
      return (q === 1 ? y - 1 : y) + '-Q' + (q === 1 ? 4 : q - 1);
    }
    const [year, month] = key.split('-').map(Number);
    return periodKey(new Date(Date.UTC(year, month - 2, 1)), 'month');
  }

  function renderPeriods() {
    const rows = getRows(), grain = $('periodGrain').value, timeline = periodTotals(rows, grain), lookup = new Map(timeline.map(x => [x.key, x]));
    const latest = timeline.at(-1), previous = latest ? lookup.get(previousPeriod(latest.key, grain)) : null;
    const growth = latest && previous && previous.total !== 0 ? (latest.total / previous.total - 1) * 100 : null, p = chartPalette();
    set('periodLatest', latest ? money(latest.total) : '—');
    set('periodLatestLabel', latest ? latest.key : 'No selected period');
    set('periodPrevious', previous ? money(previous.total) : '—');
    set('periodPreviousLabel', latest ? previousPeriod(latest.key, grain) : 'Previous calendar period');
    set('periodChange', pct(growth));
    $('periodChange').className = 'value' + (growth > 0 ? ' change-up' : growth < 0 ? ' change-down' : '');
    set('periodChangeValue', latest && previous ? (latest.total - previous.total >= 0 ? '+' : '') + money(latest.total - previous.total) : 'Previous period is not in this selection');
    set('periodCount', number(timeline.length));
    draw('periodChart', 'bar', { labels: timeline.map(x => x.key), datasets: [{ label: 'Total sales', data: timeline.map(x => x.total), backgroundColor: timeline.map((x, i) => i === timeline.length - 1 ? '#ffc220' : p.blue), borderRadius: 4 }] }, optionsFor());
    table('periodTable', [{ label: 'Period' }, { label: 'Sales', numeric: true }, { label: 'Change vs prior period', numeric: true }, { label: 'Distinct weeks', numeric: true }, { label: 'Stores', numeric: true }, { label: 'Records', numeric: true }], [...timeline].reverse().map(x => {
      const prior = lookup.get(previousPeriod(x.key, grain)), change = prior && prior.total !== 0 ? (x.total / prior.total - 1) * 100 : null;
      return [x.key, fullMoney(x.total), changeCell(change), new Set(x.records.map(r => periodKey(r.date, 'week'))).size, new Set(x.records.map(r => r.Store)).size, number(x.records.length)];
    }));
  }

  function renderSeasons() {
    const rows = getRows(), holiday = rows.filter(r => r.Holiday_Flag === 1), regular = rows.filter(r => r.Holiday_Flag === 0), a = averageSales(holiday), b = averageSales(regular);
    const months = group(rows, r => r.date.getUTCMonth()), best = [...months].map(([month, records]) => ({ month, mean: averageSales(records) })).sort((a, b) => b.mean - a.mean)[0];
    set('seasonHoliday', a === null ? '—' : money(a));
    set('seasonRegular', b === null ? '—' : money(b));
    set('seasonHolidayCount', number(holiday.length) + ' holiday records');
    set('seasonRegularCount', number(regular.length) + ' regular records');
    set('seasonUplift', pct(a !== null && b !== null && b !== 0 ? (a / b - 1) * 100 : null));
    set('seasonBest', best ? MONTHS[best.month] : '—');
    set('seasonBestValue', best ? money(best.mean) + ' average store-week sales' : 'No records');
    set('seasonNote', holiday.length && regular.length ? 'Average store-week sales account for different numbers of records. Calendar months combine the selected years.' : 'Select All weeks and a period containing holiday and regular records to compare both groups.');
    const p = chartPalette(), split = (records, flag) => averageSales(records.filter(r => r.Holiday_Flag === flag));
    draw('seasonMonthlyChart', 'bar', { labels: MONTHS, datasets: [{ label: 'Regular weeks', data: MONTHS.map((_, i) => split(months.get(i) || [], 0)), backgroundColor: p.blue, borderRadius: 3 }, { label: 'Holiday weeks', data: MONTHS.map((_, i) => split(months.get(i) || [], 1)), backgroundColor: '#ffc220', borderRadius: 3 }] }, optionsFor(true));
    const years = [...group(rows, r => String(r.date.getUTCFullYear()))].sort(([a], [b]) => a.localeCompare(b));
    draw('seasonYearChart', 'bar', { labels: years.map(([year]) => year), datasets: [{ label: 'Regular weeks', data: years.map(([, r]) => split(r, 0)), backgroundColor: p.blue, borderRadius: 4 }, { label: 'Holiday weeks', data: years.map(([, r]) => split(r, 1)), backgroundColor: '#ffc220', borderRadius: 4 }] }, optionsFor(true));
    table('seasonTable', [{ label: 'Month' }, { label: 'Total sales', numeric: true }, { label: 'Weekly average', numeric: true }, { label: 'Holiday average', numeric: true }, { label: 'Regular average', numeric: true }, { label: 'Records', numeric: true }], [...months].sort(([a], [b]) => a - b).map(([m, r]) => [MONTHS[m], fullMoney(sales(r)), showMoney(averageSales(r)), showMoney(split(r, 1)), showMoney(split(r, 0)), number(r.length)]));
  }

  function renderEconomics() {
    const factor = $('economicFactor').value;
    const name = $('economicFactor').selectedOptions[0].textContent;
    const rows = getRows().filter(r => Number.isFinite(r[factor]));
    const meanX = rows.length ? avg(rows.map(r => r[factor])) : null;
    const meanY = averageSales(rows);

    let xx = 0, yy = 0, xy = 0;
    rows.forEach(r => {
      const x = r[factor] - meanX;
      const y = r.Weekly_Sales - meanY;
      xx += x * x;
      yy += y * y;
      xy += x * y;
    });
    const correlation = rows.length > 1 && xx > 0 && yy > 0 ? Math.max(-1, Math.min(1, xy / Math.sqrt(xx * yy))) : null;

    set('economicAverage', meanX === null ? '—' : numeric(meanX));
    set('economicFactorName', name);
    set('economicCorrelation', correlation === null ? '—' : correlation.toFixed(3));
    set('economicRecords', number(rows.length));
    set('economicSales', meanY === null ? '—' : money(meanY));

    const p = chartPalette();
    const viewMode = $('economicViewMode') ? $('economicViewMode').value : 'trend';

    if (viewMode === 'timeline') {
      // Dual-Axis Timeline: Weekly Sales vs Economic Factor over time
      const weeklyBuckets = [...group(rows, r => periodKey(r.date, 'week'))].sort(([a], [b]) => a.localeCompare(b));
      const timelineLabels = weeklyBuckets.map(([k]) => k);
      const timelineSales = weeklyBuckets.map(([, recs]) => avg(recs.map(r => r.Weekly_Sales)));
      const timelineFactor = weeklyBuckets.map(([, recs]) => avg(recs.map(r => r[factor])));

      draw('economicScatterChart', 'line', {
        labels: timelineLabels,
        datasets: [
          {
            label: 'Avg Weekly Sales',
            data: timelineSales,
            borderColor: p.blue,
            backgroundColor: p.fill,
            fill: true,
            yAxisID: 'y',
            tension: 0.25,
            borderWidth: 2.5,
            pointRadius: timelineLabels.length > 40 ? 0 : 2
          },
          {
            label: name,
            data: timelineFactor,
            borderColor: '#ffc220',
            backgroundColor: 'transparent',
            fill: false,
            yAxisID: 'y1',
            tension: 0.25,
            borderWidth: 2,
            borderDash: [5, 4],
            pointRadius: timelineLabels.length > 40 ? 0 : 2
          }
        ]
      }, {
        plugins: {
          legend: { display: true, labels: { color: p.text, boxWidth: 12 } },
          tooltip: {
            backgroundColor: p.surface, titleColor: p.ink, bodyColor: p.ink, borderColor: p.grid, borderWidth: 1,
            callbacks: {
              label: c => c.dataset.yAxisID === 'y' ? `Sales: ${money(c.parsed.y)}` : `${name}: ${numeric(c.parsed.y)}`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: p.text, maxTicksLimit: 10 } },
          y: { type: 'linear', position: 'left', grid: { color: p.grid }, ticks: { color: p.text, callback: v => money(v) } },
          y1: { type: 'linear', position: 'right', grid: { display: false }, ticks: { color: '#ffc220', callback: v => numeric(v) } }
        }
      });

    } else {
      // Default & Primary View: Smooth Binned Trend Curve + Linear Regression Line
      let trendBins = [];
      if (rows.length) {
        const min = rows.reduce((n, r) => Math.min(n, r[factor]), Infinity);
        const max = rows.reduce((n, r) => Math.max(n, r[factor]), -Infinity);
        const binCount = min === max ? 1 : Math.min(16, Math.max(8, new Set(rows.map(r => r[factor])).size));
        const binWidth = (max - min) / binCount;

        const slope = (rows.length > 1 && xx > 0) ? (xy / xx) : 0;
        const intercept = (meanY !== null && meanX !== null) ? (meanY - slope * meanX) : 0;

        trendBins = Array.from({ length: binCount }, (_, i) => {
          const bMin = min + i * binWidth;
          const bMax = i === binCount - 1 ? max : min + (i + 1) * binWidth;
          const mid = (bMin + bMax) / 2;
          return {
            label: binCount === 1 ? numeric(min) : `${numeric(bMin)} – ${numeric(bMax)}`,
            mid,
            regression: slope * mid + intercept,
            records: []
          };
        });

        rows.forEach(r => {
          const i = binCount === 1 ? 0 : Math.min(binCount - 1, Math.floor((r[factor] - min) / binWidth));
          trendBins[i].records.push(r);
        });
      }

      const labels = trendBins.map(b => b.label);
      const avgSalesData = trendBins.map(b => averageSales(b.records));
      const regressionData = trendBins.map(b => b.regression);

      draw('economicScatterChart', 'line', {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Average Weekly Sales',
            data: avgSalesData,
            borderColor: p.blue,
            backgroundColor: p.fill,
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: p.blue,
            order: 1
          },
          {
            type: 'line',
            label: `Regression Trendline (r = ${correlation !== null ? (correlation >= 0 ? '+' : '') + correlation.toFixed(3) : '0'})`,
            data: regressionData,
            borderColor: '#ffc220',
            backgroundColor: 'transparent',
            fill: false,
            borderWidth: 2.2,
            borderDash: [6, 4],
            pointRadius: 0,
            order: 2
          }
        ]
      }, {
        plugins: {
          legend: { display: true, labels: { color: p.text, boxWidth: 12, usePointStyle: true } },
          tooltip: {
            backgroundColor: p.surface, titleColor: p.ink, bodyColor: p.ink, borderColor: p.grid, borderWidth: 1,
            callbacks: {
              title: items => items.length ? `${name} Interval: ${items[0].label}` : '',
              label: c => {
                if (c.datasetIndex === 0) {
                  const bin = trendBins[c.dataIndex];
                  const count = bin ? bin.records.length : 0;
                  const pctShare = rows.length ? ((count / rows.length) * 100).toFixed(1) : '0';
                  return [`Avg Sales: ${money(c.parsed.y)}`, `Sample: ${number(count)} records (${pctShare}%)`];
                }
                return `Projected Trend: ${money(c.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: name + ' Intervals', color: p.text, font: { size: 11, weight: '600' } },
            grid: { display: false },
            ticks: { color: p.text, maxRotation: 25, maxTicksLimit: 8 }
          },
          y: {
            title: { display: true, text: 'Weekly Sales ($)', color: p.text, font: { size: 11, weight: '600' } },
            grid: { color: p.grid },
            ticks: { color: p.text, callback: v => money(v) }
          }
        }
      });
    }

    // Right chart: Average Sales by Factor Range (8 wide ranges)
    let bins = [];
    if (rows.length) {
      const min = rows.reduce((n, r) => Math.min(n, r[factor]), Infinity);
      const max = rows.reduce((n, r) => Math.max(n, r[factor]), -Infinity);
      const count = min === max ? 1 : Math.min(8, new Set(rows.map(r => r[factor])).size);
      const width = (max - min) / count;
      bins = Array.from({ length: count }, (_, i) => ({
        label: count === 1 ? numeric(min) : numeric(min + i * width) + '–' + numeric(i === count - 1 ? max : min + (i + 1) * width),
        records: []
      }));
      rows.forEach(r => {
        const i = count === 1 ? 0 : Math.min(count - 1, Math.floor((r[factor] - min) / width));
        bins[i].records.push(r);
      });
    }
    draw('economicRangeChart', 'bar', {
      labels: bins.map(b => b.label),
      datasets: [{
        label: 'Average weekly sales',
        data: bins.map(b => averageSales(b.records)),
        backgroundColor: p.blue,
        borderRadius: 4
      }]
    }, optionsFor());

    table('economicTable', [
      { label: name + ' range' },
      { label: 'Average sales', numeric: true },
      { label: 'Records', numeric: true }
    ], bins.map(b => [b.label, showMoney(averageSales(b.records)), number(b.records.length)]));
  }

  function dataRows() {
    const query = $('dataSearch').value.trim().toLowerCase();
    const sort = $('dataSort').value;
    const direction = $('dataOrder').value === 'asc' ? 1 : -1;
    const rows = getRows().filter(r => !query || [
      'Store ' + r.Store,
      periodKey(r.date, 'week'),
      r.Weekly_Sales,
      r.Holiday_Flag,
      r.Temperature,
      r.Fuel_Price,
      r.CPI,
      r.Unemployment
    ].join(' ').toLowerCase().includes(query));

    rows.sort((a, b) => {
      let difference;
      if (sort === 'Store') difference = a.Store.localeCompare(b.Store, undefined, { numeric: true });
      else if (sort === 'Date') difference = a.date - b.date;
      else {
        const av = a[sort], bv = b[sort];
        if (!Number.isFinite(av) && !Number.isFinite(bv)) difference = 0;
        else if (!Number.isFinite(av)) return 1;
        else if (!Number.isFinite(bv)) return -1;
        else difference = av - bv;
      }
      return direction * difference || a.Store.localeCompare(b.Store, undefined, { numeric: true }) || a.date - b.date;
    });
    return rows;
  }

  function renderData() {
    const rows = dataRows(), size = Number($('dataPageSize').value), pages = Math.max(1, Math.ceil(rows.length/size));
    state.dataPage = Math.min(pages, Math.max(1, state.dataPage));
    const start = (state.dataPage - 1) * size, visible = rows.slice(start, start + size);

    table('dataTable', [
      { label: 'Store' },
      { label: 'Date' },
      { label: 'Weekly sales', numeric: true },
      { label: 'Holiday', numeric: true },
      { label: 'Temperature', numeric: true },
      { label: 'Fuel price', numeric: true },
      { label: 'CPI', numeric: true },
      { label: 'Unemployment', numeric: true }
    ], visible.map(r => [
      'Store ' + r.Store,
      periodKey(r.date, 'week'),
      fullMoney(r.Weekly_Sales),
      r.Holiday_Flag ? 'Yes' : 'No',
      numeric(r.Temperature),
      numeric(r.Fuel_Price),
      numeric(r.CPI),
      numeric(r.Unemployment)
    ]));

    set('dataCount', number(rows.length) + ' matching records out of ' + number(getRows().length) + ' filtered records');
    set('dataPageLabel', 'Page ' + state.dataPage + ' of ' + pages + (rows.length ? ' · Rows ' + number(start + 1) + '–' + number(Math.min(start + size, rows.length)) : ' · No records'));
    $('dataPrev').disabled = state.dataPage <= 1;
    $('dataNext').disabled = state.dataPage >= pages;
    $('exportCsv').disabled = !rows.length;
  }

  function exportData() {
    const rows = dataRows();
    if (!rows.length) return;
    const records = rows.map(r => ({
      Store: r.Store,
      Date: periodKey(r.date, 'week'),
      Weekly_Sales: r.Weekly_Sales,
      Holiday_Flag: r.Holiday_Flag,
      Temperature: Number.isFinite(r.Temperature) ? r.Temperature : '',
      Fuel_Price: Number.isFinite(r.Fuel_Price) ? r.Fuel_Price : '',
      CPI: Number.isFinite(r.CPI) ? r.CPI : '',
      Unemployment: Number.isFinite(r.Unemployment) ? r.Unemployment : ''
    }));
    const csv = Papa.unparse(records, { escapeFormulae: true });
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'walmart-sales-filtered.csv';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function render() {
    const renderers = {
      overview: renderOverview,
      stores: renderStore,
      'compare-stores': renderCompare,
      periods: renderPeriods,
      seasonality: renderSeasons,
      economics: renderEconomics,
      data: renderData
    };
    if (state.page === 'data' || window.Chart) renderers[state.page]();
  }

  function route(focus = false) {
    const requested = window.location.hash.slice(1);
    const page = Object.hasOwn(ROUTES, requested) ? requested : 'overview';
    state.page = page;
    document.querySelectorAll('.page-view').forEach(view => {
      const hidden = view.id !== 'page-' + page;
      view.hidden = hidden;
      view.classList.toggle('hidden', hidden);
    });
    document.querySelectorAll('.page-nav [data-page]').forEach(link => {
      const active = link.dataset.page === page;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    const ownStore = page === 'stores' || page === 'compare-stores';
    $('globalStoreFilter').classList.toggle('hidden', ownStore);
    $('globalFilters').classList.toggle('filters-three', ownStore);

    set('pageTitle', ROUTES[page][0]);
    set('pageSubtitle', ROUTES[page][1]);
    document.title = ROUTES[page][0] + ' | Walmart Sales Intelligence';

    if (requested && !Object.hasOwn(ROUTES, requested)) window.history.replaceState(null, '', '#overview');
    render();
    if (focus) {
      $('pageHeading').focus({ preventScroll: true });
      window.scrollTo({ top: 0, left: 0 });
    }
  }

  function init() {
    window.addEventListener('hashchange', () => route(true));

    // Page-specific selects
    ['focusStore', 'storePeriod', 'comparePeriod', 'periodGrain', 'economicFactor', 'economicViewMode'].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('change', render);
    });

    // Compare store quick actions
    if ($('compareSelectAll')) {
      $('compareSelectAll').addEventListener('click', () => {
        state.stores = availableStores.slice();
        updateStoreChipUI();
        updateCompareNote();
        if (state.page === 'compare-stores') renderCompare();
      });
    }

    if ($('compareClearAll')) {
      $('compareClearAll').addEventListener('click', () => {
        state.stores = [];
        updateStoreChipUI();
        updateCompareNote();
        if (state.page === 'compare-stores') renderCompare();
      });
    }

    if ($('compareTop5')) {
      $('compareTop5').addEventListener('click', () => {
        state.stores = rankedStores.slice(0, 5).map(r => r.id);
        updateStoreChipUI();
        updateCompareNote();
        if (state.page === 'compare-stores') renderCompare();
      });
    }

    if ($('compareStoreSearch')) {
      $('compareStoreSearch').addEventListener('input', e => {
        const q = e.target.value.trim().toLowerCase();
        const chips = $('compareStoreOptions').querySelectorAll('.store-chip');
        chips.forEach(chip => {
          const match = !q || chip.textContent.toLowerCase().includes(q);
          chip.style.display = match ? 'inline-flex' : 'none';
        });
      });
    }

    // Data table controls
    ['dataSort', 'dataOrder', 'dataPageSize'].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('change', () => { state.dataPage = 1; renderData(); });
    });

    if ($('dataSearch')) $('dataSearch').addEventListener('input', () => { state.dataPage = 1; renderData(); });
    if ($('dataPrev')) $('dataPrev').addEventListener('click', () => { state.dataPage--; renderData(); });
    if ($('dataNext')) $('dataNext').addEventListener('click', () => { state.dataPage++; renderData(); });
    if ($('exportCsv')) $('exportCsv').addEventListener('click', exportData);

    route();
  }

  return { init, render, resetData };
};
