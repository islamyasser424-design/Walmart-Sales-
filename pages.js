'use strict';
window.createSalesPages=function({$,money,number,avg,sum,group,fullMoney,periodKey,MONTHS,draw,chartPalette,getRows,getAllRows,renderOverview}){
  const ROUTES={
    overview:['Sales Overview','Track weekly performance, store rankings and the factors shaping sales.'],
    stores:['Store Details','Explore one store, its strongest weeks and its position among other stores.'],
    'compare-stores':['Compare Stores','Compare up to four stores using the same period and holiday filters.'],
    periods:['Period Analysis','Compare monthly, quarterly and yearly sales with the preceding calendar period.'],
    seasonality:['Seasons & Holidays','Find seasonal patterns and compare holiday and regular store-week performance.'],
    economics:['Economic Factors','Explore relationships between weekly sales and the available economic factors.'],
    data:['Data Explorer','Search, sort and export the sales records behind the dashboard.']
  };
  const state={page:'overview',stores:[],dataPage:1};
  const numeric=n=>Number.isFinite(n)?new Intl.NumberFormat('en-US',{maximumFractionDigits:3}).format(n):'—';
  const sales=rows=>sum(rows.map(r=>r.Weekly_Sales));
  const averageSales=rows=>rows.length?avg(rows.map(r=>r.Weekly_Sales)):null;
  const pct=n=>n===null||!Number.isFinite(n)?'—':(n>0?'+':'')+n.toFixed(1)+'%';
  const showMoney=n=>n===null?'—':fullMoney(n);
  const set=(id,value)=>{$(id).textContent=value};
  const optionsFor=(legend=false)=>{
    const p=chartPalette();
    return {plugins:{legend:{display:legend,labels:{color:p.text,boxWidth:11,usePointStyle:true}},tooltip:{backgroundColor:p.surface,titleColor:p.ink,bodyColor:p.ink,borderColor:p.grid,borderWidth:1,callbacks:{label:c=>(c.dataset.label||'Sales')+': '+money(c.parsed.y)}}},
      scales:{x:{grid:{display:false},ticks:{color:p.text,maxRotation:0,maxTicksLimit:10}},y:{grid:{color:p.grid},ticks:{color:p.text,callback:v=>money(v)}}}};
  };
  const colors=()=>[chartPalette().blue,'#d79b00','#1fa889','#bf7fdb'];
  function periodTotals(rows,grain){return [...group(rows,r=>periodKey(r.date,grain))].map(([key,records])=>({key,records,total:sales(records)})).sort((a,b)=>a.key.localeCompare(b.key))}
  function table(id,columns,rows){
    const el=document.createElement('table');el.className='data-table';
    const head=document.createElement('thead'),tr=document.createElement('tr');
    columns.forEach(c=>{const th=document.createElement('th');th.scope='col';th.textContent=c.label;if(c.numeric)th.className='numeric';tr.append(th)});
    head.append(tr);el.append(head);const body=document.createElement('tbody');
    if(!rows.length){const row=document.createElement('tr'),td=document.createElement('td');td.colSpan=columns.length;td.className='table-empty';td.textContent='No matching records. Adjust the filters or load data.';row.append(td);body.append(row)}
    rows.forEach(values=>{const row=document.createElement('tr');values.forEach((cell,i)=>{const td=document.createElement('td'),object=cell!==null&&typeof cell==='object';td.textContent=object?cell.text:String(cell??'—');td.className=[columns[i].numeric?'numeric':'',object?cell.className||'':''].filter(Boolean).join(' ');row.append(td)});body.append(row)});
    el.append(body);$(id).replaceChildren(el);
  }
  function changeCell(value){return {text:pct(value),className:value>0?'change-up':value<0?'change-down':''}}
  function resetData(){
    const all=getAllRows(),ranked=[...group(all,r=>r.Store)].map(([id,rows])=>({id,total:sales(rows)})).sort((a,b)=>b.total-a.total);
    const stores=ranked.map(r=>r.id).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    $('focusStore').replaceChildren(...stores.map(id=>new Option('Store '+id,id)));
    if(ranked.length)$('focusStore').value=ranked[0].id;
    state.stores=ranked.slice(0,2).map(r=>r.id);state.dataPage=1;
    $('compareStoreOptions').replaceChildren(...stores.map(id=>{
      const label=document.createElement('label');label.className='store-chip'+(state.stores.includes(id)?' selected':'');
      const input=document.createElement('input');input.type='checkbox';input.value=id;input.checked=state.stores.includes(id);input.setAttribute('aria-label','Compare Store '+id);
      const text=document.createElement('span');text.textContent='Store '+id;label.append(input,text);
      input.addEventListener('change',()=>{
        if(input.checked&&state.stores.length>=4){input.checked=false;set('compareSelectionNote','You can compare up to 4 stores. Uncheck one to choose another.');return}
        state.stores=input.checked?[...state.stores,id]:state.stores.filter(s=>s!==id);label.classList.toggle('selected',input.checked);
        set('compareSelectionNote',state.stores.length+' stores selected. Choose up to 4; year, month and holiday filters apply to every store.');
        if(state.page==='compare-stores')renderCompare();
      });
      return label;
    }));
    set('compareSelectionNote',state.stores.length+' stores selected. Choose up to 4; year, month and holiday filters apply to every store.');
  }
  function renderStore(){
    const all=getRows({ignoreStore:true}),id=$('focusStore').value,rows=all.filter(r=>r.Store===id),mean=averageSales(rows);
    const ranking=[...group(all,r=>r.Store)].map(([store,records])=>({store,total:sales(records)})).sort((a,b)=>b.total-a.total||a.store.localeCompare(b.store,undefined,{numeric:true}));
    const position=ranking.findIndex(r=>r.store===id),weeks=periodTotals(rows,'week'),peak=[...weeks].sort((a,b)=>b.total-a.total)[0];
    set('detailTotal',rows.length?money(sales(rows)):'—');set('detailAverage',mean===null?'—':money(mean));set('detailRecords',number(rows.length)+' store-week records');
    set('detailRank',position>=0?'#'+(position+1):'—');set('detailRankNote','Among '+ranking.length+' stores in the same period');
    set('detailPeak',peak?money(peak.total):'—');set('detailPeakDate',peak?peak.key:'No records in the selected period');
    const timeline=periodTotals(rows,$('storePeriod').value),p=chartPalette();
    draw('detailTrendChart','line',{labels:timeline.map(x=>x.key),datasets:[{label:'Store '+id,data:timeline.map(x=>x.total),borderColor:p.blue,backgroundColor:p.fill,fill:true,tension:.2,pointRadius:timeline.length>40?0:2}]},optionsFor());
    draw('detailBenchmarkChart','bar',{labels:['Store '+(id||'—'),'All stores'],datasets:[{label:'Average weekly sales',data:[mean,averageSales(all)],backgroundColor:[p.blue,'#ffc220'],borderRadius:5}]},optionsFor());
    table('detailTable',[{label:'Month'},{label:'Total sales',numeric:true},{label:'Weekly average',numeric:true},{label:'Records',numeric:true}],periodTotals(rows,'month').map(x=>[x.key,fullMoney(x.total),showMoney(averageSales(x.records)),number(x.records.length)]));
  }
  function renderCompare(){
    const all=getRows({ignoreStore:true}),selected=all.filter(r=>state.stores.includes(r.Store)),grain=$('comparePeriod').value;
    const keys=[...new Set(selected.map(r=>periodKey(r.date,grain)))].sort(),palette=colors();
    const details=state.stores.map((id,i)=>{const records=all.filter(r=>r.Store===id),buckets=new Map(periodTotals(records,grain).map(x=>[x.key,x.total]));return {id,records,total:sales(records),color:palette[i],data:keys.map(k=>buckets.has(k)?buckets.get(k):null)}});
    draw('compareTrendChart','line',{labels:keys,datasets:details.map(x=>({label:'Store '+x.id,data:x.data,borderColor:x.color,backgroundColor:x.color,fill:false,tension:.15,spanGaps:false,pointRadius:keys.length>40?0:2}))},optionsFor(true));
    draw('compareTotalChart','bar',{labels:details.map(x=>'Store '+x.id),datasets:[{label:'Total sales',data:details.map(x=>x.records.length?x.total:null),backgroundColor:details.map(x=>x.color),borderRadius:5}]},optionsFor());
    const combined=sales(selected);
    table('compareTable',[{label:'Store'},{label:'Total sales',numeric:true},{label:'Weekly average',numeric:true},{label:'Records',numeric:true},{label:'Share of selected stores',numeric:true}],details.map(x=>['Store '+x.id,x.records.length?fullMoney(x.total):'—',showMoney(averageSales(x.records)),number(x.records.length),combined!==0&&x.records.length?(x.total/combined*100).toFixed(1)+'%':'—']));
  }
  function previousPeriod(key,grain){
    if(grain==='year')return String(Number(key)-1);
    if(grain==='quarter'){const [y,q]=key.split('-Q').map(Number);return (q===1?y-1:y)+'-Q'+(q===1?4:q-1)}
    const [year,month]=key.split('-').map(Number);return periodKey(new Date(Date.UTC(year,month-2,1)),'month');
  }
  function renderPeriods(){
    const rows=getRows(),grain=$('periodGrain').value,timeline=periodTotals(rows,grain),lookup=new Map(timeline.map(x=>[x.key,x]));
    const latest=timeline.at(-1),previous=latest?lookup.get(previousPeriod(latest.key,grain)):null;
    const growth=latest&&previous&&previous.total!==0?(latest.total/previous.total-1)*100:null,p=chartPalette();
    set('periodLatest',latest?money(latest.total):'—');set('periodLatestLabel',latest?latest.key:'No selected period');
    set('periodPrevious',previous?money(previous.total):'—');set('periodPreviousLabel',latest?previousPeriod(latest.key,grain):'Previous calendar period');
    set('periodChange',pct(growth));$('periodChange').className='value'+(growth>0?' change-up':growth<0?' change-down':'');
    set('periodChangeValue',latest&&previous?(latest.total-previous.total>=0?'+':'')+money(latest.total-previous.total):'Previous period is not in this selection');
    set('periodCount',number(timeline.length));
    draw('periodChart','bar',{labels:timeline.map(x=>x.key),datasets:[{label:'Total sales',data:timeline.map(x=>x.total),backgroundColor:timeline.map((x,i)=>i===timeline.length-1?'#ffc220':p.blue),borderRadius:4}]},optionsFor());
    table('periodTable',[{label:'Period'},{label:'Sales',numeric:true},{label:'Change vs prior period',numeric:true},{label:'Distinct weeks',numeric:true},{label:'Stores',numeric:true},{label:'Records',numeric:true}],[...timeline].reverse().map(x=>{
      const prior=lookup.get(previousPeriod(x.key,grain)),change=prior&&prior.total!==0?(x.total/prior.total-1)*100:null;
      return [x.key,fullMoney(x.total),changeCell(change),new Set(x.records.map(r=>periodKey(r.date,'week'))).size,new Set(x.records.map(r=>r.Store)).size,number(x.records.length)];
    }));
  }
  function renderSeasons(){
    const rows=getRows(),holiday=rows.filter(r=>r.Holiday_Flag===1),regular=rows.filter(r=>r.Holiday_Flag===0),a=averageSales(holiday),b=averageSales(regular);
    const months=group(rows,r=>r.date.getUTCMonth()),best=[...months].map(([month,records])=>({month,mean:averageSales(records)})).sort((a,b)=>b.mean-a.mean)[0];
    set('seasonHoliday',a===null?'—':money(a));set('seasonRegular',b===null?'—':money(b));set('seasonHolidayCount',number(holiday.length)+' holiday records');set('seasonRegularCount',number(regular.length)+' regular records');
    set('seasonUplift',pct(a!==null&&b!==null&&b!==0?(a/b-1)*100:null));set('seasonBest',best?MONTHS[best.month]:'—');set('seasonBestValue',best?money(best.mean)+' average store-week sales':'No records');
    set('seasonNote',holiday.length&&regular.length?'Average store-week sales account for different numbers of records. Calendar months combine the selected years.':'Select All weeks and a period containing holiday and regular records to compare both groups.');
    const p=chartPalette(),split=(records,flag)=>averageSales(records.filter(r=>r.Holiday_Flag===flag));
    draw('seasonMonthlyChart','bar',{labels:MONTHS,datasets:[{label:'Regular weeks',data:MONTHS.map((_,i)=>split(months.get(i)||[],0)),backgroundColor:p.blue,borderRadius:3},{label:'Holiday weeks',data:MONTHS.map((_,i)=>split(months.get(i)||[],1)),backgroundColor:'#ffc220',borderRadius:3}]},optionsFor(true));
    const years=[...group(rows,r=>String(r.date.getUTCFullYear()))].sort(([a],[b])=>a.localeCompare(b));
    draw('seasonYearChart','bar',{labels:years.map(([year])=>year),datasets:[{label:'Regular weeks',data:years.map(([,r])=>split(r,0)),backgroundColor:p.blue,borderRadius:4},{label:'Holiday weeks',data:years.map(([,r])=>split(r,1)),backgroundColor:'#ffc220',borderRadius:4}]},optionsFor(true));
    table('seasonTable',[{label:'Month'},{label:'Total sales',numeric:true},{label:'Weekly average',numeric:true},{label:'Holiday average',numeric:true},{label:'Regular average',numeric:true},{label:'Records',numeric:true}],[...months].sort(([a],[b])=>a-b).map(([m,r])=>[MONTHS[m],fullMoney(sales(r)),showMoney(averageSales(r)),showMoney(split(r,1)),showMoney(split(r,0)),number(r.length)]));
  }
  function renderEconomics(){
    const factor=$('economicFactor').value,name=$('economicFactor').selectedOptions[0].textContent,rows=getRows().filter(r=>Number.isFinite(r[factor]));
    const meanX=rows.length?avg(rows.map(r=>r[factor])):null,meanY=averageSales(rows);
    let xx=0,yy=0,xy=0;rows.forEach(r=>{const x=r[factor]-meanX,y=r.Weekly_Sales-meanY;xx+=x*x;yy+=y*y;xy+=x*y});
    const correlation=rows.length>1&&xx>0&&yy>0?Math.max(-1,Math.min(1,xy/Math.sqrt(xx*yy))):null;
    set('economicAverage',meanX===null?'—':numeric(meanX));set('economicFactorName',name);set('economicCorrelation',correlation===null?'—':correlation.toFixed(3));set('economicRecords',number(rows.length));set('economicSales',meanY===null?'—':money(meanY));
    const p=chartPalette(),scatterOptions=optionsFor();
    scatterOptions.scales.x={type:'linear',title:{display:true,text:name,color:p.text},grid:{color:p.grid},ticks:{color:p.text}};
    scatterOptions.plugins.tooltip.callbacks.title=items=>items.length?name+': '+numeric(items[0].parsed.x):'';
    draw('economicScatterChart','scatter',{datasets:[{label:'Weekly sales',data:rows.map(r=>({x:r[factor],y:r.Weekly_Sales})),backgroundColor:p.blue,pointRadius:2,pointHoverRadius:4}]},scatterOptions);
    let bins=[];
    if(rows.length){
      const min=rows.reduce((n,r)=>Math.min(n,r[factor]),Infinity),max=rows.reduce((n,r)=>Math.max(n,r[factor]),-Infinity),count=min===max?1:Math.min(8,new Set(rows.map(r=>r[factor])).size),width=(max-min)/count;
      bins=Array.from({length:count},(_,i)=>({label:count===1?numeric(min):numeric(min+i*width)+'–'+numeric(i===count-1?max:min+(i+1)*width),records:[]}));
      rows.forEach(r=>{const i=count===1?0:Math.min(count-1,Math.floor((r[factor]-min)/width));bins[i].records.push(r)});
    }
    draw('economicRangeChart','bar',{labels:bins.map(b=>b.label),datasets:[{label:'Average weekly sales',data:bins.map(b=>averageSales(b.records)),backgroundColor:p.blue,borderRadius:4}]},optionsFor());
    table('economicTable',[{label:name+' range'},{label:'Average sales',numeric:true},{label:'Records',numeric:true}],bins.map(b=>[b.label,showMoney(averageSales(b.records)),number(b.records.length)]));
  }
  function dataRows(){
    const query=$('dataSearch').value.trim().toLowerCase(),sort=$('dataSort').value,direction=$('dataOrder').value==='asc'?1:-1;
    const rows=getRows().filter(r=>!query||['Store '+r.Store,periodKey(r.date,'week'),r.Weekly_Sales,r.Holiday_Flag,r.Temperature,r.Fuel_Price,r.CPI,r.Unemployment].join(' ').toLowerCase().includes(query));
    rows.sort((a,b)=>{
      let difference;
      if(sort==='Store')difference=a.Store.localeCompare(b.Store,undefined,{numeric:true});
      else if(sort==='Date')difference=a.date-b.date;
      else {const av=a[sort],bv=b[sort];if(!Number.isFinite(av)&&!Number.isFinite(bv))difference=0;else if(!Number.isFinite(av))return 1;else if(!Number.isFinite(bv))return -1;else difference=av-bv}
      return direction*difference||a.Store.localeCompare(b.Store,undefined,{numeric:true})||a.date-b.date;
    });
    return rows;
  }
  function renderData(){
    const rows=dataRows(),size=Number($('dataPageSize').value),pages=Math.max(1,Math.ceil(rows.length/size));
    state.dataPage=Math.min(pages,Math.max(1,state.dataPage));const start=(state.dataPage-1)*size,visible=rows.slice(start,start+size);
    table('dataTable',[{label:'Store'},{label:'Date'},{label:'Weekly sales',numeric:true},{label:'Holiday',numeric:true},{label:'Temperature',numeric:true},{label:'Fuel price',numeric:true},{label:'CPI',numeric:true},{label:'Unemployment',numeric:true}],visible.map(r=>['Store '+r.Store,periodKey(r.date,'week'),fullMoney(r.Weekly_Sales),r.Holiday_Flag?'Yes':'No',numeric(r.Temperature),numeric(r.Fuel_Price),numeric(r.CPI),numeric(r.Unemployment)]));
    set('dataCount',number(rows.length)+' matching records out of '+number(getRows().length)+' filtered records');
    set('dataPageLabel','Page '+state.dataPage+' of '+pages+(rows.length?' · Rows '+number(start+1)+'–'+number(Math.min(start+size,rows.length)):' · No records'));
    $('dataPrev').disabled=state.dataPage<=1;$('dataNext').disabled=state.dataPage>=pages;$('exportCsv').disabled=!rows.length;
  }
  function exportData(){
    const rows=dataRows();if(!rows.length)return;
    const records=rows.map(r=>({Store:r.Store,Date:periodKey(r.date,'week'),Weekly_Sales:r.Weekly_Sales,Holiday_Flag:r.Holiday_Flag,Temperature:Number.isFinite(r.Temperature)?r.Temperature:'',Fuel_Price:Number.isFinite(r.Fuel_Price)?r.Fuel_Price:'',CPI:Number.isFinite(r.CPI)?r.CPI:'',Unemployment:Number.isFinite(r.Unemployment)?r.Unemployment:''}));
    const csv=Papa.unparse(records,{escapeFormulae:true}),url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');
    link.href=url;link.download='walmart-sales-filtered.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function render(){
    const renderers={overview:renderOverview,stores:renderStore,'compare-stores':renderCompare,periods:renderPeriods,seasonality:renderSeasons,economics:renderEconomics,data:renderData};
    if(state.page==='data'||window.Chart)renderers[state.page]();
  }
  function route(focus=false){
    const requested=window.location.hash.slice(1),page=Object.hasOwn(ROUTES,requested)?requested:'overview';state.page=page;
    document.querySelectorAll('.page-view').forEach(view=>{const hidden=view.id!=='page-'+page;view.hidden=hidden;view.classList.toggle('hidden',hidden)});
    document.querySelectorAll('.page-nav [data-page]').forEach(link=>{const active=link.dataset.page===page;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});
    const ownStore=page==='stores'||page==='compare-stores';$('globalStoreFilter').classList.toggle('hidden',ownStore);$('globalFilters').classList.toggle('filters-three',ownStore);
    set('pageTitle',ROUTES[page][0]);set('pageSubtitle',ROUTES[page][1]);document.title=ROUTES[page][0]+' | Walmart Sales Intelligence';
    if(requested&&!Object.hasOwn(ROUTES,requested))window.history.replaceState(null,'','#overview');
    render();if(focus){$('pageHeading').focus({preventScroll:true});window.scrollTo({top:0,left:0})}
  }
  function init(){
    window.addEventListener('hashchange',()=>route(true));
    ['focusStore','storePeriod','comparePeriod','periodGrain','economicFactor'].forEach(id=>$(id).addEventListener('change',render));
    ['dataSort','dataOrder','dataPageSize'].forEach(id=>$(id).addEventListener('change',()=>{state.dataPage=1;renderData()}));
    $('dataSearch').addEventListener('input',()=>{state.dataPage=1;renderData()});
    $('dataPrev').addEventListener('click',()=>{state.dataPage--;renderData()});$('dataNext').addEventListener('click',()=>{state.dataPage++;renderData()});
    $('exportCsv').addEventListener('click',exportData);route();
  }
  return {init,render,resetData};
};
