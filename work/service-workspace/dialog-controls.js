(() => {
  const selector='[data-task-prototype] dialog,dialog.draft-new-request';
  const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  function enhance(dialog){
    if(dialog.dataset.closeControlReady)return;
    dialog.dataset.closeControlReady='true';
    let button=dialog.querySelector('button[aria-label^="Close"],button[data-workflow-close],button[data-close]');
    if(!button){
      button=document.createElement('button');button.type='button';button.setAttribute('aria-label','Close dialog');
      button.addEventListener('click',()=>{
        // Use the same cancellation path as Escape, including unsaved-change guards.
        if(dialog.dispatchEvent(new Event('cancel',{cancelable:true})))dialog.close('cancel');
      });
      dialog.prepend(button);
    }
    button.classList.add('tp-dialog-close');button.title=button.getAttribute('aria-label')||'Close dialog';button.innerHTML=icon;
    const title=dialog.querySelector('h2,h3');if(title){title.classList.add('tp-dialog-title');if(!dialog.hasAttribute('aria-labelledby')){title.id ||= 'dialog-title-'+crypto.randomUUID();dialog.setAttribute('aria-labelledby',title.id);}}
  }
  const scan=()=>document.querySelectorAll(selector).forEach(enhance);
  scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
})();
