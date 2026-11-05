(() => {
  const host=document.querySelector('[data-task-prototype]');if(!host?.requestFiles)return;
  host.querySelectorAll('.tp-documents-workspace').forEach(panel=>{
    const preview=panel.querySelector('[data-file-preview]');if(!preview)return;
    const primary=panel.matches('[data-panel="files"]');
    let disclosure=panel.fileDetailsDisclosure;
    if(!disclosure){
      disclosure=document.createElement('details');disclosure.className='tp-adaptive-file-details';
      disclosure.innerHTML='<summary><strong>File details</strong><span class="tp-adaptive-file-status" hidden></span></summary><div class="tp-adaptive-file-details-content"></div>';
      panel.fileDetailsDisclosure=disclosure;preview.before(disclosure);
    }
    let lastKey='';
    function sync(){
      if(!panel.clientWidth)return;
      const compact=panel.clientWidth<760;
      if(panel.classList.contains('wp-files-single-view')!==compact)panel.classList.toggle('wp-files-single-view',compact);
      if(compact)panel.classList.remove('wp-compact-info-open');
      const title=preview.querySelector('.tp-preview-title');
      if(compact&&title&&title.nextElementSibling!==disclosure)title.after(disclosure);
      else if(!compact&&disclosure.parentElement===preview)preview.before(disclosure);
      if(primary)return;
      const key=panel.querySelector('[data-file-key].is-current')?.dataset.fileKey;
      const file=host.requestFiles.comparisonFiles().find(f=>f.key===key);if(!file||lastKey===key)return;lastKey=key;
      const state=host.requestFiles.status(key),badge=disclosure.querySelector('.tp-adaptive-file-status');
      badge.textContent=state==='requiresAttention'?'Needs validation':state==='passed'?'Validated':'';badge.hidden=!badge.textContent;badge.dataset.validated=String(state==='passed');
      const content=disclosure.querySelector('.tp-adaptive-file-details-content');content.replaceChildren();const section=document.createElement('section'),heading=document.createElement('h4'),list=document.createElement('dl');heading.textContent='File information';
      for(const [label,value] of [['File name',file.name],['Type / size',file.kind+' · '+file.size],['Uploaded',file.date],['Uploaded by',file.by],['Related work',file.related]]){if(!value)continue;const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);list.append(row);}section.append(heading,list);content.append(section);
    }
    new ResizeObserver(sync).observe(panel);
    new MutationObserver(()=>queueMicrotask(sync)).observe(panel,{attributes:true,attributeFilter:['hidden']});
    new MutationObserver(sync).observe(preview,{childList:true});
    panel.addEventListener('click',()=>queueMicrotask(sync));panel.addEventListener('change',()=>queueMicrotask(sync));
    sync();
  });
})();
