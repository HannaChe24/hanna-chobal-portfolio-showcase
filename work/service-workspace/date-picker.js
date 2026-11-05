(() => {
  const host=document.querySelector('[data-task-prototype]');if(!host)return;
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function parse(value){
    const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const text=/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec(value);
    const y=match?+match[1]:text?+text[3]:0,m=match?+match[2]-1:text?months.findIndex(v=>v.toLowerCase()===text[2].toLowerCase()):-1,day=match?+match[3]:text?+text[1]:0;
    const d=new Date(y,m,day,12);return d.getFullYear()===y&&d.getMonth()===m&&d.getDate()===day?d:null;
  }
  const format=value=>{const d=value instanceof Date?value:parse(value);return d?`${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`:'';};
  let active=null;
  function close(){if(!active)return;const {panel,trigger}=active;active=null;panel.remove();trigger?.setAttribute('aria-expanded','false');}
  function open({input,trigger,value,onSelect}){
    if(active?.trigger===trigger){close();return;}close();
    const selected=parse(value),now=new Date(),panel=document.createElement('div');
    let month=new Date((selected||now).getFullYear(),(selected||now).getMonth(),1,12);
    panel.className='tp-unified-date-picker';panel.setAttribute('popover','auto');panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Choose date');
    (input.closest('dialog,.tp-file-filter-menu,.tp-activity-filter-popover')||host).append(panel);active={panel,trigger};trigger?.setAttribute('aria-expanded','true');
    const choose=date=>{onSelect(date?iso(date):'');close();trigger?.focus();};
    const allowed=d=>(!input.min||iso(d)>=input.min)&&(!input.max||iso(d)<=input.max);
    function render(focusDate){
      panel.innerHTML='<header><button type="button" aria-label="Previous month">‹</button><strong></strong><button type="button" aria-label="Next month">›</button></header><div class="tp-date-weekdays" aria-hidden="true">'+['M','T','W','T','F','S','S'].map(v=>`<span>${v}</span>`).join('')+'</div><div class="tp-date-days" role="group" aria-label="Days"></div><footer><button type="button" data-date-clear>Clear</button><button type="button" data-date-today>Today</button></footer>';
      panel.querySelector('strong').textContent=month.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
      const offset=(month.getDay()+6)%7;
      for(let i=0;i<42;i++){
        const d=new Date(month.getFullYear(),month.getMonth(),1-offset+i,12),b=document.createElement('button');b.type='button';b.textContent=d.getDate();b.dataset.date=iso(d);b.setAttribute('aria-label',format(d));b.setAttribute('aria-pressed',String(!!selected&&iso(d)===iso(selected)));b.classList.toggle('is-other-month',d.getMonth()!==month.getMonth());if(iso(d)===iso(now))b.setAttribute('aria-current','date');b.disabled=!allowed(d);b.onclick=()=>choose(d);panel.querySelector('.tp-date-days').append(b);
      }
      for(const [label,delta] of [['Previous month',-1],['Next month',1]])panel.querySelector(`[aria-label="${label}"]`).onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+delta,1,12);render();panel.querySelector(`[aria-label="${label}"]`).focus();};
      panel.querySelector('[data-date-clear]').hidden=input.required;panel.querySelector('[data-date-clear]').onclick=()=>choose(null);
      panel.querySelector('[data-date-today]').disabled=!allowed(now);panel.querySelector('[data-date-today]').onclick=()=>choose(now);
      if(focusDate)panel.querySelector(`[data-date="${iso(focusDate)}"]`)?.focus();
    }
    panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();trigger?.focus();return;}const b=e.target.closest('[data-date]');if(!b)return;const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];if(delta){e.preventDefault();const d=parse(b.dataset.date);d.setDate(d.getDate()+delta);month=new Date(d.getFullYear(),d.getMonth(),1,12);render(d);}});
    panel.addEventListener('toggle',e=>{if(e.newState==='closed'&&active?.panel===panel)close();});
    render();panel.showPopover();const r=(trigger.closest('.tp-visit-picker-field')||trigger).getBoundingClientRect(),p=panel.getBoundingClientRect();panel.style.left=Math.max(8,Math.min(r.left,innerWidth-p.width-8))+'px';panel.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-p.height-8))+'px';
    (panel.querySelector('[aria-pressed="true"]')||panel.querySelector('[aria-current="date"]')||panel.querySelector('.tp-date-days button:not(:disabled)'))?.focus();
  }
  window.prototypeDates={parse,format,open,close};
  const enhanced=new WeakMap();
  const icon='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="1"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>';
  function enhance(){
    host.querySelectorAll('input[type="date"]').forEach(input=>{
      let button=enhanced.get(input);
      if(!button){
        // Cloned comparison panels keep markup, but need their own handlers.
        let wrap=input.parentElement;
        if(!wrap.classList.contains('tp-date-control')){wrap=document.createElement('span');wrap.className='tp-date-control';input.before(wrap);wrap.append(input);}else wrap.querySelectorAll('.tp-date-display').forEach(e=>e.remove());
        button=document.createElement('button');button.type='button';button.className='tp-date-display';button.innerHTML='<span></span>'+icon;wrap.append(button);input.tabIndex=-1;input.setAttribute('aria-hidden','true');input.addEventListener('focus',()=>button.focus());input.classList.add('tp-date-source');enhanced.set(input,button);
        button.onclick=()=>{if(input.readOnly||input.disabled)return;open({input,trigger:button,value:input.value,onSelect:value=>{input.value=value;sync();input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}});};
        input.addEventListener('change',()=>sync());input.addEventListener('input',()=>sync());
      }
      function sync(){const text=format(input.value)||'Select date';if(button.firstChild.textContent!==text)button.firstChild.textContent=text;button.disabled=input.disabled;button.setAttribute('aria-readonly',String(input.readOnly));button.setAttribute('aria-haspopup','dialog');const label=input.getAttribute('aria-label')||input.closest('label')?.querySelector(':scope > span:not(.tp-date-control):not(.tp-filter-date-field)')?.textContent||input.closest('label')?.childNodes[0]?.textContent||input.name||'Date';button.setAttribute('aria-label',`${label.replace(/\*/g,'').trim()}: ${text}`);}
      sync();
    });
  }
  enhance();new MutationObserver(enhance).observe(host,{childList:true,subtree:true});
  host.addEventListener('reset',()=>queueMicrotask(enhance));
  window.addEventListener('resize',close);host.addEventListener('close',close,true);
})();
