(() => {
  const links=[...document.querySelectorAll('.competitor-map-svg a[data-placement-rationale]')];
  if(!links.length)return;
  const tip=document.createElement('div');tip.className='competitor-placement-tooltip';tip.hidden=true;tip.id='competitor-placement-tooltip';
  document.body.append(tip);let active=null,timer;
  const hide=()=>{clearTimeout(timer);if(active)active.removeAttribute('aria-describedby');active=null;tip.hidden=true;};
  const scheduleHide=()=>{clearTimeout(timer);timer=setTimeout(hide,180);};
  const show=link=>{
    (document.fullscreenElement || document.body).append(tip);
    clearTimeout(timer);if(active&&active!==link)active.removeAttribute('aria-describedby');active=link;
    const title=link.querySelector('.name').textContent;
    tip.replaceChildren();const heading=document.createElement('strong'),copy=document.createElement('p');
    heading.textContent=title;copy.textContent=link.dataset.placementRationale;tip.append(heading,copy);tip.hidden=false;link.setAttribute('aria-describedby',tip.id);
    const dot=link.querySelector('circle').getBoundingClientRect(),bounds=tip.getBoundingClientRect();
    const x=dot.right+16,y=dot.bottom+16;
    tip.style.left=Math.max(12,Math.min(innerWidth-bounds.width-12,x))+'px';
    tip.style.top=Math.max(12,Math.min(innerHeight-bounds.height-12,y))+'px';
  };
  links.forEach(link=>{link.addEventListener('pointerenter',()=>show(link));link.addEventListener('pointerleave',scheduleHide);link.addEventListener('focus',()=>show(link));link.addEventListener('blur',scheduleHide);});
  tip.addEventListener('pointerenter',()=>clearTimeout(timer));tip.addEventListener('pointerleave',scheduleHide);tip.addEventListener('focusin',()=>clearTimeout(timer));tip.addEventListener('focusout',scheduleHide);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});window.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);
})();
