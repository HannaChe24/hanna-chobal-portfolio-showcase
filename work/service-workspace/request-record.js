(() => {
  const host = document.querySelector('[data-task-prototype]');
  const panel = host?.querySelector('[data-panel="information"]');
  if (!panel) return;
  const systemFields = new Set(['Request ID','Received','Related files','Time remaining','Work type','Current ticket','Customer update','Evidence check','Last updated','Site plan']);
  const choices = {
    'Request type':['Service incident','Service request','Scheduled maintenance'],
    Source:['Tenant portal','Email','Phone','Internal'],
    'Contact channel':['Email','Phone','Tenant portal'],
    Site:['Rivergate House','Harbour Exchange','Cedar Court','Northbank Centre','Atlas Works','Westbridge Plaza','Kingfisher Court'],
    'Service category':['Ventilation','Elevators','Plumbing','Electrical','Access control','Heating'],
    'Asset type':['Air handling unit','Passenger elevator','Pump','Control panel'],
    'Service provider':['Northstar Mechanical','Building maintenance team','Not assigned'],
    Contract:['Standard response','Priority response','Planned maintenance'],
    'Site access':['Confirmed','Pending confirmation','Restricted'],
    Status:['New','In progress','Waiting for information'],
    Coordinator:['Riley Cruz','Elliot Ward','Mina Shah','Theo Grant','Not assigned'],
    Queue:['Building services','Priority response','Planned maintenance'],
    Urgency:['Normal','Urgent','Critical'],
    'Response policy':['Standard response','Priority response'],
    'Assigned specialist':['Felix Novak','Not assigned']
  };
  const form = document.createElement('form');
  form.className = 'tp-record-form';
  form.id = 'request-record-form';
  const fields = new Map();
  panel.querySelectorAll(':scope > section').forEach(section => form.append(section));
  panel.append(form);
  form.querySelectorAll('dl > div').forEach((row,index) => {
    const name = row.querySelector('dt').textContent.replace('*','').trim();
    const cell = row.querySelector('dd');
    if(systemFields.has(name)) { row.dataset.systemField=name; return; }
    const original = cell.textContent.trim();
    let control = cell.querySelector('input');
    if(!control) {
      control = document.createElement(choices[name] ? 'select' : ['Issue summary','Additional context'].includes(name) ? 'textarea' : 'input');
      if(choices[name]) [...new Set([original,...choices[name]])].forEach(value=>control.add(new Option(value,value)));
      else if(name==='Last inspection') { control.type='date'; }
      else if(name==='Affected users') { control.type='number';control.min='0';control.step='1'; }
      control.value = name==='Last inspection'?'2026-08-18':name==='Affected users'?'26':original;
      cell.replaceChildren(control);
    }
    control.id ||= `record-field-${index}`;
    control.name=name;
    if(control.tagName==='TEXTAREA') control.maxLength=name==='Issue summary'?1000:2000;
    const label=document.createElement('label');label.htmlFor=control.id;label.textContent=name;
    row.querySelector('dt').replaceChildren(label);
    control.required=true;
    if(control.required) {
      const marker=document.createElement('span');
      marker.className='tp-required-mark';
      marker.textContent='*';
      marker.setAttribute('aria-hidden','true');
      label.prepend(marker,' ');
      row.classList.add('tp-required-field');
    }
    fields.set(name,control);
  });
  form.noValidate=true;
  const storageKey='portfolio-service-request-v1';
  const readValues=()=>Object.fromEntries([...fields].map(([name,input])=>[name,input.value]));
  let saved=readValues(), savedAt=null, saving=false, saveError='';
  let restored=null;
  try {
    const data=JSON.parse(sessionStorage.getItem(storageKey));
    if(data?.version===1 && data.record && typeof data.record==='object' && Number.isFinite(Date.parse(data.savedAt))) {
      fields.forEach((input,name)=>{
        if(typeof data.record[name]!=='string')return;
        if(name==='Status' && data.record[name]==='Completed')input.add(new Option('Completed','Completed'));
        input.value=data.record[name];
      });
      saved=readValues();savedAt=new Date(data.savedAt);restored=data;
    }
  } catch { /* An unavailable store must not prevent viewing the prototype. */ }
  const recordDirty=()=>[...fields].some(([name,input])=>input.value!==saved[name]);
  const isDirty=()=>recordDirty() || host.requestFiles.hasChanges() || Boolean(host.messageDraft?.hasChanges());
  const invalidFields=()=>[...fields.values()].filter(input=>!input.validity.valid || (input.required && !input.value.trim()));
  const footer=host.querySelector('[data-screen="case"] > .tp-case-actions');
  const group=footer.querySelector('.tp-case-action-group');
  footer.querySelector(':scope > span')?.remove();
  const secondary=document.createElement('div');secondary.className='tp-request-secondary-actions';
  const reassign=[...group.querySelectorAll(':scope > button')].find(button=>button.textContent.trim()==='Reassign coordinator');
  if(reassign)secondary.append(reassign);
  const completion=group.querySelector('.tp-request-completion');
  completion.removeAttribute('title');completion.removeAttribute('tabindex');completion.removeAttribute('aria-label');
  const complete=completion.querySelector('button');
  complete.disabled=true;complete.classList.remove('tp-primary');complete.setAttribute('aria-haspopup','dialog');
  completion.querySelector('small')?.remove();
  const completionNote=document.createElement('span');completionNote.id='request-completion-note';
  completionNote.className='tp-request-completion-note';complete.removeAttribute('aria-describedby');
  const review=document.createElement('button');review.type='button';review.className='tp-request-review';
  const completionHelp=document.createElement('div');completionHelp.className='tp-request-completion-help';completionHelp.append(completionNote,review);
  const save=document.createElement('button');save.type='button';save.textContent='Save changes';save.dataset.requestSave='';
  const discard=document.createElement('button');discard.type='button';discard.textContent='Cancel';discard.dataset.requestCancel='';
  group.replaceChildren(discard,save,completion);
  const status=document.createElement('span');status.className='tp-request-save-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  // Save feedback remains in Request record; completion blockers appear on action.
  secondary.append(status);
  const meta=panel.querySelector('.tp-structured-data-meta');
  const badge=meta.querySelector('span:first-child');
  const recordStatus=meta.querySelector('span:last-child');recordStatus.className='tp-record-save-state';recordStatus.setAttribute('role','status');recordStatus.setAttribute('aria-live','polite');
  const initialStatus=recordStatus.textContent;
  const timeLabel=date=>date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  const savedLabel=()=>!savedAt?initialStatus:savedAt.toDateString()===new Date().toDateString()?`Saved today, ${timeLabel(savedAt)}`:`Saved ${savedAt.toLocaleDateString('en-GB')}, ${timeLabel(savedAt)}`;
  const ticketCount=()=>Number(!['Resolved','Completed'].includes(window.getAssessmentOverview?.().status))+Number(!window.getAccessOverview?.().complete)+(host.requestTickets?.pendingCount() || 0);
  const blocker=()=>{
    const missing=invalidFields().length;
    if(missing)return {message:`${missing} required ${missing===1?'field needs':'fields need'} attention.`,action:'Review required fields',review:reviewRecord};
    const files=host.requestFiles.pending().length;
    if(files)return {message:`${files} ${files===1?'file needs':'files need'} validation.`,action:'Review files',review:()=>{host.requestFiles.review();update();}};
    const tickets=ticketCount();
    if(tickets)return {message:`${tickets} ${tickets===1?'ticket is':'tickets are'} still open.`,action:'Review tickets',review:()=>host.querySelector('[data-tab="jobs"]').click()};
    return null;
  };
  function reviewRecord() {
    host.querySelector('[data-tab="information"]').click();
    const input=invalidFields()[0];
    if(input){input.focus();input.scrollIntoView({block:'nearest'});input.reportValidity();}
  }
  function update() {
    host.updateCharacterCounters(form);
    const dirty=isDirty(), invalid=invalidFields();
    fields.forEach(input=>{
      const error=invalid.includes(input);
      input.setAttribute('aria-invalid',String(error));
      input.closest('dl > div').classList.toggle('is-missing',error);
      let helper=input.parentElement.querySelector('.tp-record-field-error');
      if(!helper){
        helper=document.createElement('small');helper.className='tp-record-field-error';
        helper.id=input.id+'-error';input.parentElement.append(helper);
        const descriptions=new Set((input.getAttribute('aria-describedby')||'').split(' ').filter(Boolean));
        descriptions.add(helper.id);input.setAttribute('aria-describedby',[...descriptions].join(' '));
      }
      helper.hidden=!error;
      helper.textContent=input.validity.valueMissing?'Required value missing.':input.validity.typeMismatch?'Enter a valid '+input.name.toLowerCase()+'.':'Check this value.';

    });
    badge.hidden=!invalid.length;badge.classList.toggle('is-missing',Boolean(invalid.length));
    badge.textContent=invalid.length?`${invalid.length} ${invalid.length===1?'field needs':'fields need'} attention`:'';
    const label=saving?'Saving changes…':saveError || (dirty?'Unsaved changes':savedLabel());
    recordStatus.textContent=label;status.textContent=label;
    recordStatus.dataset.state=status.dataset.state=saveError?'error':dirty?'unsaved':'saved';
    status.hidden=!panel.hidden;
    save.disabled=discard.disabled=saving || !dirty;
    save.textContent=saving?'Saving…':host.querySelector('.tp-documents-workspace.is-review-open')?'Save draft':'Save changes';
    const issue=blocker();
    completionNote.textContent=issue?.message || (dirty?'Save your changes before completing this request.':'Ready to complete.');
    review.hidden=!issue;review.textContent=issue?.action || '';review.onclick=issue?.review || null;
    complete.disabled=saving || dirty || Boolean(issue) || saved.Status==='Completed';
    complete.textContent=saved.Status==='Completed'?'Request completed':'Complete request';
    completionHelp.hidden=saved.Status==='Completed';
    const reasons=[];
    if(invalid.length)reasons.push(`${invalid.length} required ${invalid.length===1?'field needs':'fields need'} attention.`);
    if(recordDirty())reasons.push('Save or discard your changes.');
    host.setTabAttention('information','record',reasons.join(' '));
  }
  function applySaved(changes=[],restoring=false) {
    host.querySelectorAll('.tp-case-context-content dl > div').forEach(row=>{
      const key=row.querySelector('dt').textContent.trim();
      const name={Provider:'Service provider',Engineer:'Assigned specialist'}[key]||key;
      if(name in saved)row.querySelector('dd').textContent=name==='Equipment'?`${saved.Equipment} · ${saved['Asset type']}`:saved[name];
    });
    host.querySelector('.tp-identity-status .tp-status-chip').textContent=saved.Status;
    host.querySelector('.tp-identity-status .tp-priority-chip').textContent=saved.Urgency;
    if(savedAt)form.querySelector('[data-system-field="Last updated"] dd').textContent=savedLabel().replace(/^Saved today/,'Today').replace(/^Saved /,'');
    host.dispatchEvent(new CustomEvent('request-record-saved',{detail:{values:saved,changes,time:savedAt?timeLabel(savedAt):'09:24',restored:restoring}}));
  }
  async function saveChanges() {
    if(saving)return false;
    if(recordDirty() && invalidFields().length){reviewRecord();return false;}
    if(!isDirty())return true;
    saving=true;saveError='';update();
    form.inert=true;host.querySelector('[data-panel="files"]').inert=true;
    try {
      // Let the busy state render. Persist first: failed storage must never look saved.
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const values=readValues(), date=new Date();
      const changes=[...fields.keys()].filter(name=>values[name]!==saved[name]);
      if(host.requestFiles.hasChanges())changes.push('File information');
      sessionStorage.setItem(storageKey,JSON.stringify({version:1,record:values,files:host.requestFiles.snapshot(),savedAt:date.toISOString()}));
      host.messageDraft?.commit();saved=values;savedAt=date;host.requestFiles.commit();applySaved(changes);
      return true;
    } catch {
      saveError='Could not save. Your changes are still here. Please try again.';
      return false;
    } finally {
      saving=false;form.inert=false;host.querySelector('[data-panel="files"]').inert=false;update();
    }
  }
  function discardChanges() {
    fields.forEach((input,name)=>{input.value=saved[name];});
    host.requestFiles.discard();host.messageDraft?.discard();saveError='';update();
  }
  const dialog=document.createElement('dialog');dialog.className='tp-save-dialog';
  dialog.setAttribute('aria-labelledby','request-save-title');dialog.setAttribute('aria-describedby','request-save-description');
  dialog.innerHTML='<h2 id="request-save-title"></h2><p id="request-save-description"></p><p class="tp-save-dialog-error" role="alert" hidden></p><div class="tp-save-dialog-actions"></div>';
  host.append(dialog);
  let origin=null;
  function closeDialog(restoreFocus=true) {dialog.close();if(restoreFocus && origin?.isConnected)origin.focus();}
  function showDialog(title,description,actions) {
    origin=document.activeElement;
    dialog.querySelector('h2').textContent=title;dialog.querySelector('#request-save-description').textContent=description;
    const error=dialog.querySelector('[role="alert"]');error.hidden=true;error.textContent='';
    const actionsElement=dialog.querySelector('.tp-save-dialog-actions');actionsElement.replaceChildren();
    actions.forEach(({label,run,primary=false,safe=false})=>{
      const button=document.createElement('button');button.type='button';button.textContent=label;
      if(primary)button.className='tp-primary';
      button.autofocus=safe;
      button.onclick=async()=>{
        actionsElement.querySelectorAll('button').forEach(item=>item.disabled=true);
        try {await run();} finally {actionsElement.querySelectorAll('button').forEach(item=>item.disabled=false);}
      };
      actionsElement.append(button);
    });
    dialog.showModal();actionsElement.querySelector('[autofocus]')?.focus();
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(!saving)closeDialog();});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();});
  async function saveThen(next) {
    if(recordDirty() && invalidFields().length){closeDialog(false);reviewRecord();return;}
    if(await saveChanges()){closeDialog(false);next();}
    else {const error=dialog.querySelector('[role="alert"]');error.textContent=saveError;error.hidden=false;}
  }
  host.confirmRequestLeave=next=>{
    if(saving)return;
    if(!isDirty()){next();return;}
    if(dialog.open)return;
    showDialog('Save changes before leaving?','You have unsaved changes, including any message draft. Save them, or leave without keeping these changes.',[
      {label:'Keep editing',safe:true,run:()=>closeDialog()},
      {label:'Leave without saving',run:()=>{discardChanges();closeDialog(false);next();}},
      {label:'Save and leave',primary:true,run:()=>saveThen(next)}
    ]);
  };
  function requestCompletion() {
    const issue=blocker();
    if(issue) {
      showDialog('This request is not ready to complete',issue.message+' Review the remaining items before completing the request.',[
        {label:'Keep editing',safe:true,run:()=>closeDialog()},
        {label:issue.action,primary:true,run:()=>{closeDialog(false);issue.review();}}
      ]);
      return;
    }
    if(isDirty()) {
      showDialog('Save changes before completing?','Save your request record and file edits, then review the request for completion.',[
        {label:'Keep editing',safe:true,run:()=>closeDialog()},
        {label:'Save and continue',primary:true,run:()=>saveThen(requestCompletion)}
      ]);
      return;
    }
    showDialog('Complete this request?','All required fields, file checks and linked tickets are complete.',[
      {label:'Keep open',safe:true,run:()=>closeDialog()},
      {label:'Complete request',primary:true,run:async()=>{
        const input=fields.get('Status');
        if(![...input.options].some(option=>option.value==='Completed'))input.add(new Option('Completed','Completed'));
        input.value='Completed';await saveThen(()=>complete.focus());
      }}
    ]);
  }
  complete.addEventListener('click',requestCompletion);
  host.addEventListener('message-draft-change',update);
  host.saveRequestChanges=saveChanges;
  save.addEventListener('click',saveChanges);discard.addEventListener('click',discardChanges);
  form.addEventListener('submit',event=>{event.preventDefault();saveChanges();});
  const onEdit=()=>{saveError='';update();};
  form.addEventListener('input',onEdit);form.addEventListener('change',onEdit);
  host.addEventListener('file-fields-changed',onEdit);
  host.addEventListener('ticket-overview-changed',update);
  host.querySelectorAll('[data-tab]').forEach(tab=>tab.addEventListener('click',()=>queueMicrotask(update)));
  window.addEventListener('beforeunload',event=>{if(isDirty()){event.preventDefault();event.returnValue='';}});
  document.addEventListener('click',event=>{
    if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !isDirty())return;
    const link=event.target.closest('a[href]');
    if(!link || link.hasAttribute('download') || (link.target && link.target!=='_self'))return;
    const url=new URL(link.href,location.href);
    if(!['http:','https:','file:'].includes(url.protocol))return;
    if(url.origin===location.origin && url.pathname===location.pathname && url.search===location.search && url.hash)return;
    event.preventDefault();event.stopImmediatePropagation();
    host.confirmRequestLeave(()=>location.assign(url.href));
  },true);
  if(restored){host.requestFiles.restore(restored.files);applySaved([],true);}
  update();
  // Reassignment commits only the coordinator; unrelated form edits stay untouched.
  const coordinatorRow=[...host.querySelectorAll('.tp-case-context-content dl > div')].find(row=>row.querySelector('dt')?.textContent.trim()==='Coordinator');
  if(coordinatorRow && fields.has('Coordinator')) {
    const coordinatorLink=document.createElement('button');
    coordinatorLink.type='button';coordinatorLink.className='tp-coordinator-link';coordinatorLink.setAttribute('aria-haspopup','dialog');
    const refreshCoordinator=()=>{
      coordinatorLink.textContent=saved.Coordinator;
      coordinatorLink.setAttribute('aria-label',`${saved.Coordinator}, reassign coordinator`);
      coordinatorRow.querySelector('dd').replaceChildren(coordinatorLink);
    };
    const dialog=document.createElement('dialog');dialog.className='tp-coordinator-dialog';dialog.setAttribute('aria-labelledby','coordinator-dialog-title');
    dialog.innerHTML='<form method="dialog"><header><h3 id="coordinator-dialog-title">Reassign coordinator</h3><button type="button" data-close-coordinator aria-label="Close reassign coordinator">×</button></header><p>Choose a team member to coordinate this service request.</p><label for="coordinator-choice">Coordinator</label><select id="coordinator-choice" required></select><footer><button type="button" data-cancel-coordinator>Cancel</button><button type="submit">Reassign</button></footer></form>';
    host.append(dialog);
    const select=dialog.querySelector('select'),confirm=dialog.querySelector('[type="submit"]');
    choices.Coordinator.filter(name=>name!=='Not assigned').forEach(name=>select.add(new Option(name,name)));
    let assignment=null;
    const configureAssignment=target=>{assignment=target;dialog.querySelector('h3').textContent=target?'Reassign owner':'Reassign coordinator';dialog.querySelector('header + p').textContent=target?'Choose a team member to own this ticket.':'Choose a team member to coordinate this service request.';dialog.querySelector('label').textContent=target?'Owner':'Coordinator';};
    host.openOwnerAssignment=target=>{configureAssignment(target);select.value=target.owner;confirm.disabled=true;dialog.showModal();select.focus();};
    const openCoordinator=()=>{configureAssignment(null);if(saving)return;select.value=saved.Coordinator;confirm.disabled=select.value===saved.Coordinator || !select.value;dialog.showModal();select.focus();};
    coordinatorLink.onclick=openCoordinator;
    host.claimServiceRequest=()=>{configureAssignment(null);select.value='Riley Cruz';if(saved.Coordinator==='Riley Cruz'){host.dispatchEvent(new CustomEvent('request-record-saved',{detail:{values:{...saved},changes:[]}}));return;}dialog.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));};
    host.addEventListener('request-opened',event=>{
      saved={...saved,Coordinator:event.detail.coordinator==='—'?'Not assigned':event.detail.coordinator};
      fields.get('Coordinator').value=saved.Coordinator;refreshCoordinator();update();
    });

    select.onchange=()=>{confirm.disabled=select.value===(assignment?assignment.owner:saved.Coordinator) || !select.value;};
    dialog.querySelector('[data-close-coordinator]').onclick=()=>dialog.close();
    dialog.querySelector('[data-cancel-coordinator]').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>{(assignment?.trigger||coordinatorLink).focus();assignment=null;});
    dialog.querySelector('form').addEventListener('submit',event=>{
      event.preventDefault();if(assignment){if(select.value&&select.value!==assignment.owner){assignment.commit(select.value);dialog.close();}return;}if(!select.value||select.value===saved.Coordinator)return;
      const updated={...saved,Coordinator:select.value},date=new Date();
      try {
        const stored=JSON.parse(sessionStorage.getItem(storageKey)||'null');
        sessionStorage.setItem(storageKey,JSON.stringify({version:1,record:updated,files:stored?.files||{},savedAt:date.toISOString()}));
      } catch {status.textContent='Could not reassign. Please try again.';return;}
      saved=updated;savedAt=date;fields.get('Coordinator').value=select.value;
      refreshCoordinator();update();status.textContent=`Coordinator reassigned to ${select.value}.`;
      host.dispatchEvent(new CustomEvent('request-record-saved',{detail:{values:{...saved},changes:['Coordinator'],time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}}));
      dialog.close();
    });
    host.addEventListener('request-record-saved',refreshCoordinator);
    secondary.querySelectorAll('button').forEach(button=>{if(button.textContent.trim()==='Reassign coordinator')button.remove();});
    refreshCoordinator();
  }
})();
