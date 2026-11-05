// Restart demo response targets on every page load; keep one overdue example.
const relayResponseStartedAt=Date.now();
const relayResponseCases={
 'SR-0048194':{minutes:240,group:'others'},'SR-0048231':{minutes:-23,group:'others'},
 'SR-0048240':{minutes:360,group:'mine'},'SR-0048249':{minutes:480,group:'mine'},'SR-0048257':{minutes:720,group:'mine'}
};
function relayDeadline(id){return relayResponseStartedAt+(relayResponseCases[id]?.minutes??480)*60000;}
function relayRemaining(id){return Math.ceil((relayDeadline(id)-Date.now())/1000);}
(() => {
 const root=document.querySelector('[data-task-prototype]');
 const colors={'new':'new','open':'new','in progress':'progress','scheduled':'scheduled','completed':'success','resolved':'success','urgent':'urgent','high':'urgent','blocked':'urgent','overdue':'urgent'};
 function refresh(){ root.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span,small,strong,b,em,a,button,input,select,textarea,label,legend,dt,dd,td,th,time,summary").forEach(el=>{if(!el.hasAttribute("data-draft-neutral-text") && !el.matches(".tp-icon,.material-symbols-outlined") && getComputedStyle(el).color==="rgb(0, 0, 0)")el.setAttribute("data-draft-neutral-text","");}); root.querySelectorAll('.tp-pill,.tp-status-chip,.tp-priority-chip,.tp-attention-signal').forEach(el=>{const status=colors[el.textContent.trim().toLowerCase()];if(status)el.dataset.statusTone=status;}); }
 refresh(); new MutationObserver(refresh).observe(root,{childList:true,subtree:true,characterData:true});
})();

// Split descriptive second lines into explicit columns in this local draft.
(() => {
 const table=document.querySelector('.tp-list-screen table');
 function split(){
  const head=table.querySelector('thead tr');
  if(!head.querySelector('[data-col="response-time"]')){const th=document.createElement('th');th.dataset.col='response-time';th.textContent='Response target';head.querySelector('[data-col="request"]').after(th);}
  if(!head.querySelector('[data-col="request-id"]')) {const th=document.createElement('th');th.dataset.col='request-id';th.textContent='Request ID';head.querySelector('[data-col="request"]').after(th);}
  if(!head.querySelector('[data-col="equipment-type"]')) {const th=document.createElement('th');th.dataset.col='equipment-type';th.textContent='Equipment type';head.querySelector('[data-col="equipment"]').after(th);}
  table.querySelectorAll('tbody tr').forEach(row=>{
   if(!row.querySelector('[data-col="response-time"]')){const td=document.createElement('td');td.dataset.col='response-time';td.innerHTML='<span class="draft-response-chip"></span>';row.querySelector('[data-col="request"]').after(td);}
   for(const [source,key,position] of [['request','request-id','after'],['equipment','equipment-type','after']]){
    const cell=row.querySelector(`[data-col="${source}"]`),detail=cell?.querySelector('small');
    if(!detail)continue;
    const next=document.createElement('td');next.dataset.col=key;next.textContent=detail.textContent;detail.remove();cell[position](next);
   }
  });
 }
 split();new MutationObserver(split).observe(table.querySelector('tbody'),{childList:true,subtree:true});
})();

(() => {
 const table=document.querySelector('.tp-list-screen table'),host=document.querySelector('.tp-task-list');
 const order=[...table.querySelectorAll('thead th[data-col]')].map(e=>e.dataset.col), pinned=new Set(['request']);
 const labels=Object.fromEntries([...table.querySelectorAll('thead th[data-col]')].map(e=>[e.dataset.col,e.childNodes[0].textContent.trim()||e.dataset.col]));
 Object.assign(labels,{attention:'Attention',reported:'Reported by',source:'Source',status:'Status',coordinator:'Coordinator'});

 let active=null;const columnWidths=new Map();
 function apply(){
 // Keep the underlying order intact so unpin restores the column's place.
 const visibleOrder=[...order.filter(key=>pinned.has(key)),...order.filter(key=>!pinned.has(key))];
 table.querySelectorAll('thead th[data-col]').forEach(th=>{const b=th.querySelector('.draft-column-pin');if(b){const pin=pinned.has(th.dataset.col);b.setAttribute('aria-pressed',String(pin));b.setAttribute('aria-label',`${pin?'Unpin':'Pin'} ${labels[th.dataset.col]}`);b.title=b.getAttribute('aria-label');}});
 for(const row of table.querySelectorAll('tr')){
 const cells=visibleOrder.map(k=>row.querySelector(`[data-col="${k}"]`));if(cells.some(e=>!e))continue;
 if([...row.querySelectorAll('[data-col]')].map(e=>e.dataset.col).join()!==visibleOrder.join()){cells.forEach(e=>row.append(e));const action=row.querySelector('.tp-request-action-cell,.tp-request-action-heading');if(action)row.append(action);}
 const selection=row.querySelector('[data-selection-cell]');let offset=selection?selection.getBoundingClientRect().width:0;cells.forEach(e=>{const width=columnWidths.get(e.dataset.col);if(width){e.style.width=width+'px';e.style.minWidth=width+'px';e.style.maxWidth=width+'px';}const pin=pinned.has(e.dataset.col);e.classList.toggle('is-pinned',pin);e.style.left=pin?offset+'px':'';if(pin)offset+=e.getBoundingClientRect().width;});
 }
 }
 function close(){table.querySelectorAll('.draft-header-menu').forEach(e=>e.remove());table.querySelectorAll('.draft-column-trigger').forEach(e=>e.setAttribute('aria-expanded','false'));active=null;}
 table.querySelectorAll('thead th[data-col]').forEach(th=>{
 const key=th.dataset.col;
 for(const node of [...th.childNodes]){if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim()){const label=document.createElement('span');label.className='draft-column-label';label.textContent=node.textContent;node.replaceWith(label);}}
 th.draggable=true;
 th.addEventListener('dragstart',e=>{if(e.target.closest('button,.draft-column-resize')){e.preventDefault();return;}close();e.dataTransfer.setData('text/plain',key);e.dataTransfer.effectAllowed='move';th.classList.add('draft-dragging');});
 th.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';table.querySelectorAll('.draft-drop-target').forEach(el=>el.classList.remove('draft-drop-target'));th.classList.add('draft-drop-target');});
 th.addEventListener('dragleave',()=>th.classList.remove('draft-drop-target'));
 th.addEventListener('drop',e=>{e.preventDefault();const source=e.dataTransfer.getData('text/plain');if(source!==key&&order.includes(source)){order.splice(order.indexOf(source),1);order.splice(order.indexOf(key)+(e.clientX>th.getBoundingClientRect().left+th.getBoundingClientRect().width/2?1:0),0,source);apply();}table.querySelectorAll('.draft-drop-target,.draft-dragging').forEach(el=>el.classList.remove('draft-drop-target','draft-dragging'));});
 th.addEventListener('dragend',()=>table.querySelectorAll('.draft-drop-target,.draft-dragging').forEach(el=>el.classList.remove('draft-drop-target','draft-dragging')));
 const b=document.createElement('button');b.type='button';b.className='draft-column-pin';
 b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6m-5 0v6l-3 4v2h10v-2l-3-4V3M12 15v6"/></svg>';
 th.append(b);
 b.onclick=e=>{e.stopPropagation();pinned.has(key)?pinned.delete(key):pinned.add(key);apply();};
 const grip=document.createElement('span');grip.className='draft-column-resize';grip.setAttribute('role','separator');grip.setAttribute('aria-label',`Resize ${labels[key]}`);grip.tabIndex=0;th.append(grip);
 const setWidth=w=>{w=Math.max(100,w);columnWidths.set(key,w);th.style.width=w+'px';th.style.minWidth=w+'px';th.style.maxWidth=w+'px';table.querySelectorAll(`tbody [data-col="${key}"]`).forEach(e=>{e.style.width=w+'px';e.style.minWidth=w+'px';e.style.maxWidth=w+'px';});apply();};
 grip.draggable=false;grip.addEventListener('dragstart',e=>e.preventDefault());grip.onpointerdown=e=>{e.preventDefault();e.stopPropagation();const start=e.clientX,w=th.getBoundingClientRect().width;grip.setPointerCapture(e.pointerId);grip.onpointermove=e=>setWidth(w+e.clientX-start);grip.onpointerup=()=>grip.onpointermove=null;};
 grip.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();setWidth(th.getBoundingClientRect().width+(e.key==='ArrowLeft'?-16:16));}};
 });
 document.addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 new MutationObserver(apply).observe(table.querySelector('tbody'),{childList:true});new ResizeObserver(apply).observe(table);apply();
})();

