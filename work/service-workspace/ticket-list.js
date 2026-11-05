// Two-person workflow: the executor submits work; a different coordinator verifies it.
function ticketWorkTransition(state,action,actor,coordinator){
  const next=structuredClone(state);
  if(action==='assign'){
    if(actor!==coordinator||!['assignment','work'].includes(state.stage))throw Error('Only the coordinator can assign work before submission.');
    if(!state.executor)throw Error('Choose an executor.');
    next.stage='work';
  }else if(action==='submit'){
    if(state.stage!=='work'||actor!==state.executor)throw Error('Only the assigned executor can submit work.');
    if(!state.report?.trim()||!state.workConfirmed)throw Error('Add a work report and confirm the work is complete.');
    if(!state.reviewer||state.reviewer===actor)throw Error('Choose a different person to verify your work.');
    next.stage='verification';next.submittedBy=actor;next.submittedAt=new Date().toISOString();
  }else if(action==='verify'){
    if(state.stage!=='verification'||actor!==(state.reviewer||coordinator)||actor===state.submittedBy)throw Error('A different coordinator must verify the submitted work.');
    if(!state.verification?.trim()||!state.verified)throw Error('Record the verification and confirm the result.');
    next.stage='completed';next.verifiedBy=actor;next.verifiedAt=new Date().toISOString();
  }else if(action==='return'){
    if(state.stage!=='verification'||actor!==(state.reviewer||coordinator)||actor===state.submittedBy)throw Error('Only the assigned reviewer can return the work.');
    if(!state.returnReason?.trim()||!state.executor||state.executor===actor)throw Error('Record the reason and choose another executor.');
    next.stage='work';next.workConfirmed=false;next.verified=false;next.verification='';
  }else throw Error('Unknown workflow action.');
  return next;
}
(() => {
  const panel = document.querySelector('.tp-tickets');
  if (!panel) return;
  panel.querySelector(':scope > header')?.remove();
  const cards = [...panel.querySelectorAll('.tp-ticket-card')];
  const layout = document.createElement('div');
  layout.className = 'tp-ticket-browser';
  const nav = document.createElement('nav');
  nav.className = 'tp-ticket-navigation';
  nav.setAttribute('aria-label', 'Tickets in this request');
  const host=panel.closest('[data-task-prototype]');
  let activeRequestId='SR-0048217';
  const emptyRequests=new Set(['SR-0048240','SR-0048249']);
  const nextAction=host.querySelector('.tp-next-action');


  const tools=document.createElement('div');tools.className='tp-ticket-tools';
  tools.innerHTML='<header><strong>Tickets</strong></header><div class="tp-ticket-toolbar"><button type="button" data-ticket-filters aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18M6 12h12M9 18h6"/></svg>Filters</button><button type="button" data-create-ticket class="tp-primary">Create ticket <span aria-hidden="true">+</span></button></div><div class="tp-ticket-filters" hidden><fieldset class="tp-ticket-status-options"><legend>Status</legend><label><input type="radio" name="ticket-status-filter" value="all" checked>All statuses</label><label><input type="radio" name="ticket-status-filter" value="open">Active</label><label><input type="radio" name="ticket-status-filter" value="completed">Completed</label></fieldset><label hidden aria-hidden="true">Status<select tabindex="-1" aria-label="Filter tickets by status"><option value="all">All statuses</option><option value="open">Active</option><option value="completed">Completed</option></select></label></div>';
  nav.append(tools);
  const empty=document.createElement('div');empty.className='tp-ticket-empty-state';empty.hidden=true;empty.innerHTML='<img class="tp-ticket-empty-visual" src="../../assets/empty-states/no-tickets-3d-green.webp" width="144" height="144" alt=""><h3>No tickets yet</h3><p>Create a ticket to organise the work for this request.</p><button type="button" class="tp-primary" data-empty-create-ticket>Create ticket <span aria-hidden="true">+</span></button>';
  const content = document.createElement('div');
  content.className = 'tp-ticket-selection';
  const entries = cards.map((card, index) => {
    const summary = card.querySelector('summary');
    const title = summary.querySelector('.tp-ticket-title');
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = title.outerHTML + summary.querySelector('.tp-status-chip').outerHTML;
    button.id = `ticket-choice-${index}`;
    button.setAttribute('aria-controls', `ticket-overview-${index}`);
    nav.append(button);
    const article = document.createElement('article');
    article.id = `ticket-overview-${index}`;
    article.setAttribute('aria-labelledby', button.id);
    const header = document.createElement('header');
    const id = title.querySelector('small').textContent;article.dataset.ticketId=id;
    header.className = 'tp-ticket-overview-header';
    header.innerHTML = `<div class="tp-ticket-heading"><div class="tp-ticket-heading-line"><h3>${title.querySelector('strong').textContent}</h3></div></div><div class="tp-ticket-heading-actions"></div>`;
    header.querySelector('.tp-ticket-heading-line').append(summary.querySelector('.tp-status-chip'));
    const disclosure = card.querySelector('.tp-ticket-disclosure');
    header.querySelector('.tp-ticket-heading-actions').append(disclosure.querySelector('footer button'));
    const meta = document.createElement('div');
    meta.className = 'tp-ticket-overview-meta';
    meta.append(...summary.querySelectorAll('.tp-ticket-meta'));
    meta.querySelectorAll('small').forEach(label => { if(label.textContent === 'Due') label.textContent = 'Due date'; });
    const extra = index === 0 ? [['Priority','High'],['Team','Service coordination'],['Work type','Investigation'],['Ticket ID',id]] : [['Priority','Normal'],['Team','Site coordination'],['Work type','Approval'],['Ticket ID',id]];
    extra.forEach(([label,value]) => { const cell=document.createElement('span');cell.className='tp-ticket-meta';cell.innerHTML=`<small>${label}</small><span data-overview-meta="${label}">${value}</span>`;meta.append(cell); });
    const notes=document.createElement('section');notes.className='tp-ticket-notes';
    notes.innerHTML=index===0 ? '<h4>Latest comment</h4><small>Riley Cruz · Today, 09:32</small><p>Review the controller log and previous incidents before confirming the response. Record any missing evidence in the investigation.</p>' : '<h4>Latest comment</h4><small>Elliot Ward · Today, 09:30</small><p>The access window is confirmed for 09:00–17:30. Please confirm the reception contact and building manager authorization.</p>';
    article.append(header, meta, notes);
    content.append(article);
    card.remove();
    const ownerCell=[...meta.querySelectorAll('.tp-ticket-meta')].find(cell=>cell.querySelector('small')?.textContent==='Owner');
    const ownerValue=ownerCell.textContent.replace(/^Owner/,'').trim();
    return {button,article,owner:ownerValue,ownerCell,id};
  });
  const currentUser='Riley Cruz';
  let claimed={};
  try {claimed=JSON.parse(sessionStorage.getItem('portfolio-ticket-claims-v1'))||{};}catch {}
  function setWorkflow(entry,steps){
    entry.workflowSteps=steps;const active=steps.findIndex(step=>!step.done);
    let row=entry.article.querySelector('.tp-ticket-workflow-row');if(!row){row=document.createElement('div');row.className='tp-ticket-workflow-row';entry.article.querySelector('.tp-ticket-overview-meta').after(row);}
    row.innerHTML=`<section class="tp-workflow-segments" aria-label="Ticket steps">${active>=0?`<p class="tp-workflow-compact-count">Step ${active+1} of ${steps.length}</p>`:''}${active===-1?'<p class="tp-workflow-complete">All steps complete · '+steps.length+' of '+steps.length+'</p>':''}<ol class="tp-even-step-track" style="grid-template-columns:${steps.map((_,index)=>index<steps.length-1?'max-content minmax(36px,1fr)':'max-content').join(' ')}">${steps.map((step,index)=>{const state=step.done?'completed':index===active?'active':'pending',label=step.done?'Completed':index===active?'In progress':'Not started';return `<li class="is-${state}"><div class="tp-step-summary" ${index===active?'aria-current="step"':''}><span class="tp-workflow-segment-name"><span class="tp-step-state" aria-hidden="true">${step.done?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 4 4L19 6"/></svg>':index+1}</span><strong>${escape(step.name)}</strong></span><small>${step.done?`${escape(step.completedBy || host.requestTickets.owner(entry.id))}<br>${escape(step.completedAt || step.completedDate || 'Date not recorded')}`:label}</small></div>${index<steps.length-1?'<span class="tp-workflow-connector" aria-hidden="true"></span>':''}</li>`;}).join('')}</ol></section>`;
  }
  const refresh = () => {
    const article=entries[0].article, data=window.getAssessmentOverview();
    article.querySelector('.tp-ticket-heading-line .tp-status-chip').textContent=data.status;
    entries[0].button.querySelector('.tp-status-chip').textContent=data.status;
    article.querySelector('[data-overview-meta="Priority"]').textContent=data.priority;
    const actions=article.querySelector('.tp-ticket-heading-actions');
    article.querySelector('.tp-ticket-workflow-row')?.remove();
    actions.querySelector('.inv-stepper')?.remove();
    const workflowRow=document.createElement('div');workflowRow.className='tp-ticket-workflow-row';workflowRow.innerHTML=data.segments;article.querySelector('.tp-ticket-overview-meta').after(workflowRow);
    const access=entries[1].article;
    const {count,total,complete}=window.getAccessOverview();
    access.querySelector('.tp-ticket-heading-line .tp-status-chip').textContent=complete?'Completed':'Open';
    entries[1].button.querySelector('.tp-status-chip').textContent=complete?'Completed':'Open';
    access.querySelector('.inv-stepper')?.remove();
    setWorkflow(entries[1],window.getAccessOverview().steps);
    entries.filter(entry=>entry.ticket?.type==='Schedule visit').forEach(entry=>{
      const reason=entry.ticket.visitReason||entry.ticket.title.split(' · ')[0];
      const work={'Diagnostics':'On-site diagnostics','Site inspection':'Safety inspection','Repair':'Repair work','Planned maintenance':'Maintenance','Follow-up inspection':'Follow-up inspection'}[reason]||'On-site service';
      setWorkflow(entry,[{name:'Execution',done:entry.ticket.workExecution?.stage==='verification'||entry.ticket.status==='Completed',completedBy:entry.ticket.workExecution?.submittedBy,detail:entry.ticket.workExecution?.executor||entry.ticket.engineer||'Executor not assigned'},{name:'Coordinator verification',done:entry.ticket.status==='Completed',completedBy:entry.ticket.completedBy,detail:entry.ticket.owner}]);
    });
    entries.forEach(applyTicketPermissions);
    updateModeAlert();
    if(!panel.hidden)entries.find(entry=>entry.button.hasAttribute('aria-current'))?.mountReview?.();
  };
  new MutationObserver(()=>{if(!panel.hidden)refresh();}).observe(panel,{attributes:true,attributeFilter:['hidden']});
  panel.closest('[data-task-prototype]').addEventListener('ticket-overview-changed',refresh);
  const select = index => {host.requestFiles.closeReviewWorkspace();entries.forEach((entry,i) => {
    entry.article.hidden = i !== index;
    if(i === index) entry.button.setAttribute('aria-current','true');
    else entry.button.removeAttribute('aria-current');
  });updateModeAlert();};
  entries.forEach((entry,index) => entry.button.addEventListener('click', () => select(index)));
  const extraTickets=[];
  const ticketStorage='portfolio-service-tickets-SR-0048217';
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const persistTickets=()=>sessionStorage.setItem(ticketStorage,JSON.stringify(extraTickets));
  host.requestTickets={pendingCount:()=>extraTickets.filter(ticket=>ticket.type!=='Document review' && ticket.status!=='Completed').length,owner:id=>{const entry=entries.find(entry=>entry.id===id);return entry?.ticket?.owner || claimed[id] || entry?.owner;},canManage:id=>{const entry=entries.find(entry=>entry.id===id);return Boolean(entry && (entry.ticket?.owner || claimed[id] || entry.owner)===currentUser && !['Completed','Resolved'].includes(entry.article.querySelector('.tp-status-chip').textContent));}};
  host.requestTickets.countForRequest=id=>(emptyRequests.has(id)?0:cards.length)+extraTickets.filter(ticket=>(ticket.requestId||'SR-0048217')===id).length;
  host.requestTickets.canComment=id=>Boolean(host.requestPermissions?.canEdit||host.requestTickets.canManage(id));
  host.requestTickets.transferOwner=(id,owner)=>{const entry=entries.find(entry=>entry.id===id);if(!entry)return;if(entry.ticket)entry.ticket.owner=owner;else claimed[id]=owner;host.dispatchEvent(new CustomEvent('ticket-owner-changed',{detail:{id}}));updateModeAlert();};
  function claimTicket(entry){
    if(['Completed','Resolved'].includes(entry.article.querySelector('.tp-status-chip').textContent))return;
    const previous=entry.ticket?.owner || claimed[entry.id] || entry.owner;
    try {
      if(entry.ticket){entry.ticket.owner=currentUser;persistTickets();}
      else {claimed={...claimed,[entry.id]:currentUser};sessionStorage.setItem('portfolio-ticket-claims-v1',JSON.stringify(claimed));}
    } catch {if(entry.ticket)entry.ticket.owner=previous;else claimed[entry.id]=previous;return;}
    host.dispatchEvent(new CustomEvent('ticket-owner-changed',{detail:{id:entry.id}}));
    host.dispatchEvent(new Event('ticket-overview-changed'));
  }
  function updateModeAlert(){
    // The request permission controller owns the request-level notice.
    host.querySelectorAll('.tp-ticket-mode-alert:not(.tp-request-mode-alert)').forEach(alert=>alert.remove());
  }
  host.requestTickets.updateModeAlert=updateModeAlert;
  [host.querySelector('[data-screen="case"]'),panel,...host.querySelectorAll('.inv-screen')].forEach(screen=>new MutationObserver(updateModeAlert).observe(screen,{attributes:true,attributeFilter:['hidden']}));
  function syncTickets() {
    host.querySelector('[data-tab="jobs"] b').textContent=entries.length;
    filterTickets();
    host.dispatchEvent(new CustomEvent('ticket-overview-changed'));
  }
  function filterTickets() {
    const value=tools.querySelector('select').value;
    entries.forEach(entry=>{
      const done=entry.button.querySelector('.tp-status-chip').textContent==='Completed';
      const belongs=emptyRequests.has(activeRequestId)?entry.ticket?.requestId===activeRequestId:!entry.ticket?.requestId||entry.ticket.requestId===activeRequestId;
      entry.button.hidden=!belongs||(value==='completed'?!done:value==='open'?done:false);
    });
    const visible=entries.findIndex(entry=>!entry.button.hidden);
    const noTickets=emptyRequests.has(activeRequestId)&&!entries.some(entry=>entry.ticket?.requestId===activeRequestId);
    empty.hidden=!noTickets;layout.hidden=noTickets;layout.style.setProperty('display',noTickets?'none':'grid','important');panel.classList.toggle('is-empty-ticket-panel',noTickets);layout.classList.toggle('has-no-tickets',noTickets);tools.querySelector('[data-ticket-filters]').hidden=noTickets;
    host.querySelector('[data-tab="jobs"] b').textContent=host.requestTickets.countForRequest(activeRequestId);
    host.querySelector('.tp-case-workspace')?.classList.toggle('has-no-ticket-action',noTickets);
    if(nextAction){
      nextAction.hidden=noTickets;nextAction.inert=noTickets;
      nextAction.classList.remove('has-no-coordination-action','is-empty-request');
      nextAction.setAttribute('aria-hidden',String(noTickets));
    }

    const current=entries.find(entry=>entry.button.hasAttribute('aria-current'));
    if(noTickets||current?.button.hidden || !current)select(visible);
  }
  tools.querySelector('[data-ticket-filters]').onclick=event=>{
    const filter=tools.querySelector('.tp-ticket-filters');filter.hidden=!filter.hidden;
    event.currentTarget.setAttribute('aria-expanded',String(!filter.hidden));
  };
  tools.querySelector('.tp-ticket-status-options').addEventListener('change',event=>{tools.querySelector('select').value=event.target.value;tools.querySelector('select').dispatchEvent(new Event('change',{bubbles:true}));});
  tools.querySelector('select').addEventListener('change',()=>{tools.querySelectorAll('[name="ticket-status-filter"]').forEach(input=>input.checked=input.value===tools.querySelector('select').value);filterTickets();});
  host.addEventListener('ticket-overview-changed',filterTickets);
  let createdWorkScreen=null;
  function openCreatedTicket(entry){
    const ticket=entry.ticket,visit=ticket.type==='Schedule visit';
    if(!createdWorkScreen){createdWorkScreen=document.createElement('section');createdWorkScreen.className='tp-screen inv-screen tp-created-work-screen';host.append(createdWorkScreen);}
    const screen=createdWorkScreen,requestScreen=host.querySelector('[data-screen="case"]');
    screen.dataset.ticketId=ticket.id;
    const coordinator=ticket.owner;
    let actor=currentUser,contextTab='Case details';
    let contextWidth=null,splitObserver=null;
    function setupSplit(){
      splitObserver?.disconnect();
      const columns=screen.querySelector('.inv-columns'),tabs=columns.querySelector('.inv-tabs');
      const splitter=document.createElement('div');splitter.className='inv-column-splitter';splitter.tabIndex=0;splitter.setAttribute('role','separator');splitter.setAttribute('aria-orientation','vertical');splitter.setAttribute('aria-label','Resize ticket context and work');columns.append(splitter);
      const naturalWidth=()=>{const style=getComputedStyle(tabs);return [...tabs.children].reduce((sum,tab)=>sum+tab.getBoundingClientRect().width,0)+(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0)+8;};
      const resize=value=>{const total=columns.clientWidth;if(total<700){splitter.hidden=true;columns.style.removeProperty('--created-column-layout');return;}splitter.hidden=false;const width=Math.max(300,Math.min(total-320,value??naturalWidth()));columns.style.setProperty('--created-column-layout',`${width}px minmax(0,1fr)`);splitter.style.left=width+'px';splitter.setAttribute('aria-valuemin','300');splitter.setAttribute('aria-valuemax',String(total-320));splitter.setAttribute('aria-valuenow',String(Math.round(width)));};
      let pointer=null;
      splitter.onpointerdown=event=>{pointer=event.pointerId;splitter.setPointerCapture(pointer);splitter.classList.add('is-dragging');event.preventDefault();};
      splitter.onpointermove=event=>{if(pointer!==event.pointerId)return;contextWidth=event.clientX-columns.getBoundingClientRect().left;resize(contextWidth);};
      const finish=()=>{pointer=null;splitter.classList.remove('is-dragging');};splitter.onpointerup=finish;splitter.onpointercancel=finish;splitter.onlostpointercapture=finish;
      splitter.ondblclick=()=>{contextWidth=null;resize(null);};
      splitter.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Enter','Home','End'].includes(event.key))return;event.preventDefault();contextWidth=event.key==='Enter'?null:event.key==='Home'?300:event.key==='End'?columns.clientWidth-320:columns.querySelector('.inv-context').getBoundingClientRect().width+(event.key==='ArrowLeft'?-20:20);resize(contextWidth);};
      splitObserver=new ResizeObserver(()=>resize(contextWidth));splitObserver.observe(columns);requestAnimationFrame(()=>resize(contextWidth));
    }

    const original=ticket.workExecution||{stage:ticket.status==='Completed'?'completed':'work',executor:visit?(ticket.engineer&&ticket.engineer!=='Not assigned'?ticket.engineer:'Felix Novak'):coordinator,report:ticket.workflowDraft?.[1]?.work||ticket.outcome||'',verification:ticket.workflowDraft?.[2]?.report||'',workConfirmed:false,verified:false};
    let draft=structuredClone(original),saved=structuredClone(original);
    if(draft.stage==='assignment'){draft.stage='work';saved.stage='work';}
    draft.reviewer ||= draft.executor!==coordinator?coordinator:'Mina Shah';saved.reviewer=draft.reviewer;
    const comments=[...entry.article.querySelectorAll('.tp-ticket-comments,.tp-ticket-comment-composer')];
    const restoreComments=()=>comments.forEach(node=>(entry.article.querySelector('.tp-ticket-scroll-body')||entry.article).append(node));
    const dirty=()=>JSON.stringify(draft)!==JSON.stringify(saved);
    function capture(){
      const form=screen.querySelector('[data-work-form]');if(!form)return;
      for(const input of form.querySelectorAll('input,textarea,select')){if(input.disabled)continue;draft[input.name]=input.type==='checkbox'?input.checked:input.value;}
    }
    function close(){capture();if(dirty()&&!confirm('Discard unsaved changes and return to tickets?'))return;splitObserver?.disconnect();restoreComments();screen.hidden=true;requestScreen.hidden=false;host.dataset.commentViewer=currentUser;host.dispatchEvent(new Event('comment-viewer-changed'));entry.article.querySelector('[data-open-created-ticket]')?.focus({preventScroll:true});}
    const facts=()=>`<h3>${escape(ticket.title)}</h3><dl>${[['Ticket ID',ticket.id],['Related request',ticket.requestId||'SR-0048217'],['Owner',ticket.owner],['Work type',ticket.type],...(visit?[['Visit date',window.prototypeDates.format(ticket.date)],['Visit time',ticket.time],['Engineer',ticket.engineer]]:[])].map(([label,value])=>`<div><dt>${label}</dt><dd>${escape(value||'Not specified')}</dd></div>`).join('')}</dl><h4>Description</h4><p>${escape(ticket.description||'No description added.')}</p>`;
    function showContext(){
      restoreComments();const body=screen.querySelector('.inv-context-body');body.replaceChildren();body.classList.toggle('is-comments-context',contextTab==='Internal comments');
      screen.querySelectorAll('[data-created-context]').forEach(button=>{if(button.dataset.createdContext===contextTab)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
      if(contextTab==='Files'){body.append(window.createTicketFileViewer());return;}
      if(contextTab==='Internal comments'){if(comments.length){body.append(...comments);host.dispatchEvent(new Event('comment-context-shown'));}else body.innerHTML='<h3>Internal comments</h3><p>No comments yet.</p>';return;}
      if(contextTab==='Communication'){
        const source=host.querySelector('[data-panel="communication"]');
        const messages=source?[...source.querySelectorAll('.tp-message-row')].slice(0,6):[];
        body.innerHTML='<h3>Request communication</h3><p>Messages linked to the parent request.</p>'+messages.map(message=>`<section class="tp-created-context-message"><p>${escape(message.innerText)}</p></section>`).join('')+'<button type="button" data-created-open-communication>Open request communication →</button>';
        body.querySelector('button').onclick=()=>{close();host.querySelector('[data-tab="communication"]').click();};return;
      }
      if(contextTab==='Activity'){body.innerHTML='<h3>Ticket activity</h3>'+[['Assigned to',draft.executor],['Submitted by',draft.submittedBy],['Verified by',draft.verifiedBy]].filter(([,value])=>value).map(([label,value])=>`<p>${label} · ${escape(value)}</p>`).join('');return;}
      body.innerHTML=facts();
    }
    function persist(action){
      capture();let next;
      try{next=action?ticketWorkTransition(draft,action,actor,coordinator):structuredClone(draft);}catch(error){screen.querySelector('[data-work-error]').textContent=error.message;return false;}
      const previous=structuredClone(ticket);
      ticket.workExecution=next;
      if(action){ticket.status=next.stage==='completed'?'Completed':next.stage==='verification'?'Awaiting verification':'In progress';ticket.engineer=next.executor;}
      if(action==='return'){ticket.workflowDraft={...ticket.workflowDraft,completedSteps:0};}
      if(action==='submit'){ticket.workCompletedAt=new Date().toLocaleString('en-GB');ticket.workflowDraft={...ticket.workflowDraft,completedSteps:2};}
      if(action==='verify'){ticket.completedBy=actor;ticket.completedAt=new Date().toLocaleString('en-GB');ticket.completedDate=window.prototypeDates.format(new Date());ticket.outcome=next.verification;ticket.workflowDraft={...ticket.workflowDraft,completedSteps:3};}
      try{persistTickets();}catch{Object.keys(ticket).forEach(key=>delete ticket[key]);Object.assign(ticket,previous);screen.querySelector('[data-work-error]').textContent='Could not save. Please try again.';return false;}
      draft=structuredClone(next);saved=structuredClone(next);
      entry.article.querySelector('.tp-status-chip').textContent=ticket.status;entry.button.querySelector('.tp-status-chip').textContent=ticket.status;syncTickets();render();return true;
    }
    function openHandoff(action){
      const dialog=document.createElement('dialog');dialog.className='tp-save-dialog tp-ticket-handoff-dialog';
      const returning=action==='return',submitting=action==='submit';
      const candidates=peopleForHandoff().filter(person=>person!==actor);
      const preferred=returning?draft.executor:draft.reviewer;
      dialog.innerHTML=`<form><h2>${returning?'Return work for revision':submitting?'Complete your step?':'Complete this ticket?'}</h2><p>${returning?'Explain what needs to be corrected and assign the next executor.':submitting?'Your report will be sent to a different person for verification.':'The verified result will be recorded and the ticket will be closed.'}</p>${returning||submitting?`<label class="tp-handoff-field"><span>${returning?'Next executor':'Next assignee · Verification'}</span><select name="assignee" required>${candidates.map(person=>`<option ${person===preferred?'selected':''}>${escape(person)}</option>`).join('')}</select></label>`:''}${returning?'<label class="tp-handoff-field"><span>Reason for return</span><textarea name="reason" rows="3" maxlength="2000" required></textarea></label>':''}<p role="alert" data-handoff-error></p><footer><button type="button" data-handoff-cancel>Keep editing</button><button type="submit" class="tp-primary">${returning?'Return work':submitting?'Complete step':'Complete ticket'}</button></footer></form>`;
      host.append(dialog);dialog.querySelector('[data-handoff-cancel]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});
      dialog.querySelector('form').onsubmit=event=>{
        event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
        const before=structuredClone(draft);
        if(submitting)draft.reviewer=form.elements.assignee.value;
        if(returning){if(!form.elements.reason.value.trim()){form.elements.reason.setCustomValidity('Enter a reason.');form.elements.reason.reportValidity();form.elements.reason.oninput=()=>form.elements.reason.setCustomValidity('');return;}draft.executor=form.elements.assignee.value;draft.returnReason=form.elements.reason.value.trim();}
        if(persist(action)){dialog.close();screen.querySelector('[data-created-back]')?.focus({preventScroll:true});}
        else{draft=before;dialog.querySelector('[data-handoff-error]').textContent=screen.querySelector('[data-work-error]').textContent||'Could not save. Please try again.';}
      };dialog.showModal();
    }
    function peopleForHandoff(){return [...new Set([coordinator,draft.executor,draft.reviewer,'Riley Cruz','Felix Novak','Elliot Ward','Mina Shah'])].filter(Boolean);}
    function render(){
      restoreComments();
      const assign=false;
      const execute=actor===draft.executor&&draft.stage==='work';
      const verify=actor===draft.reviewer&&actor!==draft.submittedBy&&draft.stage==='verification';
      const editable=assign||execute||verify;
      const action=assign?'assign':execute?'submit':verify?'verify':'';
      const actionLabel=execute?'Complete step':verify?'Complete ticket':draft.stage==='completed'?'Ticket completed':'Complete step';
      const people=[...new Set([coordinator,draft.executor,draft.reviewer,'Felix Novak','Elliot Ward','Mina Shah'])].filter(Boolean);
      const textField=(name,label,value,enabled,placeholder)=>`<label class="tp-created-text-field"><span>${label}</span><textarea name="${name}" ${enabled?'required':'disabled'} maxlength="2000" rows="4" placeholder="${placeholder}">${escape(value||'')}</textarea></label>`;
      screen.innerHTML=`<header class="inv-header"><div><button type="button" data-created-back>← Back to tickets</button><div class="tp-created-heading"><h2><button type="button" class="tp-ticket-copy-id" data-created-copy aria-label="Copy ticket ID ${escape(ticket.id)}">${escape(ticket.id)}</button> · ${escape(ticket.title)}</h2><span class="tp-status-chip">${escape(ticket.status)}</span></div><p>${escape(ticket.requestId||'SR-0048217')} · Coordinator: ${escape(coordinator)}</p></div><details class="tp-created-avatar-menu"><summary aria-label="Switch prototype user" title="Switch prototype user"><span class="tp-avatar">${actor.split(' ').map(word=>word[0]).join('')}</span></summary><div role="group" aria-label="Preview as user"><small>Preview as</small>${people.map(person=>`<button type="button" data-preview-user="${escape(person)}" ${actor===person?'aria-current="true"':''}>${escape(person)}</button>`).join('')}</div></details></header><div class="inv-columns"><aside class="inv-context"><nav class="inv-tabs" aria-label="Ticket context">${['Communication','Internal comments','Files','Case details','Activity'].map(tab=>`<button type="button" data-created-context="${tab}">${tab}</button>`).join('')}</nav><article class="inv-context-body"></article></aside><section class="inv-decisions"><header class="inv-section-header"><div><span class="inv-meta">${visit?'SITE VISIT':'SERVICE TASK'}</span><h3>${verify?'Verify completed work':execute?'Record your work':'Work & verification'}</h3><p>${assign?'Assign execution to a colleague. You will verify their report before closing this ticket.':execute?'Record the result and submit it to the coordinator for verification.':verify?'Review the executor’s report and record your verification.':draft.stage==='completed'?'This ticket is complete. Recorded results are available for review.':'Waiting for '+escape(draft.stage==='verification'?draft.reviewer:draft.executor)+'.'}</p></div></header><form id="created-ticket-work-form" class="inv-form" data-work-form><section class="tp-created-work-block"><h3>Work report</h3><p class="inv-meta">Assigned to ${escape(draft.executor)}</p>${draft.returnReason?`<p class="inv-notice">Returned for rework: ${escape(draft.returnReason)}</p>`:''}${textField('report','Work performed and outcome',draft.report,execute,'Describe the work carried out and its outcome.')}<label class="tp-created-work-check"><input name="workConfirmed" type="checkbox" ${draft.workConfirmed?'checked':''} ${execute?'required':'disabled'}><span>The assigned work has been carried out.</span></label>${draft.submittedBy?`<p class="inv-meta">Submitted by ${escape(draft.submittedBy)}</p>`:''}</section><section class="tp-created-work-block"><h3>Result verification</h3><p class="inv-meta">Assigned to ${escape(draft.reviewer)} · Available after the executor submits the work report.</p>${textField('verification','Verification notes',draft.verification,verify,'Record your review of the result and any follow-up.')}<label class="tp-created-work-check"><input name="verified" type="checkbox" ${draft.verified?'checked':''} ${verify?'required':'disabled'}><span>I have checked the submitted report and accept the result.</span></label></section></form></section></div><footer class="inv-created-footer"><p data-work-error role="status"></p><div><button type="button" data-work-discard>Discard changes</button><button type="button" data-work-save>Save changes</button>${verify?'<button type="button" data-work-return>Return for rework</button>':''}<button type="submit" form="created-ticket-work-form" data-work-submit class="tp-primary" ${action?'':'disabled'}>${actionLabel}</button></div></footer>`;
      const topbar=document.createElement('div');topbar.className='tp-created-topbar';
      const back=screen.querySelector('[data-created-back]'),avatar=screen.querySelector('.tp-created-avatar-menu');
      const fullscreen=document.createElement('button');fullscreen.type='button';fullscreen.className='tp-created-fullscreen';
      const syncFullscreen=()=>{fullscreen.textContent=host.classList.contains('is-focus-mode')?'EXIT FULL SCREEN':'ENTER FULL SCREEN';};syncFullscreen();
      fullscreen.onclick=()=>{requestScreen.querySelector('[data-enter-fullscreen]')?.click();syncFullscreen();};
      topbar.append(back,fullscreen,avatar);screen.prepend(topbar);setupSplit();
      screen.querySelector('[data-created-back]').onclick=close;
      screen.querySelector('[data-created-copy]').onclick=async event=>{const button=event.currentTarget;try{await navigator.clipboard.writeText(ticket.id);}catch{const input=document.createElement('textarea');input.value=ticket.id;screen.append(input);input.select();const success=document.execCommand('copy');input.remove();if(!success){screen.querySelector('[data-work-error]').textContent='Could not copy. Ticket ID: '+ticket.id;return;}}button.textContent='ID COPIED';setTimeout(()=>{if(button.isConnected)button.textContent=ticket.id;},1400);};
      screen.querySelectorAll('[data-preview-user]').forEach(button=>button.onclick=()=>{capture();actor=button.dataset.previewUser;host.dataset.commentViewer=actor;render();host.dispatchEvent(new Event('comment-viewer-changed'));});
      screen.querySelectorAll('[data-created-context]').forEach(button=>button.onclick=()=>{contextTab=button.dataset.createdContext;showContext();});showContext();
      const form=screen.querySelector('[data-work-form]');
      const updateButtons=()=>{capture();screen.querySelector('[data-work-save]').disabled=!editable||!dirty();screen.querySelector('[data-work-discard]').disabled=!dirty();screen.querySelector('[data-work-submit]').disabled=!action||!form.checkValidity();};
      form.addEventListener('input',event=>{if(event.target.matches('textarea'))event.target.setCustomValidity('');updateButtons();});form.addEventListener('change',updateButtons);
      screen.querySelector('[data-work-save]').onclick=()=>{if(editable)persist();};
      screen.querySelector('[data-work-discard]').onclick=()=>{draft=structuredClone(saved);render();};
      form.onsubmit=event=>{event.preventDefault();if(!action||!form.reportValidity())return;capture();openHandoff(action);};
      screen.querySelector('[data-work-return]')?.addEventListener('click',()=>{capture();openHandoff('return');});
      updateButtons();
    }
    requestScreen.hidden=true;screen.hidden=false;render();host.scrollTop=0;screen.scrollTop=0;screen.querySelector('[data-created-back]').focus({preventScroll:true});
  }
  function addTicket(ticket) {
    // Migrate legacy planning labels independently of work progress.
    if(ticket.status==='Scheduled') {
      ticket.status='Open';
      ticket.visitConfirmation='Confirmed';
    }
    if(ticket.type==='Schedule visit') {
      ticket.visitConfirmation ||= ticket.confirmedDate ? 'Confirmed' : 'Awaiting confirmation';
      ticket.title=ticket.title.replace(' · Scheduled visit',' · Site visit');
    }
    const index=entries.length;
    const button=document.createElement('button');button.type='button';button.id=`ticket-choice-${index}`;
    button.innerHTML=`<span class="tp-ticket-title"><small>${escape(ticket.id)}</small><strong>${escape(ticket.title)}</strong></span><span class="tp-status-chip">${escape(ticket.status)}</span>`;
    const article=document.createElement('article');article.id=`ticket-overview-${index}`;article.dataset.ticketId=ticket.id;
    article.setAttribute('aria-labelledby',button.id);button.setAttribute('aria-controls',article.id);
    const visit=ticket.type==='Schedule visit';
    article.innerHTML=`<header class="tp-ticket-overview-header"><div class="tp-ticket-heading"><div class="tp-ticket-heading-line"><h3>${escape(ticket.title)}</h3><span class="tp-status-chip">${escape(ticket.status)}</span></div></div><div class="tp-ticket-heading-actions"><button type="button" data-open-created-ticket>Open ticket</button></div></header><div class="tp-ticket-overview-meta">${[['Owner',ticket.owner],['Work type',ticket.type],['Related request','SR-0048217'],['Ticket ID',ticket.id],...(visit?[['Visit planning',ticket.visitConfirmation==='Confirmed'?'Visit confirmed':'Awaiting confirmation'],['Visit date',window.prototypeDates.format(ticket.date)],['Visit time',ticket.time+' · Local site time'],['Engineer',ticket.engineer]]:[])].map(([key,value])=>`<span class="tp-ticket-meta"><small>${escape(key)}</small><span>${escape(value)}</span></span>`).join('')}</div><section class="tp-ticket-notes"><h4>${visit?'Visit coordination':'Description'}</h4><p>${escape(ticket.description || (visit?'Confirm the appointment with the engineer and arrange site access.':'No description added.'))}</p></section>`;
    article.querySelector('[data-open-created-ticket]').onclick=()=>openCreatedTicket(entry);
    if(visit){
      const planning=document.createElement('span');
      planning.className='tp-ticket-list-planning';
      planning.textContent=(ticket.visitConfirmation==='Confirmed'?'Visit confirmed':'Awaiting confirmation')+' · '+window.prototypeDates.format(ticket.date)+' · '+ticket.time;
      button.append(planning);
    }
    const entry={button,article,ticket,id:ticket.id};
    entries.push(entry);extraTickets.push(ticket);nav.append(button);content.append(article);
    button.onclick=()=>select(index);
    if(ticket.type==='Document review'){
      article.querySelector('[data-open-created-ticket]').remove();
      article.querySelector('.tp-ticket-notes').remove();
      const review=document.createElement('div');review.className='tp-document-review-workspace';article.append(review);
      const mount=()=>host.requestFiles.openReviewWorkspace(ticket.fileKey,review,host.requestTickets.canManage(ticket.id));
      button.addEventListener('click',mount);entry.mountReview=mount;
    }
    applyTicketPermissions(entry);
  }
  try {
    const restored=JSON.parse(sessionStorage.getItem(ticketStorage));
    if(Array.isArray(restored))restored.filter(ticket=>ticket && typeof ticket.title==='string' && ['Schedule visit','Service task'].includes(ticket.type) && ['Open','In progress','Scheduled','Awaiting verification','Completed'].includes(ticket.status)).forEach(addTicket);
  } catch {}
  const sampleTickets=[
    {id:'TKT-V001',type:'Schedule visit',title:'Diagnostics · Site visit',visitReason:'Diagnostics',owner:'Riley Cruz',status:'Open',visitConfirmation:'Confirmed',date:'2026-10-06',time:'10:00',engineer:'Felix Novak',description:'Inspect AHU-04 and review the controller alarm on Level 4. Reception has confirmed access to the roof plant room. Allow 60 minutes for diagnostics.',site:'Rivergate House · Building A',access:'Reception escort · Plant-room key confirmed',contact:'Jamie Cole · Reception',confirmation:'Engineer and reception confirmed',confirmedDate:'6 Oct 2026',duration:'60 minutes'},
    {id:'TKT-C001',type:'Service task',title:'Equipment history review',owner:'Mina Shah',status:'Completed',description:'Reviewed the previous inspection report and controller history for AHU-04. No recurring airflow fault was recorded. Findings are available for the engineer before diagnostics.',completedAt:'5 Oct 2026, 09:20 · BST',outcome:'History reviewed · Findings recorded',evidence:'Repair_Summary.pdf · Previous inspection report'}
  ];
  // Date-only history for the fictional sample, independent of its appointment date.
  sampleTickets.forEach(ticket=>{
    const existing=extraTickets.find(item=>item.id===ticket.id);
    if(!existing){addTicket(ticket);return;}
    if(ticket.id==='TKT-V001'){
      existing.confirmedDate ||= ticket.confirmedDate;
      if(existing.status==='Completed'){
        existing.completedDate ||= '6 Oct 2026';
        existing.workCompletedDate ||= '6 Oct 2026';
      }
    }
  });
  function applyTicketPermissions(entry) {
    const article=entry.article,actions=article.querySelector('.tp-ticket-heading-actions');
    const status=article.querySelector('.tp-status-chip').textContent;
    const completed=['Completed','Resolved'].includes(status);
    const owner=entry.ticket?.owner || claimed[entry.id] || entry.owner;
    if(!entry.button.querySelector('.tp-ticket-list-heading')){
      const heading=document.createElement('span');heading.className='tp-ticket-list-heading';
      const title=entry.button.querySelector('.tp-ticket-title');title.querySelector('small')?.remove();
      heading.append(title,entry.button.querySelector('.tp-status-chip'));entry.button.prepend(heading);
    }
    let listOwner=entry.button.querySelector('.tp-ticket-list-owner');
    if(!listOwner){listOwner=document.createElement('span');listOwner.className='tp-ticket-list-owner';listOwner.dataset.ticketListOwner=entry.id;entry.button.append(listOwner);}
    listOwner.textContent=`${entry.id} · ${owner}`;
    const ownerCell=entry.ownerCell || [...article.querySelectorAll('.tp-ticket-meta')].find(cell=>cell.querySelector('small')?.textContent==='Owner');
    if(ownerCell){
      let link=ownerCell.querySelector('[data-ticket-owner]');
      if(!link){const label=ownerCell.querySelector('small');link=document.createElement('button');link.type='button';link.className='tp-coordinator-link';link.dataset.ticketOwner='';link.setAttribute('aria-haspopup','dialog');ownerCell.replaceChildren(label,link);
        link.onclick=()=>host.openOwnerAssignment({owner:host.requestTickets.owner(entry.id),trigger:link,commit:value=>{if(entry.ticket){entry.ticket.owner=value;persistTickets();}else{claimed={...claimed,[entry.id]:value};sessionStorage.setItem('portfolio-ticket-claims-v1',JSON.stringify(claimed));}applyTicketPermissions(entry);host.dispatchEvent(new CustomEvent('ticket-overview-changed'));}});
      }
      link.textContent=owner;link.setAttribute('aria-label',owner+', reassign owner');link.disabled=false;
    }
    const editable=owner===currentUser && !completed;
    article.dataset.ticketMode=editable?'edit':'review';
    actions.querySelectorAll(':scope > button').forEach(control=>{control.hidden=false;control.disabled=control.matches('[data-start-investigation],[data-open-access-ticket],[data-open-created-ticket]')?false:!editable;});
    article.querySelectorAll('input,select,textarea').forEach(input=>input.disabled=input.closest('.tp-comment-filter-panel,.tp-comment-search')?false:input.closest('.tp-ticket-comment-composer')?!host.requestTickets.canComment(entry.id):!editable);
    article.querySelector('.tp-ticket-permission-note')?.remove();
    actions.querySelector('[data-claim-ticket]')?.remove();
    if(entry.ticket && !article.querySelector('[data-ticket-extra-details]')) {
      const details=[['Site',entry.ticket.site],['Site access',entry.ticket.access],['Site contact',entry.ticket.contact],['Confirmation',entry.ticket.confirmation],['Estimated duration',entry.ticket.duration],['Completed',entry.ticket.completedAt],['Outcome',entry.ticket.outcome],['Evidence',entry.ticket.evidence]].filter(([,value])=>value);
      if(details.length){const section=document.createElement('section');section.className='tp-ticket-notes';section.dataset.ticketExtraDetails='';section.innerHTML='<h4>'+ (completed?'Completion record':'Visit details')+'</h4><dl>'+details.map(([key,value])=>`<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join('')+'</dl>';article.append(section);}
    }
  }
  const createDialog=document.createElement('dialog');createDialog.className='tp-save-dialog tp-create-ticket-dialog';
  createDialog.setAttribute('aria-labelledby','create-ticket-title');
  createDialog.innerHTML='<form><h2 id="create-ticket-title">Create ticket</h2><p>SR-0048217 · Ventilation alarm</p><input type="hidden" name="type" value="Service task" /><div class="tp-ticket-type-tabs" role="tablist" aria-label="Ticket type"><button type="button" role="tab" aria-selected="true" tabindex="0" data-ticket-type="Service task">Service task</button><button type="button" role="tab" aria-selected="false" tabindex="-1" data-ticket-type="Schedule visit">Schedule visit</button></div><label data-service-title><span class="tp-ticket-field-label">Title</span><input name="title" required maxlength="120" /></label><label data-visit-reason hidden><span class="tp-ticket-field-label">Visit reason</span><select name="visitReason"><option value="">Select visit reason</option><option>Diagnostics</option><option>Site inspection</option><option>Repair</option><option>Planned maintenance</option><option>Follow-up inspection</option></select></label><label>Owner<select name="owner"><option>Riley Cruz</option><option>Elliot Ward</option><option>Mina Shah</option></select></label><div data-visit-fields hidden><div class="tp-visit-date-time"><label><span class="tp-ticket-field-label">Visit date</span><input type="date" name="date" /></label><label><span class="tp-ticket-field-label">Visit time</span><input type="time" name="time" /></label></div><label>Engineer<select name="engineer"><option>Felix Novak</option><option>Riley Cruz</option><option>Elliot Ward</option><option>Mina Shah</option><option>Not assigned</option></select></label></div><label>Description<textarea name="description" rows="3" maxlength="2000"></textarea></label><p role="alert" hidden></p><footer><button type="button" data-cancel-ticket>Cancel</button><button type="submit" class="tp-primary">Create ticket</button></footer></form>';
  host.append(createDialog);
  const createForm=createDialog.querySelector('form');
  createForm.noValidate=true;
  const clearErrors=()=>{createForm.querySelectorAll('[data-field-error]').forEach(error=>error.remove());createForm.querySelectorAll('[aria-invalid]').forEach(input=>{input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');});};
  function fieldError(input,message) {
    const label=input.closest('label');
    const error=document.createElement('small');error.dataset.fieldError='';error.id=`ticket-error-${input.name}`;error.textContent=message;
    label.append(error);input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',error.id);
  }
  function validateTicket() {
    clearErrors();createForm.querySelectorAll('[aria-invalid]').forEach(input=>{input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');});
    let first=null;
    [...createForm.elements].filter(input=>input.required && !input.disabled).forEach(input=>{
      if(!input.value.trim() || !input.validity.valid){fieldError(input,input.value.trim()?'Enter a valid value.':'This field is required.');first ||= input;}
    });
    const input=createForm.elements.date;
    if(type.value==='Schedule visit' && input.value){
      const date=parseVisitDate(input.value);
      if(!date){fieldError(input,'Enter a valid date, for example 29 Oct 2026.');first ||= input;}
      else if(isoDate(date)<todayISO()){fieldError(input,'Choose today or a future date. Past dates are not allowed.');first ||= input;}
    }
    if(first){(first.closest('label').querySelector('.draft-select-trigger') || first).focus();return false;}return true;
  }
  const parseVisitDate=value=>window.prototypeDates.parse(value);
  const isoDate=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const todayISO=()=>isoDate(new Date());
  createForm.elements.date.min=todayISO();
  const picker=document.createElement('div');picker.className='tp-visit-picker';picker.setAttribute('popover','manual');createDialog.append(picker);
  let pickerTrigger=null,chosenHour=9,chosenMinute=0;
  const closePicker=()=>{if(picker.matches(':popover-open'))picker.hidePopover();pickerTrigger?.setAttribute('aria-expanded','false');};
  function setPicked(input,value) {input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));closePicker();pickerTrigger?.focus();}
  function renderTime() {
    picker.innerHTML='<div class="tp-time-columns"><div><strong>Hours</strong><div data-hours></div></div><div><strong>Minutes</strong><div data-minutes></div></div></div><div class="tp-picker-footer"><button type="button" data-clear>Clear</button><button type="button" data-apply>Apply</button></div>';
    [[24,'hours'],[60,'minutes']].forEach(([count,name])=>{
      for(let value=0;value<count;value++) {
        const button=document.createElement('button');button.type='button';button.textContent=String(value).padStart(2,'0');button.setAttribute('aria-label',`${name==='hours'?'Hour':'Minute'} ${button.textContent}`);
        button.setAttribute('aria-pressed',String(value===(name==='hours'?chosenHour:chosenMinute)));button.tabIndex=value===(name==='hours'?chosenHour:chosenMinute)?0:-1;
        button.onclick=()=>{if(name==='hours')chosenHour=value;else chosenMinute=value;button.parentElement.querySelectorAll('button').forEach(item=>{item.setAttribute('aria-pressed',String(item===button));item.tabIndex=item===button?0:-1;});};picker.querySelector(`[data-${name}]`).append(button);
      }
    });
    picker.querySelector('[data-clear]').onclick=()=>setPicked(createForm.elements.time,'');
    picker.querySelector('[data-apply]').onclick=()=>setPicked(createForm.elements.time,`${String(chosenHour).padStart(2,'0')}:${String(chosenMinute).padStart(2,'0')}`);
  }
  ['date','time'].forEach(name=>{
    const input=createForm.elements[name];input.type='text';input.placeholder=name==='date'?'D MMM YYYY':'hh:mm';input.inputMode=name==='date'?'text':'numeric';
    if(name==='time')input.pattern='(?:[01][0-9]|2[0-3]):[0-5][0-9]';
    const wrap=document.createElement('span');wrap.className='tp-visit-picker-field';input.before(wrap);wrap.append(input);
    const trigger=document.createElement('button');trigger.type='button';trigger.className='tp-visit-picker-trigger';trigger.setAttribute('aria-label',name==='date'?'Choose visit date':'Choose visit time');trigger.setAttribute('aria-expanded','false');
    trigger.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">'+(name==='date'?'<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M8 3v4M16 3v4M4 10h16"/>':'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>')+'</svg>';wrap.append(trigger);
    trigger.onclick=()=>{
      if(picker.matches(':popover-open') && pickerTrigger===trigger){closePicker();return;}closePicker();pickerTrigger=trigger;
      if(name==='date'){input.min=todayISO();window.prototypeDates.open({input,trigger,value:input.value,onSelect:value=>{input.value=window.prototypeDates.format(value);input.dispatchEvent(new Event('input',{bubbles:true}));}});return;}
      else {window.prototypeDates.close();const match=/^(\d{2}):(\d{2})$/.exec(input.value);chosenHour=match?+match[1]:9;chosenMinute=match?+match[2]:0;renderTime();}
      const rect=wrap.getBoundingClientRect();picker.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-296))+'px';picker.style.top=Math.max(8,Math.min(rect.bottom+6,window.innerHeight-(name==='date'?330:290)))+'px';
      picker.showPopover();trigger.setAttribute('aria-expanded','true');(picker.querySelector('.tp-calendar-days button[tabindex="0"],.tp-time-columns button[tabindex="0"]')||picker.querySelector('button'))?.focus();
    };
  });
  createDialog.addEventListener('click',event=>{if(!picker.contains(event.target) && !event.target.closest('.tp-visit-picker-trigger'))closePicker();});
  createDialog.addEventListener('keydown',event=>{if(event.key==='Escape' && picker.matches(':popover-open')){event.preventDefault();event.stopPropagation();closePicker();pickerTrigger?.focus();}});
  createDialog.addEventListener('close',closePicker);
  const type=createForm.elements.type;
  const typeTabs=[...createForm.querySelectorAll('[data-ticket-type]')];
  function selectTicketType(value) {
    window.prototypeDates.close();
    type.value=value;
    typeTabs.forEach(tab=>{const selected=tab.dataset.ticketType===value;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
    const visit=type.value==='Schedule visit';createForm.querySelector('[data-visit-fields]').hidden=!visit;
    createForm.querySelector('[data-service-title]').hidden=visit;
    createForm.querySelector('[data-visit-reason]').hidden=!visit;
    createForm.elements.title.disabled=visit;createForm.elements.title.required=!visit;
    createForm.elements.visitReason.disabled=!visit;createForm.elements.visitReason.required=visit;
    createForm.elements.date.required=createForm.elements.time.required=visit;
    if(!createForm.elements.title.value || ['Service task','Schedule visit'].includes(createForm.elements.title.value))createForm.elements.title.value=type.value;
  }
  typeTabs.forEach((tab,index)=>{
    tab.onclick=()=>selectTicketType(tab.dataset.ticketType);
    tab.onkeydown=event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?1:1-index;
      selectTicketType(typeTabs[next].dataset.ticketType);typeTabs[next].focus();
    };
  });
  tools.querySelector('[data-create-ticket]').onclick=()=>{clearErrors();createForm.reset();selectTicketType('Service task');createForm.querySelectorAll('select').forEach(select=>select.dispatchEvent(new Event('change',{bubbles:true})));createForm.querySelector('[data-visit-fields]').hidden=true;createForm.elements.date.required=createForm.elements.time.required=false;createForm.querySelector('[role="alert"]').hidden=true;createDialog.showModal();typeTabs[0].focus();};
  createForm.querySelector('[data-cancel-ticket]').onclick=()=>createDialog.close();
  createDialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();});
  createDialog.addEventListener('close',()=>tools.querySelector('[data-create-ticket]').focus());
  createForm.addEventListener('submit',event=>{
    event.preventDefault();if(!validateTicket())return;
    const title=type.value==='Schedule visit'?createForm.elements.visitReason.value:createForm.elements.title.value.trim();
    if(!title){createForm.elements.title.focus();return;}
    const ticket={requestId:activeRequestId,id:`TKT-${String(entries.length+1).padStart(3,'0')}`,type:type.value,title,visitReason:type.value==='Schedule visit'?title:'',owner:createForm.elements.owner.value,date:type.value==='Schedule visit'?isoDate(parseVisitDate(createForm.elements.date.value)):'',time:createForm.elements.time.value,engineer:createForm.elements.engineer.value,description:createForm.elements.description.value.trim(),status:'Open'};
    try {sessionStorage.setItem(ticketStorage,JSON.stringify([...extraTickets,ticket]));}
    catch {const error=createForm.querySelector('[role="alert"]');error.hidden=false;error.textContent='Could not create ticket. Please try again.';return;}
    addTicket(ticket);tools.querySelector('select').value='all';tools.querySelector('select').dispatchEvent(new Event('change',{bubbles:true}));syncTickets();select(entries.length-1);createDialog.close();
  });
  layout.append(nav, content);
  panel.append(layout,empty);
  empty.querySelector('button').onclick=()=>tools.querySelector('[data-create-ticket]').click();
  host.addEventListener('request-opened',event=>{activeRequestId=event.detail.id;tools.querySelector('select').value='all';filterTickets();createDialog.querySelector('form > p').textContent=activeRequestId;});
  select(0);
  refresh();
  syncTickets();
  const tab = document.createElement('button');
  tab.type = 'button'; tab.dataset.tab = 'related'; tab.textContent = 'Related requests 2';
  document.querySelector('[data-tab="activity"]').before(tab);
  const related = document.createElement('section');
  related.className = 'tp-related-requests'; related.dataset.panel = 'related'; related.hidden = true;
  panel.after(related);
  window.initializeRelatedRequests(related, tab);
})();
