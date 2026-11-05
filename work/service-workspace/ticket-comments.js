function commentDateMatches(timestamp,period,specificDate,now=new Date()){
  const time=new Date(timestamp).getTime();
  if(period==='all'||period==='specific'&&!specificDate)return true;
  if(period==='specific'||period==='today'){
    let start;
    if(period==='today')start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    else{const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(specificDate);if(!match)return false;start=new Date(+match[1],+match[2]-1,+match[3]);if(start.getFullYear()!==+match[1]||start.getMonth()!==+match[2]-1||start.getDate()!==+match[3])return false;}
    const end=new Date(start);end.setDate(end.getDate()+1);
    return time>=start.getTime()&&time<end.getTime();
  }
  return ['7','30'].includes(period)&&time>=now.getTime()-Number(period)*86400000&&time<=now.getTime();
}
(() => {
  const host=document.querySelector('[data-task-prototype]'),selection=host?.querySelector('.tp-ticket-selection');
  if(!selection)return;
  const requestPanel=document.createElement('section');requestPanel.className='tp-request-comments-panel';requestPanel.dataset.panel='comments';requestPanel.hidden=true;requestPanel.innerHTML='<article data-ticket-id="SR-0048217" data-comment-scope="request"></article>';
  const main=host.querySelector('.tp-case-main-workspace');main.append(requestPanel);const requestTab=document.createElement('button');requestTab.type='button';requestTab.dataset.tab='comments';requestTab.textContent='Internal comments';main.querySelector('[data-tab="information"]').after(requestTab);
  const storage='portfolio-ticket-comments-v1',pageSize=4,views=new Map();
  let saved={},drafts={};
  const readStorage='portfolio-comment-read-v2';let readByScope={};
  try{readByScope=JSON.parse(sessionStorage.getItem(readStorage))||{};}catch{}
  try{saved=JSON.parse(sessionStorage.getItem(storage))||{};}catch{}
  const history=[
    ['Felix Novak','The controller log is available. I will compare the sensor event with the airflow readings.'],
    ['Riley Cruz','Reception confirmed access to the roof plant room.'],
    ['Elliot Ward','The building manager has been notified of the investigation.'],
    ['Elliot Ward','The east meeting rooms are still warm. No further alarms have appeared.'],
    ['Riley Cruz','Please retain the alarm history before restarting the controller.'],
    ['Felix Novak','AHU-04 is the unit serving the affected rooms.'],
    ['Elliot Ward','The previous inspection report has been attached to the request.'],
    ['Riley Cruz','Diagnostics must be completed before dispatch is confirmed.'],
    ['Elliot Ward','The local panel showed a sensor alert shortly before airflow stopped.'],
    ['Riley Cruz','Issue assessment started. Equipment details are being checked.']
  ];
  function mount(article){
    if(views.has(article))return;
    const id=article.dataset.ticketId || article.querySelector('.tp-ticket-heading > small')?.textContent.trim();if(!id)return;
    const request=article.dataset.commentScope==='request';
    const canComment=()=>request?host.requestPermissions?.canEdit!==false:host.requestTickets.canComment(id);
    const latest=[...article.querySelectorAll('.tp-ticket-notes')].find(note=>note.querySelector('h4')?.textContent==='Latest comment');
    const initial=latest?[{id:id+'-latest',author:latest.querySelector('small').textContent.split(' · ')[0],body:latest.querySelector('p').textContent,time:'Today, 09:32',created:Date.now()-3600000}]:[];
    if(request)initial.push({id:id+'-coordination',author:'Elliot Ward',body:'Please coordinate plant-room access with reception before dispatch.',time:'Today, 09:30',created:Date.now()-3600000});
    latest?.remove();
    if(id==='TKT-001')history.forEach(([author,body],index)=>initial.push({id:id+'-history-'+index,author,body,time:'Today, '+String(9-Math.floor(index/4)).padStart(2,'0')+':'+String(28-index%4*7).padStart(2,'0'),created:(initial[0]?.created||Date.now())-(index+1)*600000}));
    const metadata=article.querySelector('.tp-ticket-overview-meta');
    if(metadata){
      const cells=[...metadata.children],groups=[['Owner','Team'],['Due date','Due','Work type'],['Priority','Ticket ID']],columns=groups.map(()=>{const column=document.createElement('div');column.className='tp-ticket-fact-column';return column;});
      groups.forEach((labels,index)=>labels.forEach(label=>{const cell=cells.find(cell=>cell.querySelector('small')?.textContent===label);if(cell)columns[index].append(cell);}));
      const remaining=cells.filter(cell=>!columns.some(column=>column.contains(cell)));
      metadata.replaceChildren(...columns.filter(column=>column.childElementCount));
      if(remaining.length){const extra=document.createElement('div');extra.className='tp-ticket-fact-column';extra.append(...remaining);metadata.append(extra);}
    }
    const body=document.createElement('div');body.className='tp-ticket-scroll-body';body.tabIndex=0;body.setAttribute('role','region');body.setAttribute('aria-label','Ticket overview and comments');body.append(...article.childNodes);article.append(body);
    const comments=document.createElement('section');comments.className='tp-ticket-comments';comments.innerHTML='<header><h4>Internal comments <span data-comment-count></span><small class="tp-comment-audience">Internal · Team only</small></h4><div class="tp-comment-tools"><label class="tp-comment-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><input type="search" placeholder="Search comments" aria-label="Search comments" /></label><div class="tp-comment-filter-control"><button type="button" data-comment-filters aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 6h18M6 12h12M9 18h6"/></svg><span class="tp-comment-filter-label">Filters</span><span data-comment-filter-active hidden></span></button><div class="tp-comment-filter-panel" hidden><fieldset data-comment-period><legend>Date</legend></fieldset><button type="button" data-comment-filter-reset>Reset filters</button></div></div></div></header><ol aria-label="Internal comments"></ol><p class="tp-comments-progress" role="status"></p><div class="tp-comments-sentinel" aria-hidden="true"></div>';
    comments.querySelector('.tp-comment-audience').textContent=(request?'Request':'Ticket')+' · '+id;
    body.append(comments);
    const composer=document.createElement('form');composer.className='tp-ticket-comment-composer';composer.innerHTML='<label><textarea rows="1" maxlength="2000" placeholder="Write a comment…"></textarea></label><div><small data-comment-permission></small><button type="submit">Send<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 3-7 18-4-7-7-4 18-7ZM21 3 10 14"/></svg></button></div><p role="status" aria-live="polite" hidden></p>';
    composer.hidden=false;composer.id='comment-composer-'+id;
    const launch=document.createElement('button');launch.type='button';launch.className='tp-comment-launch tp-secondary';launch.setAttribute('aria-label','Add a comment');launch.title='Add a comment';launch.setAttribute('aria-expanded','false');launch.setAttribute('aria-controls',composer.id);launch.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>';
    const close=document.createElement('button');close.type='button';close.className='tp-comment-compose-close';close.setAttribute('aria-label','Close comment editor');close.title='Close comment editor';close.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';composer.prepend(close);
    article.append(composer,launch);
    const textarea=composer.querySelector('textarea'),button=composer.querySelector('button[type="submit"]'),feed=comments.querySelector('ol'),progress=comments.querySelector('.tp-comments-progress');
    const attachments=host.mountMessageAttachments(composer);
    composer.addEventListener('attachments-changed',()=>permissions());
    textarea.setAttribute('aria-label','Add a comment to '+id);textarea.value=drafts[id]||'';
    function fitCommentInput(){
      if(!textarea.clientWidth)return;
      textarea.style.setProperty('height','auto','important');
      const style=getComputedStyle(textarea),border=(parseFloat(style.borderTopWidth)||0)+(parseFloat(style.borderBottomWidth)||0);
      const contentHeight=textarea.scrollHeight+border;
      const height=Math.max(40,Math.min(320,contentHeight));
      textarea.style.setProperty('height',height+'px','important');
      textarea.style.overflowY=contentHeight>320?'auto':'hidden';
    }
    let commentInputWidth=0;
    new ResizeObserver(()=>{if(textarea.clientWidth!==commentInputWidth){commentInputWidth=textarea.clientWidth;fitCommentInput();}}).observe(textarea);
    requestAnimationFrame(fitCommentInput);

    let commentsVisible=false;
    const setComposerOpen=()=>{composer.hidden=false;launch.hidden=true;close.hidden=true;};
    close.hidden=true;launch.hidden=true;
    let shown=pageSize,period='all',specificDate='',query='',loadingStarted=false,loadingComplete=false;
    const jump=document.createElement('button');jump.type='button';jump.className='tp-comments-jump-bottom';jump.hidden=true;jump.setAttribute('aria-label','Go to latest comment');jump.title='Go to latest comment';jump.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 4v15m-6-6 6 6 6-6"/></svg>';document.body.append(jump);
    function commentScroller(){const dock=comments.closest('.is-comments-context');return dock?(comments.scrollHeight>comments.clientHeight+1?comments:dock):body;}
    function updateJump(){
      const scroller=commentScroller(),r=scroller.getBoundingClientRect(),c=comments.getBoundingClientRect();
      const visible=comments.getClientRects().length&&r.height>0&&r.width>0&&c.bottom>0&&c.top<innerHeight;
      const end=feed.lastElementChild?.getBoundingClientRect().bottom||0;
      jump.hidden=!visible||!all().length||!loadingComplete||!records().length||(shown>=records().length&&end<=Math.min(r.bottom,innerHeight)-12);
      if(!jump.hidden){jump.style.left=Math.max(r.left+8,r.right-56)+'px';jump.style.top=Math.min(innerHeight-56,r.bottom-56)+'px';}
    }
    function jumpToLatest(){shown=records().length;render();requestAnimationFrame(()=>{const scroller=commentScroller();scroller.scrollTo({top:scroller.scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});}
    jump.onclick=jumpToLatest;
    addEventListener('resize',updateJump);
    const skeleton=document.createElement('div');skeleton.className='tp-comments-skeleton';skeleton.hidden=true;skeleton.setAttribute('role','status');skeleton.setAttribute('aria-label','Loading internal comments');skeleton.innerHTML=Array.from({length:3},(_,index)=>'<div class="tp-comment-skeleton-item '+(index===1?'is-outgoing':'')+'"><span></span><div></div></div>').join('');feed.before(skeleton);
    const beginLoading=()=>{if(loadingStarted)return;if(!all().length){loadingStarted=true;loadingComplete=true;skeleton.hidden=true;feed.hidden=false;render();return;}loadingStarted=true;feed.hidden=true;skeleton.hidden=false;comments.setAttribute('aria-busy','true');setTimeout(()=>{loadingComplete=true;skeleton.hidden=true;feed.hidden=false;comments.setAttribute('aria-busy','false');render();},3000);};
    const search=comments.querySelector('.tp-comment-search input');
    search.addEventListener('input',()=>{query=search.value.trim().toLocaleLowerCase();shown=pageSize;render();});
    const all=()=>[...initial,...(Array.isArray(saved[id])?saved[id]:[])].sort((a,b)=>b.created-a.created);
    comments.referenceRecords=()=>all().map(comment=>({...comment}));
    const viewer=()=>host.dataset.commentViewer||'Riley Cruz';
    function readIDs(){
      const key=viewer()+'::'+id;
      if(!Array.isArray(readByScope[key])){const incoming=all().filter(comment=>comment.author!==viewer());readByScope[key]=viewer()==='Riley Cruz'?incoming.slice(2).map(comment=>comment.id):[];}
      return readByScope[key];
    }
    const unreadRecords=()=>all().filter(comment=>comment.author!==viewer()&&!readIDs().includes(comment.id));
    function receiptFor(comment){return Object.entries(readByScope).some(([key,ids])=>key.endsWith('::'+id)&&key!==comment.author+'::'+id&&Array.isArray(ids)&&ids.includes(comment.id));}
    function syncUnread(){
      const count=unreadRecords().length;
      const heading=comments.querySelector('header h4');
      let badge=heading.querySelector('[data-unread-comments]');
      if(!badge){badge=document.createElement('span');badge.dataset.unreadComments='';badge.className='tp-comment-unread-count';heading.insertBefore(badge,heading.querySelector("small"));}
      badge.hidden=!count;const text=count+' new';if(badge.textContent!==text)badge.textContent=text;
      jump.setAttribute('aria-label',count?'Go to latest comment, '+count+' unread':'Go to latest comment');
      let jumpBadge=jump.querySelector('.tp-comment-unread-count');
      if(!jumpBadge){jumpBadge=document.createElement('span');jumpBadge.className='tp-comment-unread-count';jumpBadge.setAttribute('aria-hidden','true');jump.append(jumpBadge);}
      jumpBadge.hidden=!count;if(jumpBadge.textContent!==String(count))jumpBadge.textContent=String(count);
      const targets=request?[requestTab]:[...host.querySelectorAll('.inv-screen')].filter(screen=>screen.dataset.ticketId===id||(id==='TKT-001'&&screen.classList.contains('inv-investigation-screen'))).flatMap(screen=>[...screen.querySelectorAll('[data-created-context="Internal comments"],[data-inv-tab="Internal comments"]')]);
      feed.querySelectorAll('[data-comment-read-id]').forEach(row=>{
        const comment=all().find(item=>item.id===row.dataset.commentReadId);if(!comment)return;
        const own=comment.author===viewer(),read=own?receiptFor(comment):readIDs().includes(comment.id);
        let indicator=row.querySelector('.tp-message-read-state');
        if(!indicator){indicator=document.createElement('span');indicator.className='tp-message-read-state';row.querySelector('.draft-chat-message-meta').append(indicator);}
        indicator.classList.toggle('is-read',read);indicator.classList.toggle('is-incoming',!own);
        indicator.title=own?(read?'Read by another participant':'Sent; not yet read by another participant'):(read?'Read':'Unread');
        const state=own?(read?'read':'sent'):'unread';
        indicator.classList.add('draft-chat-receipt');
        if(indicator.dataset.state!==state){indicator.dataset.state=state;indicator.innerHTML=own?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(read?'m2 12 4 4L16 6m-5 8 2 2L23 6':'m5 12 4 4 10-10')+'"/></svg><span>'+(read?'Read':'Sent')+'</span>':'<span>● Unread</span>';}
        indicator.hidden=!own&&read;
      });
      targets.forEach(tab=>{let badge=tab.querySelector('.tp-comments-unread-dot,.tp-comment-unread-count');if(!badge){badge=document.createElement('span');tab.append(badge);}badge.className='tp-comment-unread-count';badge.hidden=!count;const text=count+' new';if(badge.textContent!==text)badge.textContent=text;badge.setAttribute('aria-label',count+' unread comments');});
    }
    const readObserver=new IntersectionObserver(entries=>{
      let changed=false;
      entries.forEach(({target,isIntersecting,intersectionRatio})=>{
        if(!isIntersecting||intersectionRatio<.65)return;
        const record=all().find(comment=>comment.id===target.dataset.commentReadId);
        if(record&&record.author!==viewer()&&!readIDs().includes(record.id)){readIDs().push(record.id);changed=true;}
      });
      if(changed){try{sessionStorage.setItem(readStorage,JSON.stringify(readByScope));}catch{}host.dispatchEvent(new Event('comment-read-changed'));}
    },{threshold:[.65]});

    const records=()=>all().filter(comment=>commentDateMatches(comment.created,period,specificDate)&&(!query||(comment.author+' '+comment.body).toLocaleLowerCase().includes(query))).sort((a,b)=>a.created-b.created);
    const filterButton=comments.querySelector('[data-comment-filters]'),filterPanel=comments.querySelector('.tp-comment-filter-panel');
    filterButton.setAttribute('aria-label','Filter comments');filterButton.title='Filter comments';
    filterPanel.id='comment-filters-'+id;filterPanel.setAttribute('popover','manual');filterButton.setAttribute('aria-controls',filterPanel.id);
    const positionFilters=()=>{
      const rect=filterButton.getBoundingClientRect(),width=Math.min(240,innerWidth-32);
      filterPanel.style.width=width+'px';filterPanel.style.maxHeight='none';
      filterPanel.style.left=Math.max(16,Math.min(innerWidth-width-16,rect.right-width))+'px';
      const height=filterPanel.scrollHeight;
      filterPanel.style.top=Math.max(16,Math.min(rect.bottom+6,innerHeight-height-16))+'px';
    };
    const setFilterOpen=open=>{
      filterButton.setAttribute('aria-expanded',String(open));
      if(open){filterPanel.hidden=false;positionFilters();filterPanel.showPopover();requestAnimationFrame(positionFilters);}
      else{if(filterPanel.matches(':popover-open'))filterPanel.hidePopover();filterPanel.hidden=true;}
    };
    filterButton.addEventListener('click',()=>setFilterOpen(filterPanel.hidden));
    document.addEventListener('click',event=>{if(!comments.querySelector('.tp-comment-filter-control').contains(event.target)&&!event.target.closest('.tp-unified-date-picker'))setFilterOpen(false);});
    filterPanel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setFilterOpen(false);filterButton.focus();}});
    const periods=comments.querySelector('[data-comment-period]');
    [['all','Any time'],['today','Today'],['7','Last 7 days'],['30','Last 30 days'],['specific','Specific date…']].forEach(([value,text])=>{const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='comment-period-'+id;input.value=value;input.checked=value==='all';label.append(input,document.createTextNode(text));periods.append(label);});
    const exactField=document.createElement('label');exactField.className='tp-comment-specific-date';exactField.hidden=true;
    exactField.innerHTML='<span>Select a date</span><input type="date" aria-label="Filter comments by a specific date">';periods.append(exactField);
    const exactInput=exactField.querySelector('input');
    function resetDateFilter(){period='all';specificDate='';exactInput.value='';exactField.hidden=true;periods.querySelector('input[value="all"]').checked=true;}
    filterPanel.addEventListener('change',event=>{
      if(event.target===exactInput){specificDate=exactInput.value;}
      else if(event.target.name==='comment-period-'+id){period=event.target.value;exactField.hidden=period!=='specific';}
      else return;
      shown=pageSize;render();
    });
    filterPanel.querySelector('[data-comment-filter-reset]').addEventListener('click',()=>{resetDateFilter();shown=pageSize;render();});
    const permissions=()=>{
      const editable=canComment();launch.hidden=true;close.hidden=true;composer.hidden=false;textarea.disabled=!editable;button.hidden=!editable;button.disabled=!editable||(!textarea.value.trim()&&!attachments.files.length);attachments.update();
      const permissionNote=composer.querySelector('[data-comment-permission]'),message=editable?'':article.querySelector('.tp-status-chip')?.textContent==='Completed'?'Completed · Comments are read only':'Reassign the owner to add a comment.';
      if(permissionNote.textContent!==message)permissionNote.textContent=message;
      permissionNote.hidden=!message;
    };
    const render=()=>{
      const filtered=records(),total=all().length;const active=comments.querySelector('[data-comment-filter-active]');active.hidden=period==='all'||(period==='specific'&&!specificDate);active.textContent='1';filterButton.title=period==='specific'&&specificDate?'Date: '+window.prototypeDates.format(specificDate):'Filter comments';comments.querySelector('.tp-comment-tools').hidden=total===0;readObserver.disconnect();feed.replaceChildren();
      filtered.slice(0,shown).forEach(comment=>{const row=document.createElement('li'),meta=document.createElement('div'),author=document.createElement('strong'),time=document.createElement('time'),text=document.createElement('p');author.textContent=comment.author;time.textContent=comment.time;text.textContent=comment.body;meta.append(author,time);row.className='draft-chat-entry'+(comment.author===viewer()?' is-outgoing':'');author.className='draft-chat-author';const bubble=document.createElement('div');bubble.className='draft-chat-message'+(comment.author===viewer()?' is-outgoing':'');const stamp=document.createElement('div');stamp.className='draft-chat-message-meta';stamp.append(time);bubble.append(text);if(comment.attachments){const links=document.createElement('div');links.innerHTML=host.attachmentHTML(comment.attachments);bubble.append(links);}bubble.append(stamp);row.append(author,bubble);row.dataset.commentReadId=comment.id;feed.append(row);readObserver.observe(row);});syncUnread();
      feed.hidden=!loadingComplete;skeleton.hidden=!loadingStarted||loadingComplete;
      progress.textContent=loadingStarted&&!loadingComplete?'':!filtered.length?(all().length?'No comments match your search or filters.':'No comments yet.'):'';progress.hidden=!progress.textContent;
      const emptyFeed=!loadingStarted||loadingComplete;
      const noComments=emptyFeed&&!all().length;
      comments.classList.toggle('has-no-comments',noComments);
      const dockedContext=comments.closest('.is-comments-context');
      if(!dockedContext){if(noComments&&composer.parentElement!==comments.parentElement)comments.after(composer);else if(!noComments&&composer.parentElement===body)article.append(composer);}
      if(noComments){progress.hidden=false;progress.innerHTML='<img src="../../assets/empty-states/no-comments-3d-green.webp" width="112" height="112" alt=""><strong>No comments yet</strong><span>Share an update or ask your team a question.</span>';}
      permissions();if(!filterPanel.hidden)requestAnimationFrame(positionFilters);requestAnimationFrame(updateStickyHeader);requestAnimationFrame(updateJump);
    };
    textarea.addEventListener('input',()=>{drafts[id]=textarea.value;fitCommentInput();permissions();});
    composer.addEventListener('submit',event=>{
      event.preventDefault();const text=textarea.value.trim();if((!text&&!attachments.files.length)||!canComment())return;
      const comment={id:crypto.randomUUID(),author:viewer(),body:text,attachments:[...attachments.files],time:'Just now',created:Date.now()},next={...saved,[id]:[...(saved[id]||[]),comment]};
      const status=composer.querySelector('[role="status"]');
      try{sessionStorage.setItem(storage,JSON.stringify(next));saved=next;}catch{status.hidden=false;status.textContent='Could not add comment. Your text is still here.';return;}
      attachments.clear();textarea.value='';drafts[id]='';fitCommentInput();shown=all().length;resetDateFilter();query='';search.value='';render();requestAnimationFrame(jumpToLatest);status.hidden=true;status.textContent='';setComposerOpen(false);host.dispatchEvent(new Event('internal-comments-changed'));
    });
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)&&shown<records().length){shown+=pageSize;render();}},{root:null,rootMargin:'0px 0px 80px 0px'});observer.observe(comments.querySelector('.tp-comments-sentinel'));
    const updateStickyHeader=()=>{
      updateJump();
      const dock=comments.closest('.is-comments-context');
      if(!dock&&!article.getClientRects().length){launch.hidden=true;return;}
      const header=comments.querySelector('header'),bounds=(dock||body).getBoundingClientRect(),rect=comments.getBoundingClientRect();
      commentsVisible=bounds.height>0&&rect.top<Math.min(bounds.bottom,innerHeight)-1&&rect.bottom>Math.max(bounds.top,0);
      if(commentsVisible)beginLoading();
      const scroller=commentScroller();
      header.classList.toggle('is-stuck',scroller.scrollTop>0&&header.getBoundingClientRect().top<=scroller.getBoundingClientRect().top+1);
      permissions();
    };
    new ResizeObserver(updateStickyHeader).observe(body);
    new IntersectionObserver(()=>updateStickyHeader(),{root:body,threshold:0}).observe(comments);
    document.addEventListener('scroll',updateStickyHeader,true);
    body.addEventListener('scroll',()=>{if(body.scrollHeight-body.scrollTop-body.clientHeight<100&&shown<records().length){shown+=pageSize;render();}updateStickyHeader();if(!filterPanel.hidden)positionFilters();});
    views.set(article,{permissions,render,syncUnread});render();
  }
  host.mountInternalComments=mount;
  host.addEventListener('comment-viewer-changed',()=>views.forEach(view=>view.render()));
  host.addEventListener('comment-read-changed',()=>views.forEach(view=>view.syncUnread()));
  host.addEventListener('comment-context-shown',()=>views.forEach(view=>view.syncUnread()));
  host.addEventListener('request-edit-permission-changed',()=>views.forEach(view=>view.permissions()));
  host.addEventListener('internal-comments-changed',()=>views.forEach(view=>view.render()));
  const refresh=()=>[...selection.querySelectorAll(':scope > article'),...requestPanel.querySelectorAll(':scope > article')].forEach(article=>{mount(article);views.get(article)?.permissions();});
  new MutationObserver(refresh).observe(selection,{childList:true,subtree:true,attributes:true,attributeFilter:['data-ticket-mode']});
  refresh();
})();