(() => {
 const trigger=document.querySelector('.tp-page-actions button');
 const dialog=document.createElement('dialog');dialog.className='draft-new-request';dialog.innerHTML=`<form method="dialog"><header><h3>New request</h3><button value="cancel" formnovalidate aria-label="Close">×</button></header><label>Request type<select name="type" required><option value="">Select request type</option><option>Service incident</option><option>Maintenance request</option><option>Inspection</option><option>Site access</option></select></label><label>Assign to<select name="assignee"><option>Unassigned</option><option selected>Riley Cruz</option><option>Elliot Ward</option><option>Mina Shah</option><option>Theo Grant</option></select></label><label>Description<textarea name="description" required rows="5" placeholder="Describe what needs attention"></textarea></label><footer><button value="cancel" formnovalidate>Cancel</button><button class="tp-primary" value="create">Create request</button></footer></form>`;document.body.append(dialog);trigger.addEventListener('click',()=>dialog.showModal());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{if(dialog.returnValue==='create'){const rows=document.querySelector('[data-service-rows]'),row=rows.firstElementChild.cloneNode(true);row.dataset.requestId='SR-0048241';row.querySelector('[data-col="request"]').textContent=dialog.querySelector('[name="description"]').value;row.querySelector('[data-col="request-id"]').textContent='SR-0048241';row.querySelector('[data-col="coordinator"]').textContent=dialog.querySelector('[name="assignee"]').value;row.querySelector('input').checked=false;rows.prepend(row);}trigger.focus();});
})();

