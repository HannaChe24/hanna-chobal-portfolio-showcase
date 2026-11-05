// Alongside comparison is available from 1350 CSS pixels of viewport width.
const WORKSPACE_ALONGSIDE_MIN_WIDTH=1350;
// Pure geometry is shared by pointer/keyboard resizing and regression tests.
function workspacePanelGeometry({available,primaryMin,secondaryMin,preferredWidth=null,viewportWidth=Infinity}) {
  // Content minima are preferred; compact previews share the available width.
  const usable=Math.max(0,available-8);
  const compact=usable<primaryMin+secondaryMin;
  const minimum=compact?usable*.35:secondaryMin;
  const maximum=compact?usable*.65:usable-primaryMin;
  const width=clampWorkspacePanelWidth(preferredWidth??usable*.5,minimum,maximum);
  const canSplit=viewportWidth>=WORKSPACE_ALONGSIDE_MIN_WIDTH;
  return {canSplit,sequential:!canSplit,width,minimum,maximum};
}
function clampWorkspacePanelWidth(value,minimum,maximum) {
  return Math.max(minimum,Math.min(maximum,value));
}
(() => {
  if(typeof document==='undefined')return;
  const host=document.querySelector('[data-task-prototype]');
  const main=host?.querySelector('.tp-case-main-workspace'),nav=main?.querySelector('.tp-workspace-tabs');
  if(!main||!nav)return;
  const panels=new Map([...main.querySelectorAll(':scope > [data-panel]')].map(p=>[p.dataset.panel,p]));
  const names={communication:'Communication',jobs:'Tickets',files:'Files',information:'Request record',related:'Related requests',activity:'Activity',comments:'Internal comments'};
  const minimum={communication:640,jobs:640,files:680,information:400,related:720,activity:480};
  let primary=nav.querySelector('[data-tab].is-current')?.dataset.tab||'communication';
  let secondary=null,lastSection='information',sideWidth=null,sideRatio=null,sideOpen=false,sequential=false,suspended=false;
  let returnFocus=null;
  const toolbar=document.createElement('div');toolbar.className='wp-layout-tools';
  toolbar.innerHTML='<div class="wp-alongside-control"><button type="button" data-open-alongside aria-haspopup="menu" aria-expanded="false" aria-controls="workspace-alongside-menu"><span aria-hidden="true">+</span> View alongside</button><div id="workspace-alongside-menu" class="wp-alongside-menu" role="menu" aria-label="View alongside" hidden></div></div><button type="button" data-close-suspended hidden>Close side panel</button><span class="wp-status" role="status" aria-live="polite"></span>';
  nav.after(toolbar);
  const deck=document.createElement('div');deck.id='workspace-panel-deck';
  deck.innerHTML='<div class="wp-primary" aria-label="Main workspace"></div><div class="wp-resize" role="separator" aria-label="Resize side panel" aria-orientation="vertical" aria-controls="workspace-side-panel" tabindex="0"></div><aside id="workspace-side-panel" aria-labelledby="workspace-side-title" hidden><header class="wp-side-header"><button type="button" data-back-main hidden></button><div><h3 id="workspace-side-title"></h3></div><button type="button" data-close-side aria-label="Close side panel" title="Close side panel"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></header><div class="wp-side-body"></div></aside>';
  toolbar.after(deck);
  const primaryMount=deck.querySelector('.wp-primary'),side=deck.querySelector('aside'),sideMount=deck.querySelector('.wp-side-body'),resize=deck.querySelector('.wp-resize');
  const control=toolbar.querySelector('.wp-alongside-control'),menu=control.querySelector('[role="menu"]'),openButton=control.querySelector('[data-open-alongside]');
  const back=side.querySelector('[data-back-main]'),closeSuspended=toolbar.querySelector('[data-close-suspended]');
  const navActions=nav.querySelector('.tp-workspace-tab-actions')||nav.appendChild(document.createElement('span'));
  navActions.classList.add('tp-workspace-tab-actions');
  const expandButton=host.querySelector('[data-expand-workspace]');
  if(expandButton){expandButton.classList.remove('wp-global-expand');navActions.append(expandButton);}
  navActions.append(closeSuspended);
  const sideHeading=side.querySelector('.wp-side-header > div');
  const caption=document.createElement('small');caption.className='wp-side-caption';caption.textContent='Alongside panel';sideHeading.prepend(caption);
  const sideTabs=document.createElement('nav');sideTabs.className='wp-side-tabs tp-workspace-tabs';sideTabs.setAttribute('aria-label','Section in alongside panel');
  const tabOrder=()=>['communication','jobs','files','information','comments','related','activity'].filter(key=>panels.has(key));
  tabOrder().forEach(key=>{
    const button=document.createElement('button');button.type='button';button.dataset.sideTab=key;const original=nav.querySelector(`[data-tab="${key}"]`);button.innerHTML=original?original.innerHTML:names[key];sideTabs.append(button);
  });
  side.querySelector('.wp-side-header').after(sideTabs);
  const sideNavRow=document.createElement('div');sideNavRow.className='wp-side-nav-row';
  sideTabs.before(sideNavRow);sideNavRow.append(sideTabs);
  const sideActions=document.createElement('div');sideActions.className='wp-side-actions';sideNavRow.append(sideActions);
  sideNavRow.prepend(side.querySelector('[data-close-side]'));
  const syncNavHeight=()=>{
    sideNavRow.style.setProperty('--wp-nav-height',nav.getBoundingClientRect().height+'px');
    tabOrder().forEach((key,index)=>{const button=sideTabs.querySelector(`[data-side-tab="${key}"]`);if(button)button.style.setProperty('order',String(index),'important');});
    // Use the actual primary component metrics, including inherited type styles.
    sideTabs.querySelectorAll('[data-side-tab]').forEach(button=>{
      const original=nav.querySelector(`[data-tab="${button.dataset.sideTab}"]`);if(!original)return;
      const computed=getComputedStyle(original);
      ['font-family','font-size','line-height','letter-spacing','height','min-height','padding-top','padding-bottom','padding-left','padding-right','gap','border-radius','box-sizing'].forEach(property=>button.style.setProperty(property,computed.getPropertyValue(property),'important'));
      button.style.setProperty('font-weight',button.dataset.sideTab===secondary?'600':'400','important');
      button.querySelectorAll('b').forEach((counter,index)=>{
        const source=original.querySelectorAll('b')[index];if(!source)return;
        const style=getComputedStyle(source);
        ['font-family','font-size','line-height','font-weight','margin-left','padding-left','padding-right'].forEach(property=>counter.style.setProperty(property,style.getPropertyValue(property),'important'));
      });
    });
  };
  new ResizeObserver(syncNavHeight).observe(nav);
  const requestWorkspace=host.querySelector('.tp-case-workspace');
  const syncViewportPanels=()=>{const height=requestWorkspace.clientHeight-nav.getBoundingClientRect().height;if(height>0)deck.style.setProperty('--wp-viewport-height',height+'px');};
  new ResizeObserver(syncViewportPanels).observe(requestWorkspace);
  new ResizeObserver(syncViewportPanels).observe(nav);
  requestAnimationFrame(syncViewportPanels);




  menu.setAttribute('popover','manual');
  const closeMenu=(focus=false)=>{if(menu.matches(':popover-open'))menu.hidePopover();menu.hidden=true;openButton.setAttribute('aria-expanded','false');if(focus)openButton.focus({preventScroll:true});};
  const focusMain=()=>nav.querySelector('[data-tab].is-current')?.focus({preventScroll:true});
  panels.forEach(p=>primaryMount.append(p));
  // Files uses the same list and preview component, with independent right-hand state.
  const comparison=document.createElement('section');comparison.className='wp-file-comparison tp-documents-workspace is-inspector-collapsed';comparison.hidden=true;
  const comparisonList=panels.get('files').querySelector('.tp-file-list').cloneNode(true);
  comparisonList.querySelectorAll('[id]').forEach(element=>element.removeAttribute('id'));
  const comparisonPreview=document.createElement('article');comparisonPreview.className='tp-document-preview';comparisonPreview.dataset.filePreview='';
  comparison.append(comparisonList,comparisonPreview);sideMount.append(comparison);
  let comparisonKey='inspection';
  const chooseComparison=key=>{
    comparisonKey=key;host.requestFiles.renderComparison(comparisonPreview,key);
    comparisonList.querySelectorAll('[data-file-key]').forEach(row=>{row.classList.toggle('is-current',row.dataset.fileKey===key);row.setAttribute('aria-pressed',String(row.dataset.fileKey===key));});
  };
  chooseComparison(comparisonKey);
  comparisonPreview.addEventListener('preview-file-change',event=>chooseComparison(event.detail.key));
  comparison.addEventListener('click',event=>event.stopPropagation());
  comparisonList.addEventListener('click',event=>{
    event.stopPropagation();
    const row=event.target.closest('[data-file-key]');if(row){chooseComparison(row.dataset.fileKey);return;}
    if(event.target.closest('[data-expand-file-list]'))comparison.classList.toggle('is-files-collapsed');
  });
  comparisonList.querySelectorAll('.tp-file-start-validation,.tp-file-validation-details-link').forEach(element=>element.remove());
  const referenceFilters=comparisonList.querySelector('.tp-file-filter-toolbar');
  if(referenceFilters){
    referenceFilters.querySelectorAll('.draft-select').forEach(wrapper=>{const select=wrapper.querySelector('select');if(select){select.removeAttribute('data-draft-dropdown');select.style.setProperty('display','block','important');select.style.setProperty('position','static','important');select.style.setProperty('opacity','1','important');wrapper.replaceWith(select);}});
    const toggle=referenceFilters.querySelector(':scope > button'),filterMenu=referenceFilters.querySelector('.tp-file-filter-menu');
    referenceFilters.querySelectorAll('button,select,input').forEach(control=>{control.disabled=false;control.removeAttribute('title');});
    const applyReferenceFilters=()=>{
      const type=referenceFilters.querySelector('[data-file-filter].is-current')?.dataset.fileFilter||'all';
      const date=referenceFilters.querySelector('[data-file-date-filter]')?.value||'all';
      const from=referenceFilters.querySelector('[data-file-date-from]')?.value,to=referenceFilters.querySelector('[data-file-date-to]')?.value;
      comparisonList.querySelectorAll('[data-file-key]').forEach(row=>{const day=row.dataset.fileDate,age=(Date.parse('2026-09-05')-Date.parse(day))/86400000;const matches=date==='all'||date==='today'&&day==='2026-09-05'||['7','30'].includes(date)&&age>=0&&age<Number(date)||date==='custom'&&(!from||day>=from)&&(!to||day<=to);row.hidden=(type!=='all'&&row.dataset.fileType!==type)||!matches;if(row.parentElement.classList.contains('tp-file-entry'))row.parentElement.hidden=row.hidden;});
      const range=referenceFilters.querySelector('.tp-file-date-range');if(range)range.hidden=date!=='custom';
    };
    referenceFilters.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button===toggle){filterMenu.hidden=!filterMenu.hidden;toggle.setAttribute('aria-expanded',String(!filterMenu.hidden));}if(button.matches('[data-file-filter]')){referenceFilters.querySelectorAll('[data-file-filter]').forEach(item=>{item.classList.toggle('is-current',item===button);item.setAttribute('aria-pressed',String(item===button));});applyReferenceFilters();}if(button.matches('.tp-file-clear-filters')){referenceFilters.querySelector('[data-file-filter="all"]')?.click();const date=referenceFilters.querySelector('[data-file-date-filter]');if(date)date.value='all';applyReferenceFilters();}});
    referenceFilters.addEventListener('change',applyReferenceFilters);
  }
  const addCompactFilesNavigation=(panel,reference=false)=>{
    const bar=document.createElement('header');bar.className='wp-compact-file-bar';
    bar.innerHTML='<button type="button" data-compact-files-back>← Back to Files</button><span class="wp-compact-file-name"></span><button type="button" data-compact-file-info aria-expanded="false">File info</button>';
    panel.prepend(bar);
    let selected=reference?comparisonKey:'inspection';
    const updateName=()=>{bar.querySelector('.wp-compact-file-name').textContent=host.requestFiles.comparisonFiles().find(file=>file.key===selected)?.name||'File';};
    updateName();
    let referenceInfo=null;
    if(reference){referenceInfo=document.createElement('section');referenceInfo.className='wp-compact-reference-info';referenceInfo.hidden=true;bar.after(referenceInfo);}
    panel.addEventListener('click',event=>{
      const row=event.target.closest('[data-file-key]');
      if(row){selected=row.dataset.fileKey;updateName();panel.classList.add('wp-compact-document-open');}
      if(event.target.closest('[data-compact-files-back]')){
        event.preventDefault();event.stopImmediatePropagation();panel.classList.remove('wp-compact-document-open');
        panel.classList.remove('wp-compact-info-open');bar.querySelector('[data-compact-file-info]').setAttribute('aria-expanded','false');if(referenceInfo)referenceInfo.hidden=true;
        panel.querySelector(`[data-file-key="${selected}"]`)?.focus({preventScroll:true});
      }
      if(event.target.closest('[data-compact-file-info]')||event.target.closest('.tp-files-info-toggle')&&(reference||panel.closest('.wp-primary')?.clientWidth<640)){
        event.preventDefault();event.stopImmediatePropagation();
        panel.classList.add('wp-compact-document-open');
        const button=bar.querySelector('[data-compact-file-info]');const expanded=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(expanded));panel.classList.toggle('wp-compact-info-open',expanded);
        if(reference){
          const file=host.requestFiles.comparisonFiles().find(file=>file.key===selected);
          referenceInfo.replaceChildren();const closeInfo=document.createElement('button');closeInfo.type='button';closeInfo.className='wp-reference-info-close';closeInfo.textContent='← Back to Files';closeInfo.onclick=()=>{referenceInfo.hidden=true;panel.classList.remove('wp-compact-info-open');button.setAttribute('aria-expanded','false');};referenceInfo.append(closeInfo);const heading=document.createElement('h4');heading.textContent='File details · View only';referenceInfo.append(heading);
          [['File name',file.name],['Type / size',file.kind+' · '+file.size],['Uploaded',file.date],['Uploaded by',file.by]].forEach(([label,value])=>{const row=document.createElement('p');row.textContent=label+': '+value;referenceInfo.append(row);});referenceInfo.hidden=!expanded;
        }else if(expanded){host.requestFiles.openReview?.(selected);}
      }
    },true);
  };
  addCompactFilesNavigation(panels.get('files'));addCompactFilesNavigation(comparison,true);
  host.addEventListener('click',event=>{
    const panel=event.target.closest('.tp-communication-workspace');if(!panel)return;
    if(event.target.closest('[data-compact-call-info]')&&!panel.classList.contains('wp-reference-copy')){event.preventDefault();event.stopImmediatePropagation();panel.querySelector('.communication-info-list-heading button[aria-controls="communication-info-panel"]')?.click();return;}
    const back=event.target.closest('[data-compact-communication-back]');
    if(back){event.preventDefault();event.stopImmediatePropagation();panel.classList.remove('wp-compact-conversation-open','wp-reference-info-open');if(panel.classList.contains('wp-reference-copy')){const info=panel.querySelector('.communication-info-inspector');if(info)info.hidden=true;}panel.querySelector('.tp-message-row.is-current')?.focus();return;}
    if(!event.target.closest('.tp-message-row'))return;
    if(panel.getBoundingClientRect().width<800&&panel.classList.contains('communication-info-open'))panel.querySelector('.communication-info-list-heading button[aria-controls="communication-info-panel"]')?.click();
    let bar=panel.querySelector('.wp-compact-communication-bar');
    if(!bar){bar=document.createElement('header');bar.className='wp-compact-communication-bar';bar.innerHTML='<button type="button" data-compact-communication-back>← Back to Communication</button><button type="button" data-compact-call-info>Call info</button>';panel.prepend(bar);}
    panel.classList.add('wp-compact-conversation-open');
  },true);
  host.addEventListener('click',event=>{
    const panel=event.target.closest('.tp-ticket-browser');
    if(!panel)return;
    const back=event.target.closest('[data-compact-tickets-back]');
    if(back){event.preventDefault();event.stopImmediatePropagation();panel.classList.remove('wp-compact-ticket-open');panel.querySelector('.tp-ticket-navigation > button.is-current')?.focus();return;}
    const choice=event.target.closest('.tp-ticket-navigation > button');
    if(!choice)return;
    let bar=panel.querySelector('.wp-compact-ticket-bar');
    if(!bar){bar=document.createElement('header');bar.className='wp-compact-ticket-bar';bar.innerHTML='<button type="button" data-compact-tickets-back>← Back to Tickets</button>';panel.prepend(bar);}
    panel.classList.add('wp-compact-ticket-open');
    if(panel.classList.contains('wp-reference-copy')){
      const index=[...panel.querySelectorAll('.tp-ticket-navigation > button')].indexOf(choice);
      panel.querySelectorAll('.tp-ticket-selection > article').forEach((article,i)=>article.hidden=i!==index);
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);
  // Moving a live panel keeps its inputs/listeners; restore scroll after reparenting.
  const scrollMemory=new Map();
  const rememberScroll=()=>{
    [host,...host.querySelectorAll('*')].forEach(e=>{
      if(e.getClientRects().length && (e.scrollHeight>e.clientHeight || e.scrollWidth>e.clientWidth || e.scrollTop || e.scrollLeft))scrollMemory.set(e,[e.scrollTop,e.scrollLeft]);
    });
  };
  const restoreScroll=()=>scrollMemory.forEach(([y,x],e)=>{
    if(!e.isConnected){scrollMemory.delete(e);return;}
    if(e.getClientRects().length){e.scrollTop=y;e.scrollLeft=x;}
  });
  const preserve=action=>{
    rememberScroll();action();restoreScroll();requestAnimationFrame(restoreScroll);
  };
  const sectionAvailability=()=>({enabled:document.documentElement.clientWidth>=WORKSPACE_ALONGSIDE_MIN_WIDTH});
  const setItemAvailability=item=>{
    item.disabled=!sectionAvailability().enabled;
    item.title='';
  };
  const updateMenu=()=>{
    menu.replaceChildren(...tabOrder().map(key=>{
      const item=document.createElement('button');item.type='button';item.setAttribute('role','menuitem');item.dataset.alongsideTarget=key;item.textContent=names[key]||key;
      item.setAttribute('aria-current',String(sideOpen&&secondary===key));
      setItemAvailability(item);
      return item;
    }));
  };
  const layout=()=>{
    const available=deck.clientWidth;
    const viewportWidth=document.documentElement.clientWidth;
    if(sideOpen&&viewportWidth<WORKSPACE_ALONGSIDE_MIN_WIDTH){close();return;}
    const primaryMin=minimum[primary]||640,secondaryMin=minimum[secondary]||400;
    const geometry=workspacePanelGeometry({available,viewportWidth,primaryMin,secondaryMin,preferredWidth:sideRatio===null?null:sideRatio*available});
    const wasSuspended=suspended;
    const nextSuspended=sideOpen&&!geometry.canSplit;
    if(nextSuspended!==wasSuspended)rememberScroll();
    if(nextSuspended&&(side.contains(document.activeElement)||document.activeElement===resize))focusMain();
    const viewportAllows=viewportWidth>=WORKSPACE_ALONGSIDE_MIN_WIDTH;
    if(!viewportAllows&&(control.contains(document.activeElement)))focusMain();
    if(!viewportAllows)closeMenu();
    control.hidden=!viewportAllows||(sideOpen&&!nextSuspended);
    if(control.parentElement!==navActions){closeMenu();navActions.prepend(control);}
    // Availability is per section: the menu stays discoverable at supported viewport widths.
    menu.querySelectorAll('[data-alongside-target]').forEach(setItemAvailability);
    suspended=nextSuspended;sequential=suspended;
    const actual=geometry.width;
    sideWidth=sideRatio===null?null:actual;
    deck.style.setProperty('--wp-side-width',actual+'px');
    deck.classList.toggle('wp-split',sideOpen&&!suspended);
    // Navigation belongs to the main column; the side panel spans its full height.
    const splitVisible=sideOpen&&!suspended;
    navActions.classList.toggle('wp-actions-moved',splitVisible);
    const expandDestination=splitVisible?sideActions:navActions;
    if(expandButton&&expandButton.parentElement!==expandDestination)expandDestination.prepend(expandButton);
    requestAnimationFrame(syncNavHeight);

    const switching=sideOpen&&!suspended;
    openButton.innerHTML=switching?'Switch section <span aria-hidden="true">⌄</span>':'<span aria-hidden="true">+</span> View alongside';
    openButton.setAttribute('aria-label',switching?'Switch section in side panel':'View a section alongside');
    openButton.title=switching?'Replace the content of this side panel. One side panel can be open at a time.':'Open one section beside the main workspace';
    menu.setAttribute('aria-label',switching?'Switch section in side panel':'View alongside');

    if(splitVisible&&nav.parentElement!==primaryMount)primaryMount.prepend(nav);
    if(!splitVisible&&nav.parentElement!==main)main.insertBefore(nav,toolbar);

    primaryMount.hidden=false;
    side.hidden=!sideOpen||suspended;
    resize.hidden=!sideOpen||suspended;
    back.hidden=true;
    closeSuspended.hidden=true;
    toolbar.hidden=true;
    closeSuspended.title='Close the temporarily hidden '+(names[secondary]||'side panel');
    if(wasSuspended!==suspended){restoreScroll();requestAnimationFrame(restoreScroll);}
    resize.setAttribute('aria-valuemin',String(Math.round(geometry.minimum)));
    resize.setAttribute('aria-valuemax',String(Math.floor(geometry.maximum)));
    resize.setAttribute('aria-valuenow',String(Math.round(actual)));
    resize.setAttribute('aria-valuetext',Math.round(actual)+' pixels for '+(names[secondary]||'side panel'));
    resize.title='Resize side panel: arrow keys, Home or End';
    const communication=panels.get('communication');
    const communicationVisible=primary==='communication'||(sideOpen&&secondary==='communication'&&!suspended);
    const communicationWidth=primary==='communication'?available-actual-8:actual;
    const listOnly=sideOpen&&!suspended&&communicationVisible&&communicationWidth<800;
    if(listOnly&&!communication.classList.contains('wp-communication-list-only')){
      rememberScroll();
      const focused=document.activeElement;
      if(communication.contains(focused)&&!communication.querySelector('aside')?.contains(focused)){
        communication.querySelector('aside .tp-message-row.is-current, aside button')?.focus({preventScroll:true});
      }
    }
    const wasListOnly=communication.classList.contains('wp-communication-list-only');
    communication.classList.toggle('wp-communication-list-only',listOnly);
    if(wasListOnly&&!listOnly){restoreScroll();requestAnimationFrame(restoreScroll);}

  };
  function mountReferenceFilters(view,source){
    view.addEventListener('click',event=>{
      const control=event.target.closest('[data-ticket-owner],[data-ticket-reassign]');if(!control)return;
      event.preventDefault();event.stopImmediatePropagation();
      const id=control.closest('[data-ticket-id]')?.dataset.ticketId;
      const original=[...source.querySelectorAll('[data-ticket-id]')].find(article=>article.dataset.ticketId===id);
      original?.querySelector('[data-ticket-owner]')?.click();
    },true);
    host.addEventListener('ticket-overview-changed',()=>{
      view.querySelectorAll('[data-ticket-list-owner]').forEach(label=>{const original=[...source.querySelectorAll('[data-ticket-list-owner]')].find(item=>item.dataset.ticketListOwner===label.dataset.ticketListOwner);if(original)label.textContent=original.textContent;});
      view.querySelectorAll('[data-ticket-id]').forEach(article=>{const original=[...source.querySelectorAll('[data-ticket-id]')].find(item=>item.dataset.ticketId===article.dataset.ticketId);if(!original)return;const owner=article.querySelector('[data-ticket-owner]'),actual=original.querySelector('[data-ticket-owner]');if(owner&&actual)owner.textContent=actual.textContent;const notice=article.querySelector('.tp-ticket-permission-note'),current=original.querySelector('.tp-ticket-permission-note');if(notice&&current){notice.innerHTML=current.innerHTML;notice.hidden=current.hidden;}});
    });
    // Clones need independent viewing state; DOM cloning does not copy listeners.
    view.querySelectorAll('input[type=radio]').forEach(input=>input.name='reference-'+input.name);
    view.querySelectorAll('.tp-ticket-comments').forEach((comments,index)=>{
      const original=source.querySelectorAll('.tp-ticket-comments')[index];
      const menu=comments.querySelector('.tp-comment-filter-panel');
      menu?.removeAttribute('popover');
      const renderComments=()=>{
        const sort=comments.querySelector('input[name*="comment-sort"]:checked')?.value||'newest';
        const author=comments.querySelector('input[name*="comment-author"]:checked')?.value||'all';
        const records=(original?.referenceRecords?.()||[]).filter(item=>author==='all'||item.author===author).sort((a,b)=>sort==='oldest'?a.created-b.created:sort==='author'?a.author.localeCompare(b.author)||b.created-a.created:b.created-a.created);
        const feed=comments.querySelector('ol');feed.replaceChildren();
        records.forEach(item=>{const row=document.createElement('li'),meta=document.createElement('div'),name=document.createElement('strong'),time=document.createElement('time'),body=document.createElement('p');name.textContent=item.author;time.textContent=item.time;body.textContent=item.body;meta.append(name,time);row.append(meta,body);feed.append(row);});
        comments.querySelector('[data-comment-count]').textContent='('+records.length+')';
        comments.querySelector('.tp-comments-progress').textContent=records.length?'All comments loaded':'No comments match this filter.';
      };
      comments.addEventListener('change',renderComments);
      comments.querySelector('.tp-communication-filter-toggle','[data-clear-communication]','[data-comment-filters]')?.addEventListener('click',event=>{menu.hidden=!menu.hidden;event.currentTarget.setAttribute('aria-expanded',String(!menu.hidden));});
      comments.querySelector('[data-comment-filter-reset]')?.addEventListener('click',()=>{comments.querySelector('input[value=newest]').checked=true;comments.querySelector('[data-comment-authors] input[value=all]').checked=true;renderComments();});
    });
    if(source.referenceCommunication){
      const api=source.referenceCommunication,menu=view.querySelector('.tp-communication-filter-menu');let channel='timeline';
      const filter=()=>{const selected=name=>[...menu.querySelectorAll('[name="'+name+'"]:checked')].map(input=>input.value),channels=selected('channel'),audiences=selected('audience'),only=name=>menu.querySelector('[name="'+name+'"]')?.checked;const data=api.items();view.querySelectorAll('[data-communication-id]').forEach(row=>{const item=data.find(item=>String(item.id)===row.dataset.communicationId);row.hidden=!item||(channel!=='timeline'&&item.type!==channel)||(channels.length&&!channels.includes(item.type))||(audiences.length&&!audiences.includes(item.audience))||(only('unread')&&!item.unread)||(only('attachments')&&!item.attachments)||(only('missed')&&!item.missed);});};
      menu?.removeAttribute('popover');menu?.addEventListener('change',filter);
      const info=view.querySelector('.communication-info-inspector'),infoToggle=view.querySelector('.communication-info-list-heading button');
      const closeInfo=()=>{if(info)info.hidden=true;view.classList.remove('communication-info-open','wp-reference-info-open');infoToggle?.setAttribute('aria-expanded','false');};
      closeInfo();
      infoToggle?.removeAttribute('aria-controls');
      view.addEventListener('click',event=>{
        const toggle=event.target.closest('.communication-info-list-heading button,[data-compact-call-info]');
        if(!toggle)return;
        event.preventDefault();event.stopImmediatePropagation();
        if(view.classList.contains('wp-reference-info-open')){closeInfo();return;}
        const row=view.querySelector('[data-communication-id].is-current')||view.querySelector('[data-communication-id]');
        const data=api.information(row?.dataset.communicationId);if(!data||!info)return;
        info.replaceChildren();const heading=document.createElement('header'),title=document.createElement('strong'),close=document.createElement('button');
        title.textContent=data.label;close.type='button';close.textContent='×';close.setAttribute('aria-label','Close communication information');close.onclick=()=>{closeInfo();toggle.focus();};heading.append(title,close);
        const body=document.createElement('div');body.className='communication-info-body';const list=document.createElement('dl');
        data.rows.forEach(([label,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);list.append(row);});body.append(list);info.append(heading,body);info.hidden=false;view.classList.add('wp-reference-info-open');infoToggle?.setAttribute('aria-expanded','true');
      });

      view.addEventListener('click',event=>{const button=event.target.closest('button');const row=event.target.closest('[data-communication-id]');if(row&&(!button||button===row)){const information=api.information(row.dataset.communicationId);if(information){const caption=infoToggle?.querySelector('span');if(caption)caption.textContent=information.label;const compact=view.querySelector('[data-compact-call-info]');if(compact)compact.textContent=information.label;}api.show(row.dataset.communicationId,view.querySelector('[data-message-detail]'));view.querySelectorAll('[data-communication-id]').forEach(item=>item.classList.toggle('is-current',item===row));}if(button?.matches('.tp-communication-filter-toggle')){menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));}if(button?.matches('[data-communication-view]')){channel=button.dataset.communicationView;view.querySelectorAll('[data-communication-view]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));filter();}if(button?.matches('[data-clear-communication]')){menu.querySelectorAll('input').forEach(input=>input.checked=false);filter();}});
    }
    const activityMenu=view.querySelector('[data-activity-filters]');
    if(activityMenu){
      activityMenu.removeAttribute('popover');
      const apply=()=>{const types=[...activityMenu.querySelectorAll('[data-activity-type]:checked')].map(input=>input.value),actor=activityMenu.querySelector('[data-activity-actor]')?.value||'all',date=activityMenu.querySelector('[data-activity-date]')?.value||'all',query=view.querySelector('[data-activity-search]')?.value.toLowerCase()||'',range=activityMenu.querySelector('[data-custom-date-range]');if(range)range.hidden=date!=='custom';const dates=range?.querySelectorAll('input'),from=dates?.[0]?.value,to=dates?.[1]?.value;const events=host.referenceActivityEvents?.()||[];view.querySelectorAll('[data-activity-id]').forEach(row=>{const item=events.find(item=>item.id===row.dataset.activityId);if(!item)return;const day=item.date.startsWith('YESTERDAY')?'2026-09-04':'2026-09-05';row.hidden=!!((types.length&&!types.includes(item.type))||(actor!=='all'&&item.actor!==actor)||(date==='today'&&!item.date.startsWith('TODAY'))||(date==='custom'&&((from&&day<from)||(to&&day>to)))||(query&&!row.textContent.toLowerCase().includes(query)));if(row.nextElementSibling?.classList.contains('tp-activity-inline'))row.nextElementSibling.hidden=row.hidden;});};
      activityMenu.addEventListener('change',apply);view.querySelector('[data-activity-search]')?.addEventListener('input',apply);
      view.querySelector('[data-activity-filter-toggle]')?.addEventListener('click',event=>{activityMenu.hidden=!activityMenu.hidden;event.currentTarget.setAttribute('aria-expanded',String(!activityMenu.hidden));});
      view.querySelector('[data-clear-activity-filters]')?.addEventListener('click',()=>{activityMenu.querySelectorAll('input').forEach(input=>{if(input.type==='checkbox')input.checked=false;else input.value='';});activityMenu.querySelectorAll('select').forEach(select=>select.value='all');apply();});
    }
    const ticketMenu=view.querySelector('.tp-ticket-filters');
    view.querySelector('[data-ticket-filters]')?.addEventListener('click',event=>{ticketMenu.hidden=!ticketMenu.hidden;event.currentTarget.setAttribute('aria-expanded',String(!ticketMenu.hidden));});
    ticketMenu?.addEventListener('change',event=>{const value=event.target.value;view.querySelectorAll('.tp-ticket-navigation > button').forEach(button=>{const done=button.querySelector('.tp-status-chip')?.textContent==='Completed';button.hidden=value==='completed'?!done:value==='open'?done:false;});});
  }
  const sameSectionViews=new Map();
  const render=()=>preserve(()=>{
    sameSectionViews.forEach(view=>view.hidden=true);
    if(sideOpen&&primary===secondary&&primary!=='files'){
      let view=sameSectionViews.get(primary);
      if(!view){
        view=panels.get(primary).cloneNode(true);view.removeAttribute('data-panel');
        view.classList.add('wp-reference-copy');
        mountReferenceFilters(view,panels.get(primary));
        view.querySelectorAll('[id]').forEach(element=>element.removeAttribute('id'));
        view.classList.remove('wp-communication-list-only');
        view.querySelectorAll('input,textarea').forEach(element=>element.readOnly=true);
        view.querySelectorAll('select,[contenteditable]').forEach(element=>{if(element.matches('select'))element.disabled=true;else element.contentEditable='false';});
        const hint=document.createElement('div');hint.className='wp-reference-hint';hint.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/></svg><div><strong>Reference view</strong><span>The same tab is open in both panels. Edit in the main workspace.</span></div>';view.prepend(hint);
        view.addEventListener('click',event=>{
          const commentFilter=event.target.closest('[data-comment-filters]');
          if(commentFilter){const menu=commentFilter.closest('.tp-ticket-comments').querySelector('.tp-comment-filter-panel');menu.hidden=!menu.hidden;commentFilter.setAttribute('aria-expanded',String(!menu.hidden));event.preventDefault();event.stopImmediatePropagation();return;}
          const toggleRow=row=>{
            const expanded=row.getAttribute('aria-expanded')!=='true';
            const detail=row.nextElementSibling;
            if(detail?.classList.contains('tp-activity-inline'))detail.remove();
            row.setAttribute('aria-expanded',String(expanded));row.classList.toggle('is-current',expanded);row.lastElementChild.textContent=expanded?'−':'+';
            if(expanded)row.insertAdjacentHTML('afterend',host.renderActivityReferenceDetail(row.dataset.activityId));
          };
          const row=event.target.closest('[data-activity-id]');
          if(row){toggleRow(row);event.preventDefault();event.stopImmediatePropagation();return;}
          if(event.target.closest('[data-toggle-all-activity]')){const rows=[...view.querySelectorAll('[data-activity-id]')];const expand=rows.some(row=>row.getAttribute('aria-expanded')!=='true');rows.forEach(row=>{if((row.getAttribute('aria-expanded')==='true')!==expand)toggleRow(row);});event.target.closest('button').textContent=expand?'Collapse all':'Expand all';event.preventDefault();event.stopImmediatePropagation();return;}
          if(event.target.closest('button')&&!sideIsNavigation(event.target.closest('button'))){event.preventDefault();event.stopPropagation();}
        },true);
        sameSectionViews.set(primary,view);sideMount.append(view);
      }
      view.hidden=false;
    }

    panels.forEach((panel,key)=>{
      const comparing=sideOpen&&primary===secondary;
      const destination=sideOpen&&key===secondary&&!comparing?sideMount:primaryMount;
      if(panel.parentElement!==destination)destination.append(panel);
      panel.hidden=key!==primary&&!(sideOpen&&key===secondary);
    });
    comparison.hidden=!(sideOpen&&primary==='files'&&secondary==='files');
    nav.querySelectorAll('[data-tab]').forEach(button=>button.classList.toggle('is-current',button.dataset.tab===primary));
    host.querySelectorAll('.tp-side-nav [data-open-panel]').forEach(button=>button.classList.toggle('is-current',button.dataset.openPanel===primary));
    closeMenu();updateMenu();
    side.querySelector('h3').textContent=names[secondary]||'Side panel';
    sideTabs.querySelectorAll('[data-side-tab]').forEach(button=>{
      button.disabled=false;
      button.classList.toggle('is-current',button.dataset.sideTab===secondary);
      button.setAttribute('aria-pressed',String(button.dataset.sideTab===secondary));
      button.title=button.disabled?'Already open in the main workspace':'';
    });
    layout();
  });
  const announce=message=>toolbar.querySelector('.wp-status').textContent=message;
  const close=()=>{
    if(!sideOpen)return;
    lastSection=secondary;sideOpen=false;render();
    if(returnFocus?.isConnected&&returnFocus.getClientRects().length&&!returnFocus.disabled)returnFocus.focus({preventScroll:true});else if(!openButton.hidden&&!openButton.disabled)openButton.focus({preventScroll:true});else focusMain();
    announce('Side panel closed. '+names[primary]+' remains open.');
  };
  const open=key=>{
    if(!panels.has(key))return;
    const availability=sectionAvailability(key);
    if(!availability.enabled)return;
    if(!sideOpen)returnFocus=openButton;
    closeMenu();
    secondary=lastSection=key;sideOpen=true;render();
    sideTabs.querySelector(`[data-side-tab="${key}"]`)?.focus({preventScroll:true});announce(names[key]+' opened alongside '+names[primary]+'.');
  };
  host.workspaceLayout={
    select(key){
      if(!panels.has(key))return;
      primary=key;render();
    },
    open,close,
    get state(){return {primary,secondary,sideOpen,sideWidth,sideRatio,sequential,suspended};}
  };
  // Route each tab bar locally before legacy delegated handlers can affect another pane.
  nav.addEventListener('click',event=>{
    const button=event.target.closest('[data-tab]');
    if(!button||!nav.contains(button))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!button.disabled)host.workspaceLayout.select(button.dataset.tab);
  },true);
  sideTabs.addEventListener('click',event=>{
    const button=event.target.closest('[data-side-tab]');if(!button)return;
    // Right tabs share styling attributes, but never reach the main tab router.
    event.preventDefault();event.stopPropagation();
    if(!button.disabled)open(button.dataset.sideTab);
  });
  openButton.onclick=()=>{
    if(!menu.hidden){closeMenu();return;}
    updateMenu();menu.hidden=false;openButton.setAttribute('aria-expanded','true');
    const anchor=openButton.getBoundingClientRect();
    menu.style.left=Math.max(8,Math.min(anchor.left,document.documentElement.clientWidth-224))+'px';
    menu.style.top=anchor.bottom+6+'px';
    if(menu.showPopover)menu.showPopover();
    menu.querySelector('button:not(:disabled)')?.focus();
  };
  menu.addEventListener('click',event=>{const item=event.target.closest('[data-alongside-target]');if(item&&!item.disabled)open(item.dataset.alongsideTarget);});
  control.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!menu.hidden){event.preventDefault();event.stopPropagation();closeMenu(true);return;}
    if(menu.hidden||!['ArrowDown','ArrowUp','Home','End','Tab'].includes(event.key))return;
    if(event.key==='Tab'){closeMenu();return;}
    event.preventDefault();event.stopPropagation();
    const items=[...menu.querySelectorAll('button:not(:disabled)')],index=items.indexOf(document.activeElement);
    const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
    items[next]?.focus();
  });
  document.addEventListener('pointerdown',event=>{if(!control.contains(event.target))closeMenu();});
  side.querySelector('[data-close-side]').onclick=close;
  closeSuspended.onclick=close;
  side.addEventListener('keydown',event=>{if(event.key==='Escape'&&!event.target.closest('dialog,[popover]')){event.preventDefault();event.stopPropagation();close();}});
  const changeWidth=value=>{
    const min=Number(resize.getAttribute('aria-valuemin')),max=Number(resize.getAttribute('aria-valuemax'));
    sideWidth=clampWorkspacePanelWidth(value,min,max);sideRatio=sideWidth/deck.clientWidth;layout();
  };
  resize.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();
    const current=Number(resize.getAttribute('aria-valuenow'));
    changeWidth(event.key==='Home'?Number(resize.getAttribute('aria-valuemin')):event.key==='End'?Number(resize.getAttribute('aria-valuemax')):current+(event.key==='ArrowLeft'?24:-24));
  });
  resize.addEventListener('pointerdown',event=>{if(event.button!==0)return;resize.setPointerCapture(event.pointerId);event.preventDefault();resize.focus();});
  resize.addEventListener('pointermove',event=>{if(resize.hasPointerCapture(event.pointerId))changeWidth(deck.getBoundingClientRect().right-event.clientX);});
  resize.addEventListener('pointerup',event=>{if(resize.hasPointerCapture(event.pointerId))resize.releasePointerCapture(event.pointerId);});
  // Expand changes layout only. Preserve live DOM and current scroll positions.
  host.addEventListener('click',event=>{if(event.target.closest('[data-expand-workspace]')){
    rememberScroll();
    requestAnimationFrame(()=>{layout();restoreScroll();});
  }},true);
  const setupTabScroll=strip=>{
    if(!strip||strip.dataset.scrollControlsReady)return;
    strip.dataset.scrollControlsReady="true";
    const previous=document.createElement('button'),next=document.createElement('button');
    previous.type=next.type='button';previous.className=next.className='wp-tab-scroll';previous.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>';next.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg>';
    previous.setAttribute('aria-label','Scroll tabs left');next.setAttribute('aria-label','Scroll tabs right');
    previous.dataset.scrollDirection='previous';next.dataset.scrollDirection='next';
    const actions=strip.querySelector('.tp-workspace-tab-actions');
    const update=()=>{
      if(!strip.isConnected){previous.hidden=true;next.hidden=true;return;}
      if(actions&&!actions.classList.contains('wp-actions-moved')&&strip.lastElementChild!==actions)strip.append(actions);
      const items=[...strip.querySelectorAll('[data-tab],[data-side-tab],[data-inv-tab],[data-created-context]')];if(!items.length)return;
      if(previous.parentElement!==document.body){document.body.append(previous,next);}
      const rect=strip.getBoundingClientRect();
      if(actions&&!actions.classList.contains('wp-actions-moved')){
        actions.style.setProperty('transform','none','important');
        const bounds=actions.getBoundingClientRect();
        actions.style.setProperty('transform',`translateX(${rect.right-bounds.right-1}px)`,'important');
      }
      const actionWidth=actions&&!actions.classList.contains('wp-actions-moved')?actions.getBoundingClientRect().width:0;
      next.dataset.workspaceOverlay=String(Boolean(actionWidth&&actions.querySelector('[data-expand-workspace][aria-expanded="true"]')));
      const left=rect.left;
      const top=rect.top;
      const available=rect.width-actionWidth;
      const maximum=Math.max(0,strip.scrollWidth-strip.clientWidth);
      // These controls are portalled to body: explicitly respect the tab strip's
      // clipping ancestors and the site header instead of floating above them.
      let clipTop=0,clipBottom=innerHeight;
      const siteHeader=document.querySelector('.global-header');
      if(siteHeader&&!host.classList.contains('is-focus-mode')){
        const headerRect=siteHeader.getBoundingClientRect();
        if(getComputedStyle(siteHeader).visibility!=='hidden')clipTop=Math.max(0,headerRect.bottom);
      }
      for(let ancestor=strip.parentElement;ancestor&&ancestor!==document.body;ancestor=ancestor.parentElement){
        const style=getComputedStyle(ancestor);
        if(/auto|scroll|hidden|clip/.test(style.overflowY)){
          const bounds=ancestor.getBoundingClientRect();
          clipTop=Math.max(clipTop,bounds.top);clipBottom=Math.min(clipBottom,bounds.bottom);
        }
      }
      const overflow=maximum>1,visible=rect.width>64&&rect.height>0&&rect.top>=clipTop-1&&rect.bottom<=clipBottom+1;
      previous.hidden=!overflow||!visible;
      next.hidden=!overflow||!visible;
      strip.classList.toggle('wp-tabs-overflow',overflow);
      previous.disabled=strip.scrollLeft<=1;
      strip.classList.toggle('wp-tabs-at-start',previous.disabled);
      if(strip.classList.contains('wp-side-tabs')&&previous.disabled)previous.hidden=true;
      next.disabled=strip.scrollLeft>=maximum-1;
      [previous,next].forEach(button=>{button.style.setProperty('position','fixed','important');button.style.setProperty('top',(top+1)+'px','important');button.style.setProperty('height',Math.max(0,rect.height-2)+'px','important');});
      previous.style.setProperty('left',left+'px','important');
      const rightEdge=actionWidth?actions.getBoundingClientRect().left:left+available;
      next.style.setProperty('left',Math.max(left,rightEdge-32)+'px','important');

    };
    previous.addEventListener('click',event=>{event.stopPropagation();strip.scrollBy({left:-Math.max(180,strip.clientWidth*.6),behavior:'smooth'});});
    next.addEventListener('click',event=>{event.stopPropagation();strip.scrollBy({left:Math.max(180,strip.clientWidth*.6),behavior:'smooth'});});
    strip.addEventListener('scroll',update,{passive:true});
    requestWorkspace.addEventListener('scroll',update,{passive:true});
    strip.addEventListener('focusin',event=>{if(event.target.matches('[data-tab],[data-side-tab],[data-inv-tab],[data-created-context]'))event.target.scrollIntoView({block:'nearest',inline:'nearest'});});
    window.addEventListener('resize',update);
    document.addEventListener('scroll',update,true);
    new ResizeObserver(update).observe(strip);new MutationObserver(()=>requestAnimationFrame(update)).observe(strip,{childList:true});
    new MutationObserver(()=>requestAnimationFrame(update)).observe(host,{attributes:true,attributeFilter:['class']});
    requestAnimationFrame(update);
  };
  host.setupTabScroll=setupTabScroll;
  [nav,sideTabs].forEach(setupTabScroll);
  new MutationObserver(()=>host.querySelectorAll(".inv-tabs:not([data-scroll-controls-ready])").forEach(setupTabScroll)).observe(host,{childList:true,subtree:true});
  host.querySelectorAll(".inv-tabs").forEach(setupTabScroll);
  const sideViewControls=[
    '.draft-summary-more','.tp-email-splitter',
    '[data-ticket-owner]','[data-ticket-reassign]','.tp-coordinator-link',
    '.wp-stepper-toggle','.wp-step-path-back','[data-workflow-open]','[data-workflow-close]','[data-inv-back]','[data-inv-task]','[data-inv-tab]','[data-review-related]','[data-inv-activity-toggle]','[data-open-ticket]','[data-start-investigation]','[data-open-access-ticket]',
    '[data-side-tab]','[data-tab]','.wp-tab-scroll','[data-expand-workspace]','[data-close-side]','[data-open-alongside]',
    '[data-file-key]','[data-expand-file-list]','[data-compact-files-back]','[data-compact-file-info]','[data-compact-tickets-back]','[data-compact-communication-back]',
    '.tp-ticket-navigation > button','.tp-message-row','[data-communication-id]','[data-communication-view]',
    '[data-clear-activity-filters]','[data-activity-id]','[data-toggle-all-activity]','[data-expand-thread]',
    '.tp-preview-title .draft-select-trigger','.tp-preview-title .draft-select-menu button','[data-preview-file-prev]','[data-preview-file-next]','[data-preview-file-select]','.tp-preview-tools button','.tp-preview-pager button','[data-page]','[data-page-prev]','[data-page-next]','[data-zoom-in]','[data-zoom-out]','[data-download]','[data-preview-wide]',
    '.tp-communication-filter-toggle','[data-clear-communication]','[data-comment-filters]','[data-comment-filter-reset]','[data-compact-call-info]','.communication-info-list-heading button','.communication-info-inspector > header button','[data-copy-id]','[data-copy-ticket-id]','input[type="search"]','[data-ticket-filters]','[data-activity-filter-toggle]','[data-communication-filter-toggle]',
    '[data-file-filter]','[data-source-filter]','[data-filter]','.tp-files-info-toggle','.tp-file-filter-toolbar > button'
  ].join(',');
  const sideLockedControls=new Map();
  const sideIsNavigation=element=>element.matches('.wp-stepper-toggle,.wp-step-path-back,.wp-reference-info-close')||element.matches(sideViewControls)||Boolean(element.closest('.tp-ticket-filters,.tp-comment-filter-panel,[data-activity-filters],.tp-activity-filter-popover,.tp-communication-filter-menu,.tp-file-filter-menu'));
  const syncSideReadOnly=()=>{
    sideLockedControls.forEach((disabled,control)=>{if(!sideMount.contains(control)||!control.closest('.wp-side-body')){control.disabled=host.requestPermissions?.canEdit===false?true:disabled;sideLockedControls.delete(control);}});
    sideMount.querySelectorAll(':is(button,input,select,textarea)').forEach(control=>{
      if(sideIsNavigation(control)){control.disabled=false;if(control.matches('input,textarea'))control.readOnly=false;return;}
      if(!sideLockedControls.has(control))sideLockedControls.set(control,control.disabled);
      if(!control.disabled)control.disabled=true;
    });
    sideMount.querySelectorAll('[contenteditable]').forEach(control=>{control.contentEditable='false';control.setAttribute('aria-disabled','true');});
  };
  let sideReadOnlyPending=false;
  new MutationObserver(()=>{if(sideReadOnlyPending)return;sideReadOnlyPending=true;requestAnimationFrame(()=>{sideReadOnlyPending=false;syncSideReadOnly();});}).observe(host,{subtree:true,childList:true});
  sideMount.addEventListener('click',event=>{const control=event.target.closest('button,input,select,textarea,[contenteditable]');if(control&&sideMount.contains(control)&&!sideIsNavigation(control)){event.preventDefault();event.stopImmediatePropagation();}},true);
  syncSideReadOnly();
  const syncWorkflowCounts=()=>host.querySelectorAll('.tp-workflow-segments').forEach(section=>{
    const steps=[...section.querySelectorAll('ol > li')],index=steps.findIndex(step=>step.matches('.is-active,.is-waiting'));
    section.querySelector('.tp-workflow-compact-count')?.remove();
    let toggle=section.querySelector('.wp-stepper-toggle');
    if(index<0){toggle?.remove();return;}
    if(!toggle){toggle=document.createElement('button');toggle.type='button';toggle.className='wp-stepper-toggle';toggle.setAttribute('aria-expanded','false');section.prepend(toggle);}
    const name=steps[index].querySelector('strong')?.textContent||'',status=steps[index].querySelector('small')?.textContent||'';
    const markup=`<span class="wp-stepper-ring" style="--step-progress:${(index+1)/steps.length*100}%"><span>${index+1}/${steps.length}</span></span><span class="wp-stepper-copy"><strong>${name}</strong><small>${status}</small><small>Next: ${steps[index+1]?.querySelector('strong')?.textContent||'Complete ticket'}</small></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
    const signature=JSON.stringify([index,steps.length,name,status]);
    if(toggle.dataset.stepSignature!==signature){toggle.innerHTML=markup;toggle.dataset.stepSignature=signature;}
    toggle.setAttribute('aria-label',`Step ${index+1} of ${steps.length}: ${name}. Show full path`);
    toggle.onclick=()=>{
      const container=section.closest('.wp-primary,.wp-side-body')||section.parentElement;
      container.querySelector('.wp-step-path-panel')?.remove();
      const overlay=document.createElement('section');overlay.className='wp-step-path-panel';overlay.setAttribute('aria-label','Ticket workflow');
      const back=document.createElement('button');back.type='button';back.className='wp-step-path-back';back.textContent='← Back to Ticket';
      const heading=document.createElement('h3');heading.textContent='Ticket workflow';
      const path=section.querySelector('ol').cloneNode(true);overlay.append(back,heading,path);container.append(overlay);
      const close=()=>{overlay.remove();toggle.setAttribute('aria-expanded','false');toggle.focus();};
      back.onclick=close;overlay.onkeydown=event=>{if(event.key==='Escape'){event.stopPropagation();close();}};
      toggle.setAttribute('aria-expanded','true');back.focus();
    };
  });
  new MutationObserver(syncWorkflowCounts).observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  syncWorkflowCounts();
  const syncStatusColors=()=>host.querySelectorAll('.tp-status-chip,.tp-pill,[data-status]').forEach(chip=>{
    const progress=chip.textContent.trim().toLowerCase()==='in progress';
    chip.classList.toggle('wp-status-progress',progress);
  });
  let statusColorPending=false;
  new MutationObserver(()=>{if(statusColorPending)return;statusColorPending=true;requestAnimationFrame(()=>{statusColorPending=false;syncStatusColors();});}).observe(host,{subtree:true,childList:true,characterData:true});
  syncStatusColors();
  window.addEventListener('resize',layout);
  new ResizeObserver(layout).observe(deck);
  render();
})();

if(typeof module!=='undefined')module.exports={workspacePanelGeometry,clampWorkspacePanelWidth};

// Keep list gutters intact at the smallest two-column width.
(() => {
  if(typeof document==='undefined')return;
  const sync=()=>document.querySelectorAll('.tp-ticket-browser').forEach(panel=>{
    const row=panel.querySelector('.tp-ticket-toolbar');if(!row||!row.getBoundingClientRect().width)return;
    const style=getComputedStyle(row),buttons=[...row.querySelectorAll(':scope > button')];
    const minimum=buttons.reduce((sum,button)=>sum+Math.max(button.scrollWidth,button.getBoundingClientRect().width),0)+(parseFloat(style.columnGap)||0)*Math.max(0,buttons.length-1)+(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0)+2;
    const value=Math.ceil(minimum)+'px';if(panel.style.getPropertyValue('--ticket-list-minimum')!==value)panel.style.setProperty('--ticket-list-minimum',value);
  });
  const host=document.querySelector('[data-task-prototype]');if(!host)return;
  new ResizeObserver(sync).observe(host);
  new MutationObserver(sync).observe(host,{subtree:true,childList:true});
  document.fonts.ready.then(sync);sync();
})();

(() => {
 if(typeof document==='undefined')return;
 const footer=document.querySelector('[data-screen="case"] > .tp-case-actions'),group=footer?.querySelector('.tp-case-action-group');if(!group)return;
 const toggle=document.createElement('button');toggle.type='button';toggle.className='wp-footer-more';toggle.textContent='⋮';toggle.setAttribute('aria-label','Request actions');toggle.setAttribute('aria-expanded','false');footer.append(toggle);
 const close=()=>{footer.classList.remove('wp-footer-menu-open');toggle.setAttribute('aria-expanded','false');};
 toggle.onclick=()=>{const open=!footer.classList.contains('wp-footer-menu-open');footer.classList.toggle('wp-footer-menu-open',open);toggle.setAttribute('aria-expanded',String(open));};
 const sync=()=>{footer.classList.remove('wp-footer-overflow');const style=getComputedStyle(footer),groupStyle=getComputedStyle(group);const needed=[...group.children].reduce((sum,e)=>sum+e.getBoundingClientRect().width,0)+(parseFloat(groupStyle.columnGap)||0)*Math.max(0,group.children.length-1);const available=footer.clientWidth-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0);footer.classList.toggle('wp-footer-overflow',needed>available);if(needed<=available)close();};
 new ResizeObserver(sync).observe(footer);new MutationObserver(sync).observe(group,{childList:true});document.fonts.ready.then(sync);
 document.addEventListener('click',e=>{if(!footer.contains(e.target))close();});footer.addEventListener('keydown',e=>{if(e.key==='Escape'){close();toggle.focus();}});sync();
})();
