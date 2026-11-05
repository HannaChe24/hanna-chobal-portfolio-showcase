(() => {
  const prototype = document.querySelector('[data-task-prototype]');
  if (!prototype) return;
  const characterCounters = new WeakMap();
  let characterCounterId = 0;
  prototype.updateCharacterCounters = (root = prototype) => {
    root.querySelectorAll('textarea[maxlength]').forEach(field => {
      if(field.closest('.tp-ticket-comment-composer'))return;
      let update = characterCounters.get(field);
      if (!update) {
        const counter = document.createElement('span');
        counter.className = 'tp-character-counter';
        counter.id = `tp-character-counter-${++characterCounterId}`;
        field.after(counter);
        const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
        descriptions.add(counter.id);
        field.setAttribute('aria-describedby', [...descriptions].join(' '));
        update = () => {
          // Match the browser's native maxlength counting, including pasted text.
          const remaining = Math.max(0, field.maxLength - field.value.length);
          counter.textContent = `${remaining.toLocaleString('en-GB')} ${remaining === 1 ? 'character' : 'characters'} remaining`;
        };
        characterCounters.set(field, update);
        field.addEventListener('input', update);
        field.addEventListener('change', update);
      }
      update();
    });
  };
  // Reset fires before the browser restores the fields' default values.
  prototype.addEventListener('reset', event => queueMicrotask(() => prototype.updateCharacterCounters(event.target)));
  // Each feature owns its attention reasons; opening a tab never clears them.
  const tabAttention = new Map();
  prototype.setTabAttention = (name, source, reason) => {
    if (!tabAttention.has(name)) tabAttention.set(name, new Map());
    const reasons = tabAttention.get(name);
    if (reason) reasons.set(source, reason);
    else reasons.delete(source);
    const tab = prototype.querySelector(`.tp-workspace-tabs [data-tab="${name}"]`);
    if (!tab) return;
    tab.querySelectorAll('.tp-tab-alert,.tp-tab-attention-text').forEach(item => item.remove());
    const description = [...reasons.values()].join(' ');
    tab.toggleAttribute('data-needs-attention', Boolean(description));
    if (!description) { tab.removeAttribute('title'); return; }
    let label = tab.querySelector('.tp-tab-label');
    if (!label) {
      label = document.createElement('span');
      label.className = 'tp-tab-label';
      label.append(...tab.childNodes);
      tab.append(label);
    }
    const dot = document.createElement('span');
    dot.className = 'tp-tab-alert';
    dot.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'tp-tab-attention-text';
    text.textContent = ` — Needs attention: ${description}`;
    label.append(dot);
    tab.append(text);
    tab.title = `Needs attention: ${description}`;
  };
  const requests = [
    ['SR-0048217','Ventilation alarm · Level 4','Urgent','Rivergate House','In progress','Today, 11:00','Riley Cruz'],
    ['SR-0048194','Lift door sensor inspection','Scheduled','Harbour Exchange','Scheduled','Today, 13:30','Elliot Ward'],
    ['SR-0048231','Water pressure drop','Urgent','Cedar Court','New','Today, 14:15','Mina Shah'],
    ['SR-0048178','Emergency lighting test','Scheduled','Northbank Centre','Scheduled','Tomorrow','Theo Grant'],
    ['SR-0048240','Loading-bay access fault','Scheduled','Atlas Works','New','Tomorrow','Riley Cruz'],
    ['SR-0048244','Heating controls review','Scheduled','Westbridge Plaza','In progress','Tomorrow, 10:00','Riley Cruz'],
    ['SR-0048249','Reception door closer fault','Urgent','Kingfisher Court','New','Today, 16:30','Riley Cruz'],
    ['SR-0048253','Meeting-room temperature issue','Scheduled','Rivergate House','Scheduled','Wed, 09:30','Riley Cruz'],
    ['SR-0048257','Basement lighting inspection','Scheduled','Cedar Court','In progress','Wed, 13:00','Riley Cruz'],
    ['SR-0048261','Intercom audio intermittent','Urgent','Northbank Centre','New','Today, 15:40','Elliot Ward'],
    ['SR-0048265','Roof access request','Scheduled','Harbour Exchange','Scheduled','Thu, 08:30','Mina Shah'],
    ['SR-0048269','Cooling unit noise report','Urgent','Westbridge Plaza','In progress','Tomorrow, 12:00','Theo Grant'],
    ['SR-0048273','Fire-door inspection follow-up','Scheduled','Atlas Works','Scheduled','Thu, 14:00','Elliot Ward'],
    ['SR-0048277','Water ingress assessment','Urgent','Kingfisher Court','New','Today, 17:00','Mina Shah'],
    ['SR-0048281','Generator test coordination','Scheduled','Rivergate House','New','Fri, 10:00','—'],
    ['SR-0048285','Car-park gate access issue','Urgent','Harbour Exchange','New','Tomorrow, 09:00','—'],
    ['SR-0048289','Washroom extractor inspection','Scheduled','Northbank Centre','Scheduled','Fri, 13:30','—'],
    ['SR-0048293','External lighting fault','Urgent','Cedar Court','New','Tomorrow, 16:00','—']
  ];
  // List metadata mirrors the compact Service information summary.
  const requestMetadata = [
    ['Ventilation','AHU-04','Air handling unit','Jamie Cole','Tenant portal'],
    ['Elevators','LFT-02','Passenger elevator','Alex Reed','Phone'],
    ['Plumbing','PMP-01','Booster pump','Sam Patel','Tenant portal'],
    ['Electrical','EL-03','Emergency lighting','Morgan Lee','Internal'],
    ['Access control','GATE-01','Loading-bay gate','Jordan Bell','Email'],
    ['Heating','HTG-02','Heating controller','Taylor Scott','Tenant portal'],
    ['Access control','DR-01','Reception door','Robin Hall','Phone'],
    ['Ventilation','AHU-02','Air handling unit','Jamie Cole','Email'],
    ['Electrical','LT-B1','Lighting circuit','Sam Patel','Internal'],
    ['Access control','IC-01','Intercom','Morgan Lee','Phone'],
    ['Access control','RF-01','Roof access door','Alex Reed','Email'],
    ['Ventilation','AC-03','Cooling unit','Taylor Scott','Tenant portal'],
    ['Fire safety','FD-02','Fire door','Jordan Bell','Internal'],
    ['Building fabric','RF-02','Roof drainage','Robin Hall','Phone'],
    ['Electrical','GEN-01','Generator','Jamie Cole','Internal'],
    ['Access control','GATE-02','Car-park gate','Alex Reed','Tenant portal'],
    ['Ventilation','EXT-01','Extractor fan','Morgan Lee','Internal'],
    ['Electrical','LT-EXT','External lighting','Sam Patel','Email']
  ];
  requests.forEach((row,index) => row.push(...requestMetadata[index]));
  requests[0][5] = 'Today, 16:30';
  const escapeCell = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const listScreen = prototype.querySelector('[data-screen="tasks"]');
  const requestScreen = prototype.querySelector('[data-screen="case"]');
  const rows = prototype.querySelector('[data-service-rows]');
  const search = prototype.querySelector('.tp-search input');
  const toast = prototype.querySelector('.tp-toast');
  const tour = prototype.querySelector('[data-prototype-tour]');
  let toastTimer;
  let tourPresented = false;
  let requestFilter = 'mine';
  let currentPage = 1;
  let rowsPerPage = 5;
  const selectedRequests = new Set();
  const tableFilters = {attention:'all',status:'all',coordinator:'all',reported:'all',source:'all'};
  const issueSummaryRow = [...prototype.querySelectorAll('.tp-structured-data > section:first-of-type dl > div')].find(row => row.querySelector('dt')?.textContent.trim() === 'Issue summary');
  issueSummaryRow?.insertAdjacentHTML('afterend','<div class="tp-long-value"><dt>Additional context</dt><dd>The tenant reported that airflow stopped shortly after a warning appeared on the local control panel. The east meeting rooms remain occupied throughout the afternoon, so access must be coordinated without interrupting scheduled sessions. Reception can provide plant-room access and should be notified before the engineer arrives. Review the attached photographs and the latest inspection report before confirming the response.</dd></div>');
  prototype.addEventListener('pointerenter', () => document.body.classList.add('tp-prototype-pointer'));
  prototype.addEventListener('pointerleave', () => document.body.classList.remove('tp-prototype-pointer'));
  const toastQueue = [];
  let toastRemaining = 0, toastStarted = 0, toastOrigin = null;
  toast.removeAttribute('role');toast.removeAttribute('aria-live');
  toast.innerHTML = '<span class="tp-toast-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg></span><span class="tp-toast-message" role="status" aria-live="polite" aria-atomic="true"></span><button type="button" class="tp-toast-close" aria-label="Dismiss notification"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>';
  const toastMessage = toast.querySelector('.tp-toast-message');
  const pauseToast = () => {
    clearTimeout(toastTimer);
    if (toastStarted) toastRemaining = Math.max(0, toastRemaining - (performance.now() - toastStarted));
    toastStarted = 0;
  };
  const resumeToast = () => {
    if (!toast.classList.contains('is-visible') || toastStarted || document.hidden || toast.matches(':hover') || toast.contains(document.activeElement)) return;
    toastStarted = performance.now();toastTimer = setTimeout(dismissToast, toastRemaining);
  };
  const dismissToast = () => {
    pauseToast();
    if (toast.contains(document.activeElement) && toastOrigin?.isConnected) toastOrigin.focus({preventScroll:true});
    toast.classList.remove('is-visible');toastMessage.textContent = '';
    if (toastQueue.length) showToast(...toastQueue.shift());
  };
  const showToast = (message, tone = 'success') => {
    if (toast.classList.contains('is-visible')) {
      if (toastMessage.textContent !== message && !toastQueue.some(item=>item[0]===message)) toastQueue.push([message,tone]);
      return;
    }
    toastOrigin = document.activeElement;
    toast.dataset.tone = tone;
    toast.querySelector('.tp-toast-icon path').setAttribute('d',tone==='failed'?'m9 9 6 6m0-6-6 6':'m8 12 3 3 5-6');
    toastRemaining = Math.max(8000, 2000 + message.split(/\s+/).length * 400);
    toastMessage.textContent = message;toast.classList.add('is-visible');resumeToast();
  };
  toast.querySelector('.tp-toast-close').addEventListener('click',dismissToast);
  toast.addEventListener('pointerenter',pauseToast);toast.addEventListener('pointerleave',resumeToast);
  toast.addEventListener('focusin',pauseToast);toast.addEventListener('focusout',()=>queueMicrotask(resumeToast));
  toast.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();dismissToast();}});
  document.addEventListener('visibilitychange',()=>document.hidden?pauseToast():resumeToast());
  const requestTicketCount=id=>{
    if(prototype.requestTickets?.countForRequest)return prototype.requestTickets.countForRequest(id);
    let added=[];try{added=JSON.parse(sessionStorage.getItem('portfolio-service-tickets-SR-0048217'))||[];}catch{}
    return (['SR-0048240','SR-0048249'].includes(id)?0:2)+added.filter(ticket=>(ticket.requestId||'SR-0048217')===id).length;
  };
  const renderRows = (query = '') => {
    const normalized = query.trim().toLowerCase();
    const filtered = requests.filter(item => (prototype.dataset.problemOnly !== 'true' || relayRemaining(item[0]) <= 900) && item.join(' ').toLowerCase().includes(normalized) && (requestFilter === 'all' || (requestFilter === 'urgent' && ['Urgent','High'].includes(item[2])) || (requestFilter === 'scheduled' && item[2] === 'Scheduled') || (requestFilter === 'mine' && item[6] === 'Riley Cruz') || (requestFilter === 'others' && !['Riley Cruz','—'].includes(item[6])) || (requestFilter === 'unassigned' && item[6] === '—')) && (tableFilters.attention === 'all' || item[2] === tableFilters.attention) && (tableFilters.status === 'all' || item[4] === tableFilters.status) && (tableFilters.coordinator === 'all' || item[6] === tableFilters.coordinator) && (tableFilters.reported === 'all' || item[10] === tableFilters.reported) && (tableFilters.source === 'all' || item[11] === tableFilters.source));
    const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    currentPage = Math.min(currentPage, pageCount);
    const pageStart = (currentPage - 1) * rowsPerPage;
    const visibleRequests = filtered.slice(pageStart, pageStart + rowsPerPage);
    const cell = (name,content) => `<td data-col="${name}"${name === 'request' ? ' class="is-pinned"' : ''}>${content}</td>`;
    rows.innerHTML = visibleRequests.map(item => `<tr tabindex="0" data-open-request data-request-id="${item[0]}" class="${selectedRequests.has(item[0]) ? 'is-selected' : ''}"><td class="tp-select-cell" data-selection-cell><input type="checkbox" aria-label="Select ${item[0]}"${selectedRequests.has(item[0]) ? ' checked' : ''} /></td>${cell('request',`<strong>${item[1]}</strong><small>${item[0]}</small>`)}${cell('attention',`<span class="tp-attention-signal is-${item[2].toLowerCase()}">${escapeCell(item[2])}</span>`)}${cell('tickets',requestTicketCount(item[0]))}${cell('site',escapeCell(item[3]))}${cell('category',escapeCell(item[7]))}${cell('equipment',`<strong>${escapeCell(item[8])}</strong><small>${escapeCell(item[9])}</small>`)}${cell('reported',escapeCell(item[10]))}${cell('source',escapeCell(item[11]))}${cell('status',`<span class="tp-pill">${escapeCell(item[4])}</span>`)}${cell('target',escapeCell(item[5]))}${cell('coordinator',escapeCell(item[6]))}<td class="tp-request-action-cell"><button type="button" class="tp-view-request" aria-label="View Request ${item[0]}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg><span>View Request</span></button></td></tr>`).join('');
    let emptyState=prototype.querySelector('[data-request-table-empty]');
    if(!emptyState){
      emptyState=document.createElement('div');emptyState.dataset.requestTableEmpty='';emptyState.className='tp-request-table-empty';emptyState.setAttribute('role','status');emptyState.setAttribute('aria-live','polite');
      rows.closest('table').after(emptyState);
    }
    const hasCriteria=Boolean(normalized||prototype.dataset.problemOnly==='true'||requestFilter!=='all'||Object.values(tableFilters).some(value=>value!=='all'));
    const emptyTitle=hasCriteria?'No requests found':'No requests to display';
    const emptyCopy=hasCriteria?'Try a different date range or adjust your filters.':'Requests will appear here when they are available.';
    emptyState.hidden=filtered.length!==0;
    if(!filtered.length)emptyState.innerHTML=`<img class="tp-request-empty-visual" src="../../assets/empty-states/request-folder-3d-green.webp" alt="" width="144" height="144" /><strong>${emptyTitle}</strong><p>${emptyCopy}</p>`;
    const footer = prototype.querySelector('.tp-list-footer');
    const rangeStart = filtered.length ? pageStart + 1 : 0;
    const rangeEnd = Math.min(pageStart + rowsPerPage, filtered.length);
    footer.querySelector(':scope > span').textContent = `Showing ${rangeStart}–${rangeEnd} of ${filtered.length} requests`;
    const pageValues = footer.querySelectorAll(':scope > div > span b');
    pageValues[0].textContent = currentPage;
    pageValues[1].textContent = pageCount;
    footer.querySelector('[aria-label="Previous page"]').disabled = currentPage === 1;
    footer.querySelector('[aria-label="Next page"]').disabled = currentPage === pageCount;
    updateBulkState();
  };
  prototype.addEventListener('ticket-overview-changed',()=>renderRows(search?.value||''));
  prototype.addEventListener('draft-problem-filter',()=>{currentPage=1;renderRows(search?.value||'');});
  const bulkBar = prototype.querySelector('[data-bulk-bar]');
  const updateBulkState = () => {
    if (!bulkBar) return;
    const count = selectedRequests.size;
    bulkBar.classList.toggle('is-inactive', count === 0);
    bulkBar.querySelector('[data-selected-count]').textContent = count;
    const actionSelect = bulkBar.querySelector('[data-bulk-select]');
    actionSelect.disabled = count === 0;
    bulkBar.querySelector('[data-bulk-apply]').disabled = count === 0 || !actionSelect.value;
    const visible = [...rows.querySelectorAll('[data-request-id]')];
    const selectAll = prototype.querySelector('[data-select-all]');
    if (selectAll) { selectAll.checked = visible.length > 0 && visible.every(row => selectedRequests.has(row.dataset.requestId)); selectAll.indeterminate = visible.some(row => selectedRequests.has(row.dataset.requestId)) && !selectAll.checked; }
  };
  prototype.querySelectorAll('.tp-filters [data-filter]').forEach(button => {
    const key = button.dataset.filter;
    button.querySelector('b').textContent = requests.filter(item => key === 'all' || (key === 'mine' && item[6] === 'Riley Cruz') || (key === 'others' && !['Riley Cruz','—'].includes(item[6])) || (key === 'unassigned' && item[6] === '—') || (key === 'urgent' && ['Urgent','High'].includes(item[2])) || (key === 'scheduled' && item[2] === 'Scheduled')).length;
  });
  prototype.querySelector('th[data-col="site"]').insertAdjacentHTML('afterend','<th data-col="category">Service category</th><th data-col="equipment">Equipment</th><th data-col="reported">Reported by</th><th data-col="source">Source</th>');
  prototype.querySelector('.tp-list-screen thead tr').insertAdjacentHTML('beforeend','<th class="tp-request-action-heading" scope="col">Actions</th>');
  // Retain the detailed data in the editable record before simplifying the sidebar.
  const sidebar = prototype.querySelector('.tp-case-context-content');
  const recordSections = prototype.querySelectorAll('.tp-structured-data > section');
  const existingLabels = new Set([...prototype.querySelectorAll('.tp-structured-data dt')].map(e=>e.textContent.trim()));
  sidebar.querySelectorAll('dl > div').forEach(row => {
    const key = row.querySelector('dt').textContent.trim();
    const aliases = {Asset:'Equipment',Provider:'Service provider',Engineer:'Assigned specialist','Affected area':'Reported impact'};
    if(key==='Site plan') {
      const copy = row.cloneNode(true);recordSections[1].querySelector('dl').append(copy);return;
    }
    if(existingLabels.has(aliases[key] || key)) return;
    const copy=row.cloneNode(true);
    if(key==='Subtype') copy.querySelector('dt').textContent='Service subtype';
    recordSections[key==='District'||key==='Address'?1:0].querySelector('dl').append(copy);
  });
  sidebar.innerHTML = '<dl><div><dt>Site</dt><dd>Rivergate House</dd></div><div><dt>Service category</dt><dd>Ventilation</dd></div><div><dt>Equipment ID</dt><dd>AHU-04</dd></div><div><dt>Equipment Type</dt><dd>Air handling unit</dd></div><div><dt>Coordinator</dt><dd>Riley Cruz</dd></div></dl><button type="button" class="tp-record-details-link" data-open-panel="information">View request record →</button>';
  renderRows();

  const closeTour = ({engage = false, continueReading = false} = {}) => {
    if (!tour) return;
    tour.hidden = true;
    prototype.classList.remove('is-tour-active');
    if (engage) setFocusMode(true);
    if (continueReading) document.querySelector('#public-references-title')?.scrollIntoView({behavior:'smooth'});
  };
  const openTour = () => {
    if (!tour || tourPresented) return;
    tourPresented = true;
    tour.hidden = false;
    prototype.classList.add('is-tour-active');
    requestAnimationFrame(() => tour.querySelector('.tp-tour-card')?.focus({preventScroll:true}));
  };
  const tourObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio > .35)) {
      openTour();
      tourObserver.disconnect();
    }
  }, {threshold:[.35]});
  tourObserver.observe(prototype);
  tour?.querySelector('[data-tour-next]')?.addEventListener('click', () => closeTour({engage:true}));
  tour?.querySelector('[data-tour-continue]')?.addEventListener('click', () => closeTour({continueReading:true}));
  tour?.querySelector('[data-tour-close]')?.addEventListener('click', () => closeTour({continueReading:true}));
  search?.addEventListener('input', event => { currentPage = 1; renderRows(event.target.value); });
  prototype.querySelectorAll('.tp-filters [data-filter]').forEach(button => button.addEventListener('click', () => {
    requestFilter = button.dataset.filter;
    prototype.querySelectorAll('.tp-filters [data-filter]').forEach(item => item.classList.toggle('is-selected', item === button || (button.closest('.tp-filter-heading') && item.dataset.filter === 'all')));
    currentPage = 1;
    renderRows(search?.value || '');
  }));
  const listFooter = prototype.querySelector('.tp-list-footer');
  listFooter?.querySelector('select')?.addEventListener('change', event => { rowsPerPage = Number(event.target.value); currentPage = 1; renderRows(search?.value || ''); });
  listFooter?.querySelector('[aria-label="Previous page"]')?.addEventListener('click', () => { if (currentPage > 1) { currentPage -= 1; renderRows(search?.value || ''); } });
  listFooter?.querySelector('[aria-label="Next page"]')?.addEventListener('click', () => { currentPage += 1; renderRows(search?.value || ''); });
  rows.addEventListener('change', event => {
    if (!event.target.matches('input[type="checkbox"]')) return;
    const row = event.target.closest('[data-request-id]');
    event.target.checked ? selectedRequests.add(row.dataset.requestId) : selectedRequests.delete(row.dataset.requestId);
    row.classList.toggle('is-selected', event.target.checked);
    updateBulkState();
  });
  prototype.querySelector('[data-select-all]')?.addEventListener('change', event => {
    rows.querySelectorAll('[data-request-id]').forEach(row => { event.target.checked ? selectedRequests.add(row.dataset.requestId) : selectedRequests.delete(row.dataset.requestId); });
    renderRows(search?.value || '');
  });
  prototype.querySelector('thead [data-selection-cell]')?.addEventListener('click', event => {
    if (event.target.matches('input')) return;
    const checkbox = event.currentTarget.querySelector('input');
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const bulkSelect = prototype.querySelector('[data-bulk-select]');
  bulkSelect?.addEventListener('change', () => { prototype.querySelector('[data-bulk-apply]').disabled = !bulkSelect.value || selectedRequests.size === 0; });
  prototype.querySelector('[data-bulk-apply]')?.addEventListener('click', () => { if (!bulkSelect.value) return; showToast(`${bulkSelect.value} applied to ${selectedRequests.size} request${selectedRequests.size === 1 ? '' : 's'}`); selectedRequests.clear(); bulkSelect.value = ''; renderRows(search?.value || ''); });
  [['reported','Reported by',10],['source','Source',11]].forEach(([key,label,index])=>{
    const values=[...new Set(requests.map(item=>item[index]))].sort();
    prototype.querySelector(`th[data-col="${key}"]`).innerHTML=`<div class="tp-header-filter"><span>${label}</span><button type="button" data-header-filter-toggle="${key}" aria-label="Filter by ${label.toLowerCase()}" aria-expanded="false"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4l-3 1V8z"/></svg><i hidden></i></button><div class="tp-header-filter-menu" data-header-filter-menu="${key}" hidden><button class="is-selected" type="button" data-filter-value="all">All</button>${values.map(value=>`<button type="button" data-filter-value="${escapeCell(value)}">${escapeCell(value)}</button>`).join('')}</div></div>`;
  });
  function syncTableFilterIndicators() {
    prototype.querySelectorAll('[data-header-filter-toggle]').forEach(toggle => {
      const key = toggle.dataset.headerFilterToggle;
      const value = tableFilters[key] || 'all';
      const active = value !== 'all';
      const wrapper = toggle.closest('.tp-header-filter');
      wrapper.classList.toggle('has-active-filter', active);
      toggle.setAttribute('aria-label', `Filter by ${key}${active ? ': ' + value : ': All'}`);
      let badge = wrapper.querySelector('.tp-header-filter-value');
      if (!badge) { badge = document.createElement('span'); badge.className = 'tp-header-filter-value'; wrapper.append(badge); }
      badge.textContent = active ? value : '';
      badge.hidden = !active;
      badge.title = active ? `Filtered by ${value}` : '';
      wrapper.querySelectorAll('[data-filter-value]').forEach(option => option.setAttribute('aria-pressed', String(option.dataset.filterValue === value)));
      const clear = wrapper.querySelector('[data-header-filter-clear]');
      if (clear) { clear.hidden = !active; clear.textContent = active ? value + ' ×' : '×'; clear.title = active ? `Clear ${key} filter: ${value}` : ''; clear.setAttribute('aria-label', `Clear ${key} filter: ${value}`); }
    });
  }
  const closeHeaderFilters = () => { prototype.querySelectorAll('[data-header-filter-menu]').forEach(menu => { menu.hidden = true; }); prototype.querySelectorAll('[data-header-filter-toggle]').forEach(button => button.setAttribute('aria-expanded','false')); };
  prototype.querySelectorAll('[data-header-filter-toggle]').forEach(toggle => toggle.insertAdjacentHTML('afterend',`<button class="tp-header-filter-clear" type="button" data-header-filter-clear="${toggle.dataset.headerFilterToggle}" aria-label="Clear ${toggle.dataset.headerFilterToggle} filter" hidden>×</button>`));
  prototype.querySelector('thead')?.addEventListener('click', event => {
    const clear = event.target.closest('[data-header-filter-clear]');
    if (clear) { const key = clear.dataset.headerFilterClear; tableFilters[key] = 'all'; const menu = prototype.querySelector(`[data-header-filter-menu="${key}"]`); menu.querySelectorAll('[data-filter-value]').forEach(button => button.classList.toggle('is-selected',button.dataset.filterValue === 'all')); clear.hidden = true; syncTableFilterIndicators(); closeHeaderFilters(); renderRows(search?.value || ''); return; }
    const toggle = event.target.closest('[data-header-filter-toggle]');
    if (toggle) { const menu = prototype.querySelector(`[data-header-filter-menu="${toggle.dataset.headerFilterToggle}"]`); const opening = menu.hidden; closeHeaderFilters(); menu.hidden = !opening; toggle.setAttribute('aria-expanded',String(opening)); return; }
    const option = event.target.closest('[data-filter-value]');
    if (!option) return;
    const menu = option.closest('[data-header-filter-menu]'); const key = menu.dataset.headerFilterMenu;
    tableFilters[key] = option.dataset.filterValue;
    menu.querySelectorAll('[data-filter-value]').forEach(button => button.classList.toggle('is-selected',button === option));
    prototype.querySelector(`[data-header-filter-clear="${key}"]`).hidden = option.dataset.filterValue === 'all';
    syncTableFilterIndicators(); closeHeaderFilters(); renderRows(search?.value || '');
  });
  syncTableFilterIndicators();
  document.addEventListener('click', event => { if (!event.target.closest('.tp-header-filter')) closeHeaderFilters(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeHeaderFilters(); });
  const openRequest = (id='SR-0048217') => { const request=requests.find(item=>item[0]===id); prototype.dispatchEvent(new CustomEvent('request-opened',{detail:{id,coordinator:request?.[6]||'Not assigned'}})); openPanel('communication'); listScreen.hidden = true; listScreen.classList.remove('is-active'); requestScreen.hidden = false; requestScreen.classList.add('is-active'); requestScreen.scrollTop = 0; };
  rows.addEventListener('click', event => {
    const selectionCell = event.target.closest('[data-selection-cell]');
    if (selectionCell) {
      if (!event.target.matches('input')) { const checkbox = selectionCell.querySelector('input'); checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change',{bubbles:true})); }
      return;
    }
    if (event.target.closest('[data-open-request]')) openRequest(event.target.closest('[data-open-request]').dataset.requestId);
  });
  rows.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-open-request]')) { event.preventDefault(); openRequest(event.target.closest('[data-open-request]').dataset.requestId); } });
  prototype.querySelector('[data-back]')?.addEventListener('click', () => {
    const leave = () => { requestScreen.hidden = true; requestScreen.classList.remove('is-active'); listScreen.hidden = false; listScreen.classList.add('is-active'); };
    if (prototype.confirmRequestLeave) prototype.confirmRequestLeave(leave); else leave();
  });
  prototype.dataset.theme = 'light';
  const openPanel = name => {
    if(prototype.workspaceLayout){prototype.workspaceLayout.select(name);return;}
    prototype.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== name; });
    prototype.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('is-current', button.dataset.tab === name));
    prototype.querySelectorAll('.tp-side-nav [data-open-panel]').forEach(button => button.classList.toggle('is-current', button.dataset.openPanel === name));
  };
  prototype.addEventListener('click', event => { const control = event.target.closest('[data-tab],[data-open-panel]'); if (control && !control.hasAttribute('data-side-tab')) openPanel(control.dataset.tab || control.dataset.openPanel); });
  prototype.querySelector('[data-nav-collapse]')?.addEventListener('click', event => { const collapsed = requestScreen.classList.toggle('is-nav-collapsed'); event.currentTarget.querySelector('span:not(.tp-icon)').textContent = collapsed ? 'Expand menu' : 'Collapse menu'; });
  const copyIdControl = prototype.querySelector('[data-copy-id]');
  const copyTooltip = document.createElement('span');
  copyTooltip.id = 'tp-copy-id-tooltip';
  copyTooltip.className = 'tp-copy-id-tooltip';
  copyTooltip.setAttribute('role', 'tooltip');
  copyTooltip.textContent = 'Click to copy request ID';
  copyTooltip.hidden = true;
  document.body.append(copyTooltip);
  copyIdControl.setAttribute('aria-describedby', copyTooltip.id);
  const positionCopyTooltip = (x, y) => {
    copyTooltip.hidden = false;
    const box = copyTooltip.getBoundingClientRect();
    copyTooltip.style.left = `${Math.max(8, Math.min(x + 14, window.innerWidth - box.width - 8))}px`;
    copyTooltip.style.top = `${y + 18 + box.height > window.innerHeight - 8 ? Math.max(8, y - box.height - 12) : y + 18}px`;
  };
  const hideCopyTooltip = () => { copyTooltip.hidden = true; };
  copyIdControl.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') positionCopyTooltip(event.clientX, event.clientY); });
  copyIdControl.addEventListener('pointermove', event => { if (event.pointerType !== 'touch') positionCopyTooltip(event.clientX, event.clientY); });
  copyIdControl.addEventListener('pointerleave', hideCopyTooltip);
  copyIdControl.addEventListener('pointerdown', hideCopyTooltip);
  copyIdControl.addEventListener('focus', () => {
    if (!copyIdControl.matches(':focus-visible')) return;
    const box = copyIdControl.getBoundingClientRect();
    positionCopyTooltip(box.left, box.bottom);
  });
  copyIdControl.addEventListener('blur', hideCopyTooltip);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideCopyTooltip(); });
  window.addEventListener('scroll', () => { if (!copyIdControl.matches(':hover, :focus-visible')) hideCopyTooltip(); }, true);
  window.addEventListener('resize', hideCopyTooltip);

  prototype.querySelector('[data-copy-id]')?.addEventListener('click', async event => { const button = event.currentTarget; try { await navigator.clipboard.writeText('SR-0048217'); } catch (_) {} button.classList.add('is-copied'); setTimeout(() => button.classList.remove('is-copied'), 1400); });
  const setWorkspaceExpanded = expanded => {
    requestScreen.classList.toggle('is-communication-expanded', expanded);
    const control = prototype.querySelector('[data-expand-workspace]');
    control.querySelector('span:last-child').textContent = expanded ? 'Restore workspace' : 'Expand workspace';
    control.querySelector('.tp-icon').textContent = expanded ? 'close_fullscreen' : 'open_in_full';
    control.setAttribute('aria-expanded', String(expanded));
    control.title = expanded ? 'Restore workspace' : 'Expand workspace';
    control.setAttribute('aria-label',control.title);
  };
  setWorkspaceExpanded(false);
  const draftKey='divider-message-draft';
  const emptyDraft={to:'jamie.cole@example.com',subject:'Update: ventilation request SR-0048217',cc:'',bcc:'',message:'',attachments:[]};
  let savedDraft={...emptyDraft};
  try {savedDraft={...emptyDraft,...JSON.parse(sessionStorage.getItem(draftKey)||'null')};} catch {}
  let messageDraft={...savedDraft};
  const draftChanged=()=>prototype.dispatchEvent(new CustomEvent('message-draft-change'));
  const renderDraftAttachments=detail=>{
    const list=detail.querySelector('.draft-message-attachments');list.replaceChildren();
    (messageDraft.attachments||[]).forEach((file,index)=>{const item=document.createElement('span');item.textContent=file.name+' ';const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove '+file.name);remove.onclick=()=>{messageDraft.attachments=messageDraft.attachments.filter((_,i)=>i!==index);renderDraftAttachments(detail);draftChanged();};item.append(remove);list.append(item);});
  };
  const fillComposer=()=>{
    const detail=prototype.querySelector('[data-message-detail]');
    if(!detail.classList.contains('tp-email-composer'))return;
    for(const key of ['to','subject','cc','bcc']){const field=detail.querySelector(`[data-draft-field="${key}"]`);field.value=messageDraft[key]||'';if(key==='cc'||key==='bcc')field.closest('label').hidden=!field.value;}
    detail.querySelector('[data-draft-field="message"]').innerHTML=messageDraft.message;
    renderDraftAttachments(detail);
  };
  prototype.messageDraft={
    getSaved:()=>({...savedDraft}),
    hasChanges:()=>JSON.stringify(messageDraft)!==JSON.stringify(savedDraft),
    commit:()=>{sessionStorage.setItem(draftKey,JSON.stringify(messageDraft));savedDraft={...messageDraft};prototype.dispatchEvent(new CustomEvent('message-draft-saved',{detail:{...savedDraft}}));},
    discard:()=>{messageDraft={...savedDraft};fillComposer();}
  };
  const closeComposer=()=>{setWorkspaceExpanded(false);prototype.dispatchEvent(new CustomEvent('restore-communication-detail'));};
  const openComposer=() => {
    setWorkspaceExpanded(true);
    const detail = prototype.querySelector('[data-message-detail]');
    detail.classList.remove('draft-chat-detail','draft-unconnected-call-detail');
    detail.classList.add('tp-email-composer');
    detail.innerHTML = `<header class="draft-compose-header"><button type="button" data-close-compose aria-label="Close" title="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button><button class="tp-primary" type="button" data-send-message>Send<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 3-7 18-4-7-7-4 18-7ZM21 3 10 14"/></svg></button></header><div class="draft-recipient-row"><label><span class="draft-compose-field-label">To</span><input type="email" data-draft-field="to" aria-label="To" placeholder="Add recipients" required /></label><button type="button" data-show-recipient="cc">Cc</button><button type="button" data-show-recipient="bcc">Bcc</button></div><label hidden><span class="draft-compose-field-label">Cc</span><input data-draft-field="cc" aria-label="Cc" placeholder="Add recipients" /></label><label hidden><span class="draft-compose-field-label">Bcc</span><input data-draft-field="bcc" aria-label="Bcc" placeholder="Add recipients" /></label><label><span class="draft-compose-field-label">Subject</span><input data-draft-field="subject" aria-label="Subject" placeholder="Add a subject" /></label><div class="draft-rich-toolbar" role="toolbar" aria-label="Text formatting"><button type="button" data-format="bold" aria-label="Bold"><b>B</b></button><button type="button" data-format="italic" aria-label="Italic"><i>I</i></button><button type="button" data-format="underline" aria-label="Underline"><u>U</u></button><span></span><button type="button" data-format="insertUnorderedList" aria-label="Bulleted list"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/></svg></button><button type="button" data-format="insertOrderedList" aria-label="Numbered list">1.</button><button type="button" data-format="removeFormat" aria-label="Clear formatting">Tx</button><button type="button" data-attach-message aria-label="Attach files"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m8 13 7-7a3 3 0 0 1 4 4L9 20a5 5 0 0 1-7-7L13 2m-8 14 9-9"/></svg></button><input type="file" data-message-files multiple hidden /></div><div class="draft-rich-editor" contenteditable="true" role="textbox" aria-label="Message" aria-multiline="true" data-draft-field="message" data-placeholder="Write a message…"></div><div class="draft-message-attachments"></div>`;
    fillComposer();
    detail.oninput=event=>{const key=event.target.dataset.draftField;if(key){messageDraft[key]=key==='message'?event.target.innerHTML:event.target.value;draftChanged();}};
    detail.querySelectorAll('[data-format]').forEach(button=>{
      button.onmousedown=event=>event.preventDefault();
      button.onclick=()=>{detail.querySelector('.draft-rich-editor').focus();document.execCommand(button.dataset.format,false,null);messageDraft.message=detail.querySelector('.draft-rich-editor').innerHTML;draftChanged();};
    });
    detail.querySelectorAll('[data-show-recipient]').forEach(button=>button.onclick=()=>{const input=detail.querySelector(`[data-draft-field="${button.dataset.showRecipient}"]`);input.closest('label').hidden=false;input.focus();});
    detail.querySelector('[data-attach-message]').onclick=()=>detail.querySelector('[data-message-files]').click();
    detail.querySelector('[data-message-files]').onchange=event=>{messageDraft.attachments=[...(messageDraft.attachments||[]),...Array.from(event.target.files).map(file=>({name:file.name,size:file.size}))];renderDraftAttachments(detail);draftChanged();};

  };
  prototype.querySelector('[data-new-message]')?.addEventListener('click',openComposer);
  prototype.addEventListener('compose-email-reply',event=>{
    const start=()=>{messageDraft={...emptyDraft,...event.detail,attachments:[]};openComposer();draftChanged();prototype.querySelector('.draft-rich-editor').focus();};
    if(prototype.messageDraft.hasChanges())prototype.confirmRequestLeave(start);else start();
  });
  let allowDraftNavigation=false;
  prototype.addEventListener('click',event=>{
    const control=event.target.closest('[data-close-compose],[data-tab],[data-communication-id],[data-communication-view],[data-new-message],[data-back],[data-open-ticket]');
    if(prototype.workspaceLayout && control?.matches('[data-tab]'))return;
    if(!control || allowDraftNavigation || !prototype.messageDraft.hasChanges() || !prototype.querySelector('.tp-email-composer'))return;
    event.preventDefault();event.stopImmediatePropagation();
    prototype.confirmRequestLeave(()=>{allowDraftNavigation=true;control.click();allowDraftNavigation=false;});
  },true);
  prototype.addEventListener('click',event=>{
    if(event.target.closest('[data-close-compose]'))closeComposer();
    if(event.target.closest('[data-send-message]')){
      const detail=prototype.querySelector('[data-message-detail]');
      const recipient=detail.querySelector('[data-draft-field="to"]');
      const message=detail.querySelector('[data-draft-field="message"]');
      if(!recipient.value.trim()||!recipient.checkValidity()){recipient.reportValidity();recipient.focus();return;}
      if(!message.textContent.trim()){message.focus();showToast('Write a message before sending.');return;}
      prototype.dispatchEvent(new CustomEvent('message-draft-cleared'));sessionStorage.removeItem(draftKey);savedDraft={...emptyDraft};messageDraft={...emptyDraft};draftChanged();closeComposer();showToast('Message sent · Demo');
    }
  });
  window.addEventListener('beforeunload',event=>{if(prototype.messageDraft.hasChanges()){event.preventDefault();event.returnValue='';}});

  prototype.querySelector('[data-expand-workspace]')?.addEventListener('click', () => setWorkspaceExpanded(!requestScreen.classList.contains('is-communication-expanded')));

  const communication = prototype.querySelector('.tp-communication-workspace');
  const splitter = document.createElement('button');
  splitter.type = 'button';
  splitter.className = 'tp-email-splitter';
  splitter.setAttribute('role', 'separator');
  splitter.setAttribute('aria-label', 'Resize email list');
  splitter.setAttribute('aria-orientation', 'vertical');
  splitter.setAttribute('aria-valuemin', '25');
  splitter.setAttribute('aria-valuemax', '65');
  let emailRatio = 0;
  const resizeEmails = value => {
    const width = communication.getBoundingClientRect().width;
    const minimum = prototype.querySelector('.tp-case-context').getBoundingClientRect().width;
    const minimumRatio = width ? minimum / width * 100 : 25;
    emailRatio = Math.max(minimumRatio, Math.min(65, value));
    splitter.setAttribute('aria-valuemin', String(Math.round(minimumRatio)));
    communication.style.setProperty('--tp-email-column', `${emailRatio}%`);
    communication.style.setProperty('--tp-email-divider', `${emailRatio}%`);
    splitter.setAttribute('aria-valuenow', String(Math.round(emailRatio)));
  };

  communication.append(splitter);
  splitter.addEventListener('pointerdown', event => { splitter.setPointerCapture(event.pointerId); event.preventDefault(); });
  splitter.addEventListener('pointermove', event => { if (!splitter.hasPointerCapture(event.pointerId)) return; const bounds = communication.getBoundingClientRect(); resizeEmails((event.clientX - bounds.left) / bounds.width * 100); });
  splitter.addEventListener('pointerup', event => splitter.releasePointerCapture(event.pointerId));
  splitter.addEventListener('keydown', event => { if (!['ArrowLeft','ArrowRight'].includes(event.key)) return; event.preventDefault(); const width = communication.getBoundingClientRect().width; const current = communication.querySelector(':scope > aside').getBoundingClientRect().width / width * 100; resizeEmails(current + (event.key === 'ArrowLeft' ? -2 : 2)); });

  const operationalRow = prototype.querySelector('.tp-operational-context');
  const tabsRow = prototype.querySelector('.tp-case-main-workspace > .tp-workspace-tabs');
  const syncContextRows = () => {
    if (!operationalRow.getBoundingClientRect().height) return;
    requestScreen.style.setProperty('--tp-operation-row-height', `${operationalRow.getBoundingClientRect().height}px`);
    requestScreen.style.setProperty('--tp-tabs-row-height', `${tabsRow.getBoundingClientRect().height}px`);
  };
  const contextRowsObserver = new ResizeObserver(syncContextRows);
  contextRowsObserver.observe(operationalRow);
  contextRowsObserver.observe(tabsRow);

  const fileViews = {
    inspection:{name:'Elevator_Inspection_Report.pdf',kind:'PDF document',size:'420 KB',by:'Alex Turner',date:'5 Sep 2026, 13:47',related:'Inspection & Assessment',preview:'document',title:'Elevator #2 inspection report',description:'Illustrative inspection evidence created for this independent prototype.'},
    photo:{name:'Elevator landing photo',format:'WEBP',kind:'Image',size:'21 KB',by:'Reported by customer',date:'5 Sep 2026, 09:48',related:'Initial issue verification',preview:'image',title:'Elevator landing display',description:'Customer-provided view of the inactive landing indicator on Level 6.'},
    summary:{name:'Repair_Summary.pdf',kind:'PDF document',size:'186 KB',by:'Maria Lopez',date:'5 Sep 2026, 14:22',related:'Repair authorization',preview:'document',title:'Repair assessment summary',description:'Recommended work and approval context for the service request.'},
    after:{name:'Lobby overview',format:'WEBP',kind:'Image',size:'67 KB',by:'Alex Turner',date:'5 Sep 2026, 14:26',related:'Post-inspection evidence',preview:'image',title:'Inspection evidence',description:'Illustrative image added after the on-site inspection.'}
  };
  fileViews.plan={name:'Level 4 · Floor plan',kind:'Floor plan · SVG',size:'—',by:'Riley Cruz',date:'5 Sep 2026, 09:32',related:'Site access',preview:'plan',title:'Level 4 · Rivergate House'};
  const filesPanel=prototype.querySelector('[data-panel="files"]');
  filesPanel.querySelector('aside').insertAdjacentHTML('beforeend','<button type="button" class="tp-document-row" data-file-key="plan" data-file-type="document"><span class="tp-icon"></span><span><strong>Level 4 · Floor plan</strong><small>Building layout · SVG</small></span></button>');
  filesPanel.querySelector('[data-file-filter="all"] b').textContent='5';
  filesPanel.querySelector('[data-file-filter="document"] b').textContent='3';
  prototype.querySelector('[data-tab="files"] b').textContent='5';
  const iconPaths={image:'<rect x="3" y="3" width="18" height="18" rx="1"/><circle cx="8" cy="8" r="2"/><path d="m3 18 6-6 4 4 3-3 5 5"/>',document:'<path d="M6 2h9l4 4v16H6zM14 2v5h5"/><text x="7" y="16" stroke="none" fill="currentColor" font-size="6" font-family="Arial">PDF</text>',plan:'<path d="M3 3h18v18H3zM3 11h8V3m0 8v10m0-6h10M16 15v6"/>'};
  filesPanel.querySelectorAll('[data-file-key]').forEach(button=>{const file=fileViews[button.dataset.fileKey];button.dataset.fileDate=new Date(file.date).toISOString().slice(0,10);const icon=button.querySelector('.tp-icon');icon.className='tp-icon';icon.innerHTML=`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${iconPaths[file.preview==='plan'?'plan':file.preview==='image'?'image':'document']}</svg>`;button.querySelector('strong').textContent=file.name;});
  const filePreview = prototype.querySelector('[data-file-preview]');
  const fileDetails = document.createElement('aside');
  fileDetails.className = 'tp-validation-sidebar';
  filesPanel.append(fileDetails);
  const fitFileSidebar = () => {
    if (filesPanel.hidden) return;
    const footer = requestScreen.querySelector('.tp-case-actions');
    const available = footer.getBoundingClientRect().top - fileDetails.getBoundingClientRect().top;
    fileDetails.style.maxHeight = window.innerWidth > 700 && available > 100 ? `${available}px` : '';
    const previewHeight = footer.getBoundingClientRect().top - filePreview.getBoundingClientRect().top;
    filePreview.style.height = window.innerWidth > 700 && previewHeight > 100 ? `${previewHeight}px` : '560px';
  };
  new ResizeObserver(fitFileSidebar).observe(filesPanel);
  window.addEventListener('resize', fitFileSidebar);

  const fileIcon = name => {
    const paths={file_info:'M5 2h10l4 4v16H5zM14 2v5h5M12 10v1m-1 3h1v5m-2 0h4',panel_left_open:'M3 3h18v18H3zM9 3v18M14 9l3 3-3 3',panel_left_close:'M3 3h18v18H3zM9 3v18m7-6-3-3 3-3',panel_right_open:'M3 3h18v18H3zM15 3v18m-5-6-3-3 3-3',panel_right_close:'M3 3h18v18H3zM15 3v18M8 9l3 3-3 3',right_panel:'M3 4h18v16H3zM15 4v16',upload:'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',grid_view:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',rotate_right:'M20 4v6h-6M20 10a8 8 0 1 0-1 8',fit_screen:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 7h10v10H7z',download:'M12 3v13m-5-5 5 5 5-5M4 16v5h16v-5',open_in_full:'M14 3h7v7M21 3l-8 8M3 14v7h7M3 21l8-8',close_fullscreen:'M21 3l-8 8m0-7v7h7M3 21l8-8m-7 0h7v7',draft:'M5 2h10l4 4v16H5zM14 2v5h5'};
    return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="${paths[name]||paths.draft}"/></svg>`;
  };
  const fileList = filesPanel.querySelector('aside');
  fileList.classList.add('tp-file-list');
  fileList.insertAdjacentHTML('afterbegin', '<header class="tp-files-heading"><strong data-files-count>Files (5)</strong><button type="button" data-upload-files aria-label="Upload files"><span class="material-symbols-outlined">upload</span><span>Upload</span></button><input type="file" data-file-input multiple hidden></header>');
  fileList.querySelector('[data-upload-files] .material-symbols-outlined').outerHTML=fileIcon('upload');
  filesPanel.classList.remove('is-files-collapsed');
  fileList.querySelector('[data-upload-files]').addEventListener('click', () => fileList.querySelector('[data-file-input]').click());
  fileList.querySelector('[data-file-input]').addEventListener('change', event => {
    for (const upload of event.target.files) {
      const key = 'upload' + Object.keys(fileViews).length;
      const url = URL.createObjectURL(upload);
      fileViews[key] = {name:escapeCell(upload.name),kind:escapeCell(upload.type || 'File'),size:Math.ceil(upload.size/1024)+' KB',by:'Riley Cruz',date:'Just now',related:'Service request',preview:'uploaded',url,mime:upload.type};
      const row = document.createElement('button');
      row.type='button'; row.className='tp-document-row'; row.dataset.fileKey=key; row.dataset.fileDate='2026-09-05'; row.dataset.fileType=upload.type.startsWith('image/')?'image':'document';
      row.innerHTML=`<span class="tp-icon">${fileIcon('draft')}</span><span><strong>${escapeCell(upload.name)}</strong><small>${fileViews[key].size}</small></span>`;
      row.addEventListener('click',()=>renderFile(key)); fileList.append(row);
      renderFile(key);
    }
    const count=Object.keys(fileViews).length;
    fileList.querySelector('[data-files-count]').textContent=`Files (${count})`;
    prototype.querySelector('[data-tab="files"] b').textContent=count;
    fileList.querySelectorAll('[data-file-filter]').forEach(button=>button.querySelector('b').textContent=[...fileList.querySelectorAll('[data-file-key]')].filter(row=>button.dataset.fileFilter==='all'||row.dataset.fileType===button.dataset.fileFilter).length);
    fileList.querySelector('[data-file-filter="all"]').click();
    event.target.value='';
  });
  const validation = {
    inspection: {sensor:'Failed', certificate:'', checked:false},
    summary: {reference:'DEMO-APPROVAL-042', checked:true}
  };
  // Each page load offers one completed example and one playable validation scenario.
  prototype.documentReviewApproval='pending';
  prototype.documentValidationExample={by:'Maria Lopez',at:new Date(Date.now()-45*60*1000).toISOString()};
  const validationRules = {
    inspection: {sensor:value=>value==='Failed'?'':'Does not match the report: sensor failed.',certificate:value=>value?.trim()?'':'Could not read the certification number from the scan. Check the original certificate and enter it manually.'},
    summary: {reference:value=>value?.trim()?'':'Required approval reference is missing.'}
  };
  // One derived result drives all validation UI; register rules for new document types here.
  const getFileValidation = key => {
    const rules=validationRules[key];
    if(!rules) return {validationStatus:'notApplicable',issues:{},openCount:0};
    const issues=Object.fromEntries(Object.entries(rules).map(([field,check])=>[field,check(validation[key]?.[field])]));
    const reviewCount=key==='inspection' && !validation[key].checked ? 1 : 0;
    const internalIssues=key==='inspection' && (validation[key]?.nextDate||'2026-10-29') <= (validation[key]?.inspectionDate||'2026-09-05') ? ['Next inspection date must be later than the inspection date.'] : [];
    const approvalCount=key==='inspection' && prototype.documentReviewApproval!=='approved'?1:0;
    const openCount=Object.values(issues).filter(Boolean).length + reviewCount + approvalCount + internalIssues.length;
    return {dataReviewed:Boolean(validation[key]?.checked),approvalCount,internalIssues,validationStatus:openCount?'requiresAttention':'passed',issues,openCount,reviewCount};
  };
  const issuesFor = key => getFileValidation(key).openCount;
  const validationLabels={passed:'Validation passed',requiresAttention:'Validation requires attention'};
  const updateFileStatuses = () => {
    fileList.querySelectorAll('[data-file-key]').forEach(button => {
      const key=button.dataset.fileKey;
      const {validationStatus}=getFileValidation(key);
      button.dataset.validationStatus=validationStatus;
      button.querySelector('.tp-file-status')?.remove();
      button.classList.remove('has-issues');
      button.querySelectorAll('.tp-validation-dot').forEach(dot=>dot.remove());
      let entry=button.parentElement;
      if(!entry.classList.contains('tp-file-entry')) {
        entry=document.createElement('div');entry.className='tp-file-entry';
        button.before(entry);entry.append(button);
      }
      entry.querySelector('.tp-file-review-link')?.remove();
      const count=issuesFor(key);
      if(count) {
        const status=document.createElement('span');status.className='tp-file-status tp-file-needs-validation';status.textContent='Needs validation';status.title='Open File info to review and validate the extracted document data.';
        button.querySelector('strong').parentElement.append(status);

      } else if(validationStatus==='passed') {
        const status=document.createElement('span');status.className='tp-file-status tp-file-validated';status.textContent='Validated';
        button.querySelector('strong').parentElement.append(status);
      }
      const fileTitle=button.querySelector('strong');
      let heading=button.querySelector('.tp-file-list-heading');
      if(!heading){heading=document.createElement('span');heading.className='tp-file-list-heading';fileTitle.before(heading);heading.append(fileTitle);}
      const badge=button.querySelector('.tp-file-status');if(badge)heading.after(badge);
      button.title=fileViews[key].name+(validationLabels[validationStatus]?' · '+validationLabels[validationStatus]:'');
      button.setAttribute('aria-label',button.title);
    });
    const pending = Object.keys(validationRules).filter(key => issuesFor(key) > 0 || !validation[key]?.checked).length;
    prototype.setTabAttention('files', 'validation', pending ? `${pending} ${pending === 1 ? 'file needs' : 'files need'} validation.` : '');
  };
  let selectedFileKey=null;
  let reviewSession=null;
  const returnDocumentToFiles=()=>{reviewSession=null;filesPanel.append(filePreview);};
  prototype.addEventListener('click',event=>{if(!prototype.workspaceLayout && event.target.closest('[data-tab="files"]')){returnDocumentToFiles();if(selectedFileKey)renderFile(selectedFileKey);}},true);
  let sidebarExpanded=true;
  fileDetails.id='tp-file-inspector';
  const fileInfoToggle=document.createElement('button');
  fileInfoToggle.type='button';fileInfoToggle.className='tp-files-info-toggle';
  fileInfoToggle.dataset.toggleInspector='';fileInfoToggle.setAttribute('aria-controls','tp-file-inspector');
  fileInfoToggle.innerHTML=fileIcon('file_info')+'<span>'+'File info'+'</span>';
  fileInfoToggle.title='Expand file information';
  filesPanel.insertBefore(fileDetails,filePreview);
  fileList.querySelector('.tp-files-heading').append(fileInfoToggle);
  fileInfoToggle.onclick=()=>{
    const expanded=sidebarExpanded && !documentExpanded;
    prototype.inlineFileInfoClosed=expanded;
    if(expanded){setFileSidebar(false);return;}
    documentExpanded=false;
    setFileSidebar(true);
    if(prototype.inlineFileValidation && validation[selectedFileKey])prototype.requestFiles.openReview(selectedFileKey);
  };
  const syncFileInfoControl = () => {
    const expanded=sidebarExpanded && !documentExpanded;
    fileInfoToggle.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/></svg><span>File details</span>';
    const destination=fileList.querySelector('.tp-files-heading');
    if(fileInfoToggle.parentElement!==destination)destination.append(fileInfoToggle);
    const label=expanded?'Close File details':'Open File details';
    fileInfoToggle.hidden=false;
    fileInfoToggle.title=label;
    fileInfoToggle.setAttribute('aria-label',label);
    fileInfoToggle.setAttribute('aria-expanded',String(expanded));
  };
  let documentExpanded=false;
  const syncFileLayout = () => {
    const inspectorVisible=sidebarExpanded && !documentExpanded;
    filesPanel.classList.toggle('is-preview-wide',documentExpanded);
    filesPanel.classList.toggle('is-inspector-collapsed',!inspectorVisible);
    fileDetails.hidden=!inspectorVisible;
    filesPanel.querySelectorAll('[data-toggle-inspector]').forEach(button=>{
      button.setAttribute('aria-expanded',String(inspectorVisible));
      button.setAttribute('aria-label',inspectorVisible?'Collapse file information':'Expand file information');
    });
    syncFileInfoControl();
    const wideButton=filePreview.querySelector('[data-preview-wide]');
    if(wideButton){
      wideButton.setAttribute('aria-expanded',String(documentExpanded));
      wideButton.setAttribute('aria-label',documentExpanded?'Restore document preview':'Expand document preview');
      wideButton.innerHTML=fileIcon(documentExpanded?'close_fullscreen':'open_in_full');
    }
    requestAnimationFrame(fitFileSidebar);
  };
  const setFileSidebar = expanded => {
    if(!expanded && sidebarExpanded){
      filesPanel.classList.remove('is-files-collapsed');
      prototype.dispatchEvent(new CustomEvent('file-layout-reset'));
    }
    sidebarExpanded=expanded;
    if(expanded) documentExpanded=false;
    syncFileLayout();
  };
  const setDocumentExpanded = expanded => {documentExpanded=expanded;syncFileLayout();};

  updateFileStatuses();
  const fileFieldState = new Map();
  const fileIsDirty = (key, state) => state.values.some((value,index)=>value!==state.saved[index]) || Boolean(validation[key]?.checked)!==state.savedChecked;
  // Save operates on every edited file, including files no longer on screen.
  const filePreviewContent=key=>{
    const file=fileViews[key];
    const lobbyPreview = `<figure class="tp-shared-evidence"><img src="../../assets/service-lobby.webp" width="1000" height="750" loading="lazy" alt="Elevator lobby with two lift doors, call panel and ceiling fire-safety devices" /><figcaption>Demo photo · <a href="https://commons.wikimedia.org/wiki/File:Elevator_Lobby,_Arizona_Biltmore_Hotel,_Missouri_Ave,_Biltmore_Area,_Phoenix,_AZ_-_54438006348.jpg" target="_blank" rel="noopener">Warren LeMay</a> · <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank" rel="noopener">CC BY-SA 2.0</a> · Monochrome, resized</figcaption></figure>`;
    const content = file.preview === 'plan' ? `<article class="tp-document-preview-page"><h4>Level 4 · Floor plan</h4><p>Rivergate House · Building A · Schematic, not to scale</p><svg viewBox="0 0 600 360" role="img" aria-label="Floor plan showing reception, corridor, meeting rooms and lift lobby" style="width:100%;height:auto"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20h560v320H20zM20 150h560M20 220h560M180 20v130M380 20v130M240 220v120M430 220v120"/></g><g fill="currentColor" font-size="16" font-family="Arial" text-anchor="middle"><text x="100" y="90">Reception</text><text x="280" y="90">Meeting rooms E01–E03</text><text x="480" y="90">Meeting rooms E04–E06</text><text x="300" y="190">Corridor</text><text x="130" y="285">Lift lobby</text><text x="335" y="285">Stairs</text><text x="500" y="285">Service access</text></g></svg></article>` : file.preview === 'image'
      ? key === 'after' ? lobbyPreview : `<figure class="tp-shared-evidence"><img src="../../assets/service-elevator.webp" width="1000" height="750" loading="lazy" alt="Elevator doors and floor indicator panel" /><figcaption>Demo photo · <a href="https://commons.wikimedia.org/wiki/File:Elevator_interior_(9487191108).jpg" target="_blank" rel="noopener">Hotel Stationery</a> · <a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noopener">CC BY 2.0</a> · Monochrome, resized</figcaption></figure>`
      : `<article class="tp-document-preview-page"><span>FICTIONAL SUPPORTING FILE</span><h4>${file.title}</h4><p>${file.description}</p><dl><div><dt>Ticket</dt><dd>SR-0048217</dd></div><div><dt>Site</dt><dd>Riverside Apartments · Building A</dd></div><div><dt>Related work</dt><dd>${file.related}</dd></div></dl></article>`;
    return content;
  };
  prototype.requestFiles = {
    comparisonFiles:()=>Object.entries(fileViews).map(([key,file])=>({key,...file})),
    comparisonPreview:key=>filePreviewContent(key),
    renderComparison:(target,key)=>{
      const file=fileViews[key];if(!file)return;
      target.innerHTML=`<header class="tp-document-preview-toolbar"></header><div class="tp-document-preview-canvas">${filePreviewContent(key)}</div>`;
      if(key==='inspection')target.querySelector('.tp-document-preview-page').insertAdjacentHTML('beforeend','<h4>Inspection checklist</h4><table class="tp-evidence-table"><thead><tr><th>Item</th><th>Status</th></tr></thead><tbody><tr><td>Door sensor test</td><td>Failed</td></tr><tr><td>Emergency communication</td><td>Passed</td></tr><tr><td>Certification number</td><td>Illegible in supplied scan</td></tr></tbody></table><p>Door sensor did not respond during the inspection. Verify the extracted data before accepting this file.</p>');
      setupFilePreview(file,key,target);
    },
    resetLayout:()=>{prototype.inlineFileInfoClosed=false;documentExpanded=false;filesPanel.classList.remove('is-files-collapsed');setFileSidebar(true);prototype.dispatchEvent(new CustomEvent('file-layout-reset'));},
    status:key=>getFileValidation(key).validationStatus,
    reviewChecks:key=>getFileValidation(key),
    editReview:key=>{if(validation[key])validation[key].checked=false;if(reviewSession)reviewSession.editable=true;renderFile(key);},
    refreshReview:()=>{if(selectedFileKey)renderFile(selectedFileKey);},
    openReviewWorkspace:(key,target,editable)=>{reviewSession={key,target,editable};renderFile(key);},
    closeReviewWorkspace:()=>{if(reviewSession){returnDocumentToFiles();if(selectedFileKey)renderFile(selectedFileKey);}},
    hasChanges: () => [...fileFieldState].some(([key,state])=>fileIsDirty(key,state)),
    snapshot: () => Object.fromEntries([...fileFieldState].map(([key,state])=>[key,{values:[...state.values],checked:Boolean(validation[key]?.checked)}])),
    commit: () => {
      fileFieldState.forEach((state,key)=>{state.saved=[...state.values];state.savedChecked=Boolean(validation[key]?.checked);});
      if(selectedFileKey) renderFile(selectedFileKey);
    },
    restore: data => {
      Object.entries(data || {}).forEach(([key,state])=>{
        if(key==='inspection')return; // Restart the interactive sample on page reload.
        if(!fileViews[key] || !Array.isArray(state.values) || !state.values.every(value=>typeof value==='string'))return;
        fileFieldState.set(key,{values:[...state.values],saved:[...state.values],savedChecked:Boolean(state.checked)});
        if(validation[key]) {
          validation[key].checked=Boolean(state.checked);
          if(key==='inspection') {validation[key].sensor=state.values[3];validation[key].certificate=state.values[4];}
          if(key==='summary') validation[key].reference=state.values[0];
        }
      });
      if(selectedFileKey) renderFile(selectedFileKey);
    },
    discard: () => {
      fileFieldState.forEach((state,key)=>{
        state.values=[...state.saved];
        if(validation[key]) {
          validation[key].checked=state.savedChecked;
          if(key==='inspection') {validation[key].sensor=state.values[3];validation[key].certificate=state.values[4];}
          if(key==='summary') validation[key].reference=state.values[0];
        }
      });
      if(selectedFileKey) renderFile(selectedFileKey);
      updateFileStatuses();
    },
    pending: () => Object.keys(validationRules).filter(key=>issuesFor(key)>0 || !validation[key]?.checked),
    review: () => {
      const key=prototype.requestFiles.pending()[0];
      if(!key)return;
      prototype.requestFiles.openReview?.(key);
    }
  };
  const renderFile = key => {
    // The compact accordion may host the live inspector inside the preview.
    // Restore its sibling position before rebuilding the preview's contents.
    if(filePreview.contains(fileDetails))filesPanel.insertBefore(fileDetails,filePreview);
    const keepPreviewExpanded=documentExpanded;
    const file = fileViews[key] || fileViews.inspection;
    const firstSelection=selectedFileKey===null;
    const selectionChanged=selectedFileKey!==key;
    selectedFileKey=key;
    if(selectionChanged){documentExpanded=false;if(prototype.inlineFileValidation && reviewSession?.key!==key)returnDocumentToFiles();}
    prototype.querySelectorAll('[data-file-key]').forEach(button => button.classList.toggle('is-current', button.dataset.fileKey === key));
    const content = filePreviewContent(key);
    filePreview.innerHTML = `<header class="tp-document-preview-toolbar"><strong>${file.name}</strong><div class="tp-document-preview-actions"><button type="button" aria-label="Zoom out"><span class="tp-icon material-symbols-outlined">zoom_out</span></button><span>100%</span><button type="button" aria-label="Zoom in"><span class="tp-icon material-symbols-outlined">zoom_in</span></button><button type="button" aria-label="Download"><span class="tp-icon material-symbols-outlined">download</span></button></div></header><div class="tp-document-preview-canvas">${content}</div>`;
    const count = issuesFor(key);
    fileList.querySelectorAll('[data-file-key]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.fileKey === key)));
    fileDetails.innerHTML = `<header class="tp-files-heading"><strong>File details</strong></header><section class="tp-file-info"><h4>File information</h4><dl>${[['File name',file.name],['Type / size',file.kind+' · '+file.size],['Uploaded',file.date],['Uploaded by',file.by],['Related work',file.related]].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></section><section class="tp-validation"><h4>Extracted information <span class="tp-validation-count">${count ? count+' open' : getFileValidation(key).validationStatus==='passed'?'✓ Validated':''}</span></h4><p>Fields marked with * are required.</p><form novalidate>${key === 'inspection' ? `<label>Inspection date<input type="date" value="2026-09-05" readonly></label><label>Elevator ID<input value="E-02" readonly></label><label>Inspection type *<select name="inspectionType" required><option>Routine safety inspection</option><option>Follow-up inspection</option></select></label><label>Door sensor status *<select name="sensor"><option>Operational</option><option>Failed</option></select><small data-error="sensor"></small></label><label>Certification number *<input name="certificate" placeholder="Enter certificate number" required><small data-error="certificate"></small></label><label>Next inspection due<input type="date" value="2026-10-29"></label><label>Inspector<select><option>TechLift Services</option><option>Building maintenance</option></select></label><label>Additional notes<textarea name="additionalNotes" maxlength="1000" rows="3" placeholder="Add notes"></textarea></label>` : key === 'summary' ? `<label>Repair authorization *<input name="reference" placeholder="Enter approval reference" required><small data-error="reference"></small></label>` : '<p>Validation does not apply to this file.</p>'}${validation[key] ? '<button type="submit" class="tp-validate-button">Validate file ↗</button>' : ''}<p class="tp-validation-feedback" role="status" aria-live="polite"></p></form></section>`;
    const metadata=fileDetails.querySelector('.tp-file-info');
    const disclosure=document.createElement('section');disclosure.className='tp-file-metadata-disclosure';
    disclosure.innerHTML='<h4>File information</h4>';
    metadata.querySelector('h4').remove();disclosure.append(metadata);
    fileDetails.querySelector(':scope > header').innerHTML=`<button type="button" class="divider-file-info-close" data-close-file-info aria-controls="tp-file-inspector" aria-label="Close file information" title="Close file information"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button><strong>File details</strong>`;
    fileDetails.append(disclosure);
    fileDetails.querySelector('[data-close-file-info]').onclick=()=>{setFileSidebar(false);fileInfoToggle.focus();};
    const validationSection=fileDetails.querySelector('.tp-validation');
    const form = validationSection.querySelector('form');
    form.querySelectorAll('label').forEach(label=>{
      const text=label.firstChild;
      const caption=document.createElement('span'); caption.textContent=text.textContent.includes('*') ? '* '+text.textContent.replace(/\*/g,'').trim() : text.textContent;
      if(text.textContent.includes('*')) label.querySelector('input,select').required=true;
      text.replaceWith(caption);
    });

    if(key==='inspection') {
      const control=form.elements.inspectionType;
      const row=control.closest('label');
      row.querySelector('span').innerHTML='<span class="tp-ai-required" aria-hidden="true">*</span> Inspection type';
      control.dataset.aiExtracted='true';
    }
    const controls=[...form.querySelectorAll('input,select')];
    const stored=fileFieldState.get(key);
    if(stored) controls.forEach((control,index)=>{if(typeof stored.values[index]==='string')control.value=stored.values[index];});
    if(stored && validation[key]) Object.keys(validationRules[key]).forEach(name=>{validation[key][name]=form.elements[name].value;});
    if(validation[key] && !stored) Object.entries(validation[key]).forEach(([name,value])=>{if(form.elements[name]) form.elements[name].value=value;});
    if(key==='inspection'){const dates=form.querySelectorAll('input[type="date"]');validation[key].inspectionDate=dates[0].value;validation[key].nextDate=dates[1].value;}
    const baseline=stored?.saved || controls.map(control=>control.value);
    const savedChecked=stored?.savedChecked ?? Boolean(validation[key]?.checked);
    const notifyFileChanges=()=>{
      const values=controls.map(control=>control.value);
      fileFieldState.set(key,{values,saved:baseline,savedChecked});
      prototype.setTabAttention('files','unsaved',prototype.requestFiles.hasChanges()?'Save or discard your file changes.':'');
      prototype.dispatchEvent(new Event('file-fields-changed'));
    };

    const syncValidatedReadOnly = () => {
      const locked=Boolean(validation[key]?.checked) && getFileValidation(key).validationStatus==='passed';
      form.classList.toggle('is-validated-readonly',locked);
      controls.forEach(control=>{
        if(locked) {
          if(control.tagName==='SELECT') control.disabled=true;
          else control.readOnly=true;
          control.setAttribute('aria-readonly','true');
        }
      });
      const validateButton=form.querySelector('.tp-validate-button');
      if(validateButton) validateButton.hidden=locked;
      const hint=validationSection.querySelector(':scope > p');
      if(hint && validation[key]) hint.hidden=locked;
    };
    const showErrors = () => {
      const state = validation[key];
      if (!state) return;
      const {issues:errors,openCount:remaining,validationStatus}=getFileValidation(key);
      Object.entries(errors).forEach(([name,message]) => {
        form.elements[name].setAttribute('aria-invalid', String(Boolean(message)));
        const error = form.querySelector(`[data-error="${name}"]`);
        error.id = `file-error-${name}`;
        error.textContent = message;
        form.elements[name].setAttribute('aria-describedby', error.id);
      });
      const reviewCount=getFileValidation(key).reviewCount;
      const errorCount=Object.values(errors).filter(Boolean).length;
      validationSection.querySelector('.tp-validation-count').textContent = remaining ? [errorCount?errorCount+' to fix':'',reviewCount?reviewCount+' to review':''].filter(Boolean).join(' · ') : state.checked?'✓ Validated':'Ready to validate';
      if(key==='inspection') {
        const row=form.elements.inspectionType.closest('label'), reviewed=Boolean(validation[key].checked);
        row.classList.toggle('tp-ai-needs-review',!reviewed);


      }
      updateFileStatuses();
      syncFileInfoControl();
      syncValidatedReadOnly();
    };
    if(validation[key]) {

      showErrors();
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if(!prototype.requestPermissions?.canEdit||(reviewSession && !reviewSession.editable))return;
      if(validation[key]) Object.keys(validation[key]).forEach(name=>{if(form.elements[name]) validation[key][name]=form.elements[name].value;});
      if(validation[key]) validation[key].checked=Object.values(getFileValidation(key).issues).every(message=>!message) && !getFileValidation(key).internalIssues.length && form.checkValidity();
      showErrors();
      notifyFileChanges();
      form.querySelector('[role="status"]').textContent=!validation[key]?.checked?'Resolve the field errors before confirming the data review.':'Saving the data review…';
      if(validation[key]?.checked && prototype.saveRequestChanges){
        const saved=await prototype.saveRequestChanges();
        if(saved)prototype.dispatchEvent(new CustomEvent('document-review-completed',{detail:{key}}));
        else form.querySelector('[role="status"]').textContent='Could not save the review. Your changes are still here.';
      }
    });
    const updateValidationDraft=()=>{
      if(key==='inspection'){const dates=form.querySelectorAll('input[type="date"]');validation[key].inspectionDate=dates[0].value;validation[key].nextDate=dates[1].value;}
      if(validation[key]) {validation[key].checked=false;Object.keys(validationRules[key]).forEach(name=>{validation[key][name]=form.elements[name].value;});}
      showErrors();notifyFileChanges();
    };
    form.addEventListener('input',updateValidationDraft);
    form.addEventListener('change',updateValidationDraft);
    form.addEventListener('file-draft-reset',updateValidationDraft);
    notifyFileChanges();
    if(key === 'inspection') filePreview.querySelector('.tp-document-preview-page').insertAdjacentHTML('beforeend', '<h4>Inspection checklist</h4><table class="tp-evidence-table"><thead><tr><th>Item</th><th>Status</th></tr></thead><tbody><tr><td>Door sensor test</td><td>Failed</td></tr><tr><td>Emergency communication</td><td>Passed</td></tr><tr><td>Certification number</td><td>Illegible in supplied scan</td></tr></tbody></table><p>Door sensor did not respond during the inspection. Verify the extracted data before accepting this file.</p>');
    setupFilePreview(file, key);
    // Set the inspector default once; later file selections preserve user control.
    setFileSidebar(firstSelection ? true : sidebarExpanded);
    // File info presents values; the editable review lives in its work ticket.
    const info=document.createElement('section');info.className='tp-file-readonly-values';
    const heading=document.createElement('h4');heading.textContent='Extracted data';info.append(heading);
    const values=document.createElement('dl');
    form.querySelectorAll('label').forEach(label=>{
      const input=label.querySelector('input,select,textarea');if(!input)return;
      const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
      dt.textContent=label.firstElementChild.textContent.replace('*','').trim();
      let text=(input.tagName==='SELECT'?input.selectedOptions[0]?.textContent:input.value)||'—';
      if(input.type==='date'&&input.value)text=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(input.value+'T12:00:00'));
      dd.textContent=text;
      row.append(dt,dd);values.append(row);
    });
    if(values.children.length)info.append(values);else info.hidden=true;
    if(values.children.length){const source=document.createElement('span');source.className='tp-extracted-ai-label';source.textContent='AI extracted';heading.append(source);}
    if(validation[key]){
      const check=getFileValidation(key),errors=Object.values(check.issues).filter(Boolean).length+(check.internalIssues?.length||0),done=check.dataReviewed;
      const overview=document.createElement('div');overview.className='tp-file-validation-overview';
      const status=document.createElement('span');status.className='tp-file-validation-state';status.dataset.tone=done?'success':'pending';status.textContent='Needs validation';status.title='Open File info to review and validate the extracted document data.';
      const details=document.createElement('small');details.textContent=done?(key==='inspection'?'10 of 10 checks passed':'All checks passed'):(errors?errors+' '+(errors===1?'field needs':'fields need')+' correction':'Data ready to validate');if(!done)overview.append(details);
      if(done){
        let receipt=key==='summary'?prototype.documentValidationExample:null;
        try {receipt=receipt||JSON.parse(sessionStorage.getItem('portfolio-document-validation-receipts')||'{}')[key];
          if(!receipt){const saved=JSON.parse(sessionStorage.getItem('portfolio-service-request-v1')||'null');if(saved?.files?.[key]?.checked&&Number.isFinite(Date.parse(saved.savedAt)))receipt={by:'Riley Cruz',at:saved.savedAt};}
        }catch{}
        const metadata=document.createElement('small');metadata.className='tp-file-validation-metadata';metadata.textContent='Confirmed by '+(receipt?.by||'Riley Cruz')+(receipt?' · '+new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(receipt.at)):'');overview.append(metadata);
      }
      const link=document.createElement('button');link.type='button';link.className=done?'tp-file-validation-details-link':'tp-file-start-validation';link.textContent=done?'View validation details →':'Review and correct →';link.onclick=()=>prototype.requestFiles.openReview?.(key);
      if(done)info.append(link);
      heading.after(overview);
      const review=document.createElement('section');review.className='tp-file-view-checks';
      const reviewTitle=document.createElement('h4');reviewTitle.textContent='Document checks';review.append(reviewTitle);
      const result=document.createElement('p');result.textContent=done?'All checks passed':errors+' '+(errors===1?'check requires':'checks require')+' attention';review.append(result);
      const messages=[...Object.values(check.issues||{}).filter(Boolean),...(check.internalIssues||[]).map(issue=>typeof issue==='string'?issue:issue.message||issue.title).filter(Boolean)];
      if(messages.length&&!done){const list=document.createElement('ul');messages.forEach(message=>{const item=document.createElement('li');item.textContent=message;list.append(item);});review.append(list);}
      const note=document.createElement('p');note.className='tp-file-view-checks-note';note.textContent=prototype.requestPermissions?.canEdit?'Review the extracted data against the source document.':'View only · The request owner can correct and confirm these values.';review.append(note);
      info.prepend(review);
    }
    validationSection.replaceWith(info);
    if(reviewSession && reviewSession.key===key){
      const {target,editable}=reviewSession;
      const inline=prototype.inlineFileValidation && target===fileDetails;
      const metadata=fileDetails.querySelector('.tp-file-metadata-disclosure').cloneNode(true);metadata.classList.add('tp-review-file-details');
      target.replaceChildren();
      if(inline){
        setFileSidebar(true);
        const header=document.createElement('header');header.className='tp-files-heading tp-inline-info-header';
        header.innerHTML='<button type="button" data-close-file-info aria-label="Close File info" title="Close File info"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button><div class="tp-inline-info-title"><strong>File details</strong><p data-review-file></p></div><span data-review-state id="document-review-summary" hidden></span><div class="tp-review-confirm"></div>';
        target.append(header);
        header.querySelector('[data-close-file-info]').onclick=()=>{
          prototype.inlineFileInfoClosed=true;setFileSidebar(false);fileInfoToggle.focus();
        };
      }
      const fields=document.createElement('section');fields.className='tp-document-review-fields';
      validationSection.querySelector('h4').firstChild.textContent='Review extracted data ';
      validationSection.querySelector(':scope > p').textContent='Compare these values with the source document. Correct missing or conflicting data before completing the review.';
      fields.append(validationSection,metadata);target.append(fields);if(!inline)target.append(filePreview);
      const submit=form.querySelector('[type="submit"]');if(submit){submit.textContent='Confirm reviewed data';submit.hidden=!editable;}
      form.querySelectorAll('input,select,textarea').forEach(input=>input.disabled=!editable);
      if(!editable)form.querySelectorAll('[data-error]').forEach(error=>error.hidden=true);
      filePreview.querySelector('[data-preview-wide]').hidden=false;
      filePreview.querySelector('[data-toggle-document-preview]').hidden=true;
      if(inline)syncFileInfoControl();
      prototype.dispatchEvent(new CustomEvent('document-review-rendered',{detail:{key}}));
    }
    if(keepPreviewExpanded)setDocumentExpanded(true);

  };
  const setupFilePreview = (file, key, previewTarget=filePreview) => {
    previewTarget.classList.remove('is-document-preview-hidden');
    const canvas=previewTarget.querySelector('.tp-document-preview-canvas');
    if(file.preview==='uploaded') {
      canvas.replaceChildren();
      const element=document.createElement(file.mime.startsWith('image/')?'img':file.mime.startsWith('video/')?'video':file.mime==='application/pdf'?'iframe':'p');
      if(element.tagName==='P') element.textContent='Preview unavailable for this file type. Use Download to open the original.';
      else {if(element.tagName==='VIDEO'){element.controls=true;element.preload='metadata';}element.src=file.url; element.title=file.name; element.style.cssText='width:100%;min-height:500px;object-fit:contain;border:0';}
      canvas.append(element);
    }
    const pages=[canvas.innerHTML];
    if(key==='inspection') {
      const sections=[['Inspection checklist','Door sensor test: Failed. Emergency communication: Passed. Safety checklist: Certification number is illegible in the supplied scan.'],['Door sensor assessment','The door sensor did not respond during the inspection. The extracted status is Failed, matching the report.'],['Safety observations','Emergency communication passed the inspection. The certification reference is blurred in the scan and could not be extracted. Verify the number against the original certificate.'],['Recommended action','Review the door sensor fault and confirm the certification reference from the original and enter it manually before accepting the inspection evidence.'],['Inspection record','Inspector: TechLift Services. Inspection type: Routine safety inspection. Next inspection due: 29 Oct 2026.']];
      sections.forEach(([title,copy],index)=>pages.push(`<article class="tp-document-preview-page"><span>ILLUSTRATIVE INSPECTION REPORT · ${index+2} / 6</span><h4>${title}</h4><p>${copy}</p><dl><div><dt>Equipment</dt><dd>Elevator E-02</dd></div><div><dt>Site</dt><dd>Rivergate House · Building A</dd></div></dl></article>`));
    }
    const previewCapabilities={
      image:file.preview==='image'||Boolean(file.mime?.startsWith('image/')),
      paginated:pages.length>1,
      embeddedPdf:file.preview==='uploaded'&&file.mime==='application/pdf',
      supported:file.preview!=='uploaded'||Boolean(file.mime?.startsWith('image/'))||Boolean(file.mime?.startsWith('video/'))||file.mime==='application/pdf'
    };
    let page=0,scale=1,rotation=0;
    previewTarget.querySelector('.tp-document-preview-toolbar').outerHTML=`<header class="tp-preview-title"><strong>${file.name}</strong></header><nav class="tp-preview-tools" aria-label="Document tools"><button type="button" data-toggle-document-preview aria-label="Hide page thumbnails" aria-pressed="true" aria-expanded="true"><span class="material-symbols-outlined">grid_view</span></button><button type="button" data-page-prev aria-label="Previous page">‹</button><span data-page-position></span><button type="button" data-page-next aria-label="Next page">›</button><button type="button" data-zoom-out aria-label="Zoom out">−</button><span data-zoom-level>100%</span><button type="button" data-zoom-in aria-label="Zoom in">+</button><button type="button" data-preview-wide aria-label="Expand document preview"><span class="material-symbols-outlined">open_in_full</span></button><button type="button" data-download aria-label="Download file"><span class="material-symbols-outlined">download</span></button></nav>`;
    const fileKeys=[...fileList.querySelectorAll('[data-file-key]')].filter(row=>!row.hidden&&!row.parentElement.hidden).map(row=>row.dataset.fileKey);
    const fileIndex=fileKeys.indexOf(key);
    if(fileIndex>=0){
      const titlebar=previewTarget.querySelector('.tp-preview-title');
      titlebar.replaceChildren();
      const previous=document.createElement('button');previous.type='button';previous.dataset.previewFilePrev='';previous.textContent='‹';previous.setAttribute('aria-label','Previous file');previous.disabled=fileIndex===0;
      const select=document.createElement('select');select.dataset.previewFileSelect='';select.setAttribute('aria-label','Choose file');
      fileKeys.forEach(fileKey=>{const option=document.createElement('option');option.value=fileKey;option.textContent=fileViews[fileKey].name;option.selected=fileKey===key;select.append(option);});
      const position=document.createElement('span');position.className='tp-preview-file-position';position.textContent=`${fileIndex+1} of ${fileKeys.length}`;
      const next=document.createElement('button');next.type='button';next.dataset.previewFileNext='';next.textContent='›';next.setAttribute('aria-label','Next file');next.disabled=fileIndex===fileKeys.length-1;
      const choose=fileKey=>{if(previewTarget===filePreview)fileList.querySelector(`[data-file-key="${fileKey}"]`)?.click();else previewTarget.dispatchEvent(new CustomEvent('preview-file-change',{bubbles:true,detail:{key:fileKey}}));};
      previous.onclick=()=>choose(fileKeys[fileIndex-1]);next.onclick=()=>choose(fileKeys[fileIndex+1]);select.onchange=()=>choose(select.value);
      titlebar.append(select,previous,position,next);
    }
    previewTarget.insertAdjacentHTML('beforeend',`<footer class="tp-preview-pager"><span data-page-caption aria-live="polite"></span><button type="button" data-page-prev aria-label="Previous page">‹</button><div class="tp-preview-thumbnails">${pages.map((_,index)=>`<button type="button" data-page="${index}" aria-label="Page ${index+1}"><span class="tp-mini-page"><i></i><i></i><i></i><b>${index+1}</b></span></button>`).join('')}</div><button type="button" data-page-next aria-label="Next page">›</button></footer>`);
    const transform=()=>{const child=canvas.firstElementChild;if(child){child.style.zoom=scale;const visual=previewCapabilities.image?(child.matches('img')?child:child.querySelector('img')):child;if(visual)visual.style.transform=`rotate(${rotation}deg)`;}previewTarget.querySelector('[data-zoom-level]').textContent=Math.round(scale*100)+'%';};
    const draw=()=>{canvas.innerHTML=pages[page];canvas.scrollTop=0;previewTarget.querySelector('[data-page-position]').textContent=`${page+1} / ${pages.length}`;previewTarget.querySelector('[data-page-caption]').textContent=`Page ${page+1} of ${pages.length}`;previewTarget.querySelectorAll('[data-page-prev]').forEach(b=>b.disabled=page===0);previewTarget.querySelectorAll('[data-page-next]').forEach(b=>b.disabled=page===pages.length-1);previewTarget.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.page)===page)));transform();};
    previewTarget.querySelectorAll('[data-page-prev]').forEach(b=>b.onclick=()=>{page=Math.max(0,page-1);draw();});
    previewTarget.querySelectorAll('[data-page-next]').forEach(b=>b.onclick=()=>{page=Math.min(pages.length-1,page+1);draw();});
    previewTarget.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=Number(b.dataset.page);draw();});
    previewTarget.querySelector('[data-zoom-in]').onclick=()=>{scale=Math.min(2,scale+.1);transform();};
    previewTarget.querySelector('[data-zoom-out]').onclick=()=>{scale=Math.max(.5,scale-.1);transform();};
    const pagesToggle=previewTarget.querySelector('[data-toggle-document-preview]');
    pagesToggle.disabled=!previewCapabilities.paginated;
    pagesToggle.hidden=!previewCapabilities.paginated;
    pagesToggle.setAttribute('aria-pressed',String(previewCapabilities.paginated));
    pagesToggle.setAttribute('aria-expanded',String(previewCapabilities.paginated));
    pagesToggle.setAttribute('aria-label',previewCapabilities.paginated?'Hide page thumbnails':'Page thumbnails');
    pagesToggle.title=previewCapabilities.paginated?'Hide page thumbnails':'Only one page';
    pagesToggle.onclick=()=>{
      if(pagesToggle.disabled)return;
      const visible=pagesToggle.getAttribute('aria-expanded')!=='true';
      pagesToggle.setAttribute('aria-pressed',String(visible));
      pagesToggle.setAttribute('aria-expanded',String(visible));
      pagesToggle.setAttribute('aria-label',visible?'Hide page thumbnails':'Show page thumbnails');
      pagesToggle.title=visible?'Hide page thumbnails':'Show page thumbnails';
      previewTarget.querySelector('.tp-preview-pager').hidden=!visible;
    };
    previewTarget.querySelector('[data-preview-wide]').onclick=()=>{
      const existing=previewTarget.closest('.tp-fullscreen-file-dialog');
      if(existing){existing.close();return;}
      const placeholder=document.createComment('preview position');previewTarget.before(placeholder);
      const dialog=document.createElement('dialog');dialog.className='tp-fullscreen-file-dialog';
      const close=document.createElement('button');close.type='button';close.className='tp-fullscreen-file-close';close.textContent='×';close.setAttribute('aria-label','Close preview');close.onclick=()=>dialog.close();
      dialog.append(close,previewTarget);filesPanel.append(dialog);
      dialog.addEventListener('close',()=>{placeholder.replaceWith(previewTarget);dialog.remove();syncFileLayout();},{once:true});
      dialog.showModal();close.focus();
    };
    previewTarget.querySelector('[data-download]').onclick=()=>{
      const link=document.createElement('a');
      const generated=!file.url;
      link.href=file.url||URL.createObjectURL(new Blob([`<!doctype html><title>${file.name}</title>${pages.join('')}`],{type:'text/html'}));
      link.download=file.url?file.name:file.name.replace(/\.[^.]+$/,'')+'-preview.html';link.click();if(generated)setTimeout(()=>URL.revokeObjectURL(link.href),1000);
    };
    previewTarget.querySelectorAll('[data-page-prev],[data-page-next],[data-page-position]').forEach(control=>{control.hidden=!previewCapabilities.paginated;});
    previewTarget.querySelector('.tp-preview-pager').hidden=!previewCapabilities.paginated;
    if(previewCapabilities.image) {
      const rotate=document.createElement('button');rotate.type='button';rotate.dataset.rotateImage='';
      rotate.setAttribute('aria-label','Rotate image clockwise');rotate.title='Rotate image clockwise';rotate.innerHTML=fileIcon('rotate_right');
      rotate.onclick=()=>{rotation=(rotation+90)%360;transform();};
      previewTarget.querySelector('[data-download]').before(rotate);
    }
    if(previewCapabilities.embeddedPdf||!previewCapabilities.supported) {
      previewTarget.querySelectorAll('[data-zoom-out],[data-zoom-in],[data-zoom-level]').forEach(control=>{control.hidden=true;});
    }
    if(!previewCapabilities.supported) previewTarget.querySelector('[data-toggle-document-preview]').hidden=true;
    previewTarget.querySelectorAll('.material-symbols-outlined').forEach(icon=>{icon.outerHTML=fileIcon(icon.textContent);});
    draw();
  };
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||filesPanel.hidden) return;
    const filterMenu=filesPanel.querySelector('.tp-file-filter-menu');
    if(filterMenu && !filterMenu.hidden) {
      event.preventDefault();event.stopImmediatePropagation();filterMenu.hidden=true;
      const filterToggle=filesPanel.querySelector('.tp-file-filter-toolbar > button');
      filterToggle.setAttribute('aria-expanded','false');filterToggle.focus();return;
    }
    if(documentExpanded) {
      event.preventDefault();event.stopImmediatePropagation();setDocumentExpanded(false);
      filePreview.querySelector('[data-preview-wide]')?.focus();
    } else if(sidebarExpanded) {
      event.preventDefault();event.stopImmediatePropagation();setFileSidebar(false);
      fileInfoToggle.focus();
    }
  },true);
  renderFile('inspection');
  prototype.querySelectorAll('[data-file-key]').forEach(button => button.addEventListener('click', () => renderFile(button.dataset.fileKey)));
  prototype.querySelectorAll('[data-file-filter]').forEach(button => button.addEventListener('click', () => {
    const type = button.dataset.fileFilter;
    prototype.querySelectorAll('[data-file-filter]').forEach(item => item.classList.toggle('is-current', item === button));
    prototype.querySelectorAll('[data-file-key]').forEach(item => { item.hidden = type !== 'all' && item.dataset.fileType !== type; if(item.parentElement.classList.contains('tp-file-entry')) item.parentElement.hidden=item.hidden; });
  }));

  const activityEvents = [
    {id:'EVT-98214',date:'TODAY · 5 SEP 2026',time:'14:26',type:'file',actor:'other',title:'Image added',summary:'1 image · Alex Turner',detail:'Post-inspection evidence was added to the ticket.',files:['after'],technical:['FILE_CREATE','attachment_count','0','1','source: user upload']},
    {id:'EVT-98208',date:'TODAY · 5 SEP 2026',time:'14:22',type:'ticket',actor:'other',title:'Issue assessment ticket completed',summary:'TKT-001 · Alex Turner',detail:'All required steps in the issue assessment ticket were completed.',technical:['TICKET_STATUS_UPDATE','ticket_status','ACTIVE','COMPLETE','source: ticket update']},
    {id:'EVT-98202',date:'TODAY · 5 SEP 2026',time:'14:05',type:'ticket',actor:'me',title:'Repair authorization requested',summary:'Pending approval · Maria Lopez',detail:'Authorization was requested before repair work could proceed.',technical:['APPROVAL_CREATE','approval_state','—','PENDING','source: user action']},
    {id:'EVT-98196',date:'TODAY · 5 SEP 2026',time:'13:47',type:'file',actor:'other',title:'File added',summary:'Elevator_Inspection_Report.pdf · Alex Turner',detail:'An inspection report was attached to the ticket.',file:'inspection',technical:['FILE_CREATE','attachment_id','—','ATT-7741','source: user upload']},
    {id:'EVT-98182',date:'TODAY · 5 SEP 2026',time:'12:15',type:'ticket',actor:'me',title:'Ticket details updated',summary:'Maria Lopez',detail:'The ticket details were saved.',technical:['RECORD_FIELDS_UPDATE','ticket_data','v12','v13','source: user action']},
    {id:'EVT-98170',date:'TODAY · 5 SEP 2026',time:'11:40',type:'ticket',actor:'other',title:'Initial issue verification completed',summary:'Reported issue and site access verified · Alex Turner',detail:'The reported issue and elevator access were verified.',technical:['TASK_STATUS_UPDATE','task_status','IN_PROGRESS','COMPLETE','source: user action']},
    {id:'EVT-98141',date:'TODAY · 5 SEP 2026',time:'10:42',type:'status',actor:'me',title:'Request status: Open → In progress',summary:'SR-0048217 · Maria Lopez',detail:'Maria Lopez moved the ticket into active coordination.',technical:['STATUS_CD_UPDATE','status_code','01','03','source: user action']},
    {id:'EVT-98134',date:'TODAY · 5 SEP 2026',time:'10:31',type:'ticket',actor:'other',title:'Issue assessment ticket started',summary:'TKT-001 · Alex Turner',detail:'The issue assessment ticket was started.',technical:['TICKET_START','ticket_id','—','TKT-001','source: user action']},
    {id:'EVT-98127',date:'TODAY · 5 SEP 2026',time:'10:21',type:'assignment',actor:'me',title:'Coordinator reassigned',summary:'Maintenance Queue → Maria Lopez',detail:'Coordination ownership moved from the shared queue to Maria Lopez.',technical:['ASSIGNEE_ID_UPDATE','owner_id','QUEUE-04','USR-118','source: user action']},
    {id:'EVT-98112',date:'TODAY · 5 SEP 2026',time:'09:56',type:'communication',actor:'other',title:'Customer email received',summary:'“Elevator is still not working on my floor.”',detail:'An incoming customer reply was added to the communication history.',technical:['MESSAGE_RECEIVED','channel','—','EMAIL','source: messaging service']},
    {id:'EVT-98105',date:'TODAY · 5 SEP 2026',time:'09:48',type:'file',actor:'other',title:'Image added',summary:'1 image · Reported by customer',detail:'Customer evidence was attached to the initial request.',files:['photo'],technical:['FILE_CREATE','attachment_count','0','1','source: intake service']},
    {id:'EVT-98091',date:'TODAY · 5 SEP 2026',time:'09:12',type:'system',actor:'system',title:'Service request SR-0048217 created',summary:'Incoming customer request · System',detail:'The system created a new ticket from the submitted request.',technical:['TICKET_CREATE','record_id','—','SR-0048217','source: intake service']},
    {id:'EVT-97988',date:'YESTERDAY · 4 SEP 2026',time:'16:48',type:'ticket',actor:'other',title:'Verify reported issue completed',summary:'Initial verification · Alex Turner',detail:'The initial verification task was completed.',technical:['TASK_STATUS_UPDATE','task_status','IN_PROGRESS','COMPLETE','source: user action']},
    {id:'EVT-97944',date:'YESTERDAY · 4 SEP 2026',time:'14:12',type:'comment',actor:'other',title:'Internal comment added',summary:'“Inspection scheduled for tomorrow morning.”',detail:'A coordinator added an internal comment.',technical:['COMMENT_CREATE','comment_id','—','CMT-441','source: user action']}
  ];
  const eventTickets={'EVT-98208':'TKT-001','EVT-98202':'TKT-002','EVT-98182':'TKT-001','EVT-98170':'TKT-001','EVT-98134':'TKT-001','EVT-97988':'TKT-001'};
  activityEvents.forEach(event=>{event.ticketId=eventTickets[event.id]||null;});
  const allActivityEvents=()=>[...activityEvents,...(prototype.ticketActivityEvents?.()||[])].sort((a,b)=>{
    const day=e=>e.date.startsWith('YESTERDAY')?'2026-09-04':'2026-09-05';
    return (day(b)+'T'+b.time).localeCompare(day(a)+'T'+a.time);
  });
  const activityFiles=event=>(event.files || [event.file]).filter(key=>fileViews[key]);
  const activityTitle=event=>activityFiles(event).length?`${event.title} · ${activityFiles(event).map(key=>fileViews[key].name).join(', ')}`:event.title;
  const activityFileName=file=>file.name.replace(/\.[a-z0-9]+$/i,'').replace(/_/g,' ');
  const activityFileFormat=file=>file.format||(file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toUpperCase())||(file.preview==='plan'?'SVG':file.kind==='PDF document'?'PDF':'FILE');
  const activitySummary=event=>activityFiles(event).length?`${event.ticketId||'SR-0048217'} · ${[...new Set(activityFiles(event).map(key=>fileViews[key].by))].join(', ')}`:event.ticketId?`${event.ticketId} · ${event.summary.replace(new RegExp('^'+event.ticketId+'\\s*·\\s*'),'')}`:event.summary;
  const activityTimeline = prototype.querySelector('[data-activity-timeline]');
  const activitySearch = prototype.querySelector('[data-activity-search]');
  const activityEmpty = prototype.querySelector('[data-activity-empty]');
  const activityChips = prototype.querySelector('[data-activity-chips]');
  const selectedTypes = new Set();
  const expandedEvents = new Set();
  let scopeFilter='all';
  let actorFilter = 'all';
  let dateFilter = 'all';
  const eventMatches = event => {
    const query = (activitySearch?.value || '').trim().toLowerCase();
    const searchable = [event.ticketId||'Request',event.title,event.summary,event.detail,...(event.files || [event.file]).filter(key=>fileViews[key]).map(key=>fileViews[key].name),event.id,event.time,event.date,'SR-0048217',`2026-09-05T${event.time}:00.000Z`,event.actor === 'me' ? 'Maria Lopez' : event.actor === 'system' ? 'System' : 'Alex Turner',...event.technical].join(' ').toLowerCase();
    const range=prototype.querySelector('[data-custom-date-range]');
    const from=range?.querySelector('input:first-of-type')?.value || '',to=range?.querySelectorAll('input')[1]?.value || '';
    const eventDay=event.date.startsWith('YESTERDAY')?'2026-09-04':'2026-09-05';
    const matchesDate=dateFilter==='all'||dateFilter==='7'||dateFilter==='30'||(dateFilter==='today'&&event.date.startsWith('TODAY'))||(dateFilter==='custom'&&(!from||eventDay>=from)&&(!to||eventDay<=to));
    return (scopeFilter==='all'||scopeFilter==='request'&&!event.ticketId||event.ticketId===scopeFilter) && (!query || searchable.includes(query)) && (!selectedTypes.size || selectedTypes.has(event.type)) && (actorFilter === 'all' || event.actor === actorFilter) && matchesDate;
  };
  const activityDetailMarkup = event => {
    const actor = event.displayActor ? escapeCell(event.displayActor) : event.actor === 'me' ? 'Maria Lopez' : event.actor === 'system' ? 'System' : 'Alex Turner';
    return `<article class="tp-activity-inline"><p>${event.detail}</p><section class="tp-activity-technical" aria-label="Event details"><dl>${event.technical.map((value,index) => `<div><dt>${['Event type','Internal field','Old code','New code','Source'][index]}</dt><dd>${value}</dd></div>`).join('')}<div><dt>Event ID</dt><dd>${event.id}</dd></div><div><dt>Record ID</dt><dd>SR-0048217</dd></div><div><dt>Precise timestamp</dt><dd>2026-09-05T${event.time}:00.000Z</dd></div></dl></section></article>`;
  };
  prototype.referenceActivityEvents=()=>allActivityEvents().map(event=>({...event}));
  prototype.renderActivityDetail=activityDetailMarkup;
  prototype.renderActivityReferenceDetail=id=>{const event=allActivityEvents().find(item=>item.id===id);return event?activityDetailMarkup(event):'';};
  const activityToolbar=prototype.querySelector('.tp-ticket-activity .tp-activity-toolbar');
  const activityBatchToggle=prototype.querySelector('[data-toggle-all-activity]');
  const activityGroupHeader=document.createElement('div');activityGroupHeader.className='tp-activity-group-header';activityGroupHeader.innerHTML='<span data-activity-group-count></span>';
  if(activityBatchToggle){activityGroupHeader.append(activityBatchToggle);activityTimeline.closest('.tp-activity-layout').before(activityGroupHeader);}
  const renderActivity = () => {
    const visible = allActivityEvents().filter(eventMatches);
    let currentDate = '';
    activityTimeline.innerHTML = visible.map(event => { const heading = event.date !== currentDate ? `<h5>${currentDate = event.date}</h5>` : ''; const expanded = expandedEvents.has(event.id); return `${heading}<div role="button" tabindex="0" data-activity-id="${event.id}" class="${expanded ? 'is-current' : ''}" aria-expanded="${expanded}"><time>${event.time}</time><span class="tp-activity-marker" aria-hidden="true"></span><span class="tp-activity-event-copy"><strong>${activityFiles(event).length?escapeCell(event.title)+' · '+activityFiles(event).map(key=>`<a href="#file-${key}" class="tp-activity-file-link" data-open-activity-file="${key}">${escapeCell(activityFileName(fileViews[key]))}.${escapeCell(activityFileFormat(fileViews[key]).toLowerCase())}</a>`).join(', '):escapeCell(event.title)}</strong><small>${escapeCell(activitySummary(event))}</small></span><span aria-hidden="true">${expanded ? '−' : '+'}</span></div>${expanded ? activityDetailMarkup(event) : ''}`; }).join('');
    activityEmpty.hidden = visible.length > 0;
    activityTimeline.hidden = visible.length === 0;
    const chips = [...selectedTypes].map(type => `<button type="button" data-remove-type="${type}">${escapeCell(prototype.querySelector(`[data-activity-type][value="${type}"]`)?.closest("label")?.textContent.trim() || type)} ×</button>`);
    if(scopeFilter!=='all')chips.push(`<button type="button" data-reset-scope>${scopeFilter==='request'?'Request only':escapeCell(scopeFilter)} ×</button>`);
    if (actorFilter !== 'all') chips.push(`<button type="button" data-reset-actor>${actorFilter} ×</button>`);
    if (dateFilter !== 'all') chips.push(`<button type="button" data-reset-date>${dateFilter === 'today' ? 'Today' : dateFilter === 'custom' ? 'Custom range' : `Last ${dateFilter} days`} ×</button>`);
    activityChips.innerHTML = chips.join(''); activityChips.hidden = chips.length === 0;
    prototype.querySelector('[data-clear-visible-filters]').hidden = chips.length === 0;
    const toggle = prototype.querySelector('[data-toggle-all-activity]');
    const allExpanded = visible.length > 0 && visible.every(event => expandedEvents.has(event.id));
    toggle.disabled = visible.length === 0;toggle.hidden=visible.length<=1;
    activityGroupHeader.hidden=visible.length===0;activityGroupHeader.querySelector('[data-activity-group-count]').textContent=''+visible.length+' '+(visible.length===1?'event':'events');
    toggle.innerHTML = `<svg class="tp-activity-toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${allExpanded ? 'm8 3 4 4 4-4M8 21l4-4 4 4' : 'm8 7 4-4 4 4M8 17l4 4 4-4'}"/></svg><span>${allExpanded ? 'Collapse all' : 'Expand all'}</span>`;

  };
  const showActivityDetails = id => {
    expandedEvents.has(id) ? expandedEvents.delete(id) : expandedEvents.add(id);
    renderActivity();
  };
  renderActivity();
  activitySearch?.addEventListener('input', renderActivity);
  activityTimeline?.addEventListener('keydown',event=>{if(event.target.matches('[data-activity-id]')&&['Enter',' '].includes(event.key)){event.preventDefault();showActivityDetails(event.target.dataset.activityId);}});
  activityTimeline?.addEventListener('click', event => { if(event.target.closest('[data-open-activity-file]'))return; const row = event.target.closest('[data-activity-id]'); if (row) showActivityDetails(row.dataset.activityId); });
  const activityFilterToggle = prototype.querySelector('[data-activity-filter-toggle]');
  const activityFilterPopover = prototype.querySelector('[data-activity-filters]');
  const scopeLabel=document.createElement('label');scopeLabel.textContent='Activity for';
  const scopeSelect=document.createElement('select');scopeSelect.dataset.activityScope='';scopeSelect.setAttribute('data-native-select','');scopeSelect.setAttribute('aria-label','Activity for');
  [['all','All activity'],['request','Request only'],['TKT-001','TKT-001 · Issue assessment'],['TKT-002','TKT-002 · Site access approval'],['TKT-V001','TKT-V001 · Diagnostics · Site visit'],['TKT-C001','TKT-C001 · Equipment history review']].forEach(([value,label])=>scopeSelect.add(new Option(label,value)));
  scopeLabel.append(scopeSelect);activityFilterPopover?.prepend(scopeLabel);
  scopeSelect.addEventListener('change',()=>{scopeFilter=scopeSelect.value;renderActivity();});
  prototype.addEventListener('ticket-activity-changed',renderActivity);
  const closeActivityFilters = () => { if (!activityFilterPopover) return; activityFilterPopover.hidden = true; activityFilterToggle?.setAttribute('aria-expanded','false'); };
  activityFilterToggle?.addEventListener('click', () => { const opening = activityFilterPopover.hidden; activityFilterPopover.hidden = !opening; activityFilterToggle.setAttribute('aria-expanded',String(opening)); });
  document.addEventListener('click', event => { if (!activityFilterPopover || activityFilterPopover.hidden || event.target.closest('[data-activity-filter-toggle],[data-activity-filters]')) return; closeActivityFilters(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !activityFilterPopover?.hidden) closeActivityFilters(); });
  prototype.querySelectorAll('[data-activity-type]').forEach(input => input.addEventListener('change', () => { input.checked ? selectedTypes.add(input.value) : selectedTypes.delete(input.value); renderActivity(); }));
  prototype.querySelector('[data-activity-actor]')?.addEventListener('change', event => { actorFilter = event.target.value; renderActivity(); });
  prototype.querySelector('[data-custom-date-range]')?.addEventListener('change',renderActivity);
  prototype.querySelector('[data-activity-date]')?.addEventListener('change', event => { dateFilter = event.target.value; const range = prototype.querySelector('[data-custom-date-range]'); if (range) range.hidden = dateFilter !== 'custom'; renderActivity(); });
  prototype.querySelector('[data-all-activity]')?.addEventListener('click', () => { selectedTypes.clear(); prototype.querySelectorAll('[data-activity-type]').forEach(input => { input.checked = false; }); renderActivity(); });
  prototype.querySelector('[data-clear-activity-filters]')?.addEventListener('click', () => { selectedTypes.clear(); scopeFilter='all';prototype.querySelector('[data-activity-scope]').value='all'; actorFilter = 'all'; dateFilter = 'all'; prototype.querySelectorAll('[data-activity-type]').forEach(input => { input.checked = false; }); prototype.querySelector('[data-activity-actor]').value = 'all'; prototype.querySelector('[data-activity-date]').value = 'all'; const range = prototype.querySelector('[data-custom-date-range]'); if (range) range.hidden = true; renderActivity(); });
  activityChips?.addEventListener('click', event => { if(event.target.hasAttribute('data-reset-scope')){scopeFilter='all';prototype.querySelector('[data-activity-scope]').value='all';} const type = event.target.dataset.removeType; if (type) { selectedTypes.delete(type); const input = prototype.querySelector(`[data-activity-type][value="${type}"]`); if (input) input.checked = false; } if (event.target.hasAttribute('data-reset-actor')) { actorFilter = 'all'; prototype.querySelector('[data-activity-actor]').value = 'all'; } if (event.target.hasAttribute('data-reset-date')) { dateFilter = 'all'; prototype.querySelector('[data-activity-date]').value = 'all'; prototype.querySelector('[data-custom-date-range]').hidden=true; } renderActivity(); });
  prototype.querySelector('[data-clear-visible-filters]')?.addEventListener('click', () => prototype.querySelector('[data-clear-activity-filters]')?.click());
  prototype.querySelector('[data-toggle-all-activity]')?.addEventListener('click', () => {
    const visible = allActivityEvents().filter(eventMatches);
    const collapse = visible.length > 0 && visible.every(event => expandedEvents.has(event.id));
    visible.forEach(event => collapse ? expandedEvents.delete(event.id) : expandedEvents.add(event.id));
    renderActivity();
  });
  activityTimeline?.addEventListener('click', event => { const fileButton = event.target.closest('[data-open-activity-file]'); if (fileButton) { event.preventDefault();event.stopPropagation(); prototype.querySelector('.tp-file-clear-filters')?.click(); returnDocumentToFiles(); openPanel('files'); renderFile(fileButton.dataset.openActivityFile); fileList.querySelector(`[data-file-key="${fileButton.dataset.openActivityFile}"]`)?.scrollIntoView({block:'nearest'}); } });

  prototype.addEventListener('request-record-saved', event => {
    const {values,changes,time,restored} = event.detail;
    const request = requests.find(row => row[0] === (prototype.requestPermissions?.requestId||'SR-0048217'));
    request[2]=values.Urgency; request[3]=values.Site; request[4]=values.Status; request[6]=values.Coordinator; request[5]=values['Target response']; request[7]=values['Service category']; request[8]=values.Equipment; request[9]=values['Asset type']; request[10]=values['Reported by']; request[11]=values.Source;
    renderRows(search?.value || '');
    if(restored || !changes.length)return;
    activityEvents.unshift({id:`EVT-RECORD-${Date.now()}`,date:'TODAY',time,type:'request',actor:'me',title:'Request record updated',summary:changes.join(' · '),detail:'Saved changes to '+changes.join(', ')+'.',technical:['RECORD_FIELDS_UPDATE','request_record','Previous values','Updated values','source: user action']});
    renderActivity();
  });
  function setFocusMode(active) { prototype.classList.remove('is-stage-locked'); prototype.classList.toggle('is-focus-mode', active); document.body.classList.toggle('tp-prototype-locked', active); prototype.querySelectorAll('[data-enter-fullscreen]').forEach(control=>{control.innerHTML='<svg class="site-fullscreen-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="'+(active?'M3 9h6V3M21 9h-6V3M15 21v-6h6M9 21v-6H3':'M9 3H3v6M15 3h6v6M21 15v6h-6M9 21H3v-6')+'"/></svg><span class="site-fullscreen-label">'+(active?'EXIT FULL SCREEN':'ENTER FULL SCREEN')+'</span>';control.setAttribute('aria-pressed',String(active));}); }
  prototype.querySelectorAll('[data-enter-fullscreen]').forEach(control=>control.addEventListener('click', () => setFocusMode(!prototype.classList.contains('is-focus-mode'))));
  prototype.querySelector('[data-exit-prototype]')?.addEventListener('click', () => { if (prototype.classList.contains('is-focus-mode')) setFocusMode(false); else if (prototype.classList.contains('is-stage-locked')) { prototype.classList.remove('is-stage-locked'); document.body.classList.remove('tp-prototype-locked'); } else document.querySelector('#public-references-title')?.scrollIntoView({behavior:'smooth'}); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open],:popover-open')) return;
    // Let a select dismiss its picker without also leaving the workspace.
    if (event.target instanceof Element && event.target.closest('select')) return;
    if (!tour?.hidden) closeTour({continueReading:true});
    else { prototype.classList.remove('is-stage-locked'); setFocusMode(false); }
  });
})();