// Shared calm dropdown presentation; native selects retain their change handlers.
(() => {
 function enhance(select){
  if(select.hasAttribute('data-native-select')||select.dataset.draftDropdown)return;select.dataset.draftDropdown='true';
  const wrap=document.createElement('span');wrap.className='draft-select';select.before(wrap);wrap.append(select);
  const button=document.createElement('button');button.type='button';button.className='draft-select-trigger';button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
  const label=select.labels?.[0]||select.closest('label');
  const labelText=label?[...label.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join(' ').replace('*','').trim():'';
  button.setAttribute('aria-label',select.getAttribute('aria-label')||labelText||label?.querySelector(':scope > span')?.textContent.replace('*','').trim()||'Choose option');wrap.append(button);
  const menu=document.createElement('div');menu.className='draft-select-menu';menu.setAttribute('popover','manual');menu.setAttribute('role','listbox');wrap.append(menu);
  function sync(){button.disabled=select.disabled;button.innerHTML='<span></span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';button.firstChild.textContent=select.selectedOptions[0]?.textContent||'Choose option';button.classList.toggle('has-ai-adornment',select.dataset.aiExtracted==='true');if(select.dataset.aiExtracted==='true'){button.firstChild.className='draft-select-value';button.insertAdjacentHTML('afterbegin','<span class="tp-ai-select-adornment" aria-hidden="true" title="AI-extracted value"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7Z"/></svg><span>AI</span></span>');button.setAttribute('aria-description','AI-extracted value');}}
  function close(){if(menu.matches(':popover-open'))menu.hidePopover();button.setAttribute('aria-expanded','false');}
  function open(){document.querySelectorAll('.draft-select-menu:popover-open').forEach(e=>e.hidePopover());menu.replaceChildren();[...select.options].forEach((option,i)=>{const item=document.createElement('button');item.type='button';item.setAttribute('role','option');item.tabIndex=-1;item.setAttribute('aria-selected',String(select.selectedIndex===i));item.disabled=option.disabled;item.textContent=option.textContent;if(select.matches('[data-preview-file-select]')){const filesApi=document.querySelector('[data-task-prototype]').requestFiles;const file=filesApi?.comparisonFiles().find(f=>f.key===option.value);if(file){item.classList.add('tp-file-picker-option');const meta=document.createElement('small'),state=filesApi.status(file.key);meta.textContent=file.kind+' · '+file.size+(state==='requiresAttention'?' · Needs validation':state==='passed'?' · Validated':'');item.append(meta);}}item.onclick=()=>{select.selectedIndex=i;select.dispatchEvent(new Event('change',{bubbles:true}));sync();close();button.focus();};menu.append(item);});const r=button.getBoundingClientRect();menu.style.left=r.left+'px';menu.style.top=r.bottom+6+'px';menu.style.width=r.width+'px';menu.showPopover();if(select.matches('[data-file-date-filter],[data-activity-date]')){menu.style.maxHeight=Math.max(80,innerHeight-16)+'px';menu.style.overflowY='auto';const height=menu.getBoundingClientRect().height;if(r.bottom+6+height>innerHeight-8)menu.style.top=Math.max(8,r.top-height-6)+'px';}button.setAttribute('aria-expanded','true');menu.querySelector('[aria-selected="true"]')?.focus();}
  button.onclick=()=>menu.matches(':popover-open')?close():open();button.onkeydown=e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();e.stopPropagation();open();if(e.key==='ArrowUp')menu.querySelector('button:last-child')?.focus();}};
  menu.onkeydown=e=>{
    const items=[...menu.querySelectorAll('button:not(:disabled)')],index=items.indexOf(document.activeElement);
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();button.focus();return;}
    if(e.key==='Tab'){close();button.focus();return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();const next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();}
    else if(e.key.length===1 && !e.ctrlKey && !e.metaKey && e.key!==' '){e.preventDefault();const match=items.slice(index+1).concat(items.slice(0,index+1)).find(item=>item.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase()));match?.focus();}
  };
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))close();});document.addEventListener('scroll',close,true);select.addEventListener('change',sync);new MutationObserver(sync).observe(select,{attributes:true,childList:true,subtree:true});sync();
 }
 function refresh(){document.querySelectorAll('.task-prototype select,.draft-new-request select').forEach(enhance);}
 refresh();new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
})();

