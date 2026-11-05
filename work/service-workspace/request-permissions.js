// Request ownership controls editing across all sections; viewing stays available.
function canEditServiceRequest(owner,currentUser='Riley Cruz'){return owner===currentUser;}
if(typeof module!=='undefined')module.exports={canEditServiceRequest};
(() => {
  if(typeof document==='undefined')return;
  const host=document.querySelector('[data-task-prototype]'),screen=host?.querySelector('[data-screen="case"]');if(!screen)return;
  const currentUser='Riley Cruz';let requestId='SR-0048217',owner=screen.querySelector('[data-ticket-owner], [data-ticket-reassign], .tp-coordinator-link')?.textContent.trim()||currentUser;
  const assignments=new Map(),locked=new Map(),editable=new Map();
  const banner=document.createElement('div');banner.className='tp-ticket-mode-alert tp-request-mode-alert';banner.setAttribute('role','status');banner.hidden=true;
  banner.innerHTML='<svg class="tp-view-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg><div><strong>View mode only</strong><span data-request-permission-message></span></div><button type="button" data-claim-request>Assign to Me</button>';
  screen.querySelector(':scope > header').after(banner);
  banner.querySelector('button').onclick=()=>host.claimServiceRequest?.();
  host.querySelectorAll('.tp-topbar .tp-user-avatar').forEach((avatar,index)=>{
    const text='Riley Cruz · Coordinator · You';
    avatar.removeAttribute('title');avatar.setAttribute('tabindex','0');avatar.setAttribute('aria-label',text);
    const tooltip=document.createElement('span');tooltip.className='tp-user-tooltip';tooltip.id='current-user-tooltip-'+index;tooltip.setAttribute('role','tooltip');tooltip.innerHTML='Riley Cruz <span class="tp-user-tooltip-chip">You</span> · Coordinator';
    avatar.setAttribute('aria-describedby',tooltip.id);avatar.append(tooltip);
  });
  const viewingSelectors=[
    '.tp-comment-launch','.tp-comment-compose-close','.tp-ticket-comment-composer textarea','.tp-ticket-comment-composer button[type="submit"]','.tp-review-show-checks','.wp-resize','.tp-email-splitter','.tp-ticket-splitter','.draft-summary-more','.tp-comment-search input', '.wp-footer-more','.wp-reference-info-close','.tp-files-info-toggle',
    '.wp-stepper-toggle','.wp-step-path-back','[data-workflow-open]','[data-workflow-close]','[data-inv-back]','[data-inv-task]','[data-inv-tab]','[data-review-related]','[data-inv-activity-toggle]',
    '.communication-info-list-heading button','.communication-info-inspector > header button','[data-compact-call-info]','.wp-tab-scroll','[data-copy-id]','[data-copy-ticket-id]','[data-tab]','[data-side-tab]','[data-open-panel]','[data-back]','[data-enter-fullscreen]','[data-expand-workspace]','[data-open-alongside]','[data-alongside-target]','[data-close-side]',
    '[data-ticket-owner]','[data-ticket-reassign]','.tp-coordinator-link','[data-claim-request]','[data-file-key]','[data-expand-file-list]','[data-compact-communication-back]','[data-compact-tickets-back]','[data-compact-files-back]','[data-compact-file-info]',
    '[data-toggle-inspector]','[data-file-info-toggle]','.tp-files-info-toggle','[data-close-file-info]',
    '.tp-preview-title .draft-select-trigger','.tp-preview-title .draft-select-menu button','[data-preview-file-prev]','[data-preview-file-next]','[data-preview-file-select]','.tp-preview-tools button','.tp-preview-pager button','[data-page]','[data-page-prev]','[data-page-next]','[data-zoom-in]','[data-zoom-out]','[data-download]','[data-preview-wide]',
    '.tp-message-row','[data-communication-id]','[data-communication-view]','[data-expand-thread]','[data-ticket-index]','.tp-ticket-navigation > button','[data-open-ticket]','[data-start-investigation]','[data-open-access-ticket]',
    '[data-activity-id]','[data-activity-toggle]','[data-toggle-all-activity]','[data-open-activity-file]','[data-open-activity-ticket]',
    '[data-comment-filters]','[data-comment-filter-reset]','.tp-communication-filter-toggle','[data-clear-communication]','[data-source-filter]','[data-file-filter]','[data-communication-filter-toggle]','.tp-file-filter-toolbar > button','[data-ticket-filters]','[data-activity-filter-toggle]','[data-table-filter]','[data-filter]','[data-clear-filters]'
  ].join(',');
  const assignmentDialog=element=>Boolean(element.closest('.tp-coordinator-dialog'));
  const viewControl=element=>element.matches(viewingSelectors)||assignmentDialog(element)||element.closest('.tp-message-filters,.tp-communication-filter-menu,.tp-file-filter-menu,.tp-comment-filter-panel,.tp-ticket-filters,.tp-activity-filter-popover')&&!element.matches('[data-new-message],.draft-new-communication,.tp-new-email');
  let previousPermission;
  function update(){
    const canEdit=canEditServiceRequest(owner,currentUser);screen.dataset.requestReadOnly=String(!canEdit);
    banner.hidden=canEdit;
    if(previousPermission!==canEdit){previousPermission=canEdit;queueMicrotask(()=>host.dispatchEvent(new CustomEvent('request-edit-permission-changed',{detail:{canEdit}})));}
    const message=`${owner==='Not assigned'||owner==='—'?'This request is not assigned':`This request is assigned to ${owner}`}. Assign it to yourself to make changes.`;
    const description=banner.querySelector('[data-request-permission-message]');if(description.textContent!==message)description.textContent=message;
    const link=screen.querySelector('[data-ticket-owner], [data-ticket-reassign], .tp-coordinator-link');
    if(link){let chip=link.parentElement.querySelector('.tp-you-chip');if(owner===currentUser&&!chip){chip=document.createElement('b');chip.className='tp-you-chip';chip.textContent='YOU';link.after(chip);}if(owner!==currentUser&&chip)chip.remove();}
    host.querySelectorAll('[data-screen="case"] button,[data-screen="case"] input,[data-screen="case"] select,[data-screen="case"] textarea,.inv-screen button,.inv-screen input,.inv-screen select,.inv-screen textarea').forEach(element=>{
      if(viewControl(element)){if(locked.has(element)){element.disabled=locked.get(element);locked.delete(element);}return;}
      if(!canEdit){if(!locked.has(element))locked.set(element,element.disabled);if(!element.disabled)element.disabled=true;}
      else if(locked.has(element)){element.disabled=locked.get(element);locked.delete(element);}
    });
    screen.querySelectorAll('[contenteditable]').forEach(element=>{
      if(!canEdit){if(!editable.has(element))editable.set(element,element.contentEditable);if(element.contentEditable!=='false')element.contentEditable='false';}
      else if(editable.has(element)){element.contentEditable=editable.get(element);editable.delete(element);}
    });
  }
  host.requestPermissions={get canEdit(){return canEditServiceRequest(owner,currentUser);},get owner(){return owner;},get requestId(){return requestId;}};
  host.addEventListener('request-opened',event=>{requestId=event.detail.id;owner=assignments.get(requestId)||event.detail.coordinator;update();});
  host.addEventListener('request-record-saved',event=>{if(event.detail.values?.Coordinator){owner=event.detail.values.Coordinator;assignments.set(requestId,owner);update();}});
  // Capture guards also cover controls inserted by an open dialog or re-render.
  host.addEventListener('click',event=>{
    if(host.requestPermissions.canEdit||!event.target.closest('[data-screen="case"],.inv-screen'))return;
    const control=event.target.closest('button,input,select,textarea,[contenteditable]');
    if(control&&!viewControl(control)){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  let scheduled=false;
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;update();});};
  new MutationObserver(schedule).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','contenteditable']});
  update();
})();
