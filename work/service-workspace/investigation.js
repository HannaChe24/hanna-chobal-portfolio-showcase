(() => {
  const host = document.querySelector('[data-task-prototype]');
  if (!host) return;
  const pool = ['Verify Request Details','Validate Equipment Details','Review Reported Issue','Review Supporting Evidence','Check Previous Incidents','Check for Duplicate Requests','Review Service History','Review Recent Activity','Validate Request Priority','Assess Safety Impact','Assess Service Impact','Verify Customer Communication','Request Missing Information','Confirm Site Access Requirements','Identify Responsible Service Team','Check SLA Requirements','Determine Required Action','Complete Investigation'];
  const yn = ['Yes','No'];
  const question = (id, label, options = yn) => ({id,label,options});
  const definitions = {
    verify: {title:pool[0], tab:'Communication', questions:[question('equipment','Is the affected equipment clearly identified?',['Yes','No','Unable to confirm']),question('location','Is the reported location clear?'),question('enough','Is enough information available to begin investigation?')]},
    evidence: {title:pool[3], tab:'Files', questions:[question('available','Evidence available?'),question('sufficient','Evidence sufficient to assess the issue?'),{...question('type','Evidence type',['Photo','Video','Document','System log','None available']),control:'checkbox'}]},
    incidents: {title:pool[4], tab:'Activity', questions:[question('similar','Similar incident found?'),question('open','Related open request found?'),question('history','Service history reviewed?')]},
    safety: {title:pool[9], tab:'Communication', questions:[question('risk','Potential safety risk?',['Yes','No','Unclear']),question('people','People currently affected?')]},
    priority: {title:pool[8], tab:'Case details', questions:[{...question('recommended','Recommended priority',['Low','Medium','High','Critical']),control:'select'}]},
    action: {title:'Work summary', tab:'Case details', questions:[]},
    missing: {title:pool[12], tab:'Communication', questions:[question('needed','Information needed',['Clear equipment photo','Location confirmation','Customer clarification','Incident report']),question('received','Has the missing information been received?')]},
    escalation: {title:'Escalate Safety Issue', tab:'Case details', questions:[question('team','Responsible escalation team',['Safety duty manager','Emergency response desk']),question('acknowledged','Has the responsible team acknowledged the escalation?')]}
  };
  let ids = ['verify','evidence','incidents','safety','priority','action'];
  const answers = {}, completed = new Set(), added = new Set();
  let selected = 'verify', tab = 'Communication', stage = 'Investigation', priority = 'High', waiting = false, resolved = false;
  const events = [{time:'09:32',text:'Investigation started · Riley Cruz',detail:'Six required validation tasks generated for ventilation case SR-0048217.'},{time:'09:26',text:'Files uploaded · Jamie Cole',detail:'Door-panel photo, controller log and service report attached.'},{time:'09:18',text:'Request received · Tenant portal',detail:'Ventilation unit AHU-04 airflow stops repeatedly on Level 4. Meeting rooms affected.'}];
  const activityIds=new WeakMap();let activitySequence=0;
  host.ticketActivityEvents=()=>events.map(event=>{
    if(!activityIds.has(event))activityIds.set(event,'TKT-001-INV-'+(++activitySequence));
    const actor=event.text.includes(' · ')?event.text.split(' · ').slice(1).join(' · '):'Riley Cruz';
    return {id:activityIds.get(event),ticketId:'TKT-001',date:'TODAY · 5 SEP 2026',time:event.time,type:'ticket',actor:'me',displayActor:actor,title:event.text.split(' · ')[0],summary:actor,detail:esc(event.detail||'Recorded in this local prototype session.'),technical:['TICKET_ACTIVITY','ticket_activity','—','—','Ticket investigation']};
  });
  queueMicrotask(()=>host.dispatchEvent(new Event('ticket-activity-changed')));
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const log = (text, detail='') => {events.unshift({time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),text,detail});host.dispatchEvent(new Event('ticket-activity-changed'));};
  const value = (id,key) => answers[id]?.[key];
  const duplicate = () => value('incidents','duplicate') === 'Yes';
  const safetyRisk = () => value('safety','risk') === 'Yes' || value('safety','immediate') === 'Yes';
  const add = id => { if(ids.includes(id)) return; ids.splice(ids.indexOf('action'),0,id); added.add(id); log(`Required task added · ${definitions[id].title}`,'Added automatically from an investigation answer.'); };
  const invalidate = id => { if(completed.delete(id)) log(`Task reopened · ${definitions[id].title}`,'A decision or dependency changed; review and complete again.'); };
  const valid = id => {
    const a = answers[id] || {};
    if (!definitions[id].questions.every(q => Array.isArray(a[q.id])?a[q.id].length>0:Boolean(a[q.id]))) return false;
    if(id === 'action' && !a.reason?.trim()) return false;
    return true;
  };
  const questionMarkup=(id,q,a)=>{
    const attrs=`data-answer-section="${id}" name="${id}-${q.id}" data-answer-key="${q.id}"`;
    const legend=`<span class="tp-required-mark" aria-hidden="true">*</span> ${q.label}`;
    if(q.control==='select')return `<label class="inv-builder-field"><span>${legend}</span><select ${attrs} required data-native-select><option value="">Select priority</option>${q.options.map(option=>`<option value="${esc(option)}" ${a[q.id]===option?'selected':''}>${esc(option)}</option>`).join('')}</select></label>`;
    const multiple=q.control==='checkbox',values=Array.isArray(a[q.id])?a[q.id]:[a[q.id]];
    return `<fieldset><legend>${legend}</legend>${multiple?'<p class="inv-meta">Select all that apply.</p>':''}<div>${q.options.map(option=>`<label><input type="${multiple?'checkbox':'radio'}" ${multiple?'':'required'} ${attrs} value="${esc(option)}" ${values.includes(option)?'checked':''} ${(option==='Close as duplicate'&&!duplicate())?'disabled':''}>${esc(option)}</label>`).join('')}</div></fieldset>`;
  };
  const evidenceFiles=new Map();
  const evidenceUploadMarkup=()=>`<div class="inv-evidence-upload"><button type="button" data-upload-evidence><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/></svg>Upload evidence</button><p id="evidence-upload-help">Photos: JPG, PNG, WEBP, GIF. Videos: MP4, MOV, WEBM. Up to 50 MB per file.</p><ul>${(answers.evidence?.uploads||[]).map(id=>{const file=evidenceFiles.get(id);return file?`<li><button type="button" class="inv-evidence-thumbnail" data-preview-evidence="${esc(id)}" aria-label="Preview ${esc(file.name)}">${file.type.startsWith('video/')?`<video src="${file.url}" muted preload="metadata" aria-hidden="true"></video>`:`<img src="${file.url}" alt="" loading="lazy">`}</button><div class="inv-evidence-file-copy"><button type="button" class="inv-evidence-file-name" data-preview-evidence="${esc(id)}">${esc(file.name)}</button><small>${file.type.startsWith('video/')?'Video':'Photo'} · ${file.size<1024*1024?Math.max(1,Math.round(file.size/1024))+' KB':(file.size/1024/1024).toFixed(1)+' MB'}</small></div></li>`:'';}).join('')}</ul></div>`;
  const supportingFields=(id,a)=>id==='verify'?`<label class="inv-builder-field"><span>Equipment reference</span><input type="text" name="equipmentReference" data-detail-section="verify" maxlength="80" value="${esc(a.equipmentReference||'')}" placeholder="e.g. AHU-04"></label>`:id==='evidence'?`<label class="inv-builder-field"><span>Evidence notes</span><textarea name="evidenceNotes" data-detail-section="evidence" rows="3" maxlength="1000" placeholder="Record findings or missing evidence…">${esc(a.evidenceNotes||'')}</textarea></label>`:id==='incidents'?`<label class="inv-builder-field"><span>Related request reference</span><input type="text" name="relatedReference" data-detail-section="incidents" maxlength="80" value="${esc(a.relatedReference||'')}" placeholder="e.g. SR-0048129"></label>`:'';
  const captureDraft = () => ({answers:structuredClone(answers), completed:[...completed], added:[...added], ids:[...ids], priority, waiting, events:structuredClone(events)});
  let savedDraft = captureDraft();
  const isDirty = () => JSON.stringify(captureDraft()) !== JSON.stringify(savedDraft);
  const discardDraft = () => {
    Object.keys(answers).forEach(key=>delete answers[key]);Object.assign(answers,structuredClone(savedDraft.answers));
    completed.clear();savedDraft.completed.forEach(id=>completed.add(id));
    added.clear();savedDraft.added.forEach(id=>added.add(id));
    ids.splice(0,ids.length,...savedDraft.ids);priority=savedDraft.priority;waiting=savedDraft.waiting;
    events.splice(0,events.length,...structuredClone(savedDraft.events));host.dispatchEvent(new Event('ticket-activity-changed'));
    if(!ids.includes(selected))selected=ids.find(id=>!completed.has(id))||'action';
    render();
  };
  new MutationObserver(()=>{const button=screen.querySelector('[data-ticket-fullscreen]'),source=host.querySelector('[data-enter-fullscreen]');if(button&&source){button.innerHTML=source.innerHTML;button.setAttribute('aria-pressed',String(host.classList.contains('is-focus-mode')));}}).observe(host,{attributes:true,attributeFilter:['class']});
  const state = id => completed.has(id) ? 'Completed' : (id === 'missing' && value(id,'received') === 'No') || (id === 'escalation' && value(id,'acknowledged') === 'No') ? 'Blocked' : Object.keys(answers[id] || {}).length ? 'In progress' : 'Not started';
  const screen = document.createElement('section');
  screen.className = 'tp-screen inv-screen'; screen.hidden = true;screen.dataset.ticketId='TKT-001';
  screen.setAttribute('aria-label','Ticket investigation');
  host.append(screen);

  // The shared evidence/tasks boundary keeps its user-set ratio across renders.
  let columns=null, splitRatio=null, dragPointer=null, dragOffset=0;
  const splitter=document.createElement('div');
  splitter.className='inv-column-splitter';
  splitter.tabIndex=0;
  splitter.setAttribute('role','separator');
  splitter.setAttribute('aria-orientation','vertical');
  splitter.setAttribute('aria-label','Resize evidence and investigation tasks');
  splitter.setAttribute('aria-controls','investigation-evidence-panel investigation-tasks-panel');
  splitter.title='Drag to resize. Use arrow keys to adjust; double-click or press Enter to reset.';
  const finishResize=()=>{
    const pointer=dragPointer;
    dragPointer=null;
    if(pointer!==null&&splitter.hasPointerCapture(pointer))splitter.releasePointerCapture(pointer);
    splitter.classList.remove('is-dragging');
    host.classList.remove('is-resizing-investigation');
  };
  const splitBounds=()=>({min:360/columns.clientWidth,max:1-320/columns.clientWidth});
  const syncSplit=()=>{
    if(!columns?.isConnected||!columns.clientWidth)return;
    const stacked=getComputedStyle(columns).gridTemplateColumns.trim().split(/\s+/).length===1;
    splitter.hidden=stacked||columns.clientWidth<680;
    if(splitter.hidden){finishResize();return;}
    const {min,max}=splitBounds();
    if(splitRatio===null){
      const tabs=columns.querySelector('.inv-tabs'),style=tabs?getComputedStyle(tabs):null;
      const tabWidth=tabs?[...tabs.children].reduce((sum,tab)=>sum+tab.getBoundingClientRect().width,0)+(parseFloat(style.columnGap)||0)*Math.max(0,tabs.children.length-1)+(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0)+8:460;
      const initialWidth=Math.min(columns.clientWidth-320,Math.max(360,tabWidth));
      columns.style.setProperty('--inv-column-layout',`${initialWidth}px minmax(0,1fr)`);
    }
    else columns.style.setProperty('--inv-column-layout',`${Math.max(min,Math.min(max,splitRatio))*100}% minmax(0,1fr)`);
    const actual=columns.querySelector('.inv-context').getBoundingClientRect().width/columns.getBoundingClientRect().width;
    splitter.style.left=`${actual*100}%`;
    splitter.setAttribute('aria-valuemin',String(Math.round(min*100)));
    splitter.setAttribute('aria-valuemax',String(Math.round(max*100)));
    splitter.setAttribute('aria-valuenow',String(Math.round(actual*100)));
    splitter.setAttribute('aria-valuetext',`${Math.round(actual*100)}% evidence, ${Math.round((1-actual)*100)}% investigation tasks`);
  };
  const resizeSplit=ratio=>{
    const {min,max}=splitBounds();
    splitRatio=Math.max(min,Math.min(max,ratio));
    syncSplit();
  };
  const resetSplit=()=>{splitRatio=null;syncSplit();};
  const splitObserver=new ResizeObserver(syncSplit);
  splitter.addEventListener('pointerdown',event=>{
    if(event.button!==0||splitter.hidden)return;
    event.preventDefault();splitter.focus({preventScroll:true});
    const bounds=splitter.getBoundingClientRect();
    dragOffset=event.clientX-(bounds.left+bounds.width/2);
    dragPointer=event.pointerId;splitter.setPointerCapture(event.pointerId);
    splitter.classList.add('is-dragging');host.classList.add('is-resizing-investigation');
  });
  splitter.addEventListener('pointermove',event=>{
    if(event.pointerId!==dragPointer)return;
    const bounds=columns.getBoundingClientRect();
    resizeSplit((event.clientX-bounds.left-dragOffset)/bounds.width);
  });
  splitter.addEventListener('pointerup',finishResize);
  splitter.addEventListener('pointercancel',finishResize);
  splitter.addEventListener('lostpointercapture',finishResize);
  splitter.addEventListener('dblclick',resetSplit);
  splitter.addEventListener('keydown',event=>{
    if(splitter.hidden||!['ArrowLeft','ArrowRight','Home','End','Enter'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();
    if(event.key==='Enter'){resetSplit();return;}
    const {min,max}=splitBounds();
    const actual=columns.querySelector('.inv-context').getBoundingClientRect().width/columns.getBoundingClientRect().width;
    const step=event.shiftKey ? 0.1 : 0.02;
    resizeSplit(event.key==='Home'?min:event.key==='End'?max:actual+(event.key==='ArrowLeft'?-step:step));
  });

  let activityQuery = '';
  const expandedActivity = new Set();
  const visibleTicketEvents = () => events.filter(e => `${e.text} ${e.detail} ${e.time}`.toLowerCase().includes(activityQuery.toLowerCase()));
  const ticketActivityToggle = () => {
    const visible = visibleTicketEvents();
    const collapse = visible.length > 0 && visible.every(e => expandedActivity.has(e));
    return `<button type="button" data-inv-activity-toggle ${visible.length<=1?'hidden':''} ${visible.length ? '' : 'disabled'}><svg class="tp-activity-toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${collapse ? 'm8 3 4 4 4-4M8 21l4-4 4 4' : 'm8 7 4-4 4 4M8 17l4 4 4-4'}"/></svg><span>${collapse ? 'Collapse all' : 'Expand all'}</span></button>`;
  };
  const ticketActivityDetail=(event)=>host.renderActivityDetail(host.ticketActivityEvents()[events.indexOf(event)]);
  const ticketActivityMarkup = () => {
    const visible = events.filter(e => `${e.text} ${e.detail} ${e.time}`.toLowerCase().includes(activityQuery.toLowerCase()));
    if(!visible.length) return '<p class="inv-meta">No activity matches your search.</p>';
    return `<h5>TODAY · 5 SEP 2026</h5>${visible.map(e=>{const id=events.indexOf(e), expanded=expandedActivity.has(e);return `<button type="button" data-inv-activity="${id}" aria-expanded="${expanded}" class="${expanded?'is-current':''}"><time>${e.time}</time><span class="tp-activity-marker" aria-hidden="true"></span><span class="tp-activity-event-copy"><strong>${esc(e.text.split(' · ')[0])}</strong><small>TKT-001 · ${esc(e.text.includes(' · ')?e.text.split(' · ').slice(1).join(' · '):'Riley Cruz')}</small></span><span aria-hidden="true">${expanded?'−':'+'}</span></button>${expanded?ticketActivityDetail(e,id):''}`}).join('')}`;
  };
  const ticketFileViewer=window.createTicketFileViewer();
  let chatSort='oldest';
  const internalMessages=[
    {author:'Elliot Ward',body:'Reception confirmed access to the plant room. Let me know when the investigation is ready for dispatch.',time:'09:30'},
    {author:'Riley Cruz',body:'I am reviewing the evidence and equipment details before completing Investigation.',time:'09:32'}
  ];
  let internalChatDraft='';
  const contexts = {
    Communication: () => window.ticketCommunicationMarkup(),
    'Internal comments': () => '<article class="inv-internal-comment-view" data-ticket-id="TKT-001"></article>',
    Files: () => '<div data-ticket-file-viewer></div>',
    'Case details': () => `<h3>Case details</h3><dl>${Object.entries({'Case ID':'SR-0048217','Building':'Rivergate House · Building A','Equipment ID':'AHU-04','Location':'Level 4 · East lobby','Requester':'Jamie Cole','Contact person':'Jamie Cole · Reception, extension 104','Category / subcategory':'HVAC / Airflow loss','Assigned team':'Service coordination · Riley Cruz','Responsible service team':'Northstar Mechanical','SLA':'Priority response · Due today, 16:30','Current priority':priority,'Ticket state':resolved?'Resolved · Duplicate':waiting?'Waiting for customer input':stage}).map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`,
    Activity: () => `<header class="tp-activity-toolbar"><div><h4>Activity</h4><p>Updates and decisions for TKT-001.</p></div><label><span class="tp-icon material-symbols-outlined">search</span><input type="search" placeholder="Search activity" aria-label="Search ticket activity" data-inv-activity-search value="${esc(activityQuery)}" /></label></header><div class="tp-activity-actions tp-activity-group-header"><span data-ticket-activity-count>${visibleTicketEvents().length} ${visibleTicketEvents().length===1?'event':'events'}</span>${ticketActivityToggle()}</div><div class="tp-activity-timeline inv-ticket-timeline">${ticketActivityMarkup()}</div>`

  };
  const workflowSteps = [
    {name:'Investigation', owner:'Riley Cruz · Service coordinator', startedAt:'Today, 09:32'},
    {name:'Dispatch', owner:null},
    {name:'Resolution', owner:null}
  ];
  const workflowMarkup = () => {
    const index = workflowSteps.findIndex(step => step.name === stage);
    const done = workflowSteps.filter(step => step.completedAt).length;
    const progress = resolved ? 100 : done/3*100;
    const complete=resolved || done===workflowSteps.length;
    const check='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
    return `<button class="inv-stepper" type="button" data-workflow-open aria-haspopup="dialog" aria-label="${complete?'All steps complete. View step history':`Step ${index+1} of 3: ${stage}. View ticket step details`}"><span class="inv-stepper-line">${complete?check+`<strong>${done===3?'All steps complete':'Ticket complete'}</strong><span class="inv-stepper-separator">·</span><span>${done===3?'3 of 3':done+' of 3 completed · Remaining steps skipped'}</span>`:`<span>Step ${index+1} of 3</span><span class="inv-stepper-separator">·</span><strong>${stage}</strong><span class="inv-stepper-next">→ Next: ${workflowSteps[index+1]?.name || 'Complete ticket'}</span>`}</span><svg class="inv-stepper-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button>`;
  };
  const workflowSegments=()=>`<section class="tp-workflow-segments" aria-label="Ticket steps">${workflowSteps.every(step=>step.completedAt)?'<p class="tp-workflow-complete">All steps complete · 3 of 3</p>':''}<ol class="tp-even-step-track" style="grid-template-columns:max-content minmax(36px,1fr) max-content minmax(36px,1fr) max-content">${workflowSteps.map((step,index)=>{const state=step.skipped?'skipped':step.completedAt?'completed':stage===step.name?(waiting?'waiting':'active'):'pending';const label={completed:'Completed',active:'In progress',waiting:'Waiting for information',pending:'Not started',skipped:'Skipped'}[state];return `<li class="is-${state}"><div class="tp-step-summary" ${state==='active'||state==='waiting'?'aria-current="step"':''}><span class="tp-workflow-segment-name"><span class="tp-step-state" aria-hidden="true">${state==='completed'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 4 4L19 6"/></svg>':String(index+1)}</span><strong>${step.name}</strong></span><small>${state==='completed'?`${esc((step.owner || 'Not assigned').split(' · ')[0])}<br>${esc(step.completedAt)}`:label}</small></div>${index<workflowSteps.length-1?'<span class="tp-workflow-connector" aria-hidden="true"></span>':''}</li>`;}).join('')}</ol></section>`;
  const workflowDrawer = () => `<dialog class="inv-workflow-drawer" aria-labelledby="workflow-drawer-title"><header><div><small>TKT-001 · ISSUE ASSESSMENT</small><h3 id="workflow-drawer-title">Ticket progress</h3></div><button type="button" data-workflow-close aria-label="Close ticket step details">×</button></header><p>Stage ownership and completion history</p><ol class="inv-stage-timeline">${workflowSteps.map((step,i)=>{
    const state = step.skipped ? 'skipped' : step.completedAt ? 'completed' : stage===step.name ? waiting ? 'waiting' : 'active' : 'pending';
    return `<li class="is-${state}" ${stage===step.name?'aria-current="step"':''}><span class="inv-step-number" aria-hidden="true">${state==='completed'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>':state==='skipped'?'−':String(i+1).padStart(2,'0')}</span><div><h4>${step.name}</h4><p class="inv-stage-status">${{completed:'Completed',active:'In progress',waiting:'Waiting for customer input',pending:'Not started',skipped:'Skipped · Resolved as duplicate'}[state]}</p>${state==='pending' || state==='skipped' ? `<div class="inv-stage-empty"><p>${state==='skipped'?'This step was not needed.':'This step has not started.'}</p><dl><dt>Assignee</dt><dd>Not assigned</dd><dt>Started / completed</dt><dd>—</dd></dl></div>` : `<dl><dt>${step.completedAt?'Completed by':'Assigned to'}</dt><dd>${step.owner || 'Not assigned'}</dd><dt>${step.completedAt?'Completed':'Started'}</dt><dd>${step.completedAt || step.startedAt || '—'}</dd></dl>`}</div></li>`;
  }).join('')}</ol></dialog>`;

  window.getAssessmentOverview = () => ({
    stepper: workflowMarkup(), segments:workflowSegments(), drawer: workflowDrawer(), priority,
    status: resolved ? 'Resolved' : waiting ? 'Waiting for information' : 'In progress',
    stage, next: ids.find(id => !completed.has(id)) ? definitions[ids.find(id => !completed.has(id))].title : 'Investigation tasks complete',
    blocker: waiting ? 'Waiting for customer input before investigation can continue.' : resolved ? 'Resolved as duplicate of SR-0048129.' : stage === 'Dispatch' ? 'Investigation approved. Service-team dispatch can proceed.' : 'Assessment and a confirmed decision are required before dispatch.'
  });
  const canCompleteInvestigation=()=>stage==='Investigation'&&!resolved&&ids.every(valid);
  const render = () => {
    finishResize();
    splitObserver.disconnect();
    splitter.remove();
    ticketFileViewer.remove();
    const previousScroll=screen.querySelector('.inv-decisions')?.scrollTop||0;
    const evidenceScroll=screen.querySelector('.inv-context-body')?.scrollTop||0;
    const def = definitions[selected], a = answers[selected] || {};
    const all = ids.every(id => completed.has(id)), outcome = value('action','outcome');
    const canFinish = all && !waiting && !resolved && stage === 'Investigation' && ['Dispatch service team','Close as duplicate','Escalate','Continue investigation'].includes(outcome);
    screen.innerHTML = `<header class="inv-header"><div><button data-inv-back type="button">← Back to tickets</button><h2><button type="button" class="tp-ticket-copy-id" data-copy-ticket-id="TKT-001" aria-label="Copy ticket ID TKT-001" title="Copy ticket ID">TKT-001</button> · Issue assessment</h2><p>SR-0048217 · AHU-04 · Rivergate House <span>Priority: ${priority}</span></p></div><div class="inv-ticket-progress">${workflowMarkup()}${workflowSegments()}</div></header><div class="inv-columns"><section class="inv-decisions">${waiting?'<p class="inv-notice" role="status">Blocked · Waiting for customer input. Investigation remains open.</p>':''}<form class="inv-form"><span class="inv-meta">DECISION WORKSPACE</span><h3>${def.title}</h3><p class="inv-meta">Use ${def.tab} in the evidence panel to validate your answers.</p>${selected==='incidents'?'<button type="button" data-review-related>Review related requests →</button>':''}${selected==='priority'?`<p>Current priority: <strong>${priority}</strong></p>`:''}${def.questions.map(q=>`<fieldset><legend><span class="tp-required-mark" aria-hidden="true">*</span> ${q.label}</legend><div>${q.options.map(option=>`<label><input type="radio" name="${q.id}" value="${option}" ${a[q.id]===option?'checked':''} ${resolved||stage!=='Investigation'||(option==='Close as duplicate'&&!duplicate())?'disabled':''}>${option}</label>`).join('')}</div></fieldset>`).join('')}${selected==='priority'&&a.recommended&&a.recommended!==priority?`<fieldset><legend>Confirm priority change: ${priority} → ${a.recommended}</legend><label><input type="radio" name="confirm" value="Yes" ${a.confirm==='Yes'?'checked':''}>Confirm recommended priority</label>${safetyRisk()&&a.recommended!=='Critical'?'<p>Critical priority is required while a safety escalation is active.</p>':''}</fieldset>`:''}${selected==='action'?`<label class="inv-reason"><span><span class="tp-required-mark" aria-hidden="true">*</span> Work summary</span><textarea name="reason" required maxlength="1000" ${resolved||stage!=='Investigation'?'disabled':''}>${esc(a.reason||'')}</textarea></label><p class="inv-meta">Close as duplicate requires a confirmed related request.${duplicate()?' Linked case: SR-0048129.':''}</p>`:''}<footer><span>${completed.has(selected)?'Completed · Changing an answer reopens this task.':'Required answers must be recorded before completion.'}</span><button class="tp-primary" type="submit" ${!valid(selected)||completed.has(selected)||resolved||stage!=='Investigation'?'disabled':''}>Complete task →</button></footer></form><footer class="inv-stage-footer"><p>${resolved?'Resolved as duplicate · Linked to SR-0048129':stage==='Dispatch'?'Investigation completed · Ready for service-team dispatch':waiting?'Awaiting information; Dispatch remains unavailable.':'Complete every required investigation task before continuing.'}</p><button type="button" data-inv-finish ${canFinish?'':'disabled'}>${outcome==='Close as duplicate'?'Resolve as duplicate':outcome==='Escalate'?'Record escalation':outcome==='Continue investigation'?'Continue investigation':'Complete Investigation → Dispatch'}</button></footer></section><aside class="inv-context"><nav class="inv-tabs" aria-label="Investigation context">${Object.keys(contexts).map(name=>`<button type="button" data-inv-tab="${name}" ${tab===name?'aria-current="page"':''}>${name}</button>`).join('')}</nav><article class="inv-context-body">${contexts[tab]()}</article></aside></div>${workflowDrawer()}`;
    const displayControl=document.createElement('div');displayControl.className='tp-display-control';
    const fullscreen=document.createElement('button');fullscreen.type='button';fullscreen.dataset.ticketFullscreen='';
    const syncFullscreen=()=>{const source=host.querySelector('[data-enter-fullscreen]');fullscreen.innerHTML=source.innerHTML;fullscreen.setAttribute('aria-pressed',String(host.classList.contains('is-focus-mode')));};
    fullscreen.addEventListener('click',()=>{host.querySelector('[data-enter-fullscreen]').click();syncFullscreen();});syncFullscreen();
    displayControl.append(fullscreen);
    const ticketBar=document.createElement('header');ticketBar.className='tp-topbar tp-casebar inv-ticket-topbar';
    const back=screen.querySelector('[data-inv-back]');back.classList.add('tp-back');ticketBar.append(back);
    const searchSlot=document.createElement('div');searchSlot.className='tp-search-slot';searchSlot.append(displayControl);ticketBar.append(searchSlot);
    const user=host.querySelector('[data-screen="case"] .tp-casebar .tp-user');if(user)ticketBar.append(user.cloneNode(true));
    screen.prepend(ticketBar);
    const investigationForm=screen.querySelector('.inv-form');
    investigationForm.innerHTML=stage==='Investigation'?`<span class="inv-meta">INVESTIGATION</span><h3>Complete your Investigation</h3><p class="inv-meta">Review the evidence on the left and complete the required sections below.</p>${ids.map(id=>{
      const section=definitions[id],a=answers[id]||{};
      return `<section class="inv-validation-section" data-validation-section="${id}"><h4>${section.title}</h4>${id==='missing'?'<p class="inv-meta">Additional information is required because an earlier answer identified a gap.</p>':id==='escalation'?'<p class="inv-meta">Confirm the safety escalation before proceeding.</p>':''}${section.questions.map(q=>questionMarkup(id,q,a)).join('')}${supportingFields(id,a)}${id==='evidence'?evidenceUploadMarkup():''}${id==='action'?`<label class="inv-reason"><span><span class="tp-required-mark" aria-hidden="true">*</span> Work summary</span><textarea name="reason" required maxlength="1000">${esc(a.reason||'')}</textarea></label>`:''}</section>`;
    }).join('')}<footer><button class="tp-primary" type="submit" ${canCompleteInvestigation()?'':'disabled'}>Complete Step</button></footer>`:`<div class="inv-handoff" role="status"><h3>${resolved?'Ticket resolved':stage==='Dispatch'?'Investigation completed':'Investigation'}</h3><p>${resolved?'Closed as duplicate of SR-0048129.':`The next step is Dispatch, assigned to ${esc(workflowSteps[1].owner||'Not assigned')}.`}</p><p class="inv-meta">${resolved?'No further work is required on this ticket.':'Investigation answers are saved. Return to Tickets to review the handoff.'}</p></div><footer><span>${resolved?'Ticket resolved':'Dispatch ready'}</span><button type="submit" disabled>Investigation completed</button></footer>`;
    const fileSlot=screen.querySelector('[data-ticket-file-viewer]');
    if(fileSlot){
      fileSlot.replaceWith(ticketFileViewer);
      screen.querySelector('.inv-context').classList.add('is-viewing-files');
    }
    requestAnimationFrame(()=>{
      const timeline=screen.querySelector('.inv-ticket-timeline'),row=timeline?.querySelector('[data-inv-activity]'),marker=row?.querySelector('.tp-activity-marker');
      if(marker){const bounds=marker.getBoundingClientRect();timeline.style.setProperty('--ticket-activity-rail',(bounds.left+bounds.width/2-row.getBoundingClientRect().left)+'px');}
    });
    if(host.requestTickets&&!host.requestTickets.canManage('TKT-001')){
      const notice=document.createElement('div');notice.className='tp-ticket-mode-alert';notice.setAttribute('role','status');
      const title=document.createElement('strong'),copy=document.createElement('span');title.textContent='View mode only';copy.textContent='This ticket is assigned to '+host.requestTickets.owner('TKT-001')+'. You can review its information and add comments in the request. Working answers can only be edited by the ticket owner.';notice.append(title,copy);screen.querySelector('.inv-header').after(notice);
    }
    const internalComments=screen.querySelector('.inv-internal-comment-view');if(internalComments)host.mountInternalComments?.(internalComments);
    host.updateCharacterCounters(screen);
    columns = screen.querySelector('.inv-columns');
    columns.prepend(columns.querySelector('.inv-context'));
    columns.querySelector('.inv-context').id='investigation-evidence-panel';
    columns.querySelector('.inv-decisions').id='investigation-tasks-panel';
    columns.append(splitter);
    if(splitRatio!==null)columns.style.setProperty('--inv-column-layout',`${splitRatio*100}% minmax(0,1fr)`);
    splitObserver.observe(columns);
    const form = screen.querySelector('.inv-form');
    form.id = 'inv-decision-form';
    const taskFooter = form.querySelector('footer');
    const complete = taskFooter.querySelector('[type="submit"]');
    complete.setAttribute('form', form.id);
    complete.setAttribute('data-inv-complete', '');
    const stageFooter = screen.querySelector('.inv-stage-footer');
    const actions = document.createElement('footer');
    actions.className = 'tp-case-actions inv-ticket-actions';
    actions.setAttribute('aria-label', 'Ticket actions');
    const message = taskFooter.querySelector('span');
    const controls = document.createElement('div');
    controls.className = 'tp-case-action-group';
    complete.textContent='Complete Step';
    const discard=document.createElement('button');
    discard.type='button';discard.className='tp-secondary';discard.textContent='Discard Changes';
    discard.dataset.invDiscard='';discard.disabled=!isDirty();
    const save=document.createElement('button');save.type='button';save.className='tp-secondary';save.textContent='Save changes';save.dataset.invSave='';save.disabled=!isDirty();
    controls.append(discard,save,complete);
    actions.append(message, controls);
    screen.insertBefore(actions, screen.querySelector('.inv-workflow-drawer'));
    taskFooter.remove();
    stageFooter.remove();
    screen.classList.add('inv-investigation-screen');
    syncSplit();
    screen.querySelector('.inv-decisions').scrollTop=previousScroll;
    screen.querySelector('.inv-context-body').scrollTop=evidenceScroll;
    const drawer = screen.querySelector('.inv-workflow-drawer');
    drawer.addEventListener('close', () => screen.querySelector('[data-workflow-open]')?.focus({preventScroll:true}));
    drawer.addEventListener('keydown', event => { if(event.key === 'Escape') event.stopPropagation(); });
    drawer.addEventListener('click', event => {
      const bounds = drawer.getBoundingClientRect();
      if(event.target === drawer && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) drawer.close();
    });
    if(host.requestTickets && !host.requestTickets.canManage('TKT-001'))screen.querySelectorAll('.inv-form input,.inv-form textarea,.inv-form select,[data-upload-evidence],[data-inv-complete],[data-inv-finish]').forEach(control=>control.disabled=true);
    host.dispatchEvent(new Event('ticket-overview-changed'));
  };
  host.addEventListener('ticket-owner-changed',event=>{if(event.detail.id==='TKT-001'&&!screen.hidden)render();});
  const syncRequiredSections=()=>{ids=['verify','evidence','incidents','safety','priority','action'];};
  screen.addEventListener('change',event=>{
    if(event.target.matches('[data-chat-sort]')){chatSort=event.target.value;render();return;}
    if(!host.requestTickets?.canManage('TKT-001'))return;
    const input=event.target;if(!input.closest('.inv-form'))return;
    if(input.name==='dispatchOwner'){answers.action||={};answers.action.dispatchOwner=input.value;}
    else if(input.dataset.answerSection){const id=input.dataset.answerSection,key=input.dataset.answerKey;answers[id]||={};if(input.type==='checkbox'){let values=Array.isArray(answers[id][key])?[...answers[id][key]]:[];values=input.checked?[...values.filter(value=>value!==input.value),input.value]:values.filter(value=>value!==input.value);answers[id][key]=input.checked&&input.value==='None available'?['None available']:values.filter(value=>value!=='None available');}else answers[id][key]=input.value;if(id==='priority'&&key==='recommended')delete answers.priority.confirm;}
    else return;
    syncRequiredSections();render();
  });
  screen.addEventListener('input',event=>{
    if(event.target.hasAttribute('data-inv-activity-search')){activityQuery=event.target.value;screen.querySelector('.inv-ticket-timeline').innerHTML=ticketActivityMarkup();screen.querySelector('[data-ticket-activity-count]').textContent=''+visibleTicketEvents().length+' '+(visibleTicketEvents().length===1?'event':'events');screen.querySelector('[data-inv-activity-toggle]').outerHTML=ticketActivityToggle();return;}
    if(event.target.name==='internalMessage'){internalChatDraft=event.target.value;return;}
    if(event.target.dataset.detailSection&&host.requestTickets?.canManage('TKT-001')){
      const input=event.target;answers[input.dataset.detailSection]||={};answers[input.dataset.detailSection][input.name]=input.value;
      screen.querySelector('[data-inv-save]').disabled=!isDirty();screen.querySelector('[data-inv-discard]').disabled=!isDirty();return;
    }
    if(event.target.name!=='reason'||!host.requestTickets?.canManage('TKT-001'))return;
    answers.action||={};answers.action.reason=event.target.value;
    screen.querySelector('[data-inv-complete]').disabled=!canCompleteInvestigation();
    screen.querySelector('[data-inv-save]').disabled=!isDirty();screen.querySelector('[data-inv-discard]').disabled=!isDirty();
  });
  const finishStep = () => {
    workflowSteps[0].completedAt=`Today, ${new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`;
    workflowSteps[1].startedAt=workflowSteps[0].completedAt;workflowSteps[1].owner=value('action','dispatchOwner');stage='Dispatch';
    log('Investigation completed · Investigation → Dispatch','Investigation answers saved; responsibility transferred to '+workflowSteps[1].owner+'.');
  };
  const uploadDialog=document.createElement('dialog');uploadDialog.className='inv-evidence-upload-dialog';uploadDialog.setAttribute('aria-labelledby','evidence-upload-title');host.append(uploadDialog);
  uploadDialog.innerHTML='<header><h3 id="evidence-upload-title">Upload evidence</h3><button type="button" data-upload-close aria-label="Close upload">×</button></header><p>Add photos or videos to this investigation.</p><div class="inv-evidence-drop"><p>Drop photos and videos here</p><div class="inv-upload-methods"><button type="button" data-upload-browse>Choose files</button><button type="button" data-upload-paste>Paste from clipboard</button></div><small>Or paste with Ctrl / ⌘ + V</small><input type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm" multiple hidden><small>Photos: JPG, PNG, WEBP, GIF. Videos: MP4, MOV, WEBM. Up to 50 MB per file</small></div><p role="alert" data-upload-error></p><ul class="inv-upload-queue" aria-label="Selected files"></ul><footer><button type="button" data-upload-cancel>Cancel</button><button type="button" data-upload-confirm disabled>Add evidence</button></footer>';
  let pendingUploads=[];let uploadSequence=0;
  const evidencePreview=document.createElement('dialog');evidencePreview.className='inv-upload-preview';evidencePreview.setAttribute('aria-labelledby','inv-upload-preview-title');host.append(evidencePreview);
  evidencePreview.innerHTML='<header><h3 id="inv-upload-preview-title"></h3><button type="button" aria-label="Close preview">×</button></header><div class="inv-upload-preview-content"></div>';
  let previewFile=null,previewOpener=null;
  const closePreview=()=>evidencePreview.close();
  evidencePreview.querySelector('button').onclick=closePreview;
  evidencePreview.addEventListener('click',event=>{if(event.target===evidencePreview){const bounds=evidencePreview.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)closePreview();}});
  evidencePreview.addEventListener('close',()=>{
    evidencePreview.querySelector('.inv-upload-preview-content').replaceChildren();
    const index=pendingUploads.indexOf(previewFile);previewFile=null;
    if(previewOpener?.isConnected)previewOpener.focus({preventScroll:true});
    else uploadDialog.querySelector('[data-preview-upload="'+index+'"]')?.focus({preventScroll:true});
    previewOpener=null;
  });
  const openEvidencePreview=(file,opener=document.activeElement)=>{
    previewOpener=opener;
    if(!file?.url)return;previewFile=file;
    evidencePreview.querySelector('h3').textContent=file.name;
    const media=document.createElement(file.type.startsWith('video/')?'video':'img');media.src=file.url;
    if(media.tagName==='VIDEO'){media.controls=true;media.preload='metadata';}else media.alt=file.name;
    evidencePreview.querySelector('.inv-upload-preview-content').replaceChildren(media);evidencePreview.showModal();
  };

  screen.addEventListener('click',event=>{const button=event.target.closest('[data-preview-evidence]');if(button){event.preventDefault();openEvidencePreview(evidenceFiles.get(button.dataset.previewEvidence),button);}});

  const disposeUpload=file=>{clearInterval(file.timer);clearTimeout(file.successTimer);if(file.url)URL.revokeObjectURL(file.url);};
  const clearPending=()=>{if(evidencePreview.open)evidencePreview.close();pendingUploads.forEach(disposeUpload);pendingUploads=[];};
  const paintUploadQueue=()=>{
    const list=uploadDialog.querySelector('.inv-upload-queue');list.innerHTML=pendingUploads.map((file,index)=>`<li class="${file.status==='error'?'has-error':''}">${file.url?`<button type="button" class="inv-upload-thumbnail" data-preview-upload="${index}" aria-label="Preview ${esc(file.name)}">${file.type.startsWith('video/')?`<video src="${file.url}" muted preload="metadata" aria-label="Video thumbnail"></video>`:`<img src="${file.url}" alt="">`}${file.successUntil>Date.now()?`<span class="inv-upload-success" aria-hidden="true" style="animation-delay:-${(2000-(file.successUntil-Date.now()))/1000}s"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 8 3 3 7-7"/></svg></span>`:''}</button>`:'<span class="inv-upload-file-icon" aria-hidden="true">!</span>'}<div><strong>${esc(file.name)}</strong><small>${(file.size/1024/1024).toFixed(1)} MB · ${file.status==='uploading'?'Uploading · '+file.progress+'%':file.status==='ready'?'Ready to add':esc(file.error)}</small>${file.status==='uploading'?`<progress max="100" value="${file.progress}" aria-label="Uploading ${esc(file.name)}">${file.progress}%</progress>`:''}${file.status==='error'&&file.retryable?`<button type="button" data-retry-upload="${index}">Retry</button>`:''}</div><button type="button" data-remove-upload="${index}" aria-label="Delete ${esc(file.name)}" title="Delete file"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6v15h12V6M10 10v7M14 10v7"/></svg></button></li>`).join('');
    const ready=pendingUploads.filter(file=>file.status==='ready').length;
    uploadDialog.querySelector('[data-upload-confirm]').disabled=!ready||pendingUploads.some(file=>file.status!=='ready');
    uploadDialog.querySelector('[data-upload-confirm]').textContent=ready?'Add '+ready+' '+(ready===1?'file':'files'):'Add evidence';
  };
  // Local prototype: simulate transfer progress without a network upload.
  const startUpload=file=>{
    clearInterval(file.timer);file.status='uploading';file.progress=0;file.error='';file.successUntil=0;clearTimeout(file.successTimer);paintUploadQueue();
    file.timer=setInterval(()=>{
      if(!uploadDialog.open){clearInterval(file.timer);return;}
      if(navigator.onLine===false){clearInterval(file.timer);file.status='error';file.error='Connection lost. Check your connection and retry.';file.retryable=true;paintUploadQueue();return;}
      file.progress=Math.min(100,file.progress+10);
      if(file.progress===100){clearInterval(file.timer);file.status='ready';file.successUntil=Date.now()+2000;file.successTimer=setTimeout(()=>{file.successUntil=0;if(uploadDialog.open&&pendingUploads.includes(file))paintUploadQueue();},2000);}
      paintUploadQueue();
    },300);
  };
  const addUploadFiles=files=>{
    [...files].forEach(file=>{
      if(pendingUploads.some(item=>item.name===file.name&&item.size===file.size))return;
      let error='';
      if(!/\.(jpe?g|png|webp|gif|mp4|mov|webm)$/i.test(file.name)||!/^(image|video)\//.test(file.type))error='Unsupported format. Choose JPG, PNG, WEBP, GIF, MP4, MOV or WEBM.';
      else if(file.size>50*1024*1024)error='File exceeds 50 MB. Choose a smaller file.';
      else if(!file.size)error='This file is empty. Choose another file.';
      const entry={file,name:file.name,size:file.size,type:file.type,url:error?'':URL.createObjectURL(file),status:error?'error':'uploading',progress:0,error,retryable:false};
      pendingUploads.push(entry);if(!error)startUpload(entry);
    });
    uploadDialog.querySelector('[data-upload-error]').textContent='';paintUploadQueue();
  };
  screen.addEventListener('click',event=>{if(!event.target.closest('[data-upload-evidence]')||!host.requestTickets?.canManage('TKT-001'))return;clearPending();paintUploadQueue();uploadDialog.querySelector('[data-upload-error]').textContent='';uploadDialog.showModal();});
  const fileInput=uploadDialog.querySelector('input[type="file"]');
  uploadDialog.querySelector('[data-upload-browse]').onclick=()=>fileInput.click();
  fileInput.onchange=()=>{addUploadFiles(fileInput.files);fileInput.value='';};
  uploadDialog.addEventListener('paste',event=>{
    const files=[...(event.clipboardData?.files||[])];
    if(files.length){event.preventDefault();addUploadFiles(files);}
  });
  uploadDialog.querySelector('[data-upload-paste]').onclick=async()=>{
    const error=uploadDialog.querySelector('[data-upload-error]');
    try {
      if(!navigator.clipboard?.read)throw new Error('Clipboard unavailable');
      const items=await navigator.clipboard.read(),files=[];
      const extensions={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm'};
      for(const item of items){const type=item.types.find(type=>extensions[type]);if(type){const blob=await item.getType(type);files.push(new File([blob],'Clipboard-'+Date.now()+'-'+files.length+'.'+extensions[type],{type}));}}
      if(files.length)addUploadFiles(files);
      else error.textContent='No supported photos or videos found. Copy a file, then paste here with Ctrl / ⌘ + V.';
    } catch(error) {
      uploadDialog.querySelector('[data-upload-error]').textContent='Use Ctrl / ⌘ + V to paste a copied photo or video, or choose files.';
    }
  };

  const drop=uploadDialog.querySelector('.inv-evidence-drop');
  let dragDepth=0;
  const dropTitle=drop.querySelector('p');
  const resetDrop=()=>{dragDepth=0;drop.classList.remove('is-dragover');dropTitle.textContent='Drop photos and videos here';};
  const isFileDrag=event=>Array.from(event.dataTransfer?.types||[]).includes('Files');
  drop.addEventListener('dragenter',event=>{if(!isFileDrag(event))return;event.preventDefault();dragDepth++;drop.classList.add('is-dragover');dropTitle.textContent='Release to add files';});
  drop.addEventListener('dragover',event=>{if(!isFileDrag(event))return;event.preventDefault();event.dataTransfer.dropEffect='copy';});
  drop.addEventListener('dragleave',()=>{dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)resetDrop();});
  drop.addEventListener('drop',event=>{event.preventDefault();resetDrop();addUploadFiles(event.dataTransfer.files);});
  uploadDialog.addEventListener('close',resetDrop);
  uploadDialog.addEventListener('dragover',event=>{if(isFileDrag(event))event.preventDefault();});
  uploadDialog.addEventListener('drop',event=>{event.preventDefault();resetDrop();});
  uploadDialog.addEventListener('click',event=>{
    const preview=event.target.closest('[data-preview-upload]');if(preview){openEvidencePreview(pendingUploads[Number(preview.dataset.previewUpload)]);return;}
    const retry=event.target.closest('[data-retry-upload]');if(retry){startUpload(pendingUploads[Number(retry.dataset.retryUpload)]);return;}
    const remove=event.target.closest('[data-remove-upload]');if(remove){const index=Number(remove.dataset.removeUpload);disposeUpload(pendingUploads[index]);pendingUploads.splice(index,1);paintUploadQueue();}
  });
  uploadDialog.querySelector('[data-upload-close]').onclick=uploadDialog.querySelector('[data-upload-cancel]').onclick=()=>uploadDialog.close();
  uploadDialog.addEventListener('close',()=>{clearPending();screen.querySelector('[data-upload-evidence]')?.focus({preventScroll:true});});
  uploadDialog.querySelector('[data-upload-confirm]').onclick=()=>{
    if(!pendingUploads.length||pendingUploads.some(file=>file.status!=='ready')||!host.requestTickets?.canManage('TKT-001'))return;
    answers.evidence||={};answers.evidence.uploads||=[];const types=new Set(Array.isArray(answers.evidence.type)?answers.evidence.type:[]);types.delete('None available');
    const transfer=new DataTransfer();pendingUploads.forEach(file=>{const id='evidence-'+(++uploadSequence);evidenceFiles.set(id,file);answers.evidence.uploads.push(id);types.add(file.type.startsWith('video/')?'Video':'Photo');transfer.items.add(file.file);});
    answers.evidence.type=[...types];answers.evidence.available='Yes';
    const requestInput=host.querySelector('[data-file-input]');if(requestInput){requestInput.files=transfer.files;requestInput.dispatchEvent(new Event('change',{bubbles:true}));}
    const count=pendingUploads.length;pendingUploads=[];log('Evidence added · Riley Cruz',count+' photo or video '+(count===1?'file was':'files were')+' attached to TKT-001.');uploadDialog.close();render();
  };
  const completionDialog=document.createElement('dialog');completionDialog.className='inv-leave-dialog inv-completion-dialog';host.append(completionDialog);
  const exitCompleted=dashboard=>{completionDialog.close();screen.hidden=true;host.querySelector('[data-screen="case"]').hidden=dashboard;if(dashboard){const list=host.querySelector('[data-screen="tasks"]');list.hidden=false;list.classList.add('is-active');}else host.querySelector('[data-tab="jobs"]').click();};
  const openCompletion=()=>{
    const dispatch=true;
    completionDialog.innerHTML='<button type="button" class="inv-modal-close" data-completion-close aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button><h3>Complete your Investigation step?</h3><p>'+ (dispatch?'Dispatch is the next stage. Responsibility will pass to the colleague selected below, and this ticket will no longer be assigned to you.':value('action','outcome')==='Close as duplicate'?'This will close the ticket as a duplicate. Dispatch will be skipped.':'This will record your decision. Investigation remains open for further work.')+'</p>'+(dispatch?'<label class="inv-dispatch-owner"><span>Next owner</span><select data-native-select data-completion-owner><option value="Felix Novak">Felix Novak</option><option value="Elliot Ward">Elliot Ward</option><option value="Mina Shah">Mina Shah</option></select></label>':'')+'<fieldset class="inv-completion-destination"><legend>After completing your step</legend><label><input type="radio" name="completionDestination" value="request" checked>Return to request</label><label><input type="radio" name="completionDestination" value="dashboard">Go to dashboard</label></fieldset><footer><button type="button" data-completion-cancel>Keep editing</button><button type="button" class="tp-primary" data-completion-confirm>Complete your step</button></footer>';
    completionDialog.querySelector('[data-completion-close]').onclick=()=>completionDialog.close();

    completionDialog.querySelector('[data-completion-cancel]').onclick=()=>completionDialog.close();
    completionDialog.querySelector('[data-completion-confirm]').onclick=()=>{
      if(!host.requestTickets?.canManage('TKT-001')||!canCompleteInvestigation())return;
      if(dispatch){answers.action.dispatchOwner=completionDialog.querySelector('[data-completion-owner]').value;}
      priority=value('priority','recommended');ids.forEach(id=>completed.add(id));waiting=false;finishStep();savedDraft=captureDraft();
      if(dispatch)host.requestTickets.transferOwner('TKT-001',answers.action.dispatchOwner);
      render();
      const dashboard=completionDialog.querySelector('[name=completionDestination]:checked').value==='dashboard';
      exitCompleted(dashboard);
    };
    completionDialog.showModal();
  };
  screen.addEventListener('submit',event=>{event.preventDefault();if(event.target.matches('[data-internal-chat]')){if(!host.requestTickets?.canManage('TKT-001')||!internalChatDraft.trim())return;internalMessages.push({author:'Riley Cruz',body:internalChatDraft.trim(),time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})});internalChatDraft='';render();screen.querySelector('[name=internalMessage]')?.focus({preventScroll:true});return;}if(host.requestTickets?.canManage('TKT-001')&&canCompleteInvestigation())openCompletion();});
  screen.addEventListener('click', event => {
    const button=event.target.closest('button');if(!button) return;
    if(button.hasAttribute('data-inv-activity')) { const item=events[Number(button.dataset.invActivity)];expandedActivity.has(item)?expandedActivity.delete(item):expandedActivity.add(item);render();return; }
    if(button.hasAttribute('data-inv-activity-toggle')) {
      const visible = visibleTicketEvents();
      const collapse = visible.length > 0 && visible.every(e => expandedActivity.has(e));
      visible.forEach(e => collapse ? expandedActivity.delete(e) : expandedActivity.add(e));
      render();return;
    }
    if(button.hasAttribute('data-workflow-open')) { screen.querySelector('.inv-workflow-drawer').showModal(); return; }
    if(button.hasAttribute('data-workflow-close')) { screen.querySelector('.inv-workflow-drawer').close(); screen.querySelector('[data-workflow-open]').focus({preventScroll:true}); return; }
    if(button.hasAttribute('data-review-related')){screen.hidden=true;host.querySelector('[data-screen="case"]').hidden=false;host.querySelector('[data-tab="related"]').click();return;}
    if(button.hasAttribute('data-inv-back')){screen.hidden=true;host.querySelector('[data-screen="case"]').hidden=false;host.querySelector('[data-tab="jobs"]').click();return;}
    if(button.dataset.invTask){selected=button.dataset.invTask;tab=definitions[selected].tab;render();return;}
    if(button.dataset.invTab){tab=button.dataset.invTab;render();return;}
    if(button.hasAttribute('data-inv-discard') && host.requestTickets?.canManage('TKT-001')){discardDraft();return;}
  });
  const leaveDialog=document.createElement('dialog');leaveDialog.className='inv-leave-dialog';
  leaveDialog.innerHTML='<h3>Save changes before leaving?</h3><p>Your ticket answers have unsaved changes.</p><footer><button type="button" data-stay>Keep editing</button><button type="button" data-discard-leave>Discard and leave</button><button type="button" data-save-leave>Save and leave</button></footer>';
  host.append(leaveDialog);let pendingLeave;
  leaveDialog.querySelector('[data-stay]').onclick=()=>leaveDialog.close();
  leaveDialog.querySelector('[data-discard-leave]').onclick=()=>{discardDraft();leaveDialog.close();pendingLeave?.();};
  leaveDialog.querySelector('[data-save-leave]').onclick=()=>{savedDraft=captureDraft();leaveDialog.close();pendingLeave?.();};
  screen.addEventListener('click',event=>{
    const save=event.target.closest('[data-inv-save]');if(save){savedDraft=captureDraft();render();return;}
    const exit=event.target.closest('[data-inv-back],[data-review-related]');
    if(exit&&isDirty()){event.preventDefault();event.stopImmediatePropagation();pendingLeave=()=>{screen.hidden=true;host.querySelector('[data-screen="case"]').hidden=false;host.querySelector(exit.hasAttribute('data-review-related')?'[data-tab="related"]':'[data-tab="jobs"]').click();};leaveDialog.showModal();}
  },true);
  window.addEventListener('beforeunload',event=>{if(!screen.hidden&&isDirty()){event.preventDefault();event.returnValue='';}});
  host.addEventListener('click', event => {if(!event.target.closest('[data-start-investigation]'))return;host.querySelector('[data-screen="case"]').hidden=true;screen.hidden=false;render();host.scrollTop=0;screen.scrollTop=0;});
  host.addEventListener('click',async event=>{
    const button=event.target.closest('[data-copy-ticket-id]');if(!button)return;
    const id=button.dataset.copyTicketId;
    try {
      await navigator.clipboard.writeText(id);
      button.textContent='ID COPIED ✓';button.setAttribute('aria-label','Ticket ID copied');
      setTimeout(()=>{button.textContent=id;button.setAttribute('aria-label','Copy ticket ID '+id);},1400);
    } catch(error) {button.title='Could not copy. Select and copy the ticket ID manually.';}
  });
})();
