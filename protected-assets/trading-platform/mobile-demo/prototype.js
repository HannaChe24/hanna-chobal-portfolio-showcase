(() => {
  'use strict';
  const canvas = document.querySelector('#canvas'), viewport = document.querySelector('#viewport');
  const titles = {home:'Home',symbols:'Symbols',info:'Instrument details',signals:'Trading signals',profile:'Company profile',analysis:'Market analysis',trade:'Order preview',filters:'Market filters',settings:'Home settings',watchlist:'My watchlist'};
  const heights = {home:1980,symbols:724,info:1129,signals:1129,profile:1129,analysis:1129,trade:1268,filters:812,settings:812};
  const instruments=[{symbol:'NOVA',name:'Nova Systems',price:142.68},{symbol:'ALTO',name:'Alto Energy',price:86.42},{symbol:'MIRA',name:'Mira Labs',price:214.15},{symbol:'ORBN',name:'Orbit Networks',price:58.93},{symbol:'VELA',name:'Vela Industries',price:112.36}];
  let current=instruments[0];
  const saved=new Set(instruments.map(a=>a.symbol));
  let screen = 'home', side = 'Buy', orderType = 'Market', timer;
  const filters = {chart:true,compact:false,amounts:false,open:true,'North America':true,Europe:true,'South America':false,Africa:false,Asia:false,Australia:false};
  const settings = [true,true,true,true,true];
  let settingsDraft = [...settings], filterDraft = {...filters};
  const unit = n => `${n / 375 * 100}cqw`;
  function place(el,x,y,w,h){Object.assign(el.style,{left:unit(x),top:unit(y-44),width:unit(w),height:unit(h)});canvas.append(el);return el;}
  function button(label,action,x,y,w,h,cls='hotspot') {const b=document.createElement('button');b.type='button';b.className=cls;b.setAttribute('aria-label',label);b.addEventListener('click',action);return place(b,x,y,w,h);}
  function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>el.classList.remove('visible'),2800);}
  function toggle(label,value,change,x,y){const b=button(label,()=>{value=!value;b.setAttribute('aria-checked',value);change(value);},x,y,36,21,'overlay-control switch');b.setAttribute('role','switch');b.setAttribute('aria-checked',value);}
  function tabs(){const bar=document.createElement('nav');bar.className='detail-tabs';bar.setAttribute('aria-label','Instrument information');[['trade','Trade'],['info','Info'],['signals','Signals'],['profile','Profile'],['analysis','Analysis']].forEach(([id,label])=>{const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-current',screen===id);b.onclick=()=>show(id);bar.append(b)});canvas.append(bar);}
  function show(id){
    screen=id;canvas.replaceChildren();viewport.scrollTop=0;
    document.querySelectorAll('[data-screen]').forEach(b=>b.setAttribute('aria-current',b.dataset.screen===id));
    document.querySelector('[data-action=watchlist]').setAttribute('aria-current',id==='watchlist');
    canvas.style.height=unit((heights[id]||812)-44);
    if(id==='watchlist'){renderWatchlist();return;}
    const img=document.createElement('img');img.src=id+'.svg?v=20260914-clean-layers';img.alt=`${titles[id]} — mobile interface in a dark theme`;img.draggable=false;canvas.append(img);
    if(id==='home'||id==='symbols'){
      const head=document.createElement('div');head.className='top-brand';head.innerHTML=`<strong>Workspace</strong><span>${titles[id]}</span><button aria-label="Open home settings">⚙</button>`;head.querySelector('button').onclick=()=>show('settings');canvas.append(head);
    }
    if(id==='home'){
      button('Browse all symbols',()=>show('symbols'),283,376,83,35);
      const names=instruments.map(a=>a.symbol);
      [448,807,1160].forEach((start,section)=>{
        names.forEach((symbol,index)=>button(`Open ${symbol} · ${['My trades','My watchlist','Top movers'][section]}`,()=>{current=instruments[index];show('info')},0,start+index*50,375,50,'hotspot symbol-row-hotspot'));
      });
      button('View watchlist',()=>show('watchlist'),283,726,83,35);
      button('View top movers',()=>show('symbols'),283,1078,83,35);
      [['My trades',16,92,'symbols'],['My watchlist',95,96,'watchlist'],['Today top movers',197,114,'symbols']].forEach(([name,x,w,to])=>button(name,()=>show(to),x,109,w,36));
      applyHomePreferences();
    } else if(id==='symbols'){
      button('Open market filters',()=>show('filters'),260,109,110,39);
      [180,340,500].forEach((y,i)=>{button('Open instrument details',()=>{current=instruments[i];show('info')},16,y,343,80);button('Preview sell order',()=>{current=instruments[i];side='Sell';show('trade')},22,y+100,156,43);button('Preview buy order',()=>{current=instruments[i];side='Buy';show('trade')},192,y+100,161,43);});
      button('My watchlist',()=>show('watchlist'),15,109,110,36);
      applySymbolFilters();
      if(!filters.compact && filters['North America'] && filters.open){
        const details=[...canvas.querySelectorAll('button[aria-label="Open instrument details"]')];
        details.forEach((detail,i)=>{
          const group=document.createElement('div');group.className='symbol-card';group.setAttribute('role','group');group.setAttribute('aria-label',['NOVA','ALTO','MIRA'][i]);
          const start=170+i*160;
          Object.assign(group.style,{position:'absolute',left:'0',right:'0',top:unit(start-44),height:unit(160)});
          const children=[detail,detail.nextElementSibling,detail.nextElementSibling.nextElementSibling];
          children.forEach(child=>{child.style.top=unit(parseFloat(child.style.top)*375/100-(start-44));group.append(child)});
          canvas.append(group);
        });
      }
    } else if(['info','signals','profile','analysis','trade'].includes(id)){
      button('Close instrument',()=>show('symbols'),16,72,40,44);tabs();
      renderIdentity();
      const star=document.createElement('button');star.className='save-star';
      const refresh=()=>{const active=saved.has(current.symbol);star.textContent=active?'★':'☆';star.setAttribute('aria-label',`${active?'Remove':'Add'} ${current.name} ${active?'from':'to'} watchlist`);star.setAttribute('aria-pressed',active)};
      refresh();star.onclick=()=>{saved.has(current.symbol)?saved.delete(current.symbol):saved.add(current.symbol);refresh();toast(saved.has(current.symbol)?'Added to watchlist':'Removed from watchlist')};canvas.append(star);
      if(id==='trade') renderTrade();
    } else if(id==='settings'){
      settingsDraft=[...settings];
      button('Close settings',()=>show('home'),18,71,43,44);
      ['My trades','My watchlist','Today top movers','Latest news','Upcoming events'].forEach((label,i)=>toggle(label,settingsDraft[i],v=>settingsDraft[i]=v,278,132+i*52));
      button('Cancel settings',()=>show('home'),170,728,96,49);
      button('Save home settings',()=>{settings.splice(0,5,...settingsDraft);show('home');toast('Home preferences saved')},270,728,94,49);
    } else if(id==='filters'){
      filterDraft={...filters};
      const heading=document.createElement('div');heading.className='filter-heading';heading.textContent='Filters';canvas.append(heading);
      const done=button('Apply filters',()=>{Object.assign(filters,filterDraft);show('symbols');toast('Market filters applied')},281,48,78,38,'overlay-control primary');done.textContent='Done';
      const clear=button('Clear all filters',()=>{Object.keys(filters).forEach(k=>filters[k]=false);show('filters')},35,48,78,38,'overlay-control filter-clear');clear.textContent='Clear all';
      ['chart','compact','amounts'].forEach((key,i)=>toggle(['Always show chart','Compact list view','Use amounts for stop loss and take profit'][i],filterDraft[key],v=>filterDraft[key]=v,300,107+i*41));
      [['Open markets',48,262,true],['Close markets',148,262,false]].forEach(([label,x,y,value])=>{const b=button(label,()=>{filterDraft.open=value;canvas.querySelectorAll('[data-market]').forEach(e=>e.setAttribute('aria-pressed',e.dataset.market===String(value)));},x,y,97,34,'overlay-control chip');b.textContent=label;b.dataset.market=value;b.setAttribute('aria-pressed',filterDraft.open===value)});
      [['North America',48,480,97],['South America',148,480,101],['Africa',253,480,55],['Europe',48,516,60],['Asia',111,516,45],['Australia',159,516,70]].forEach(([label,x,y,w])=>{const b=button(label,()=>{filterDraft[label]=!filterDraft[label];b.setAttribute('aria-pressed',filterDraft[label]);},x,y,w,34,'overlay-control chip');b.textContent=label;b.setAttribute('aria-pressed',filterDraft[label]);});
    }
  }
  function sliceImage(src,start,end,top){
    const part=document.createElement('div');part.style.cssText=`position:absolute;left:0;right:0;top:${unit(top)};height:${unit(end-start)};overflow:hidden;pointer-events:none`;
    const image=document.createElement('img');image.src=src;image.alt='';image.style.marginTop=unit(-start);part.append(image);canvas.prepend(part);
  }
  function applyHomePreferences(){
    const sections=[[44,354,true],[354,718,settings[0]],[718,1055,settings[1]],[1055,1410,settings[2]]];
    canvas.querySelector('img').remove();let top=0;
    const controls=[...canvas.querySelectorAll('.hotspot')];
    sections.forEach(([start,end,visible])=>{if(visible && start===718){const panel=document.createElement('section');panel.className='watch-panel home-watch';panel.style.top=unit(top);panel.innerHTML='<h2>My watchlist</h2>'+watchRows();bindWatch(panel);canvas.append(panel)}else if(visible)sliceImage('home.svg?v=20260914-clean-layers',start,end,top);controls.forEach(b=>{const y=parseFloat(b.style.top)*375/100+44;if(y>=start&&y<end){if(!visible||start===718)b.remove();else b.style.top=unit(top+y-start);}});if(visible)top+=end-start;});
    top=renderHomeUpdates(top);
    canvas.style.height=unit(Math.max(top,699));
  }
  function renderHomeUpdates(top){
    const news=[['news-technology.svg','Digital platforms expand their mobile offering','NOVA','Market desk · 35m ago'],['news-energy.svg','Energy sector outlook: the week ahead','ALTO','Daily brief · 1h ago'],['news-devices.svg','Connected devices remain in focus','VELA','Market notes · 3h ago']];
    if(settings[3]){
      const section=document.createElement('section');section.className='home-news home-update';section.style.top=unit(top);
      section.innerHTML='<header><h2>Latest news</h2></header>'+news.map(([src,title,symbol,meta],i)=>`<button class="home-news-row" data-news="${i}"><img src="${src}" alt="${['Mobile trading devices','Renewable energy landscape','Connected wearable device'][i]}"><span><strong>${title}</strong><small><b>${symbol}</b> <em>↗ 2.94%</em> <span>${meta}</span></small></span></button>`).join('');
      section.querySelectorAll('[data-news]').forEach(b=>b.onclick=()=>{current=instruments.find(a=>a.symbol===news[Number(b.dataset.news)][2]);show('signals')});canvas.append(section);top+=344;
    }
    if(settings[4]){
      const section=document.createElement('section');section.className='home-events home-update';section.style.top=unit(top);
      section.innerHTML='<header><h2>Upcoming events</h2></header>'+[['NOVA','N','11:30 AM','Medium positive'],['ALTO','A','11:30 AM','Medium neutral'],['MIRA','M','11:40 AM','High positive']].map(([symbol,icon,time,impact],i)=>`<article class="home-event" data-instrument="${symbol}"><div class="event-time">Today, ${time}<span class="event-symbol"><i>${icon}</i>${symbol}</span></div><div class="event-actions"><button data-side="Sell">Sell $${instruments[i].price.toFixed(2)}</button><button data-side="Buy" class="${i===1?'':'event-buy'}">Buy $${(instruments[i].price+0.20).toFixed(2)}</button></div><dl><div><dt>Event</dt><dd>Employment change (Nov)</dd></div><div><dt>Impact</dt><dd class="${i===1?'event-neutral':'event-positive'}">● ● ● ${impact}</dd></div></dl></article>`).join('');
      section.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>{current=instruments.find(a=>a.symbol===b.closest('[data-instrument]').dataset.instrument);side=b.dataset.side;show('trade')});canvas.append(section);top+=548;
    }
    return top+24;
  }
  function applySymbolFilters(){
    if(!filters['North America']||!filters.open){
      const cover=document.createElement('div');cover.className='watch-panel';cover.style.cssText=`position:absolute;top:${unit(111)};left:0;right:0;bottom:0;background:#10191e`;
      cover.innerHTML='<h2>No matching symbols</h2><p>These sample stocks are in North America’s open markets. Change your filters to see them.</p><button class="primary">Edit filters</button>';cover.querySelector('button').onclick=()=>show('filters');canvas.append(cover);return;
    }
    if(!filters.chart)[180,340,500].forEach(y=>{const cover=document.createElement('div');cover.style.cssText=`position:absolute;left:${unit(133)};top:${unit(y-16)};width:${unit(138)};height:${unit(40)};background:#10191e;pointer-events:none`;canvas.append(cover)});
    if(filters.compact){canvas.style.height=unit(699);canvas.querySelector('img').remove();sliceImage('symbols.svg?v=20260914-clean-layers',44,170,0);[170,330,490].forEach((start,i)=>sliceImage('symbols.svg?v=20260914-clean-layers',start,start+65,126+i*76));canvas.querySelectorAll('.hotspot').forEach(b=>{const label=b.getAttribute('aria-label');if(label==='Open instrument details'){const index=Math.round((parseFloat(b.style.top)*375/100+44-180)/160);b.style.top=unit(126+index*76);b.style.height=unit(65);}else if(label.startsWith('Preview'))b.remove();});}
  }
  function renderIdentity(){
    const head=document.createElement('div');head.className='dynamic-identity';head.innerHTML=`<strong>${current.symbol}</strong><small>${current.name}</small>`;canvas.append(head);
    const quote=document.createElement('div');quote.className='dynamic-quote';quote.textContent='$'+current.price.toFixed(2);canvas.append(quote);
    if(['info','profile'].includes(screen)){const copy=document.createElement('div');copy.className='dynamic-company-copy'+(screen==='profile'?' profile-copy':'');copy.style.top=unit(screen==='info'?234:386);copy.innerHTML=`${current.name} is a fictional company used in this portfolio demonstration. Market information is illustrative.`;canvas.append(copy)}
    if(screen==='signals'){const labels=document.createElement('div');labels.className='dynamic-signal-labels';labels.innerHTML=['30 min','15 min','60 min','4 h','30 min','15 min','1 day'].map(t=>`<span>${current.symbol} ${t}</span>`).join('');canvas.append(labels)}
  }
  function watchRows(){return instruments.filter(a=>saved.has(a.symbol)).map(a=>`<button class="watch-row" data-instrument="${a.symbol}"><span>${a.symbol}<small>${a.name}</small></span><svg class="watch-spark" viewBox="0 0 90 28" aria-label="Illustrative one-day trend"><path d="M1 18L8 16L13 9L21 13L28 11L34 20L40 18L45 22L51 10L58 14L63 8L70 12L78 6L88 10" fill="none" stroke="#49a85d" stroke-width="1.2"/></svg><span>$${a.price.toFixed(2)}<small><em>↗ 2.94%</em></small></span></button>`).join('')||'<p class="empty-watch">No saved instruments. Add one using the star in its details.</p>'}
  function bindWatch(panel){panel.querySelectorAll('[data-instrument]').forEach(b=>b.onclick=()=>{current=instruments.find(a=>a.symbol===b.dataset.instrument);show('info')})}
  function renderWatchlist(){canvas.style.height=unit(699);const panel=document.createElement('div');panel.className='watch-panel';panel.innerHTML=`<h2>My watchlist</h2>${watchRows()}<button class="primary">Explore symbols →</button>`;panel.querySelector('.primary').onclick=()=>show('symbols');bindWatch(panel);canvas.append(panel)}
  function renderTrade(){
    // Keep the order preview consistent with the displayed instrument.
    canvas.querySelector('img').style.clipPath='inset(0 0 80% 0)';
    const form=document.createElement('form');form.className='trade-form';form.innerHTML=`<div class="choices" data-side><button type="button" aria-pressed="${side==='Sell'}">Sell</button><button type="button" aria-pressed="${side==='Buy'}">Buy</button></div><label for="units">Amount · units</label><input id="units" type="number" min="5" max="100000" step="1" value="10" required><p id="margin">Required margin: $${(current.price*10/10).toFixed(2)}<br>Available margin: $6,500.00</p><label>Order type</label><div class="choices" data-order><button type="button" aria-pressed="true">Market</button><button type="button" aria-pressed="false">Entry</button></div><div id="entry" hidden><label for="rate">Entry price</label><input id="rate" type="number" min="0.01" step="0.01" value="${(current.price-1).toFixed(2)}"></div><label><input type="checkbox" id="stop"> Stop loss</label><div id="stop-field" hidden><label for="stop-price">Stop price</label><input id="stop-price" type="number" min="0.01" step="0.01" value="${(current.price*.95).toFixed(2)}"></div><label><input type="checkbox" id="profit"> Take profit</label><div id="profit-field" hidden><label for="profit-price">Target price</label><input id="profit-price" type="number" min="0.01" step="0.01" value="${(current.price*1.05).toFixed(2)}"></div><p>Preview the order flow with sample data.</p><button class="primary" type="submit">Preview ${side.toLowerCase()} order</button>`;
    form.querySelectorAll('[data-side] button').forEach(b=>b.onclick=()=>{side=b.textContent;form.querySelectorAll('[data-side] button').forEach(e=>e.setAttribute('aria-pressed',e===b));form.querySelector('[type=submit]').textContent=`Preview ${side.toLowerCase()} order`;updateMargin();});
    form.querySelectorAll('[data-order] button').forEach(b=>b.onclick=()=>{orderType=b.textContent;form.querySelectorAll('[data-order] button').forEach(e=>e.setAttribute('aria-pressed',e===b));form.querySelector('#entry').hidden=orderType!=='Entry';updateMargin();});
    const quote=()=>orderType==='Entry'?Number(form.querySelector('#rate').value):current.price+(side==='Buy'?.20:0);
    function updateMargin(){form.querySelector('#margin').innerHTML=`Required margin: $${(Number(form.querySelector('#units').value)*quote()/10).toFixed(2)}<br>Available margin: $6,500.00`;}
    form.querySelector('#units').oninput=updateMargin;form.querySelector('#rate').oninput=updateMargin;
    ['stop','profit'].forEach(k=>form.querySelector('#'+k).onchange=e=>form.querySelector('#'+k+'-field').hidden=!e.target.checked);
    form.onsubmit=e=>{e.preventDefault();toast(`${side} ${form.querySelector('#units').value} ${current.symbol} · ${orderType.toLowerCase()} order preview. Demo complete.`)};canvas.append(form);orderType='Market';updateMargin();
  }
  document.querySelectorAll('[data-screen]').forEach(b=>b.onclick=()=>show(b.dataset.screen));
  document.querySelector('[data-action=trade]').onclick=()=>{side='Buy';show('trade')};
  document.querySelector('[data-action=watchlist]').onclick=()=>show('watchlist');
  document.querySelector('#hints').onclick=e=>{const on=document.body.classList.toggle('show-hints');e.currentTarget.setAttribute('aria-pressed',on);e.currentTarget.textContent=on?'Hide tap areas':'Show tap areas'};
  document.querySelector('#restart').onclick=()=>{saved.clear();instruments.forEach(a=>saved.add(a.symbol));current=instruments[0];settings.splice(0,5,true,true,true,true,true);Object.assign(filters,{chart:true,compact:false,amounts:false,open:true,'North America':true,Europe:true,'South America':false,Africa:false,Asia:false,Australia:false});show('home');toast('Prototype restarted')};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')show(['settings','home','watchlist'].includes(screen)?'home':'symbols')});
  show('home');
})();
