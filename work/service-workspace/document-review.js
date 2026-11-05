(() => {
  const host=document.querySelector('[data-task-prototype]'),files=host?.querySelector('[data-panel="files"]');
  if(!files || !host.requestFiles)return;
  const screen=files.querySelector('#tp-file-inspector');
  const target=screen;
  host.inlineFileValidation=true;
  host.inlineFileInfoClosed=false;
  const fileSplitter=document.createElement('div');fileSplitter.className='tp-file-selection-splitter';fileSplitter.tabIndex=0;fileSplitter.setAttribute('role','separator');fileSplitter.setAttribute('aria-orientation','vertical');fileSplitter.setAttribute('aria-label','Resize File details');files.append(fileSplitter);
  let selectionWidth=280;
  let detailsWidth=400;
  const syncSelectionWidth=()=>{
    const width=files.clientWidth;selectionWidth=width/3;const active=width>=1000&&!files.classList.contains('is-inspector-collapsed')&&!files.classList.contains('is-preview-wide');
    fileSplitter.hidden=!active;
    if(!active){files.style.removeProperty('grid-template-columns');return;}
    if(files.classList.contains('is-files-collapsed'))files.classList.remove('is-files-collapsed');
    const maximum=width-selectionWidth-320;detailsWidth=Math.max(280,Math.min(maximum,detailsWidth));
    files.style.setProperty('grid-template-columns',selectionWidth+'px '+detailsWidth+'px minmax(0,1fr)','important');
    fileSplitter.style.left=(selectionWidth+detailsWidth)+'px';fileSplitter.setAttribute('aria-valuemin','280');fileSplitter.setAttribute('aria-valuemax',String(Math.round(maximum)));fileSplitter.setAttribute('aria-valuenow',String(Math.round(detailsWidth)));
  };
  fileSplitter.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();fileSplitter.setPointerCapture(event.pointerId);});
  fileSplitter.addEventListener('pointermove',event=>{if(!fileSplitter.hasPointerCapture(event.pointerId))return;detailsWidth=event.clientX-files.getBoundingClientRect().left-selectionWidth;syncSelectionWidth();});
  fileSplitter.addEventListener('pointerup',event=>{if(fileSplitter.hasPointerCapture(event.pointerId))fileSplitter.releasePointerCapture(event.pointerId);});
  fileSplitter.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();detailsWidth=event.key==='Home'?280:event.key==='End'?files.clientWidth-selectionWidth-320:detailsWidth+(event.key==='ArrowLeft'?-16:16);syncSelectionWidth();});
  new ResizeObserver(syncSelectionWidth).observe(files);
  new MutationObserver(syncSelectionWidth).observe(files,{attributes:true,attributeFilter:['class']});
  let key='inspection',showAllRules=false,opening=false;
  let validationReceipts={};
  try {validationReceipts=JSON.parse(sessionStorage.getItem('portfolio-document-validation-receipts')||'{}');}catch{}
  delete validationReceipts.inspection;
  validationReceipts.summary=host.documentValidationExample;
  files.addEventListener('click',event=>{
    const button=event.target.closest('.tp-review-confirm [type="submit"]');
    if(!button||button.disabled)return;
    const received=target.querySelector('[data-approval-received]');
    if(received){
      received.checked=true;
      host.documentReviewApproval='approved';
      try {sessionStorage.setItem('portfolio-document-review-approval','approved');}catch{}
    }
  },true);
  const alignReviewHeader=()=>{};
  host.requestFiles.openReview=fileKey=>{
    if(opening)return;
    if(host.requestPermissions&&!host.requestPermissions.canEdit){host.requestFiles.closeReviewWorkspace();return;}
    opening=true;host.inlineFileInfoClosed=false;key=fileKey;showAllRules=false;
    host.requestFiles.openReviewWorkspace(key,target,!host.requestFiles.reviewChecks(key).dataReviewed);
    files.classList.add('is-file-info-validation');
    opening=false;
  };
  host.addEventListener('click',event=>{
    if(opening)return;
    const file=event.target.closest('[data-file-key]');
    if(file&&!files.contains(file))return;
    const tab=event.target.closest('[data-tab="files"]');
    if(!file&&!tab)return;
    const selected=file?.dataset.fileKey||files.querySelector('[data-file-key].is-current')?.dataset.fileKey;
    if(selected && (host.requestPermissions?.canEdit||!host.inlineFileInfoClosed) && host.requestFiles.status(selected)!=='notApplicable')queueMicrotask(()=>host.requestFiles.openReview(selected));
  },true);
  host.addEventListener('request-edit-permission-changed',()=>{
    if(!host.requestPermissions.canEdit){host.requestFiles.closeReviewWorkspace();return;}
    const selected=files.querySelector('[data-file-key].is-current')?.dataset.fileKey;
    if(selected&&host.requestFiles.status(selected)!=='notApplicable')host.requestFiles.openReview(selected);
  });
  const paintResults=()=>{
    if(screen.hidden)return;
    const checks=host.requestFiles.reviewChecks(key),errors=Object.entries(checks.issues||{}).filter(([,message])=>message);
    const approved=!checks.approvalCount,done=Boolean(checks.dataReviewed);
    const fields=target.querySelector('.tp-document-review-fields'),form=fields?.querySelector('.tp-validation form');
    if(!fields || !form)return;
    const controlFor=caption=>[...form.querySelectorAll('label')].find(label=>label.querySelector(':scope > span')?.textContent.replace(/\*/g,'').trim()===caption)?.querySelector('input,select,textarea');
    const dates=form.querySelectorAll('input[type="date"]'),equipment=controlFor('Elevator ID'),type=form.elements.inspectionType,inspector=controlFor('Inspector'),notes=controlFor('Additional notes');
    const rule=(title,passed,message,control,page)=>({title,passed:Boolean(passed),message,control,page});
    const allRules=key==='inspection'?[
      rule('Sensor status matches the report',!checks.issues.sensor,'Extracted value conflicts with the report. Verify the failed sensor status.',form.elements.sensor,3),
      rule(checks.issues.certificate?'Certification number could not be read':'Certification number is provided',!checks.issues.certificate,'The reference is blurred in the scan. Check the original certificate or request a clearer copy, then enter the number manually.',form.elements.certificate,4),
      rule('Inspection date is provided',dates[0]?.value,'Enter the inspection date shown in the document.',dates[0],1),
      rule('Equipment ID uses the expected format',/^E-\d{2}$/.test(equipment?.value||''),'Use the equipment ID format E-02.',equipment,1),
      rule('Inspection type is specified',type?.value,'Select the inspection type.',type,6),
      rule('Inspector is specified',inspector?.value,'Select the inspector named in the report.',inspector,6),
      rule('Next inspection date is provided',dates[1]?.value,'Enter the next inspection due date.',dates[1],6),
      rule('Next inspection follows the inspection date',!dates[0]?.value||!dates[1]?.value||dates[1].value>dates[0].value,'The next inspection must be later than the inspection date.',dates[1],6),
      rule('Source document is a PDF',/\.pdf$/i.test(files.querySelector('[data-preview-file-select] option:checked')?.textContent||files.querySelector('.tp-preview-title strong')?.textContent||''),'A PDF inspection report is required.',null,1),
      rule('Notes stay within 1,000 characters',(notes?.value.length||0)<=1000,'Shorten additional notes to 1,000 characters.',notes,null)
    ]:Object.entries(checks.issues||{}).map(([name,message])=>rule('Approval reference is provided',!message,message,form.elements[name],null));
    const failed=allRules.filter(item=>!item.passed),errorCount=failed.length,blocked=errorCount>0;
    // Additional rules participate in native form validation as well as the summary.
    [equipment,dates[0],dates[1],type,inspector,notes].filter(Boolean).forEach(control=>{
      const failures=failed.filter(item=>item.control===control),message=failures.map(item=>item.message).join(' ');
      control.setCustomValidity(message);control.setAttribute('aria-invalid',String(Boolean(message)));
      const label=control.closest('label');let error=label.querySelector('[data-review-rule-error]');
      if(message&&!error){error=document.createElement('small');error.dataset.reviewRuleError='';label.append(error);}
      if(error){error.textContent=message;error.hidden=!message;}
    });
    fields.querySelector('.tp-review-results-header')?.remove();
    const confirmSlot=screen.querySelector('.tp-review-confirm')||files.querySelector('.tp-adaptive-file-details > summary .tp-review-confirm');
    const submit=form.querySelector('[type="submit"]');
    if(submit){form.id='document-review-data-form';submit.setAttribute('form',form.id);confirmSlot.replaceChildren(submit);}
    const summary=screen.querySelector('[data-review-state]');
    summary.textContent=done?'Data reviewed':errorCount?errorCount+' of '+allRules.length+' checks failed':'All rules passed';
    summary.dataset.tone=errorCount?'error':done?'success':'pending';summary.hidden=true;
    const confirm=confirmSlot.querySelector('[type="submit"]');
    confirmSlot.querySelector('[data-validation-status]')?.remove();
    if(confirm){confirm.hidden=done;confirm.disabled=blocked||done;confirm.textContent='Confirm';confirm.setAttribute('aria-describedby','document-review-summary');}
    const fileLine=screen.querySelector('[data-review-file]'),fileName=document.createElement('span');fileName.className='tp-review-file-name';fileName.textContent=files.querySelector('.tp-preview-title strong')?.textContent||'Selected document';fileLine.replaceChildren(fileName);
    if(done){const status=document.createElement('span');status.dataset.documentValidated='';status.textContent='Validated';status.setAttribute('role','status');fileLine.append(status);}
    target.querySelector('.tp-review-rules')?.remove();
    const validation=fields.querySelector('.tp-validation');
    validation.querySelector('h4').firstChild.textContent='Extracted data ';
    validation.querySelector('.tp-validation-count').hidden=true;
    if(!validation.querySelector('.tp-extracted-ai-label')){const badge=document.createElement('span');badge.className='tp-extracted-ai-label';badge.textContent='AI extracted';validation.querySelector('h4').append(badge);}
    validation.querySelector(':scope > p').textContent='The sparkle marks AI-extracted values. Compare with the document before confirming.';
    if(!form.dataset.reviewLayout){
      form.querySelectorAll('label').forEach(label=>{
        const control=label.querySelector('input,select,textarea');if(!control)return;
        if(!done && !control.disabled){control.readOnly=false;control.removeAttribute('aria-readonly');}
        const caption=label.querySelector(':scope > span');
        if(caption){const text=caption.textContent.replace(/\*/g,'').trim();caption.textContent=text;
          if(control.required){const marker=document.createElement('span');marker.className='tp-required-mark';marker.textContent='*';marker.setAttribute('aria-hidden','true');caption.prepend(marker,' ');}}

        if(control.type==='date')label.dataset.fieldSize='date';
        else if(label.textContent.includes('Elevator ID'))label.dataset.fieldSize='short';
        else if(label.textContent.includes('Additional notes')){
          label.dataset.fieldSize='notes';
          const counter=document.createElement('small');counter.className='tp-notes-counter';
          const update=()=>counter.textContent=(1000-control.value.length).toLocaleString('en-GB')+' characters remaining';
          control.addEventListener('input',update);update();label.append(counter);
        }
        else label.dataset.fieldSize='standard';
        if(control.value && !['certificate','reference'].includes(control.name) && !label.textContent.includes('Additional notes')){
          const wrap=document.createElement('span');wrap.className='tp-review-ai-field';
          const field=control.closest('.draft-select')||control;field.before(wrap);wrap.append(field);
          const icon=document.createElement('span');icon.className='tp-review-ai-icon';icon.title='AI-extracted value';icon.setAttribute('aria-hidden','true');
          icon.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7Z"/></svg>';
          wrap.append(icon);control.setAttribute('aria-description','AI-extracted value');
        }
      });
      form.dataset.reviewLayout='ready';
    }
    form.querySelectorAll('label[data-field-size]').forEach(label=>{
      label.classList.toggle('is-validated-value',done);label.querySelector('.tp-validated-value')?.remove();
      if(!done)return;
      const control=label.querySelector('input,select,textarea'),value=document.createElement('span');value.className='tp-validated-value';
      let text=control?.tagName==='SELECT'?control.selectedOptions[0]?.textContent:control?.value;
      if(control?.type==='date'&&text)text=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(text+'T12:00:00'));
      value.textContent=text||'—';label.append(value);
    });
    let approval=fields.querySelector('.tp-review-approval-status');
    if(!approval){
      approval=document.createElement('section');approval.className='tp-review-approval-status';approval.setAttribute('aria-label','Review confirmation');
      fields.append(approval);
    const metadata=fields.querySelector(".tp-review-file-details");if(metadata)fields.append(metadata);
    }
    if(!approval.querySelector('[data-approval-received]')){
      approval.innerHTML='<p>Review confirmation</p><label class="tp-inline-approval-statement"><input type="checkbox" data-approval-received><span>I have checked the extracted data against the document and completed the missing information.</span></label>';
      const received=approval.querySelector('[data-approval-received]');received.checked=approved;
      received.addEventListener('change',paintResults);
    }
    const received=approval.querySelector('[data-approval-received]');
    received.disabled=done;received.required=true;received.setAttribute('form',form.id);
    if(done)received.checked=true;
    if(confirm)confirm.disabled=blocked||done||!received.checked;
    fields.querySelector('.tp-validation-receipt')?.remove();
    const rules=document.createElement('section');rules.className='tp-review-rules';rules.setAttribute('aria-label','Document checks');
    const ruleHeader=document.createElement('header'),heading=document.createElement('h4');heading.textContent='Document checks';
    const toggle=document.createElement('button');toggle.type='button';toggle.textContent=showAllRules?'Show failed only':'Show all '+allRules.length+' checks';toggle.setAttribute('aria-expanded',String(showAllRules));toggle.onclick=()=>{showAllRules=!showAllRules;paintResults();};ruleHeader.append(heading);
    const count=document.createElement('p');count.className='tp-review-rule-count';count.dataset.tone=failed.length?'error':'success';count.textContent=failed.length?failed.length+' of '+allRules.length+' checks failed':allRules.length+' of '+allRules.length+' checks passed';
    const list=document.createElement('ul');list.className='tp-review-rule-list';
    (showAllRules?allRules:failed).forEach(item=>{
      const row=document.createElement('li');row.dataset.ruleState=item.passed?'passed':'failed';
      const icon=document.createElement('span');icon.className='tp-review-rule-icon';icon.setAttribute('aria-label',item.passed?'Passed':'Failed');icon.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(item.passed?'m5 12 4 4L19 6':'m6 6 12 12M18 6 6 18')+'"/></svg>';
      const body=document.createElement('div'),title=document.createElement('span');title.textContent=item.title;
      if(!item.passed){const copy=document.createElement('p');copy.textContent=item.message;body.append(title,copy);}else body.append(title);
      row.append(icon,body);list.append(row);
    });
    const titleGroup=document.createElement('div');titleGroup.className='tp-review-check-title';titleGroup.append(heading,count);ruleHeader.prepend(titleGroup);rules.append(ruleHeader,list,toggle);toggle.className='tp-review-show-checks';fields.prepend(rules);
    confirmSlot.querySelector('[data-edit-reviewed-data]')?.remove();
    fields.append(approval);
    const metadata=fields.querySelector(".tp-review-file-details");if(metadata)fields.append(metadata);
    if(done){
      const receipt=document.createElement('section');receipt.className='tp-validation-receipt';receipt.setAttribute('aria-label','Validation details');
      let entry=validationReceipts[key];
      if(!entry){
        try {const saved=JSON.parse(sessionStorage.getItem('portfolio-service-request-v1')||'null');
          if(saved?.files?.[key]?.checked&&Number.isFinite(Date.parse(saved.savedAt)))entry={by:'Riley Cruz',at:saved.savedAt,source:'record-save'};
        }catch{}
      }
      const title=document.createElement('strong');title.textContent='Confirmed by '+(entry?.by||'Riley Cruz');receipt.append(title);
      if(entry){const time=document.createElement('time');time.dateTime=entry.at;time.textContent=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(entry.at));receipt.append(time);}
      approval.append(receipt);
    }
    alignReviewHeader();

  };
  host.addEventListener('document-review-rendered',paintResults);
  host.addEventListener('file-fields-changed',()=>queueMicrotask(paintResults));
  host.addEventListener('document-review-completed',()=>{
    if(screen.hidden)return;
    validationReceipts[key]={by:'Riley Cruz',at:new Date().toISOString()};
    try {sessionStorage.setItem('portfolio-document-validation-receipts',JSON.stringify(validationReceipts));}catch{}
    host.requestFiles.openReviewWorkspace(key,target,false);
  });
})();
