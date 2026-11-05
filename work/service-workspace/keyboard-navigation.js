(() => {
  const host=document.querySelector('[data-task-prototype]');if(!host)return;
  const focusables='button:not(:disabled),a[href],input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),summary,[contenteditable="true"],[tabindex]:not([tabindex="-1"])';
  const visible=element=>element.getClientRects().length && !element.closest('[hidden],[inert]') && getComputedStyle(element).visibility!=='hidden';
  const items=root=>[...root.querySelectorAll(focusables)].filter(visible);
  function tabs(){
    const nav=host.querySelector('.tp-workspace-tabs');if(!nav)return;
    nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Request workspace');
    nav.querySelectorAll('[data-tab]').forEach(button=>{const selected=button.classList.contains('is-current');button.setAttribute('role','tab');button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;const panel=host.querySelector('[data-panel="'+button.dataset.tab+'"]');if(panel){button.id ||= 'workspace-tab-'+button.dataset.tab;panel.id ||= 'workspace-panel-'+button.dataset.tab;button.setAttribute('aria-controls',panel.id);const alongside=Boolean(panel.closest('#workspace-side-panel'));panel.setAttribute('role',alongside?'region':'tabpanel');panel.setAttribute('aria-labelledby',alongside?'workspace-side-title':button.id);}});
  }
  tabs();new MutationObserver(tabs).observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  host.addEventListener('click',event=>{
    const row=event.target.closest('[data-open-request]');if(row && !event.target.closest('input,button'))requestAnimationFrame(()=>host.querySelector('.tp-workspace-tabs [aria-selected="true"]')?.focus());
    if(event.target.closest('[data-back]'))requestAnimationFrame(()=>host.querySelector('[data-open-request]')?.focus());
  });
  document.addEventListener('keydown',event=>{
    const target=event.target;if(!(target instanceof Element)||!host.contains(target))return;
    const dialog=target.closest('dialog[open]');
    if(event.key==='Tab'){
      const root=dialog || (host.classList.contains('is-focus-mode')?host:null);if(!root)return;
      const controls=items(root),first=controls[0],last=controls.at(-1);
      if(event.shiftKey && target===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey && target===last){event.preventDefault();first?.focus();}
      return;
    }
    const tab=target.closest('.tp-workspace-tabs [data-tab]');
    if(tab && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      event.preventDefault();event.stopImmediatePropagation();const buttons=[...tab.parentElement.querySelectorAll('[data-tab]')].filter(visible),index=buttons.indexOf(tab),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[next]?.click();buttons[next]?.focus();return;
    }
    const view=target.closest('.tp-communication-views button');
    if(view && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      event.preventDefault();event.stopImmediatePropagation();const buttons=[...view.parentElement.querySelectorAll('button')],index=buttons.indexOf(view),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[next].click();buttons[next].focus();return;
    }
    const day=target.closest('.tp-calendar-days button');
    if(day && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
      event.preventDefault();event.stopImmediatePropagation();const buttons=[...day.parentElement.querySelectorAll('button')],index=buttons.indexOf(day),delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};const next=event.key==='Home'?index-index%7:event.key==='End'?Math.min(buttons.length-1,index-index%7+6):Math.max(0,Math.min(buttons.length-1,index+delta[event.key]));buttons.forEach((button,index)=>button.tabIndex=index===next?0:-1);buttons[next]?.focus();return;
    }
    const list=target.closest('.tp-ticket-navigation,.tp-communication-results,.tp-document-list,[data-panel="files"] > aside:first-child,.tp-time-columns [data-hours],.tp-time-columns [data-minutes],.draft-new-menu,.tp-activity-timeline');
    if(list && !target.matches('input,textarea,select') && ['ArrowUp','ArrowDown','Home','End'].includes(event.key)){
      const options=[...list.querySelectorAll('.tp-message-row,button[data-select-ticket],button[data-ticket-id],button.tp-document-row,button[data-activity-id],:scope > button')].filter(visible);
      const current=options.findIndex(element=>element===target);if(current<0)return;
      event.preventDefault();event.stopImmediatePropagation();const next=event.key==='Home'?0:event.key==='End'?options.length-1:(current+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;if(target.closest('.tp-time-columns'))options.forEach((button,index)=>button.tabIndex=index===next?0:-1);options[next]?.focus();return;
    }
    const popup=target.closest('.draft-new-menu');
    if(event.key==='Escape' && popup){event.preventDefault();event.stopImmediatePropagation();popup.hidden=true;const trigger=popup.parentElement.querySelector('[aria-expanded="true"]');trigger?.setAttribute('aria-expanded','false');trigger?.focus();}
  },true);
})();
