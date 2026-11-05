window.initializeRelatedRequests = (panel, tab) => {
  const records = [
    ['SR-0048129','Airflow interruption','Rivergate House','AHU-04','Open','Riley Cruz'],
    ['SR-0047901','Airflow sensor alignment','Rivergate House','AHU-04','Resolved','Elliot Ward'],
    ['SR-0048253','Meeting-room temperature issue','Rivergate House','AHU-02','Scheduled','Riley Cruz'],
    ['SR-0048281','Generator test coordination','Rivergate House','GEN-01','New','Not assigned'],
    ['SR-0048244','Heating controls review','Westbridge Plaza','HTG-02','In progress','Riley Cruz'],
    ['SR-0048194','Lift door sensor inspection','Harbour Exchange','LFT-02','Scheduled','Elliot Ward']
  ];
  const types = {'Potential duplicate':'May describe the same issue. Requires review before confirming a duplicate.','Previous incident':'Earlier incident relevant to this request.','Related to':'Relevant context with no dependency.','Blocked by':'This request depends on the selected request.','Blocks':'The selected request depends on this request.','Duplicate of':'Confirmed as the same issue as the selected request.'};
  const links = [{id:records[0][0],type:'Potential duplicate',note:'Compare location and symptoms before confirming a duplicate.'},{id:records[1][0],type:'Previous incident',note:'Resolved after sensor alignment on 18 Aug 2026.'}];
  const esc = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  panel.innerHTML=`<header class="tp-related-header"><div><h3>Related requests</h3><p>Relationships for this request.</p></div><button class="tp-primary" type="button" data-add-related>Add related request</button></header><div class="tp-related-table-wrap"><table class="tp-related-table"><thead><tr><th>Request ID</th><th>Request</th><th data-related-column="relationship">Relationship</th><th>Description</th><th data-related-column="status">Status</th><th>Site</th><th>Equipment</th><th data-related-column="coordinator">Coordinator</th></tr></thead><tbody></tbody></table></div><p role="status" data-related-filter-status></p><p role="status" data-related-status></p>`;
  let page=1,pageSize=5;
  const footer=document.createElement('footer');footer.className='tp-list-footer tp-related-footer';
  footer.innerHTML='<span data-related-page-summary role="status"></span><div><label>Rows per page <select aria-label="Related requests rows per page"><option selected>5</option><option>10</option><option>25</option></select></label><span data-related-page-position></span><nav aria-label="Related requests table pages"><button type="button" data-related-prev aria-label="Previous related requests page"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><button type="button" data-related-next aria-label="Next related requests page"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></nav></div>';
  panel.querySelector('.tp-related-table-wrap').after(footer);
  const table=panel.querySelector('.tp-related-table');
  const initialWidths=[140,240,200,480,140,200,140,200],widthKey='portfolio-related-column-widths-v1';
  let widths=[...initialWidths];
  try {const stored=JSON.parse(sessionStorage.getItem(widthKey));if(Array.isArray(stored) && stored.length===8 && stored.every(width=>Number.isFinite(width)&&width>=100))widths=stored;}catch {}
  const cols=document.createElement('colgroup');widths.forEach(()=>cols.append(document.createElement('col')));table.prepend(cols);
  const applyWidths=()=>{[...cols.children].forEach((col,index)=>col.style.width=widths[index]+'px');table.style.width=widths.reduce((sum,width)=>sum+width,0)+'px';};
  table.querySelectorAll('th').forEach((th,index)=>{
    const name=th.textContent,grip=document.createElement('span');grip.className='draft-column-resize';grip.tabIndex=0;grip.setAttribute('role','separator');grip.setAttribute('aria-orientation','vertical');grip.setAttribute('aria-label','Resize related '+name.toLowerCase());
    const setWidth=width=>{widths[index]=Math.max(100,Math.round(width));grip.setAttribute('aria-valuenow',String(widths[index]));applyWidths();};
    const save=()=>{try {sessionStorage.setItem(widthKey,JSON.stringify(widths));}catch {}};
    grip.setAttribute('aria-valuemin','100');grip.setAttribute('aria-valuenow',String(widths[index]));
    grip.onpointerdown=event=>{event.preventDefault();event.stopPropagation();const start=event.clientX,width=widths[index];grip.setPointerCapture(event.pointerId);grip.onpointermove=move=>setWidth(width+move.clientX-start);grip.onpointerup=()=>{grip.onpointermove=null;save();};grip.onpointercancel=()=>{grip.onpointermove=null;save();};};
    grip.onkeydown=event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();event.stopPropagation();setWidth(widths[index]+(event.key==='ArrowRight'?16:-16));save();};
    th.append(grip);
  });
  applyWidths();
  const filters={relationship:new Set(),status:new Set(),coordinator:new Set()};
  const filterValue=(link,key)=>{const record=records.find(r=>r[0]===link.id);return key==='relationship'?link.type:key==='status'?record[4]:record[5];};
  const render = () => {
    const visible=links.filter(link=>Object.entries(filters).every(([key,values])=>!values.size||values.has(filterValue(link,key))));

    const pages=Math.max(1,Math.ceil(visible.length/pageSize));page=Math.min(page,pages);
    const start=(page-1)*pageSize,end=Math.min(start+pageSize,visible.length);
    footer.querySelector('[data-related-page-summary]').textContent=visible.length?'Showing '+(start+1)+'–'+end+' of '+visible.length+' related requests':'Showing 0 of 0 related requests';
    footer.querySelector('[data-related-page-position]').textContent='Page '+page+' of '+pages;
    footer.querySelector('[data-related-prev]').disabled=page===1;footer.querySelector('[data-related-next]').disabled=page===pages;
    panel.querySelector('tbody').innerHTML=visible.slice(start,end).map(link=>{const r=records.find(r=>r[0]===link.id);return `<tr><td>${esc(r[0])}</td><td title="${esc(r[1])}">${esc(r[1])}</td><td>${esc(link.type)}</td><td class="draft-related-description" title="${esc(link.note || types[link.type])}">${esc(link.note || types[link.type])}</td><td>${esc(r[4])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[5])}</td></tr>`;}).join('')||'<tr><td colspan="8" class="draft-related-empty">No related requests match these filters.</td></tr>';
    panel.querySelector('[data-related-filter-status]').textContent=Object.values(filters).some(set=>set.size)?`${visible.length} of ${links.length} related requests shown`:'';
    tab.textContent=`Related requests ${links.length}`;
  };
  footer.querySelector('select').addEventListener('change',event=>{pageSize=Number(event.target.value);page=1;render();});
  footer.querySelector('[data-related-prev]').onclick=()=>{page--;render();};
  footer.querySelector('[data-related-next]').onclick=()=>{page++;render();};
  const closeFilters=()=>panel.querySelectorAll('.draft-related-filter').forEach(menu=>{menu.hidden=true;menu.previousElementSibling.setAttribute('aria-expanded','false');});
  panel.querySelectorAll('[data-related-column]').forEach(th=>{
    const key=th.dataset.relatedColumn,title=th.childNodes[0].textContent;
    const button=document.createElement('button');button.type='button';button.className='draft-related-filter-toggle';button.setAttribute('aria-label','Filter related requests by '+title.toLowerCase());button.setAttribute('aria-expanded','false');button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M6 12h12M9 18h6"/></svg>';
    const menu=document.createElement('div');menu.className='draft-related-filter';menu.hidden=true;
    const options=key==='relationship'?Object.keys(types):[...new Set(records.map(record=>record[key==='status'?4:5]))];
    menu.innerHTML=`<strong>${title}</strong>${options.map(value=>`<label><input type="checkbox" value="${esc(value)}">${esc(value)}</label>`).join('')}<button type="button" data-clear-related-filter disabled>Clear filter</button>`;
    th.append(button,menu);
    button.onclick=()=>{const open=menu.hidden;closeFilters();menu.hidden=!open;button.setAttribute('aria-expanded',String(open));};
    const update=()=>{page=1;filters[key]=new Set([...menu.querySelectorAll('input:checked')].map(input=>input.value));menu.querySelector('[data-clear-related-filter]').disabled=!filters[key].size;button.classList.toggle('is-active',filters[key].size>0);render();};
    menu.onchange=update;menu.querySelector('[data-clear-related-filter]').onclick=()=>{menu.querySelectorAll('input').forEach(input=>input.checked=false);update();};
  });
  document.addEventListener('click',event=>{if(!event.target.closest('[data-related-column]'))closeFilters();});
  panel.addEventListener('keydown',event=>{if(event.key==='Escape')closeFilters();});
  const dialog=document.createElement('dialog');dialog.className='tp-related-dialog';dialog.setAttribute('aria-labelledby','related-dialog-title');dialog.setAttribute('aria-describedby','related-dialog-description');
  dialog.innerHTML=`<form>
    <header><h3 id="related-dialog-title">Add related request</h3><button class="tp-related-close" type="button" data-close-related aria-label="Close add related request"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
    <p id="related-dialog-description">Link an existing request to SR-0048217.</p>
    <div class="tp-related-search">
      <label for="related-request-search">Request</label>
      <div class="tp-related-search-field"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="related-request-search" name="requestSearch" type="text" role="combobox" enterkeyhint="search" aria-autocomplete="list" aria-controls="related-request-options" aria-expanded="false" autocomplete="off" placeholder="Search by request ID or title" required autofocus></div>
      <input name="request" type="hidden">
      <div class="tp-related-search-results" hidden><div id="related-request-options" role="listbox" aria-label="Matching requests"></div><p data-request-empty hidden>No matching requests. Try another ID or title.</p></div>
      <span class="tp-related-search-status" role="status" aria-live="polite"></span>
    </div>
    <label>Relationship type<span class="tp-related-select"><select name="type" required aria-describedby="related-type-help">${Object.keys(types).map(type=>`<option>${type}</option>`).join('')}</select></span></label>
    <p id="related-type-help" data-type-help></p>
    <label><span>Comment <span class="tp-related-optional">(optional)</span></span><textarea name="comment" rows="3" maxlength="1000" placeholder="Add a note about this relationship"></textarea></label>
    <footer><button class="tp-secondary" type="button" data-close-related>Cancel</button><button class="tp-primary tp-related-submit" type="submit" disabled>Add related request</button></footer>
  </form>`;
  document.querySelector('[data-task-prototype]').append(dialog);
  document.querySelector('[data-task-prototype]').updateCharacterCounters(dialog);
  const form=dialog.querySelector('form');
  const submit=form.querySelector('[type="submit"]');
  const search=form.elements.requestSearch;
  const results=dialog.querySelector('.tp-related-search-results');
  const options=dialog.querySelector('[role="listbox"]');
  const searchStatus=dialog.querySelector('.tp-related-search-status');
  let matches=[],activeIndex=-1;
  const closeResults=()=>{
    results.hidden=true;search.setAttribute('aria-expanded','false');search.removeAttribute('aria-activedescendant');activeIndex=-1;
  };
  const setActive=index=>{
    activeIndex=index;
    [...options.children].forEach((option,i)=>option.setAttribute('aria-selected',String(i===index)));
    const active=options.children[index];
    if(active){search.setAttribute('aria-activedescendant',active.id);active.scrollIntoView({block:'nearest'});}
    else search.removeAttribute('aria-activedescendant');
  };
  const showResults=()=>{
    const tokens=(form.elements.request.value?'':search.value).trim().toLowerCase().split(/\s+/).filter(Boolean);
    matches=records.filter(record=>!links.some(link=>link.id===record[0])&&tokens.every(token=>record.slice(0,4).join(' ').toLowerCase().includes(token)));
    options.innerHTML=matches.map(record=>`<div id="related-option-${record[0]}" role="option" aria-selected="false" data-request-option="${record[0]}"><strong>${record[0]} · ${esc(record[1])}</strong><small>${esc(record[2])} · ${esc(record[3])} · ${esc(record[4])}</small></div>`).join('');
    results.querySelector('[data-request-empty]').hidden=matches.length>0;
    results.hidden=false;search.setAttribute('aria-expanded','true');setActive(-1);
    searchStatus.textContent=matches.length?`${matches.length} ${matches.length===1?'request':'requests'} found. Use the arrow keys to choose.`:'No matching requests.';
  };
  const chooseRequest=id=>{
    const record=matches.find(record=>record[0]===id);
    if(!record)return;
    form.elements.request.value=id;search.value=`${id} · ${record[1]}`;submit.disabled=false;
    closeResults();searchStatus.textContent=`Selected ${id}: ${record[1]}.`;
  };
  search.addEventListener('input',()=>{form.elements.request.value='';submit.disabled=true;showResults();});
  search.addEventListener('focus',()=>{if(!form.elements.request.value)showResults();});
  search.addEventListener('click',()=>{if(results.hidden)showResults();});
  search.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();if(results.hidden)showResults();
      if(matches.length)setActive(event.key==='ArrowDown'?(activeIndex+1)%matches.length:(activeIndex<0?matches.length-1:(activeIndex-1+matches.length)%matches.length));
    }else if(event.key==='Enter'&&!results.hidden){event.preventDefault();if(activeIndex>=0)chooseRequest(matches[activeIndex][0]);}
    else if(event.key==='Escape'&&!results.hidden){event.preventDefault();event.stopPropagation();closeResults();}
    else if(event.key==='Tab')closeResults();
  });
  options.addEventListener('pointerdown',event=>event.preventDefault());
  options.addEventListener('click',event=>{const option=event.target.closest('[data-request-option]');if(option)chooseRequest(option.dataset.requestOption);});
  search.addEventListener('blur',closeResults);
  const help=()=>dialog.querySelector('[data-type-help]').textContent=types[form.elements.type.value];
  form.elements.type.addEventListener('change',help);
  panel.querySelector('[data-add-related]').addEventListener('click',()=>{
    form.reset();form.elements.request.value='';submit.disabled=true;closeResults();searchStatus.textContent='';help();dialog.showModal();
  });
  dialog.querySelectorAll('[data-close-related]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();});
  dialog.addEventListener('close',()=>{closeResults();panel.querySelector('[data-add-related]').focus();});
  form.addEventListener('submit',event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const id=form.elements.request.value;
    if(!records.some(r=>r[0]===id)||links.some(l=>l.id===id))return;
    links.push({id,type:form.elements.type.value,note:form.elements.comment.value.trim()});render();dialog.close();
    panel.querySelector('[data-related-status]').textContent=`${id} added · ${form.elements.type.value}`;
    if(links.length===records.length)panel.querySelector('[data-add-related]').disabled=true;
  });
  render();
};
