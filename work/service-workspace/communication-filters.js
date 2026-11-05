(() => {
  const host=document.querySelector('[data-task-prototype]');
  const panel=document.querySelector('.tp-communication-workspace');
  if(!panel)return;
  const aside=panel.querySelector('aside'), toolbar=aside.querySelector('.tp-message-filters'), detail=panel.querySelector('[data-message-detail]');
  const filesToolbar=document.querySelector('.tp-file-filter-toolbar');
  const upload=document.querySelector('[data-upload-files]');
  if(filesToolbar&&upload){filesToolbar.append(upload);upload.innerHTML='<span>Upload</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/></svg>';}
  const originalDetail=detail.innerHTML;
  const compose=toolbar.querySelector('[data-new-message]');
  toolbar.replaceChildren();
  toolbar.classList.add('tp-communication-toolbar');
  const toggle=document.createElement('button');
  toggle.type='button';toggle.className='tp-communication-filter-toggle';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','communication-filters');
  const menu=document.createElement('div');menu.id='communication-filters';menu.className='tp-communication-filter-menu';menu.hidden=true;
  menu.innerHTML='<fieldset><legend>Channel</legend>'+[['email','Email'],['call','Calls'],['chat','Messages']].map(([v,l])=>`<label><input type="checkbox" name="channel" value="${v}">${l}</label>`).join('')+'</fieldset><fieldset><legend>Audience</legend><label><input type="checkbox" name="audience" value="internal">Internal</label><label><input type="checkbox" name="audience" value="external">External</label></fieldset><fieldset><legend>Show only</legend><label><input type="checkbox" name="unread">Unread</label><label><input type="checkbox" name="attachments">With attachments</label><label><input type="checkbox" name="missed">Missed calls</label></fieldset><button type="button" data-clear-communication>Clear filters</button>';
  compose.hidden=true;compose.remove();
  const actionIcon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${{email:'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM3 6l9 7 9-7',call:'M9 3H5a2 2 0 0 0-2 2c0 9 7 16 16 16a2 2 0 0 0 2-2v-4l-5-1-2 3a13 13 0 0 1-7-7l3-2z',chat:'M12 5v14M5 12h14',timeline:'m7 10 5 5 5-5'}[name]}"/></svg>`;
  const create=document.createElement('button');create.type='button';create.className='draft-new-communication tp-primary';
  const createMenu=document.createElement('div');createMenu.className='draft-new-menu';createMenu.hidden=true;
  createMenu.innerHTML=['email','call','chat'].map(channel=>`<button type="button" data-create-channel="${channel}">${actionIcon(channel)}<span>New ${channel}</span></button>`).join('');
  toolbar.append(toggle,create,menu,createMenu);
  const views=document.createElement('div');views.className='tp-communication-views';views.setAttribute('role','group');views.setAttribute('aria-label','Communication view');
  views.innerHTML=[['timeline','All'],['email','Email'],['call','Calls'],['chat','Chat']].map(([value,label])=>`<button type="button" data-communication-view="${value}" aria-pressed="${value==='timeline'}">${label}</button>`).join('');
  toolbar.after(views);
  const list=document.createElement('div');list.className='tp-communication-results';list.tabIndex=0;
  aside.querySelectorAll('.tp-message-row').forEach(row=>row.remove());aside.append(list);
  const items=[
    {id:1,type:'email',author:'Jamie Cole',title:'Ventilation alarm',summary:'Tenant photos attached',time:'18 min ago',unread:false,attachments:true,thread:'ventilation',body:'The ventilation on Level 4 has stopped after a sensor alarm. Tenant photos are attached. Reception can provide access to the plant room.'},
    {id:2,type:'call',aiProcessed:true,author:'Site reception and building facilities coordination team',title:'Access window confirmed',summary:'Access available 09:00–17:30',time:'32 min ago',unread:true,body:'Reception confirmed access to the plant room. Coordinate the visit with the service team.'},
    {id:3,type:'chat',thread:'engineer',author:'Felix Novak',title:'Equipment history review and controller diagnostics before engineer dispatch',summary:'Review controller log before dispatch',time:'41 min ago',unread:true,body:'Please review the controller log and previous incidents before confirming the response.'},
    {id:4,type:'call',author:'Jamie Cole',title:'Missed call',summary:'Call back needed',time:'52 min ago',unread:true,missed:true,body:'Incoming call was not answered. No recording is available. Follow up with Jamie Cole.'},
    {id:5,type:'email',author:'Building maintenance and facilities management team',title:'Service report attached',summary:'Previous inspection report',time:'1 hour ago',unread:true,attachments:true,body:'The previous service report is available in Files for comparison with the current issue.'},
    {id:6,type:'chat',thread:'coordination',author:'Riley Cruz',title:'Request received',summary:'Issue assessment is in progress',time:'1 hour ago',body:'The service request has been received. Issue assessment is in progress.'}
  ];
  items.push(
    {id:7,type:'email',thread:'ventilation',author:'Riley Cruz',title:'Re: Ventilation alarm',summary:'Request for equipment details',time:'2 hours ago',body:'Please confirm the affected unit and whether reception can provide access to the plant room.'},
    {id:8,type:'email',thread:'ventilation',author:'Jamie Cole',title:'Ventilation alarm',summary:'Level 4 meeting rooms are becoming warm',time:'3 hours ago',body:'The east meeting rooms are becoming warm. Could the service team investigate the ventilation?'}
  );
  items.push({id:9,type:'chat',thread:'engineer',author:'Riley Cruz',title:'Equipment history review and controller diagnostics before engineer dispatch',summary:'Controller log is attached to the assessment ticket',time:'24 min ago',delivery:'read',body:'The controller log is attached to the assessment ticket. Please review it before we confirm dispatch.'});
  items.push({id:10,type:'chat',thread:'engineer',author:'Riley Cruz',title:items.find(i=>i.id===9).title,summary:'Reception is ready to provide access',time:'12 min ago',delivery:'delivered',body:'Reception is ready to provide access.'},{id:11,type:'chat',thread:'engineer',author:'Riley Cruz',title:items.find(i=>i.id===9).title,summary:'Please confirm when the review is complete',time:'2 min ago',delivery:'sent',body:'Please confirm when the review is complete.'});
  const chatReceipt=message=>{if(message.author!=='Riley Cruz')return '';const state=message.delivery||'sent',label={sent:'Sent',delivered:'Delivered',read:'Read'}[state];return `<span class="draft-chat-receipt is-${state}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${state==='sent'?'m5 12 4 4 10-10':'m2 12 4 4L16 6m-5 8 2 2L23 6'}"/></svg><span>${label}</span></span>`;};
  const draftHost=document.querySelector('.task-prototype'),savedEmailDraft=draftHost.messageDraft?.getSaved();
  const draftItem={id:12,type:'email',thread:'ventilation',isDraft:true,author:'Jamie Cole',title:savedEmailDraft?.subject||'Re: Ventilation alarm',summary:'Visit coordination update',time:'Just now',body:savedEmailDraft?.message||'<p>Hi Jamie, we are reviewing the controller log before arranging the visit.</p>',to:savedEmailDraft?.to||'jamie.cole@example.com',cc:savedEmailDraft?.cc||'',bcc:savedEmailDraft?.bcc||''};items.push(draftItem);
  items.push({id:13,type:'call',unanswered:true,author:'Jamie Cole',title:'No answer',summary:'Try calling again later',time:'8 min ago',body:'The outgoing call was not answered. No recording or transcript is available.'});
  const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const age=item=>item.time.includes('hour')?Number(item.time.split(' ')[0])*60:item.time==='Just now'?0:Number(item.time.split(' ')[0]);
  items.sort((a,b)=>age(a)-age(b));
  const total=document.querySelector('[data-tab="communication"] b');if(total)total.textContent=items.length;
  let selected=1,view='timeline';
  const pinnedMessages=new Set();
  const listTime=item=>item.time.includes('hour')?new Date(Date.now()-Number(item.time.split(' ')[0])*3600000).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):item.time;
  const compactListTime=item=>listTime(item).replace(/(\d+) min ago/,'$1m').replace(/(\d+) hours? ago/,'$1h').replace('Just now','Now');
  const channelIcon=item=>(item.isDraft||item.hasDraft)?`<span class="tp-channel-icon draft-email-draft-icon" role="img" aria-label="Draft · Not sent" title="Draft · Not sent"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 3 5 5-12 12-6 1 1-6L16 3Zm-3 3 5 5M4 15l5 5"/></svg></span>`:item.type==='call'?`<span class="tp-channel-icon draft-call-icon ${item.cancelled?'is-cancelled':item.unanswered?'is-unanswered':item.missed?'is-missed':'is-completed'}" role="img" aria-label="${item.cancelled?'Cancelled outgoing call':item.unanswered?'No answer · Outgoing call':item.missed?'Missed call · Incoming call':'Completed call'}" title="${item.cancelled?'Cancelled outgoing call':item.unanswered?'No answer · Outgoing call':item.missed?'Missed call · Incoming call':'Completed call'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${item.cancelled?'M8 3H5a2 2 0 0 0-2 2c0 9 7 16 16 16a2 2 0 0 0 2-2v-4l-5-1-2 3a13 13 0 0 1-7-7l3-2zM16 3l5 5m0-5-5 5':item.unanswered?'M8 3H5a2 2 0 0 0-2 2c0 9 7 16 16 16a2 2 0 0 0 2-2v-4l-5-1-2 3a13 13 0 0 1-7-7l3-2zM15 3h6v6m0-6-6 6':item.missed?'M3 15v-4a16 16 0 0 1 18 0v4h-5v-4a12 12 0 0 0-8 0v4H3Z':'M9 3H5a2 2 0 0 0-2 2c0 9 7 16 16 16a2 2 0 0 0 2-2v-4l-5-1-2 3a13 13 0 0 1-7-7l3-2z'}"/></svg></span>`:item.type==='email'?`<span class="tp-channel-icon draft-email-icon ${item.unread?'is-new':'is-read'}" role="img" aria-label="${item.unread?'Unread email':'Read email'}" title="${item.unread?'Unread email':'Read email'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${item.unread?'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM3 6l9 7 9-7':'M3 10l9-7 9 7v10H3V10Zm0 0 9 6 9-6M3 20l6-6m12 6-6-6'}"/></svg></span>`:`<span class="tp-channel-icon ${item.type==='chat'?`draft-chat-icon ${item.unread?'is-new':'is-read'}`:''}" ${item.type==='chat'?`role="img" aria-label="${item.unread?'Unread message':'Read message'}" title="${item.unread?'Unread message':'Read message'}"`:''}><span class="tp-icon material-symbols-outlined">${item.type==='call'?'call':'chat'}</span></span>`;
  const chatParticipants=new Map([['coordination',['Riley Cruz','Elliot Ward']]]);
  const people=[{name:'Jamie Cole',role:'Requester',audience:'External'},{name:'Site reception',role:'Rivergate House · Reception',audience:'External'},{name:'Riley Cruz',role:'Coordinator',audience:'Internal'},{name:'Felix Novak',role:'Northstar Mechanical · Service engineer',audience:'External'},{name:'Elliot Ward',role:'Service coordinator',audience:'Internal'},{name:'Mina Shah',role:'Service coordinator',audience:'Internal'},{name:'Maya Patel',role:'Facilities manager',audience:'External'},{name:'Alex Reed',role:'Site manager',audience:'External'}];
  const contactPhones={'Jamie Cole':'+44 1632 960 010','Site reception':'+44 1632 960 011','Felix Novak':'+44 1632 960 012','Elliot Ward':'+44 1632 960 013','Mina Shah':'+44 1632 960 014','Maya Patel':'+44 1632 960 015','Alex Reed':'+44 1632 960 016'};
  const personLabel=name=>name==='Riley Cruz'?'You · Internal':`${people.find(person=>person.name===name)?.audience || 'External'} · ${people.find(person=>person.name===name)?.role || 'Contact'}`;
  const communicationAudience=item=>participantsFor(item).some(name=>(people.find(person=>person.name===name)?.audience||'External')==='External')?'External':'Internal';
  const participantsFor=item=>{const key=item.thread||item.id;if(!chatParticipants.has(key))chatParticipants.set(key,[...new Set(['Riley Cruz',...threadFor(item).filter(m=>!m.isChatStart).map(m=>m.author)])]);return [...chatParticipants.get(key)];};
  const threadFor=item=>item.thread?items.filter(i=>i.thread===item.thread):[item];
  const isPinned=item=>threadFor(item).some(i=>pinnedMessages.has(i.id));
  const callDetail=()=>`<section class="draft-call-evidence" aria-label="Call metadata"><div class="draft-call-metadata-grid"><div><div class="draft-call-metadata-label">Started</div><div class="draft-call-metadata-value">5 Oct 2026, 09:04:00 <span>BST · UTC+01:00</span></div></div><div><div class="draft-call-metadata-label">Direction / result</div><div class="draft-call-metadata-value">Outgoing · Connected</div></div><div><div class="draft-call-metadata-label">Duration</div><div class="draft-call-metadata-value">05:12 <span>Ended 09:09:12</span></div></div><div><div class="draft-call-metadata-label">Participants</div><div class="draft-call-metadata-value">Riley Cruz → Site reception</div></div></div><details><summary>Source &amp; processing details</summary><div class="draft-call-metadata-grid"><div><div class="draft-call-metadata-label">Call ID</div><div class="draft-call-metadata-value">CALL-0048217-02</div></div><div><div class="draft-call-metadata-label">Source</div><div class="draft-call-metadata-value">Workspace telephony · Linked to SR-0048217</div></div><div><div class="draft-call-metadata-label">Recording</div><div class="draft-call-metadata-value">REC-0048217-02 <span>Audio playback unavailable in this prototype</span></div></div><div><div class="draft-call-metadata-label">AI processing</div><div class="draft-call-metadata-value">Transcript &amp; summary generated at 09:10 BST</div></div><div><div class="draft-call-metadata-label">Review status</div><div class="draft-call-metadata-value">Not reviewed <span>No human verification recorded</span></div></div></div></details></section><section class="draft-call-summary"><div class="draft-call-summary-heading"><h5><svg class="communication-ai-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 3 2.2 5.8L18 11l-5.8 2.2L10 19l-2.2-5.8L2 11l5.8-2.2L10 3ZM19 3v4m-2-2h4M20 16v5m-2.5-2.5h5"/></svg>AI summary</h5></div><p class="draft-call-provenance-note">Generated from the call transcript.</p><ul><li>Engineer access is available today, 09:00–17:30, through reception. <button type="button" class="draft-call-source" data-call-source="1" title="Show source in transcript">01:00</button></li><li>Reception will escort the engineer to the plant room and provide the access key. <button type="button" class="draft-call-source" data-call-source="3" title="Show source in transcript">03:00</button></li><li>Riley will confirm the arrival time with the service team and notify reception before the visit. <button type="button" class="draft-call-source" data-call-source="4" title="Show source in transcript">04:00</button></li></ul></section><section class="draft-call-transcript"><header><h5>Call transcript</h5><span>05:12 · Site reception &amp; Riley Cruz</span></header>${[
['00:00','Riley Cruz','Hi, I’m coordinating the ventilation request on Level 4. Can we arrange access for our engineer today?'],
['01:00','Site reception','Yes. Reception is staffed from 09:00 until 17:30. Please ask the engineer to check in at the front desk.'],
['02:00','Riley Cruz','They will need to inspect AHU-04 in the plant room. Will someone be available to let them in?'],
['03:00','Site reception','We have the key and can escort them. Send us the engineer’s name and arrival time before the visit.'],
['04:00','Riley Cruz','I’ll confirm the time with the service team and send those details. Please keep the access key ready.'],
['05:00','Site reception','Agreed. We’ll be ready at reception and will arrange access when they arrive.']
].map(([time,speaker,copy],index)=>`<div class="draft-call-transcript-row" data-call-transcript="${index}" tabindex="-1"><time>${time}</time><div><strong>${speaker}</strong><p>${copy}</p></div></div>`).join('')}</section>`;
  const unconnectedCallMetadata=item=>{
    const incoming=Boolean(item.missed),rows=[
      ['Started',incoming?'5 Oct 2026, 08:44:00':'5 Oct 2026, 09:28:00','BST · UTC+01:00'],
      ['Direction / result',incoming?'Incoming · Missed':'Outgoing · No answer',''],
      ['Ringing time',incoming?'00:28':'00:35','Not connected'],
      ['Participants',incoming?'Jamie Cole → Riley Cruz':'Riley Cruz → Jamie Cole','']
    ];
    return `<section class="draft-call-evidence" aria-label="Call metadata"><div class="draft-call-metadata-grid">${rows.map(([label,value,note])=>`<div><div class="draft-call-metadata-label">${label}</div><div class="draft-call-metadata-value">${value}${note?`<span>${note}</span>`:''}</div></div>`).join('')}</div><details><summary>Source details</summary><div class="draft-call-metadata-grid"><div><div class="draft-call-metadata-label">Call ID</div><div class="draft-call-metadata-value">CALL-0048217-${incoming?'04':'13'}</div></div><div><div class="draft-call-metadata-label">Source</div><div class="draft-call-metadata-value">Workspace telephony <span>Linked to SR-0048217</span></div></div></div></details></section>`;
  };
  const missedCallDetail=(unanswered=false)=>`<section class="draft-missed-call-empty"><div class="draft-call-empty-content"><img class="draft-missed-call-image" src="../../assets/empty-states/${unanswered?'unanswered-call-3d-amber.webp':'missed-call-3d-pastel-red.webp'}" alt="" width="144" height="144" /><h3>You missed Jamie’s call</h3><p>No recording or transcript is available.<br>Get in touch to continue the conversation.</p><div class="draft-missed-call-actions"><button type="button" data-demo-call-back>Call back</button></div></div></section>`;
  const cancelledCallDetail=item=>`<section class="draft-missed-call-empty draft-cancelled-call-empty"><div class="draft-call-empty-content"><img class="draft-missed-call-image" src="../../assets/empty-states/cancelled-call-green.webp?v=2" alt="" width="144" height="144" /><h3>Call cancelled</h3><p>You cancelled the outgoing call to ${escapeText(item.contactName||item.author)} before it connected.<br>No recording or transcript is available.</p><div class="draft-missed-call-actions"><button type="button" data-demo-call-back>Call again</button></div></div></section>`;
  const unansweredCallDetail=()=>missedCallDetail(true).replace('draft-missed-call-empty','draft-missed-call-empty draft-unanswered-call-empty').replace('You missed Jamie’s call','Jamie didn’t answer').replace('Get in touch to continue the conversation.','Try calling again later or send a message.').replace('Call back</button>','Call again</button>');
  detail.addEventListener('click',event=>{
    const source=event.target.closest('[data-call-source]');
    if(source){const row=detail.querySelector(`[data-call-transcript="${source.dataset.callSource}"]`);if(row){detail.querySelectorAll('.is-source-highlight').forEach(e=>e.classList.remove('is-source-highlight'));row.classList.add('is-source-highlight');row.scrollIntoView({behavior:'smooth',block:'center'});row.focus({preventScroll:true});}return;}
    const reply=event.target.closest('[data-email-reply]');
    if(reply){const item=items.find(i=>i.id===selected);const sender=item.author==='Jamie Cole'?'jamie.cole@example.com':item.author==='Riley Cruz'?'hana.cruz@example.com':'maintenance@example.com';document.querySelector('.task-prototype').dispatchEvent(new CustomEvent('compose-email-reply',{detail:{to:reply.dataset.emailReply==='forward'?'':sender,subject:(reply.dataset.emailReply==='forward'?'Fwd: ':'Re: ')+item.title.replace(/^(Re|Fwd):\s*/i,''),cc:reply.dataset.emailReply==='all'?'reception@example.com':'',bcc:'',message:reply.dataset.emailReply==='forward'?'<p><br></p><p>---------- Forwarded message ----------</p><p>From: '+sender+'</p><p>Subject: '+item.title+'</p><p>'+item.body+'</p>':''}}));return;}

    if(event.target.closest('[data-add-chat-participant]')){
      const item=items.find(i=>i.id===selected);if(!item||item.type!=='chat')return;
      const members=new Set(participantsFor(item)),dialog=document.createElement('dialog');dialog.className='draft-chat-people-dialog';dialog.setAttribute('aria-labelledby','manage-participants-title');
      dialog.innerHTML='<header><h3 id="manage-participants-title">Manage participants</h3><button type="button" aria-label="Close participant manager">×</button></header><p>Add or remove people from this conversation. Earlier messages remain in its history.</p><h4>Current participants</h4><div class="draft-current-participants"></div><label class="draft-participant-search">Add participants<input type="search" aria-label="Search the participant directory" placeholder="Search directory by name or role"></label><div class="draft-people-results"></div><p role="status" aria-live="polite" data-participant-status></p><footer><button type="button" data-cancel-participants>Cancel</button><button type="button" data-save-participants>Save changes</button></footer>';
      panel.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();detail.querySelector('[data-add-chat-participant]')?.focus({preventScroll:true});},{once:true});dialog.querySelector('header button').onclick=dialog.querySelector('[data-cancel-participants]').onclick=()=>dialog.close();
      const search=dialog.querySelector('input'),results=dialog.querySelector('.draft-people-results'),current=dialog.querySelector('.draft-current-participants');
      const initial=[...members];
      const paint=()=>{
        current.innerHTML=[...members].map(name=>`<div class="draft-participant-row"><span><strong>${escapeText(name)}${name==='Riley Cruz'?' · You':''}</strong><small>${escapeText(personLabel(name))}</small></span>${name==='Riley Cruz'?'':`<button type="button" data-remove-person="${escapeText(name)}" aria-label="Remove ${escapeText(name)}">Remove</button>`}</div>`).join('');
        const query=search.value.trim().toLowerCase(),matches=people.filter(person=>!members.has(person.name)&&(!query||(person.name+' '+person.role+' '+person.audience).toLowerCase().includes(query)));
        results.innerHTML=matches.map(person=>`<button type="button" data-person="${escapeText(person.name)}" aria-label="Add ${escapeText(person.name)}"><span><strong>${escapeText(person.name)}</strong><small>${escapeText(personLabel(person.name))}</small></span><span>Add</span></button>`).join('')||'<p>No other participants match your search.</p>';
        const changed=initial.length!==members.size||initial.some(name=>!members.has(name));dialog.querySelector('[data-save-participants]').disabled=!changed;
      };
      search.oninput=paint;
      results.onclick=event=>{const button=event.target.closest('[data-person]');if(!button)return;members.add(button.dataset.person);paint();dialog.querySelector('[data-participant-status]').textContent=button.dataset.person+' added to selection.';};
      current.onclick=event=>{const button=event.target.closest('[data-remove-person]');if(!button)return;members.delete(button.dataset.removePerson);paint();dialog.querySelector('[data-participant-status]').textContent=button.dataset.removePerson+' removed from selection.';};
      dialog.querySelector('[data-save-participants]').onclick=()=>{const draft=detail.querySelector('textarea')?.value||'';chatParticipants.set(item.thread||item.id,[...members]);dialog.close();showDetail(item);const field=detail.querySelector('textarea');if(field)field.value=draft;render();};
      paint();dialog.showModal();search.focus();return;
    }
    if(event.target.closest('[data-missed-send-message]')) compose.click();
    if(event.target.closest('[data-demo-call-back]')){
      const previous=items.find(item=>item.id===selected);if(previous?.type!=='call')return;
      startCommunication('call',{contact:previous.contactName||(previous.id===2?'Site reception':previous.author),organization:previous.organization||(previous.id===2?'Rivergate House':''),previousCallId:previous.id,phone:previous.phone});
    }
  });
  const infoIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/></svg>';
  const infoHeading=document.createElement('header');infoHeading.className='communication-info-list-heading';
  const infoToggle=document.createElement('button');infoToggle.type='button';infoToggle.setAttribute('aria-controls','communication-info-panel');
  infoHeading.innerHTML='<strong>Communication</strong>';infoHeading.append(infoToggle);aside.prepend(infoHeading);
  const inspector=document.createElement('section');inspector.id='communication-info-panel';inspector.className='communication-info-inspector';inspector.setAttribute('aria-label','Communication information');detail.before(inspector);
  let infoOpen=false,infoAvailable=true;
  // Communication uses automatic column widths, without a resize control.
  panel.querySelector('.tp-email-splitter')?.remove();
  const listWidthProbe=document.createElement('div');
  listWidthProbe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;width:var(--tp-context-column,260px);height:0';
  listWidthProbe.setAttribute('aria-hidden','true');panel.append(listWidthProbe);
  let listRatio=null;
  const resizeList=ratio=>{
    const width=panel.getBoundingClientRect().width;if(!width)return;
    const infoSize=window.innerWidth>=1280?Math.max(360,width*.30):Math.max(240,width*.25);
    panel.style.setProperty('--communication-info-size',infoSize+'px');
    const sharedListWidth=listWidthProbe.getBoundingClientRect().width || 260;
    // Intrinsic controls plus both gutters define the drag limit.
    const controlsMinimum=Math.max(...[toolbar,infoHeading].map(row=>{
      const style=getComputedStyle(row);
      const children=[...row.children].filter(child=>!child.hidden&&getComputedStyle(child).position!=='absolute'&&getComputedStyle(child).display!=='none');
      return children.reduce((sum,child)=>sum+Math.max(child.scrollWidth,child.getBoundingClientRect().width),0)+Math.max(0,children.length-1)*(parseFloat(style.columnGap)||0)+(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0)+2;
    }));
    const minimum=Math.min(Math.max(controlsMinimum,240),width/3),infoWidth=infoOpen&&infoAvailable?Math.min(infoSize,width*.28):0;
    const maximum=Math.max(minimum,Math.min(width*.4,width-infoWidth-300));
    const size=ratio===null?Math.max(minimum,Math.min(maximum,width/3)):Math.max(minimum,Math.min(maximum,width*ratio));
    if(ratio!==null)listRatio=size/width;
    panel.style.setProperty('--communication-list-size',size+'px');
  };
  panel.resetListWidth=()=>{listRatio=null;resizeList(null);};
  const listSizeObserver=new ResizeObserver(()=>resizeList(listRatio));
  [panel,create,toggle,infoToggle].forEach(element=>listSizeObserver.observe(element));
  document.fonts.ready.then(()=>resizeList(listRatio));

  const infoExpanded=new Map();
  const setInfoOpen=open=>{infoOpen=open;inspector.hidden=true;panel.classList.remove('communication-info-open');const accordion=detail.querySelector('.communication-inline-info');if(accordion)accordion.open=open;infoToggle.setAttribute('aria-expanded',String(open));resizeList(listRatio);};
  infoToggle.onclick=()=>setInfoOpen(!infoOpen);
  const updateInfo=item=>{
    infoAvailable=['call','chat'].includes(item.type);infoToggle.hidden=!infoAvailable;
    if(!infoAvailable){inspector.replaceChildren();detail.querySelector('.communication-inline-info')?.remove();const compact=panel.querySelector('[data-compact-call-info]');if(compact)compact.hidden=true;setInfoOpen(false);return;}
    const label={call:'Call info',email:'Email info',chat:'Chat info'}[item.type];
    infoToggle.innerHTML=infoIcon+'<span>'+label+'</span>';
    const compactInfo=panel.querySelector('[data-compact-call-info]');if(compactInfo){compactInfo.textContent=label;compactInfo.hidden=false;}
    inspector.innerHTML='<header>'+infoIcon+'<strong>'+label+'</strong><button type="button" aria-label="Close communication information" title="Close communication information"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><div class="communication-info-body"></div>';
    inspector.querySelector('button').onclick=()=>{setInfoOpen(false);infoToggle.focus();};
    const body=inspector.querySelector('.communication-info-body'),evidence=detail.querySelector('.draft-call-evidence');
    if(evidence)body.append(evidence);
    else {
      const rows=item.type==='chat'?[['Participants',participantsFor(item).join(', ')]]:item.type==='email'?[['From',item.author],['Subject',item.title],['Last activity',item.time],['Messages',String(threadFor(item).length)],['Attachments',item.attachments?'Available in Files':'None'],['Related request','SR-0048217']]:[['Direction / result',item.title],['Contact',item.author],['Last activity',item.time],['Related request','SR-0048217']];
      body.innerHTML='<div class="draft-call-metadata-grid">'+rows.map(([label,value])=>'<div><div class="draft-call-metadata-label">'+escapeText(label)+'</div><div class="draft-call-metadata-value">'+escapeText(value)+'</div></div>').join('')+'</div>';
    }
    body.querySelectorAll('details').forEach(disclosure=>{
      const section=document.createElement('section');section.className='draft-info-subsection';
      const heading=document.createElement('h5'),summary=disclosure.querySelector(':scope > summary');heading.textContent=summary?.textContent||'Source details';summary?.remove();
      section.append(heading,...disclosure.childNodes);disclosure.replaceWith(section);
    });
    const infoKey=item.type+':'+(item.thread||item.id);
    const accordion=document.createElement('details');accordion.className='communication-inline-info';
    const summary=document.createElement('summary');summary.innerHTML=infoIcon+'<span>'+label+'</span><svg class="communication-inline-info-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    accordion.append(summary,body);detail.querySelector('.communication-inline-info')?.remove();
    const heading=detail.querySelector(':scope > header');if(heading)heading.after(accordion);else detail.prepend(accordion);
    accordion.open=infoExpanded.get(infoKey)??false;infoOpen=accordion.open;
    accordion.addEventListener('toggle',()=>{infoExpanded.set(infoKey,accordion.open);infoOpen=accordion.open;});
    setInfoOpen(infoOpen);
  };
  function setComposerThreadContext() {
    const header=detail.querySelector('.draft-compose-header');if(!header)return;
    const item=items.find(message=>message.id===selected),base=item && threadFor(item).find(message=>!message.isDraft);
    if(!base || base.type!=='email')return;
    let context=header.querySelector('.draft-compose-thread-context');
    if(!context){context=document.createElement('div');context.className='draft-compose-thread-context';header.querySelector('[data-close-compose]').after(context);}
    context.innerHTML='<small>EMAIL THREAD · DRAFT REPLY</small><strong>'+escapeText(base.title.replace(/^Re:\s*/i,''))+'</strong>';
    const close=header.querySelector('[data-close-compose]');close.setAttribute('aria-label','Close draft and return to thread');close.title='Return to thread';
  }
  draftHost.addEventListener('message-draft-change',setComposerThreadContext);
  const summaryExpanded=new Map();
  const showDetail=(item,markRead=false,targetDetail=detail)=>{
    const detail=targetDetail;
    if(item.isDraft){updateInfo(item);setInfoOpen(false);draftHost.dispatchEvent(new CustomEvent('compose-email-reply',{detail:{to:item.to,cc:item.cc,bcc:item.bcc,subject:item.title,message:item.body}}));return;}
    detail.classList.remove('tp-email-composer','draft-chat-detail');
    detail.classList.toggle('draft-unconnected-call-detail',Boolean(item.missed||item.unanswered||item.cancelled));
    if(item.type==='email'||item.type==='chat') {
      const thread=threadFor(item).filter(message=>!message.isDraft);
      if(item.type==='chat'){
        detail.classList.add('draft-chat-detail');
        detail.innerHTML=`<header><div><span>${communicationAudience(item).toUpperCase()} CHAT · ${participantsFor(item).map(name=>name==='Riley Cruz'?'You':escapeText(name)).join(' &amp; ')}</span><h4>${escapeText(item.title)}</h4><p class="draft-chat-participant-roles">${participantsFor(item).map(name=>`${escapeText(name)} · ${escapeText(personLabel(name))}`).join('<br>')}</p></div><button type="button" data-add-chat-participant><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a7 7 0 0 1 14 0v2M20 8v6m-3-3h6"/></svg>Manage participants</button></header><div class="draft-chat-history">${[...thread].filter(m=>!m.isChatStart).reverse().map(message=>`<div class="draft-chat-entry ${message.author==='Riley Cruz'?'is-outgoing':''}"><span class="draft-chat-author">${escapeText(message.author)}${message.author==='Riley Cruz'?'':' · '+escapeText((people.find(person=>person.name===message.author)?.role||'Contact').split(' · ').pop())}</span><div class="draft-chat-message ${message.author==='Riley Cruz'?'is-outgoing':''}"><p>${escapeText(message.body)}</p>${host.attachmentHTML(message.attachments)}<div class="draft-chat-message-meta"><time>${listTime(message)}</time>${chatReceipt(message)}</div></div></div>`).join('')}</div><form class="draft-chat-compose"><textarea aria-label="Chat message" aria-describedby="chat-audience-note" placeholder="Write a message…" rows="2" required></textarea><button type="submit">Send<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 3-7 18-4-7-7-4 18-7ZM21 3 10 14"/></svg></button><small id="chat-audience-note" class="draft-chat-audience-note">${communicationAudience(item)==='External'?'Visible to all chat participants, including external contacts.':'Internal chat · Visible to these team members only.'}</small></form>`;
        const attachments=host.mountMessageAttachments(detail.querySelector('form'));
        detail.querySelector('form').onsubmit=event=>{event.preventDefault();const field=detail.querySelector('textarea'),copy=field.value.trim();if(!copy&&!attachments.files.length)return;const message={id:Date.now(),type:'chat',thread:item.thread||'chat-'+item.id,author:'Riley Cruz',title:item.title,summary:copy,time:'Just now',delivery:'sent',body:copy,attachments:[...attachments.files]};if(!item.thread)item.thread=message.thread;items.unshift(message);if(total)total.textContent=items.filter(i=>!i.isChatStart).length;showDetail(message,true);selected=message.id;render();};
        const history=detail.querySelector('.draft-chat-history');history.scrollTop=history.scrollHeight;
      } else detail.innerHTML=`<header><div><h4>${escapeText(item.title.replace('Re: ',''))}</h4></div></header><div class="tp-conversation-thread"><div class="draft-thread-toolbar"><span class="draft-thread-caption">${item.type==='email'?'Email thread':'Message thread'} · ${thread.length} ${thread.length===1?'entry':'entries'}</span><button type="button" data-expand-thread aria-label="Expand all" title="Expand all" aria-expanded="false"><svg class="tp-activity-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 7 4-4 4 4M8 17l4 4 4-4"/></svg><span>Expand all</span></button></div>${[...thread].sort((a,b)=>age(a)-age(b)).map((message,index)=>`<details ${message.unread||index===0?'open':''}><summary><strong>${escapeText(message.author)}</strong><time>${listTime(message)}</time><span>${escapeText(message.summary)}</span></summary><p>${escapeText(message.body)}</p></details>`).join('')}</div>`;
      if(item.type==='email'){
        const button=detail.querySelector('[data-expand-thread]'),messages=[...detail.querySelectorAll('.tp-conversation-thread > details')];
        const syncToggle=()=>{
          button.hidden=messages.length<=1;
          const expanded=messages.length>0&&messages.every(message=>message.open),label=expanded?'Collapse all':'Expand all';
          button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-label',label);button.title=label;
          button.querySelector('span').textContent=label;
          button.querySelector('path').setAttribute('d',expanded?'m8 3 4 4 4-4M8 21l4-4 4 4':'m8 7 4-4 4 4M8 17l4 4 4-4');
        };
        button.onclick=()=>{const expand=!messages.every(message=>message.open);messages.forEach(message=>message.open=expand);syncToggle();};
        messages.forEach(message=>message.addEventListener('toggle',syncToggle));syncToggle();
      }
      if(markRead)thread.forEach(m=>m.unread=false);
    } else {
      detail.innerHTML=item.id===1?originalDetail:`<header><div><span>${item.type==='call'?'CALL':item.type==='email'?'EMAIL':'MESSAGE'}</span><h4>${escapeText(item.title)}</h4></div></header><div class="tp-message-author"><span class="tp-avatar">${item.author.split(' ').slice(0,2).map(s=>s[0]).join('')}</span><p><strong>${escapeText(item.author)}</strong><small>${item.time}</small></p></div><div class="tp-message-copy">${item.cancelled?unconnectedCallMetadata(item)+cancelledCallDetail(item):item.unanswered?unconnectedCallMetadata(item)+unansweredCallDetail():item.missed?unconnectedCallMetadata(item)+missedCallDetail():item.type==='call'&&item.id===2?callDetail():`<p>${item.body}</p>`}</div>`;
      if(markRead)item.unread=false;
    }
    if(item.type==='call'){
      const header=detail.querySelector(':scope > header');header.classList.add('draft-call-header');
      const contact=item.contactName||(item.id===2?'Site reception':item.author),organization=item.organization||(item.id===2?'Rivergate House':'');
      const subtitle=document.createElement('p');subtitle.className='draft-call-subtitle';subtitle.textContent=[contact,item.phone||contactPhones[contact],organization||people.find(person=>person.name===contact)?.role,item.time].filter(Boolean).join(' · ');header.querySelector('div').append(subtitle);
      const button=document.createElement('button');button.type='button';button.dataset.demoCallBack='';button.className='draft-call-repeat';
      button.innerHTML=actionIcon('call')+'<span>'+(item.missed?'Call back':'Call again')+'</span>';header.append(button);
      detail.querySelector(':scope > .tp-message-author')?.remove();
    }
    if(item.type==='email'){
      const actions=document.createElement('div');actions.className='draft-email-reply-actions';
      actions.innerHTML='<button type="button" data-email-reply="sender" aria-label="Reply" title="Reply"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5-6 6 6 6M3 11h10a7 7 0 0 1 7 7"/></svg></button><button type="button" data-email-reply="all" aria-label="Reply all" title="Reply all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 5-6 6 6 6m6-12-6 6 6 6M7 11h8a7 7 0 0 1 7 7"/></svg></button><button type="button" data-email-reply="forward" aria-label="Forward" title="Forward"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5 6 6-6 6M21 11H11a7 7 0 0 0-7 7"/></svg></button>';
      const header=detail.querySelector('header');header.classList.add('draft-email-header');header.append(actions);
      const draft=threadFor(item).find(message=>message.isDraft);
      if(draft){const preview=document.createElement('section');preview.className='draft-thread-draft';preview.innerHTML='<div><strong>Draft reply</strong><p>Continue your reply in this conversation.</p></div><button type="button" data-resume-thread-draft>Edit draft</button>';detail.querySelector('.draft-thread-toolbar').after(preview);preview.querySelector('button').onclick=()=>{selected=item.id;draftHost.dispatchEvent(new CustomEvent('compose-email-reply',{detail:{to:draft.to,cc:draft.cc,bcc:draft.bcc,subject:draft.title,message:draft.body}}));setComposerThreadContext();};}
    }
    if(item.type==='email'||item.type==='chat'){
      const messages=threadFor(item).filter(message=>!message.isDraft&&!message.isChatStart&&message.body);
      const points=item.thread==='ventilation'?[
        'Ventilation on Level 4 stopped after a sensor alarm.',
        'The east meeting rooms are becoming warm.',
        'Reception can provide access to the plant room.',
        'Tenant photos are attached to the conversation.',
        'Riley requested confirmation of the affected unit.'
      ]:item.thread==='engineer'?[
        'Review the controller log and previous incidents before confirming dispatch.',
        'The controller log is attached to the assessment ticket.',
        'Reception is ready to provide access.',
        'Riley is waiting for confirmation that the review is complete.'
      ]:messages.map(message=>message.summary||message.body);
      if(points.length){
        const summary=document.createElement('section');summary.className='draft-call-summary draft-conversation-summary';summary.setAttribute('aria-label','AI summary');
        summary.innerHTML='<div class="draft-call-summary-heading"><h5><svg class="communication-ai-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 3 2.2 5.8L18 11l-5.8 2.2L10 19l-2.2-5.8L2 11l5.8-2.2L10 3ZM19 3v4m-2-2h4M20 16v5m-2.5-2.5h5"/></svg>AI summary</h5></div><ul>'+points.map((point,index)=>'<li'+(index>2?' hidden':'')+'>'+escapeText(point)+'</li>').join('')+'</ul>'+(points.length>3?'<button type="button" class="draft-summary-more" aria-expanded="false">Show more</button>':'');
        detail.querySelector(':scope > header').after(summary);
        const more=summary.querySelector('button');if(more)more.onclick=()=>{const expanded=more.getAttribute('aria-expanded')!=='true';summary.querySelectorAll('li').forEach((li,index)=>li.hidden=index>2&&!expanded);more.setAttribute('aria-expanded',String(expanded));more.textContent=expanded?'Show less':'Show more';};
      }
    }
    const summaryBlock=detail.querySelector('.draft-call-summary');
    if(summaryBlock){
      const key=item.type+':'+(item.thread||item.id),disclosure=document.createElement('details');
      disclosure.className=summaryBlock.className+' communication-summary-disclosure';disclosure.open=summaryExpanded.get(key)??true;
      const heading=document.createElement('summary');heading.className='draft-call-summary-heading';
      heading.append(...summaryBlock.querySelector('h5').childNodes);
      const chevron=document.createElement('span');chevron.className='communication-summary-chevron';chevron.setAttribute('aria-hidden','true');chevron.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';heading.append(chevron);
      summaryBlock.querySelector('.draft-call-summary-heading').remove();summaryBlock.querySelector('.draft-summary-more')?.remove();
      summaryBlock.querySelectorAll('li').forEach(li=>li.hidden=false);
      disclosure.append(heading,...summaryBlock.childNodes);summaryBlock.replaceWith(disclosure);
      disclosure.addEventListener('toggle',()=>summaryExpanded.set(key,disclosure.open));
    }
    if(targetDetail===panel.querySelector('[data-message-detail]'))updateInfo(item);
  };
  panel.referenceCommunication={information:id=>{const item=items.find(i=>i.id===Number(id));if(!item||item.type==='email')return null;return {label:{call:'Call info',email:'Email info',chat:'Chat info'}[item.type]||'Communication info',rows:[['From / contact',item.author],['Subject',item.title],['Last activity',item.time],['Messages',String(threadFor(item).length)],['Related request','SR-0048217']]};},items:()=>items.map(item=>({...item,audience:communicationAudience(item).toLowerCase()})),show:(id,target)=>{const item=items.find(item=>item.id===Number(id));if(item)showDetail(item,false,target);}};
  const close=()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');};
  const render=()=>{
    const savedListScroll=aside.scrollTop;
    list.style.minHeight=Math.max(0,aside.clientHeight-views.offsetHeight)+'px';
    create.innerHTML=`<span>${{timeline:'New',email:'New email',call:'New call',chat:'New chat'}[view]}</span>${actionIcon(view)}`;
    create.setAttribute('aria-label',view==='timeline'?'New communication':view==='email'?'New email':view==='call'?'New call':'New chat');
    if(view==='timeline'){create.setAttribute('aria-haspopup','menu');create.setAttribute('aria-expanded',String(!createMenu.hidden));}else{create.removeAttribute('aria-haspopup');create.removeAttribute('aria-expanded');}

    const channels=[...menu.querySelectorAll('[name="channel"]:checked')].map(e=>e.value);
    const audiences=[...menu.querySelectorAll('[name="audience"]:checked')].map(e=>e.value);
    const checked=name=>menu.querySelector(`[name="${name}"]`).checked;
    const count=channels.length+audiences.length+['unread','attachments','missed'].filter(checked).length;
    menu.querySelector('[data-clear-communication]').disabled=count===0;
    toggle.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6h18M6 12h12M9 18h6"/></svg> Filters'+(count?` <span>${count}</span>`:'');
    toggle.setAttribute('aria-label',count?`Filter communication, ${count} active filters`:'Filter communication');
    let visible;
    const matches=thread=>(!channels.length||channels.includes(thread[0].type))&&(!audiences.length||audiences.includes(communicationAudience(thread[0]).toLowerCase()))&&(!checked('unread')||thread.some(i=>i.unread))&&(!checked('attachments')||thread.some(i=>i.attachments))&&(!checked('missed')||thread.some(i=>i.missed));
    const groups=new Map();
    items.filter(i=>(view==='timeline'?!i.isChatStart:i.type===view)).forEach(item=>{
      const key=item.type+':'+(item.type==='call'?item.id:item.thread||item.id);
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);
    });
    visible=[...groups.values()].filter(matches).map(thread=>{
      const activity=thread.filter(message=>!message.isDraft);
      const latest=[...(activity.length?activity:thread)].sort((a,b)=>age(a)-age(b))[0],unread=activity.filter(m=>m.unread).length;
      return {...latest,author:latest.type==='chat'?(participantsFor(latest).join(', ')||latest.author):latest.author,id:(thread.find(message=>!message.isDraft)||latest).id,isDraft:thread.every(message=>message.isDraft),hasDraft:thread.some(message=>message.isDraft),title:(thread.find(message=>!message.isDraft)||latest).title.replace(/^Re:\s*/i,''),unread:unread>0,summary:latest.summary,threadCount:thread.filter(m=>!m.isChatStart&&!m.isDraft).length,unreadCount:unread};
    });
    visible.sort((a,b)=>Number(isPinned(b))-Number(isPinned(a))||age(a)-age(b));
    list.innerHTML=visible.map(i=>`<div role="button" tabindex="0" class="tp-message-row ${isPinned(i)?'is-message-pinned':''} ${(i.id===selected||(i.thread&&i.thread===items.find(m=>m.id===selected)?.thread))?'is-current':''} ${i.unread?'is-unread':''}" data-communication-id="${i.id}" aria-label="${i.unread?'Unread: ':''}${escapeText(i.author)}, ${escapeText(i.title)}"><div class="draft-message-top">${channelIcon(i)}<strong title="${escapeText(i.author)}">${escapeText(i.author)}</strong>${i.isDraft?'':`<button type="button" class="draft-message-pin ${isPinned(i)?'is-pinned':''}" data-pin-message="${i.id}" aria-label="${isPinned(i)?'Unpin':'Pin'} ${escapeText(i.title)}" title="${isPinned(i)?'Unpin':'Pin'}" aria-pressed="${isPinned(i)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3h8l-1 7 3 4H6l3-4-1-7ZM12 14v7"/></svg></button>`}</div><div class="draft-message-subject"><b title="${escapeText(i.title)}">${escapeText(i.title)}</b></div><small class="draft-message-preview">${escapeText(i.summary)}</small><div class="draft-message-meta">${i.type==='chat'?`<span class="draft-audience-label">${communicationAudience(i)}</span>`:''}${(i.type==='email'||i.type==='chat')?`<span class="draft-thread-count" title="${i.threadCount} ${i.type==='chat'?'messages':'emails'}${i.unreadCount?` · ${i.unreadCount} unread`:''}">${i.hasDraft?'Draft · '+i.threadCount+' emails':`${i.threadCount} ${i.type==='email'?'email':'msg'}${i.threadCount===1?'':'s'}${i.unreadCount?` · ${i.unreadCount} unread`: ''}`}</span>`:''}<time class="draft-message-time" title="${listTime(i)}" aria-label="${listTime(i)}">${compactListTime(i)}</time></div></div>` ).join('')||'<p class="tp-communication-empty" role="status">No communication matches these filters.</p>';
    aside.scrollTop=savedListScroll;
    let pinnedTop=0;list.querySelectorAll('.is-message-pinned').forEach(row=>{row.style.top=pinnedTop+'px';pinnedTop+=row.getBoundingClientRect().height;});
  };
  const activateView=channel=>{view=channel;views.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.communicationView===view)));compose.hidden=true;createMenu.hidden=true;};
  const startRingback=()=>{
    const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return ()=>{};
    let context;try{context=new AudioContext();}catch{return ()=>{};}
    const gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);
    const oscillator=context.createOscillator();oscillator.frequency.value=425;oscillator.connect(gain);oscillator.start();
    let stopped=false;
    const pulse=()=>{if(stopped||context.state!=='running')return;const t=context.currentTime;gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.045,t+.025);gain.gain.setValueAtTime(.045,t+.975);gain.gain.linearRampToValueAtTime(0,t+1);};
    context.resume().then(()=>{if(!stopped)pulse();}).catch(()=>{});
    const timer=setInterval(pulse,5000);
    const stop=()=>{if(stopped)return;stopped=true;clearInterval(timer);oscillator.stop();context.close().catch(()=>{});window.removeEventListener('pagehide',stop);};
    window.addEventListener('pagehide',stop,{once:true});return stop;
  };
  const openActiveCall=(contact,phone,previous=null)=>{
    const existing=document.querySelector('.relay-call-pip');if(existing){existing.querySelector('[data-call-minimize]').focus();return;}
    const call=document.createElement('section');call.className='relay-call-pip';call.setAttribute('aria-label','Active outgoing call');
    call.innerHTML='<header class="relay-call-drag"><span>Outgoing call · Demo</span><button type="button" data-call-minimize aria-label="Minimize call" aria-expanded="true">−</button></header><div class="relay-call-person"><div class="relay-call-ripples" aria-hidden="true"><i></i><i></i><i></i><span>☎</span></div><div><strong></strong><small></small></div></div><div class="relay-call-progress"><span data-call-status role="status">Connecting…</span><time data-call-time>00:00</time></div><p class="relay-call-hint">Setting up your call</p><footer><button type="button" data-call-mute aria-pressed="false">Mute</button><button type="button" data-call-end>Cancel call</button></footer>';
    const microphone='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/><path class="relay-mic-slash" d="m3 3 18 18"/></svg>';
    const hangup='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 15v-4a16 16 0 0 1 18 0v4h-5v-4a12 12 0 0 0-8 0v4H3Z"/></svg>';
    call.querySelector('[data-call-mute]').innerHTML=microphone+'<span>Mute</span>';
    call.querySelector('[data-call-mute]').setAttribute('aria-label','Mute microphone');
    call.querySelector('[data-call-end]').setAttribute('aria-label','End call');
    call.querySelector('[data-call-end]').innerHTML=hangup+'<span>Cancel call</span>';
    const normalizedPhone=value=>value.replace(/\D/g,'');
    const knownContact=people.find(person=>person.name===contact)||people.find(person=>contactPhones[person.name]&&normalizedPhone(contactPhones[person.name])===normalizedPhone(phone));
    if(knownContact){
      call.classList.add('has-contact-avatar');
      const avatar=call.querySelector('.relay-call-ripples span');avatar.textContent=knownContact.name.split(' ').slice(0,2).map(word=>word[0]).join('');
      call.querySelector('.relay-call-ripples').removeAttribute('aria-hidden');avatar.setAttribute('role','img');avatar.setAttribute('aria-label',knownContact.name);
    }
    if(!knownContact)call.querySelector('.relay-call-ripples').remove();
    call.querySelector('strong').textContent=knownContact?.name||contact||phone;call.querySelector('small').textContent=phone;document.body.append(call);const stopAurora=window.mountCallAurora?.(call)||(()=>{});
    const stopRingback=startRingback();
    const started=Date.now();let stage=-1;
    const stages=[{at:0,label:'Connecting…',hint:'Setting up your call'},{at:3,label:'Calling…',hint:'Contacting the recipient'},{at:7,label:'Ringing…',hint:'Waiting for an answer'}];
    const clock=seconds=>String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
    const tick=()=>{const elapsed=Math.floor((Date.now()-started)/1000);const next=stages.reduce((result,item,index)=>elapsed>=item.at?index:result,0);if(next!==stage){stage=next;call.querySelector('[data-call-status]').textContent=stages[stage].label;call.querySelector('.relay-call-hint').textContent=stages[stage].hint;call.dataset.state='calling';}call.querySelector('[data-call-time]').textContent=clock(elapsed);call.querySelector('[data-call-time]').setAttribute('aria-label','Waiting for answer '+elapsed+' seconds');};
    tick();const timer=setInterval(tick,1000);
    const personArea=call.querySelector('.relay-call-person');
    const toggleCallSize=()=>{call.classList.toggle('is-minimized');const expanded=!call.classList.contains('is-minimized');const button=call.querySelector('[data-call-minimize]');button.textContent='−';button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-label','Minimize call');personArea.tabIndex=expanded?-1:0;personArea.setAttribute('aria-expanded',String(expanded));if(expanded){personArea.removeAttribute('role');personArea.removeAttribute('title');}else{personArea.setAttribute('role','button');personArea.setAttribute('aria-label','Expand call with '+(knownContact?.name||contact||phone));personArea.title='Expand call';}requestAnimationFrame(()=>clampPosition());};
    call.querySelector('[data-call-minimize]').onclick=toggleCallSize;
    personArea.onclick=()=>{if(call.classList.contains('is-minimized'))toggleCallSize();};
    personArea.onkeydown=event=>{if(call.classList.contains('is-minimized')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();toggleCallSize();}};
    call.querySelector('[data-call-mute]').onclick=event=>{const button=event.currentTarget;const muted=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(muted));button.querySelector('span').textContent=muted?'Unmute':'Mute';button.setAttribute('aria-label',muted?'Unmute microphone':'Mute microphone');};
    call.querySelector('[data-call-end]').onclick=()=>{clearInterval(timer);stopRingback();stopAurora();const item={id:Date.now(),type:'call',author:contact||phone,cancelled:true,title:'Outgoing call cancelled',summary:'Call cancelled',time:'Just now',contactName:contact||phone,phone,organization:previous?.organization||'',previousCallId:previous?.previousCallId||null,body:'The outgoing call was cancelled before connecting.'};items.unshift(item);if(total)total.textContent=items.filter(i=>!i.isChatStart).length;call.remove();render();};
    const drag=call.querySelector('.relay-call-drag');let origin=null;
    const clampPosition=()=>{const rect=call.getBoundingClientRect();call.style.left=Math.max(8,Math.min(rect.left,innerWidth-rect.width-8))+'px';call.style.top=Math.max(8,Math.min(rect.top,innerHeight-rect.height-8))+'px';call.style.right='auto';call.style.bottom='auto';};
    drag.onpointerdown=event=>{if(event.target.closest('button'))return;const rect=call.getBoundingClientRect();origin={x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};drag.setPointerCapture(event.pointerId);};
    drag.onpointermove=event=>{if(!origin)return;call.style.left=origin.left+event.clientX-origin.x+'px';call.style.top=origin.top+event.clientY-origin.y+'px';call.style.right='auto';call.style.bottom='auto';clampPosition();};
    drag.onpointerup=drag.onpointercancel=()=>{origin=null;};
    const resize=()=>{if(call.isConnected)clampPosition();else window.removeEventListener('resize',resize);};window.addEventListener('resize',resize);
  };
  const openCallPicker=()=>{
    const dialog=document.createElement('dialog');dialog.className='draft-chat-people-dialog draft-create-dialog draft-new-call-dialog';
    dialog.innerHTML='<header><h3>New call</h3><button type="button" aria-label="Close creation dialog">×</button></header><div class="draft-call-picker-tabs" role="tablist" aria-label="Choose call recipient"><button type="button" role="tab" aria-selected="true" data-call-tab="contacts">Contacts</button><button type="button" role="tab" aria-selected="false" data-call-tab="phone">Phone number</button></div><section role="tabpanel" data-call-contacts><input type="search" aria-label="Search contacts" placeholder="Search by name, role or phone number"><div class="draft-people-results"></div></section><section role="tabpanel" data-call-phone hidden><label>Phone number<input type="tel" aria-label="Phone number" placeholder="+44 1632 960 000"></label></section><footer><button type="button" data-start-communication disabled>Call</button></footer>';
    panel.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.querySelector('header button').onclick=()=>dialog.close();
    let mode='contacts',selectedContact=null;
    const search=dialog.querySelector('[type="search"]'),phone=dialog.querySelector('[type="tel"]'),results=dialog.querySelector('.draft-people-results'),start=dialog.querySelector('[data-start-communication]');
    const update=()=>{start.closest('footer').hidden=mode==='contacts';start.disabled=mode==='contacts'?!selectedContact:!/^\+?[\d\s()-]{7,}$/.test(phone.value.trim());};
    const find=()=>{const query=search.value.trim().toLowerCase();results.replaceChildren();
      people.filter(person=>contactPhones[person.name]&&(person.name+' '+person.role+' '+contactPhones[person.name]).toLowerCase().includes(query)).forEach(person=>{
        const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','Call '+person.name);
        button.innerHTML='<span><strong></strong><small></small></span><span></span>';button.querySelector('strong').textContent=person.name;button.querySelector('small').textContent=contactPhones[person.name]+' · '+personLabel(person.name);button.lastElementChild.textContent='Call';button.lastElementChild.className='draft-contact-call-action';
        button.onclick=()=>{dialog.close();openActiveCall(person.name,contactPhones[person.name]);};results.append(button);
      });
      const empty=!results.children.length;
      results.classList.toggle('is-empty',empty);
      if(empty)results.textContent='No contacts found.';
      update();};
    search.oninput=find;phone.oninput=update;
    phone.inputMode='tel';
    const keypad=document.createElement('div');keypad.className='draft-phone-keypad';keypad.setAttribute('role','group');keypad.setAttribute('aria-label','Dial pad');
    const insertDigit=digit=>{const from=phone.selectionStart??phone.value.length,to=phone.selectionEnd??from;phone.value=phone.value.slice(0,from)+digit+phone.value.slice(to);phone.focus();phone.setSelectionRange(from+digit.length,from+digit.length);update();};
    ['1','2','3','4','5','6','7','8','9','*','0','#'].forEach(digit=>{const button=document.createElement('button');button.type='button';button.textContent=digit;button.setAttribute('aria-label','Dial '+digit);button.onclick=()=>insertDigit(digit);keypad.append(button);});
    const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','Insert plus');plus.onclick=()=>insertDigit('+');
    const erase=document.createElement('button');erase.type='button';erase.textContent='⌫';erase.setAttribute('aria-label','Delete digit');erase.onclick=()=>{const from=phone.selectionStart??phone.value.length,to=phone.selectionEnd??from,start=from===to?Math.max(0,from-1):from;phone.value=phone.value.slice(0,start)+phone.value.slice(to);phone.focus();phone.setSelectionRange(start,start);update();};
    keypad.append(plus,erase);dialog.querySelector('[data-call-phone]').append(keypad);
    dialog.querySelectorAll('[data-call-tab]').forEach(button=>button.onclick=()=>{mode=button.dataset.callTab;dialog.querySelectorAll('[data-call-tab]').forEach(tab=>tab.setAttribute('aria-selected',String(tab===button)));dialog.querySelector('[data-call-contacts]').hidden=mode!=='contacts';dialog.querySelector('[data-call-phone]').hidden=mode!=='phone';update();(mode==='contacts'?search:phone).focus();});
    start.onclick=()=>{const contact=mode==='contacts'?selectedContact:null,number=mode==='contacts'?contactPhones[contact]:phone.value.trim();dialog.close();openActiveCall(contact,number);};
    find();dialog.showModal();search.focus();
  };
  const startCommunication=(channel,prefill=null)=>{
    createMenu.hidden=true;create.setAttribute('aria-expanded','false');
    if(channel==='email'){document.querySelector('.task-prototype').dispatchEvent(new CustomEvent('compose-email-reply',{detail:{to:'',subject:'',cc:'',bcc:'',message:''}}));return;}
    const host=document.querySelector('.task-prototype');
    const open=()=>{
      if(channel==='call'){if(prefill?.contact)openActiveCall(prefill.contact,prefill.phone||contactPhones[prefill.contact]||'',prefill);else openCallPicker();return;}
      const dialog=document.createElement('dialog');dialog.className='draft-chat-people-dialog draft-create-dialog';
      dialog.innerHTML='<header><h3>New chat</h3><button type="button" aria-label="Close creation dialog">×</button></header><p>Start a conversation with a participant.</p><input type="search" aria-label="Search participants" placeholder="Search by name or role"><div class="draft-people-results"></div>';
      panel.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.querySelector('header button').onclick=()=>dialog.close();
      const search=dialog.querySelector('input'),results=dialog.querySelector('.draft-people-results');
      const find=()=>{const query=search.value.trim().toLowerCase();const matches=people.filter(person=>person.name!=='Riley Cruz'&&(person.name+' '+person.role+' '+person.audience).toLowerCase().includes(query));results.innerHTML=matches.map(person=>`<button type="button" data-person="${person.name}" aria-label="Start chat with ${person.name}"><span><strong>${person.name}</strong><small>${personLabel(person.name)}</small></span><span>Start chat</span></button>`).join('')||'<p>No people found.</p>';};
      search.oninput=find;
      results.onclick=event=>{const button=event.target.closest('[data-person]');if(!button)return;const target=button.dataset.person;dialog.close();const id=Date.now(),thread='chat-'+id,item={id,type:'chat',thread,author:target,title:'Chat with '+target,summary:'Start the conversation',time:'Just now',body:'',isChatStart:true};chatParticipants.set(thread,['Riley Cruz',target]);items.unshift(item);selected=id;activateView('chat');showDetail(item);render();detail.querySelector('textarea').focus();};
      find();dialog.showModal();search.focus();
    };
    if(host.messageDraft?.hasChanges()&&detail.classList.contains('tp-email-composer'))host.confirmRequestLeave(open);else open();
  };
  create.onclick=()=>{if(view==='timeline'){createMenu.hidden=!createMenu.hidden;create.setAttribute('aria-expanded',String(!createMenu.hidden));}else startCommunication(view);};
  createMenu.onclick=event=>{const button=event.target.closest('[data-create-channel]');if(button)startCommunication(button.dataset.createChannel);};
  document.addEventListener('click',event=>{if(!toolbar.contains(event.target)){createMenu.hidden=true;create.setAttribute('aria-expanded','false');}});
  toolbar.addEventListener('keydown',event=>{if(event.key==='Escape'){createMenu.hidden=true;create.setAttribute('aria-expanded','false');}});
  toggle.onclick=()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));};
  menu.addEventListener('change',render);
  menu.querySelector('[data-clear-communication]').onclick=()=>{menu.querySelectorAll('input').forEach(e=>e.checked=false);render();};
  document.addEventListener('click',e=>{if(!toolbar.contains(e.target))close();});
  toolbar.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){e.stopPropagation();close();toggle.focus();}});
  list.addEventListener('keydown',e=>{if(e.target.matches('[data-communication-id]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.target.click();}});
  list.addEventListener('click',e=>{
    const pin=e.target.closest('[data-pin-message]');if(pin){const id=Number(pin.dataset.pinMessage),item=items.find(i=>i.id===id);if(!item||item.isDraft)return;const unpin=isPinned(item);pinnedMessages.clear();if(!unpin)threadFor(item).forEach(i=>pinnedMessages.add(i.id));render();list.querySelector(`[data-pin-message="${id}"]`)?.focus();return;}
    const row=e.target.closest('[data-communication-id]');if(!row)return;
    const item=items.find(i=>i.id===Number(row.dataset.communicationId));selected=item.id;
    showDetail(item,true);
    render();
  });
  views.addEventListener('click',event=>{
    const button=event.target.closest('[data-communication-view]');if(!button)return;
    const previousScroll=aside.scrollTop;
    view=button.dataset.communicationView;
    views.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    const channelFields=menu.querySelector('[name="channel"]').closest('fieldset');channelFields.hidden=view!=='timeline';
    if(view!=='timeline')channelFields.querySelectorAll('input').forEach(input=>input.checked=false);
    for(const name of ['missed','attachments']){const input=menu.querySelector(`[name="${name}"]`);input.disabled=name==='missed'?!['timeline','call'].includes(view):!['timeline','email'].includes(view);if(input.disabled)input.checked=false;input.closest('label').hidden=input.disabled;}
    compose.hidden=true;createMenu.hidden=true;
    if(view!=='timeline'&&items.find(i=>i.id===selected)?.type!==view)selected=items.find(i=>i.type===view).id;
    close();showDetail(items.find(i=>i.id===selected));render();
    aside.scrollTop=Math.min(previousScroll,infoHeading.offsetHeight+toolbar.offsetHeight);
  });
  document.querySelector('.task-prototype').addEventListener('restore-communication-detail',()=>{const item=items.find(i=>i.id===selected);const base=item && threadFor(item).find(message=>!message.isDraft);selected=(base||items[0]).id;showDetail(base||items[0]);render();});
  draftHost.addEventListener('message-draft-saved',event=>{const data=event.detail;if(!data.subject&&!data.message)return;let draft=items.find(i=>i.isDraft);if(!draft){draft={...draftItem};items.unshift(draft);}Object.assign(draft,{title:data.subject||'(No subject)',body:data.message,to:data.to,cc:data.cc,bcc:data.bcc,time:'Just now'});render();});
  draftHost.addEventListener('message-draft-cleared',()=>{const index=items.findIndex(i=>i.isDraft);if(index!==-1)items.splice(index,1);if(!items.some(i=>i.id===selected))selected=1;render();});
  showDetail(items.find(i=>i.id===selected));
  render();
})();