// Per-request response target scenarios in the local draft.
(() => {
 const target=document.querySelector('.tp-operational-signals dd');if(!target)return;
 const card=target.closest('dl'), note=card.querySelector('small');target.classList.add('draft-countdown');target.setAttribute('aria-live','off');
 function tick(){
 const id=document.querySelector('[data-task-prototype]').dataset.responseRequest||'SR-0048217';
 const deadline=relayDeadline(id);
 const seconds=Math.ceil((deadline-Date.now())/1000),total=Math.abs(seconds),h=Math.floor(total/3600),m=Math.floor(total%3600/60),sec=total%60;
 const time=`${h?h+'h ':''}${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`;
 const tone=seconds<=0?'overdue':seconds<=900?'soon':'normal';
 const text=seconds<=0?`${time} overdue`:`${time} left`;if(target.textContent!==text)target.textContent=text;
 target.dataset.urgency=tone;card.dataset.responseTone=tone;
 const detail=tone==='overdue'?'Target exceeded · Action required':tone==='soon'?'Response due soon · Action required':'Within response target';if(note.textContent!==detail)note.textContent=detail;
 document.querySelectorAll('.tp-structured-data dl > div').forEach(row=>{if(row.querySelector('dt')?.textContent==='Time remaining')row.querySelector('dd').textContent=text;});
 }
 document.addEventListener('click',e=>{const row=e.target.closest('[data-open-request]');if(row){document.querySelector('[data-task-prototype]').dataset.responseRequest=row.dataset.requestId;tick();}},true);
 tick();setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
})();

(() => {
 function update(){
 document.querySelectorAll('[data-service-rows] tr').forEach(row=>{const chip=row.querySelector('.draft-response-chip');if(!chip)return;const seconds=relayRemaining(row.dataset.requestId),total=Math.abs(seconds),h=Math.floor(total/3600),m=Math.floor(total%3600/60);const text=`${h?h+'h ':''}${m}m ${seconds<=0?'overdue':'left'}`;if(chip.textContent!==text)chip.textContent=text;chip.dataset.tone=seconds<=0?'overdue':seconds<=900?'soon':'normal';});
 for(const group of ['all','mine','others']){const tile=document.querySelector(`.orion-request-tiles [data-filter="${group}"]`);if(!tile)continue;const count=Object.entries(relayResponseCases).filter(([id,item])=>(group==='all'||item.group===group)&&relayRemaining(id)<=900).length;let badge=tile.querySelector('.draft-problem-count');if(!badge){badge=document.createElement('span');badge.className='draft-problem-count';tile.append(badge);}const value=String(count);if(badge.textContent!==value)badge.textContent=value;badge.hidden=!count;badge.title=`${count} requests approaching or exceeding response target`;badge.setAttribute('aria-label',badge.title);}
 }
 update();setInterval(update,1000);
})();

(() => {
 const root=document.querySelector('[data-task-prototype]');
 document.querySelectorAll('.orion-request-tiles [data-filter]').forEach(tile=>{
 const badge=tile.querySelector('.draft-problem-count');if(!badge)return;badge.setAttribute('role','button');badge.tabIndex=0;badge.setAttribute('aria-pressed','false');
 function activate(e){e.preventDefault();e.stopPropagation();const enable=!(root.dataset.problemOnly==='true'&&tile.classList.contains('is-selected'));root.dataset.problemOnly=String(enable);tile.click();root.dispatchEvent(new Event('draft-problem-filter'));document.querySelectorAll('.draft-problem-count').forEach(el=>{el.classList.toggle('is-active',enable&&el===badge);el.setAttribute('aria-pressed',String(enable&&el===badge));});}
 badge.addEventListener('click',activate);badge.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')activate(e);});
 tile.addEventListener('click',e=>{if(!e.isTrusted)return;root.dataset.problemOnly='false';document.querySelectorAll('.draft-problem-count').forEach(el=>{el.classList.remove('is-active');el.setAttribute('aria-pressed','false');});root.dispatchEvent(new Event('draft-problem-filter'));});
 });
})();

