(() => {
  'use strict';
  const sessions=new Map();
  function demoData(symbol,period,referencePrice){
    const count=period==='1D'?78:period==='1W'?70:period==='1M'?120:180;
    const step=period==='1D'?300:period==='1W'?1800:period==='1M'?14400:43200;
    let seed=[...symbol+period].reduce((a,c)=>a*31+c.charCodeAt(0),7)>>>0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const end=Date.UTC(2026,9,20,20)/1000;
    let price=symbol==='AAPL'?295:193;
    const raw=[];
    for(let i=0;i<count;i++){
      const open=price,close=Math.max(1,open+(random()-.43)*(period==='1D'?.8:2.3));
      raw.push({time:end-(count-1-i)*step,open,high:Math.max(open,close)+random()*1.2,low:Math.min(open,close)-random()*1.2,close,volume:Math.round(10000+random()*120000)});price=close;
    }
    const target=referencePrice||(symbol==='AAPL'?302.83:199.15),scale=target/raw.at(-1).close;
    return raw.map(p=>({...p,open:+(p.open*scale).toFixed(2),high:+(p.high*scale).toFixed(2),low:+(p.low*scale).toFixed(2),close:+(p.close*scale).toFixed(2)}));
  }
  window.TradingDemoChart={demoData,mount(host,{symbol,referencePrice,expanded=false,onExpand}){
    const lib=window.LightweightCharts;
    if(!lib){host.textContent='Chart unavailable. Reload the page.';return ()=>{};}
    const state=sessions.get(symbol)||{period:'1M'};
    host.innerHTML=`<div class="m-live-chart-toolbar"><span>${symbol} · USD</span><div>${['1D','1W','1M','3M'].map(p=>`<button type="button" data-chart-period="${p}" aria-pressed="${state.period===p}">${p}</button>`).join('')}</div></div><div class="m-chart-ohlc" aria-live="off"></div><div class="m-live-chart-canvas" aria-label="Interactive ${symbol} candlestick and volume chart. Drag to pan; pinch or use zoom buttons to change scale."></div><div class="m-chart-controls"><div><button type="button" data-chart-action="out" aria-label="Zoom out">−</button><button type="button" data-chart-action="in" aria-label="Zoom in">+</button><button type="button" data-chart-action="reset">Reset</button></div>${expanded?'':'<button type="button" data-chart-action="expand" aria-label="Expand chart">⤢</button>'}</div><div class="m-chart-attribution"><span>Demo data</span><a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">TradingView Lightweight Charts™</a></div><small class="m-chart-copyright">Copyright © 2025 TradingView, Inc.</small>`;
    const container=host.querySelector('.m-live-chart-canvas');
    const chart=lib.createChart(container,{autoSize:true,layout:{background:{type:'solid',color:'#fff'},textColor:'#77808e',fontFamily:'Trading Avenir Next, Arial, sans-serif',fontSize:9,attributionLogo:true},grid:{vertLines:{color:'#edf1f8'},horzLines:{color:'#edf1f8'}},rightPriceScale:{borderColor:'#d7d8e4',minimumWidth:47},timeScale:{borderColor:'#d7d8e4',timeVisible:true,secondsVisible:false,rightOffset:3},crosshair:{mode:lib.CrosshairMode.Normal},handleScroll:{mouseWheel:true,pressedMouseMove:true,horzTouchDrag:true,vertTouchDrag:false},handleScale:{mouseWheel:true,pinch:true,axisPressedMouseMove:true}});
    const candles=chart.addSeries(lib.CandlestickSeries,{upColor:'#00c887',downColor:'#ff6b6b',borderVisible:false,wickUpColor:'#00b287',wickDownColor:'#ff6b6b',priceLineVisible:true});
    candles.priceScale().applyOptions({scaleMargins:{top:.12,bottom:.25}});
    const volume=chart.addSeries(lib.HistogramSeries,{priceFormat:{type:'volume'},priceScaleId:'',lastValueVisible:false,priceLineVisible:false});
    volume.priceScale().applyOptions({scaleMargins:{top:.8,bottom:0}});
    let points;
    const display=p=>{if(!p)return;host.querySelector('.m-chart-ohlc').textContent=`O ${p.open.toFixed(2)}  H ${p.high.toFixed(2)}  L ${p.low.toFixed(2)}  C ${p.close.toFixed(2)}`;};
    function setPeriod(period){state.period=period;sessions.set(symbol,state);points=demoData(symbol,period,referencePrice);candles.setData(points.map(({volume,...p})=>p));volume.setData(points.map(p=>({time:p.time,value:p.volume,color:p.close>=p.open?'#00c88755':'#ff6b6b55'})));chart.timeScale().fitContent();display(points.at(-1));host.querySelectorAll('[data-chart-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chartPeriod===period)));}
    setPeriod(state.period);
    chart.subscribeCrosshairMove(param=>display(param.seriesData.get(candles)||points.at(-1)));
    const click=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.chartPeriod)setPeriod(b.dataset.chartPeriod);const action=b.dataset.chartAction;if(action==='reset')chart.timeScale().fitContent();if(action==='expand')onExpand();if(['in','out'].includes(action)){const range=chart.timeScale().getVisibleLogicalRange();if(range){const center=(range.from+range.to)/2,half=(range.to-range.from)/2*(action==='in'?.75:1.3);chart.timeScale().setVisibleLogicalRange({from:center-half,to:center+half});}}};
    host.addEventListener('click',click);
    return ()=>{host.removeEventListener('click',click);chart.remove();};
  }};
})();
