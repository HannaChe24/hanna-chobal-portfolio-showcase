(() => {
  'use strict';
  const canvas = document.getElementById('canvas');
  const viewport = document.getElementById('viewport');
  const overlay = document.getElementById('overlay');
  let screen = 'home', timer;
  const unit = value => `${value / 375 * 100}cqw`;
  function button(parent, label, x, y, w, h, action) {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'hotspot'; el.setAttribute('aria-label', label);
    Object.assign(el.style, {left:unit(x),top:unit(y),width:unit(w),height:unit(h)});
    el.addEventListener('click', action); parent.append(el);
  }
  function note(message) {
    const toast = document.getElementById('toast'); toast.textContent = message;
    toast.classList.add('visible'); clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('visible'), 3000);
  }
  function closeOverlay() { overlay.hidden = true; overlay.replaceChildren(); overlay.className = ""; document.querySelector(".phone").classList.remove("actions-open"); }
  function openOverlay(id) {
    overlay.replaceChildren(); overlay.className = ''; overlay.hidden = false;
    if (id === 'actions') {
      overlay.className = 'action-overlay';
      document.querySelector('.phone').classList.add('actions-open');
      const backdrop = document.createElement('button');
      backdrop.type = 'button'; backdrop.className = 'action-backdrop';
      backdrop.setAttribute('aria-label', 'Dismiss action menu');
      backdrop.onclick = closeOverlay;
      const menu = document.createElement('div'); menu.className = 'action-menu';
      const create = document.createElement('button');
      create.type = 'button'; create.textContent = '+ Create a trade';
      create.onclick = () => note('Order entry is not included in these preview screens.');
      const topup = document.createElement('button');
      topup.type = 'button'; topup.textContent = '↑ Top Up';
      topup.onclick = () => note('Funding is not included in these preview screens.');
      const close = document.createElement('button');
      close.type = 'button'; close.className = 'action-dismiss'; close.textContent = '×';
      close.setAttribute('aria-label', 'Close action menu'); close.onclick = closeOverlay;
      menu.append(create, topup); overlay.append(backdrop, menu, close);
      return;
    }
    const image = document.createElement('img');
    image.src = 'light-account.svg'; image.alt = 'Account details';
    overlay.append(image);
    button(overlay, 'Close account details', 323, 165, 36, 36, closeOverlay);
  }

  function show(id = 'home') {
    screen = id; closeOverlay(); viewport.scrollTop = 0; canvas.replaceChildren();
    const image = document.createElement('img');
    image.src = id === 'notifications' ? 'light-notifications.svg' : 'light-home.svg';
    image.alt = id === 'notifications' ? 'Notifications' : 'Account overview, trades, watchlist, market news and events';
    canvas.append(image);
    canvas.style.height = unit(id === 'notifications' ? 768 : 1934);
    const hit = (label,x,y,w,h,action) => button(canvas,label,x,y-44,w,h,action);
    if (id === 'notifications') {
      hit('Back to home',12,50,45,45,()=>show());
      hit('All notifications',12,100,45,40,()=>show('notifications'));
      hit('Unread notifications',60,100,65,40,()=>note('Unread alerts are highlighted in purple.'));
      return;
    }
    hit('Open notifications',315,50,45,45,()=>show('notifications'));
    hit('Account details',15,220,345,110,()=>openOverlay('account'));
    hit('My trades',15,355,345,60,()=>scrollToBlock(355));
    hit('My watchlist',15,720,345,55,()=>scrollToBlock(720));
    hit('Top movers',15,1080,345,60,()=>scrollToBlock(1080));
  }
  function scrollToBlock(y) { viewport.scrollTo({top:(y-44)*canvas.clientWidth/375,behavior:'smooth'}); }
  document.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',()=>{
    const id=el.dataset.go;
    if(id==='actions'){if(overlay.classList.contains('action-overlay'))closeOverlay();else openOverlay('actions');return;}
    if(screen!=='home')show(); else closeOverlay();
    if(id==='home')viewport.scrollTop=0;
    if(id==='symbols')scrollToBlock(720);
    if(id==='trades')scrollToBlock(355);
    if(id==='tools')note('This preview includes Home, Account Details, Notifications and the action menu.');
  }));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(!overlay.hidden)closeOverlay();else show();}});
  show();
})();