// Use the same rounded icon family in dynamically rendered files and tickets.
(() => {
 const root=document.querySelector('[data-task-prototype]');
 const paths={
 description:'M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 2v5h5M8 12v2h8v-2zm0 4v2h6v-2z',
 image:'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3 12h14l-5-6-3 4-2-2z',
 upload:'m12 3 6 6h-4v7h-4V9H6zm-8 14h3v3h10v-3h3v5H4z',
 info:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 4h2v2h-2zm0 4h2v8h-2z',
 chevron_left:'m15 5-7 7 7 7 2-2-5-5 5-5z',chevron_right:'m9 5 7 7-7 7-2-2 5-5-5-5z',
 remove:'M5 11h14v2H5z',add:'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
 rotate_right:'M19 3v5h-5l2-2a7 7 0 1 0 3 6h2a9 9 0 1 1-4-7z',width:'M3 4h2v16H3zm16 0h2v16h-2zM10 7v4h4V7l5 5-5 5v-4h-4v4l-5-5z',
 mail:'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 3 8 6 8-6V5l-8 6-8-6z',
 call:'M6 2h4l1 5-3 2a15 15 0 0 0 7 7l2-3 5 1v4a3 3 0 0 1-3 3C10 21 3 14 3 5a3 3 0 0 1 3-3z',
 chat:'M4 3h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8l-6 4V5a2 2 0 0 1 2-2zm2 4v2h12V7zm0 4v2h9v-2z'
 };
 function replace(svg,name){if(!svg)return;const icon=document.createElement('span');icon.className='relay-component-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="'+paths[name]+'"/></svg>';svg.replaceWith(icon);}

 function refresh(){
 root.querySelectorAll('.tp-document-row .tp-icon > svg').forEach(svg=>replace(svg,svg.closest('[data-file-type]')?.dataset.fileType==='image'?'image':'description'));
 const controls={'[data-upload-files]':'upload','[data-toggle-inspector]:not(.tp-files-info-toggle)':'info','[data-file-info-toggle]':'info','[data-file-previous]':'chevron_left','[data-file-next]':'chevron_right','[data-file-zoom-out]':'remove','[data-file-zoom-in]':'add','[data-file-rotate]':'rotate_right','[data-file-fit]':'width'};
 for(const [selector,name] of Object.entries(controls))root.querySelectorAll(selector+' > svg').forEach(svg=>replace(svg,name));
 root.querySelectorAll('.inv-channel-icon > svg').forEach(svg=>{const text=svg.closest('summary').textContent.toLowerCase();replace(svg,text.includes('phone')?'call':text.includes('email')?'mail':text.includes('messenger')?'chat':'description');});
 }
 refresh();new MutationObserver(refresh).observe(root,{childList:true,subtree:true});
})();

(() => {
 const root=document.querySelector('[data-task-prototype]');if(!root)return;
 const mark=()=>{
  root.querySelectorAll('label').forEach(label=>{
   const control=label.control||label.querySelector('input,select,textarea');
   if(!control?.required||control.type==='radio'||control.type==='checkbox'||label.querySelector('.tp-required-mark,.tp-ai-required'))return;
   const caption=label.querySelector(':scope > span:not(.draft-select)');
   const target=caption||label;
   if(target.textContent.trim().startsWith('*'))return;
   const star=document.createElement('span');star.className='tp-required-mark';star.textContent='*';star.setAttribute('aria-hidden','true');target.prepend(star,' ');
  });
 };
 mark();new MutationObserver(mark).observe(root,{childList:true,subtree:true});
})();

// At the horizontal endpoint the overlay becomes a regular visible action column.
(() => {
 const wrap=document.querySelector('.tp-list-screen .tp-table-wrap');
 if(!wrap)return;
 let frame;
 const sync=()=>{
  frame=undefined;
  wrap.classList.toggle('is-at-actions',wrap.scrollWidth-wrap.clientWidth-wrap.scrollLeft<=2);
 };
 const schedule=()=>{if(frame===undefined)frame=requestAnimationFrame(sync);};
 wrap.addEventListener('scroll',schedule,{passive:true});
 new ResizeObserver(schedule).observe(wrap);
 new ResizeObserver(schedule).observe(wrap.querySelector('table'));
 sync();
})();
