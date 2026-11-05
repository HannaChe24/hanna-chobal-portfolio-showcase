(() => {
  const host=document.querySelector('[data-task-prototype]');if(!host)return;
  const bindings=new Map();
  const checked=menu=>menu.querySelectorAll('input[type="checkbox"]:checked').length;
  function register(menu,trigger,clear,count,label){
    if(!menu||!trigger||!clear||bindings.has(menu))return;
    menu.classList.add('tp-unified-filter-menu');trigger.classList.add('tp-unified-filter-trigger');clear.classList.add('tp-unified-clear-filters');
    if(clear.textContent!=='Clear filters')clear.textContent='Clear filters';
    bindings.set(menu,{trigger,clear,count,label});
    trigger.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!menu.hidden){event.preventDefault();event.stopPropagation();menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(menu.matches(':popover-open'))menu.hidePopover();}
      if(event.key==='ArrowDown'){event.preventDefault();if(menu.hidden)trigger.click();queueMicrotask(()=>menu.querySelector('input:not(:disabled),button:not(:disabled)')?.focus());}
    });
    if(label!=='comments'){
      menu.setAttribute('popover','manual');menu.classList.add('tp-unified-filter-popover');
      menu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();menu.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}});
    }
  }
  function refresh(){
    host.querySelectorAll('[data-header-filter-menu]').forEach(menu=>{
      let clear=menu.querySelector('[data-clear-table-filter]');
      if(!clear){clear=document.createElement('button');clear.type='button';clear.dataset.clearTableFilter='';clear.textContent='Clear filters';clear.onclick=()=>menu.querySelector('[data-filter-value="all"]').click();menu.append(clear);}
      clear.classList.add('tp-unified-clear-filters');clear.disabled=!menu.querySelector('[data-filter-value].is-selected:not([data-filter-value="all"])');
    });
    host.querySelectorAll('[data-clear-related-filter]').forEach(clear=>{clear.classList.add('tp-unified-clear-filters');if(clear.textContent!=='Clear filters')clear.textContent='Clear filters';});

    register(host.querySelector('#communication-filters'),host.querySelector('[aria-controls="communication-filters"]'),host.querySelector('[data-clear-communication]'),menu=>checked(menu),'communication');
    register(host.querySelector('#file-filters'),host.querySelector('[aria-controls="file-filters"]'),host.querySelector('.tp-file-clear-filters'),menu=>Number(menu.querySelector('[data-file-filter].is-current')?.dataset.fileFilter!=='all')+Number(menu.querySelector('[data-file-date-filter]').value!=='all'),'files');
    register(host.querySelector('[data-activity-filters]'),host.querySelector('[data-activity-filter-toggle]'),host.querySelector('[data-clear-activity-filters]'),menu=>checked(menu)+Number(menu.querySelector('[data-activity-actor]').value!=='all')+Number(menu.querySelector('[data-activity-date]').value!=='all'),'activity');
    const tickets=host.querySelector('.tp-ticket-filters');
    if(tickets&&!bindings.has(tickets)){
      const clear=document.createElement('button');clear.type='button';clear.textContent='Clear filters';clear.dataset.clearTicketFilters='';
      clear.onclick=()=>{const select=tickets.querySelector('select');select.value='all';select.dispatchEvent(new Event('change',{bubbles:true}));};tickets.append(clear);
      register(tickets,host.querySelector('[data-ticket-filters]'),clear,menu=>Number(menu.querySelector('select').value!=='all'),'tickets');
      const trigger=host.querySelector('[data-ticket-filters]');tickets.id='ticket-filters';trigger.setAttribute('aria-controls',tickets.id);
      document.addEventListener('click',event=>{if(!tickets.contains(event.target)&&!trigger.contains(event.target)){tickets.hidden=true;trigger.setAttribute('aria-expanded','false');}});
      tickets.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();tickets.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}});
    }
    host.querySelectorAll('.tp-comment-filter-panel').forEach(menu=>{
      register(menu,menu.parentElement.querySelector('[data-comment-filters]'),menu.querySelector('[data-comment-filter-reset]'),panel=>{const period=panel.querySelector('input[name^="comment-period-"]:checked')?.value||'all';return Number(period!=='all'&&(period!=='specific'||Boolean(panel.querySelector('.tp-comment-specific-date input')?.value)));},'comments');
    });
    bindings.forEach(({trigger,clear,count,label},menu)=>{
      if(label!=='comments'){
        if(menu.hidden){if(menu.matches(':popover-open'))menu.hidePopover();}
        else{
          if(!menu.matches(':popover-open'))menu.showPopover();
          const rect=trigger.getBoundingClientRect(),width=Math.min(label==='activity'?420:label==='communication'?320:label==='files'?280:260,innerWidth-32);
          menu.style.width=width+'px';menu.style.left=Math.max(16,Math.min(rect.left,innerWidth-width-16))+'px';
          menu.style.top=Math.max(16,Math.min(rect.bottom+6,innerHeight-menu.getBoundingClientRect().height-16))+'px';
        }
      }
      const active=count(menu);clear.disabled=active===0;
      if(label==='comments'&&clear.hidden!==(active===0))clear.hidden=active===0;
      let badge=trigger.querySelector('.tp-filter-count,[data-comment-filter-active]')||[...trigger.children].find(child=>child.tagName==='SPAN'&&/^\d+$/.test(child.textContent.trim()));
      if(active&&!badge){badge=document.createElement('span');trigger.append(badge);}
      if(badge){badge.classList.add('tp-filter-count');if(badge.hidden!==!active)badge.hidden=!active;if(badge.textContent!==String(active))badge.textContent=String(active);}
      const aria=active?'Filter '+label+', '+active+' active '+(active===1?'filter':'filters'):'Filter '+label;
      if(trigger.getAttribute('aria-label')!==aria)trigger.setAttribute('aria-label',aria);
      const visibleClear=label==='activity'?host.querySelector('[data-clear-visible-filters]'):null;
      if(visibleClear){visibleClear.classList.add('tp-unified-clear-filters');visibleClear.disabled=!active;}
    });
  }
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh();});};
  host.addEventListener('change',schedule);host.addEventListener('click',schedule);host.addEventListener('input',schedule);
  new MutationObserver(schedule).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});refresh();
})();
