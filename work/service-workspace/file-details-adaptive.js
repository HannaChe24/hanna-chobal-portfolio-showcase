(() => {
  const host=document.querySelector('[data-task-prototype]');
  const panel=host?.querySelector('[data-panel="files"]'),inspector=panel?.querySelector('#tp-file-inspector'),preview=panel?.querySelector('[data-file-preview]');
  if(!panel||!inspector||!preview)return;
  const disclosure=document.createElement('details');disclosure.className='tp-adaptive-file-details';panel.fileDetailsDisclosure=disclosure;
  const summary=document.createElement('summary'),title=document.createElement('strong'),badge=document.createElement('span');
  title.textContent='File details';badge.className='tp-adaptive-file-status';summary.append(title,badge);
  const content=document.createElement('div');content.className='tp-adaptive-file-details-content';disclosure.append(summary,content);preview.before(disclosure);
  summary.addEventListener('click',event=>{if(event.target.closest('.tp-review-confirm'))event.stopPropagation();});
  let snapshot='';
  const update=()=>{
    const selected=panel.querySelector('[data-file-key].is-current');
    const status=selected?.querySelector('.tp-file-status')?.textContent||'';
    if(badge.textContent!==status)badge.textContent=status;badge.hidden=!status;
    badge.dataset.validated=String(status==='Validated');
    disclosure.hidden=!panel.classList.contains('wp-file-details-stacked');
    const editing=Boolean(host.requestPermissions?.canEdit&&inspector.querySelector('.tp-document-review-fields'));
    if(editing&&panel.classList.contains('wp-file-details-stacked')){
      if(inspector.parentElement!==content){content.replaceChildren(inspector);disclosure.open=true;}
      inspector.hidden=false;
      const slot=inspector.querySelector('.tp-review-confirm');
      if(slot){summary.querySelector('.tp-review-confirm')?.remove();summary.append(slot);}
      return;
    }
    const header=inspector.querySelector(':scope > header'),slot=summary.querySelector('.tp-review-confirm');
    if(slot){if(editing&&header)header.append(slot);else slot.remove();}
    if(inspector.parentElement===content)panel.insertBefore(inspector,panel.querySelector('[data-file-preview]'));
    const values=inspector.querySelector('.tp-file-readonly-values');
    const metadata=inspector.querySelector('.tp-file-info');
    const next=(selected?.dataset.fileKey||'')+(values?.outerHTML||'')+(metadata?.outerHTML||'');
    if(next===snapshot)return;snapshot=next;content.replaceChildren();
    // Keep this compact disclosure informational; editing stays in the review flow.
    if(values){const section=values.cloneNode(true);section.querySelectorAll('button').forEach(e=>e.remove());content.append(section);}
    else {
      const form=inspector.querySelector('.tp-validation form');
      if(form){const section=document.createElement('section'),heading=document.createElement('h4'),list=document.createElement('dl');heading.textContent='Extracted data';
        form.querySelectorAll('label').forEach(label=>{const input=label.querySelector('input,select,textarea');if(!input)return;const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=(label.querySelector(':scope > span')?.textContent||'').replace(/\*/g,'').trim();dd.textContent=(input.type==='date'?window.prototypeDates?.format(input.value):input.tagName==='SELECT'?input.selectedOptions[0]?.textContent:input.value)||'—';row.append(dt,dd);list.append(row);});section.append(heading,list);content.append(section);}
    }
    if(metadata){const section=metadata.cloneNode(true);if(!section.querySelector('h4')){const heading=document.createElement('h4');heading.textContent='File information';section.prepend(heading);}content.append(section);}
    content.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
  };
  const resize=()=>{if(panel.clientWidth){panel.style.setProperty('--file-pane-height',panel.clientHeight+'px');panel.classList.toggle('wp-file-details-stacked',panel.clientWidth<1000);update();}};
  new ResizeObserver(resize).observe(panel);
  new MutationObserver(update).observe(inspector,{childList:true,subtree:true,characterData:true});
  panel.addEventListener('click',event=>{if(event.target.closest('[data-file-key]'))queueMicrotask(update);});
  host.addEventListener('request-edit-permission-changed',()=>queueMicrotask(update));
  update();resize();
})();