// File categories share Communication's compact filter control.
(() => {
  const toolbar=document.querySelector('.tp-document-filters');
  if(!toolbar)return;
  const options=[...toolbar.querySelectorAll('[data-file-filter]')];
  const toggle=document.createElement('button');
  toggle.type='button';toggle.className='tp-communication-filter-toggle';
  toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','file-filters');
  const menu=document.createElement('div');
  menu.id='file-filters';menu.className='tp-communication-filter-menu tp-file-filter-menu';menu.hidden=true;
  const heading=document.createElement('p');heading.textContent='File type';menu.append(heading,...options);
  const dateLabel=document.createElement('label');dateLabel.textContent='Date';
  const date=document.createElement('select');date.dataset.fileDateFilter='';
  date.innerHTML=document.querySelector('[data-activity-date]').innerHTML;dateLabel.append(date);
  const range=document.createElement('div');range.className='tp-file-date-range';range.hidden=true;
  const calendarIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>';
  range.innerHTML=`<label><span>From</span><span class="tp-filter-date-field"><input type="date" aria-label="From date" data-file-date-from value="2026-09-04">${calendarIcon}</span></label><label><span>To</span><span class="tp-filter-date-field"><input type="date" aria-label="To date" data-file-date-to value="2026-09-05">${calendarIcon}</span></label>`;
  const clear=document.createElement('button');clear.type='button';clear.className='tp-file-clear-filters';clear.textContent='Clear filters';
  menu.append(dateLabel,range,clear);
  toolbar.replaceChildren(toggle,menu);
  toolbar.classList.add('tp-file-filter-toolbar');
  const sync=()=>{
    const active=options.find(b=>b.classList.contains('is-current'));
    const filtered=(active?.dataset.fileFilter!=='all'?1:0)+(date.value!=='all'?1:0);
    toggle.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6h18M6 12h12M9 18h6"/></svg> Filters'+(filtered?` <span>${filtered}</span>`:'');
    toggle.setAttribute('aria-label',filtered?`Filter files, ${filtered} active filters`:'Filter files');
    options.forEach(b=>b.setAttribute('aria-pressed',String(b===active)));
  };
  const close=()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');};
  toggle.onclick=()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));};
  const apply=()=>{
    const type=options.find(b=>b.classList.contains('is-current'))?.dataset.fileFilter||'all';
    const from=range.querySelector('[data-file-date-from]').value,to=range.querySelector('[data-file-date-to]').value;
    const today='2026-09-05'; // Same reference day as Request Activity's demo events.
    toolbar.closest('.tp-file-list').querySelectorAll('[data-file-key]').forEach(row=>{
      const day=row.dataset.fileDate;const age=(Date.parse(today)-Date.parse(day))/86400000;
      const matches=date.value==='all'||(date.value==='today'&&day===today)||(['7','30'].includes(date.value)&&age>=0&&age<Number(date.value))||(date.value==='custom'&&(!from||day>=from)&&(!to||day<=to));
      row.hidden=(type!=='all'&&row.dataset.fileType!==type)||!matches;
      if(row.parentElement.classList.contains('tp-file-entry'))row.parentElement.hidden=row.hidden;
    });
    sync();
  };
  date.onchange=()=>{range.hidden=date.value!=='custom';apply();};range.addEventListener('change',apply);
  options.forEach(b=>b.addEventListener('click',()=>{apply();close();toggle.focus();}));
  clear.onclick=()=>{date.value='all';range.hidden=true;options.find(b=>b.dataset.fileFilter==='all').click();};
  document.addEventListener('click',e=>{if(!toolbar.contains(e.target))close();});
  toolbar.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){e.stopPropagation();close();toggle.focus();}});
  sync();
})();
