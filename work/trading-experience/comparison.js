(()=>{
 const order=new URLSearchParams(location.search).get('view')==='order';
 const base='../../protected-assets/trading-platform/';
 const board=document.querySelector('.full-comparison');
 const viewport=document.querySelector('.comparison-viewport');
 board.style.setProperty('--mobile-ratio',order?String((375/1587)/(1440/1071)):String((375/2066)/(1440/900)));
 document.getElementById('comparison-title').textContent=order?'Order setup · Web and mobile':'Overview · Web and mobile';
 document.getElementById('web-image').src=base+(order?'web-order-panel.svg?v=20261102-colour-avatar':'web-account-overview.svg?v=20261102-colour-avatar');
 document.getElementById('mobile-image').src=base+'mobile-demo/'+(order?'source-trade-options.svg?v=20261030-header-2':'light-home.svg?v=20261102-colour-avatar');
 let scale=1, drag=null, suppressClick=false;
 const pointers=new Map();
 function zoom(next,x,y){
  const rect=viewport.getBoundingClientRect();
  const px=x===undefined?rect.width/2:x-rect.left, py=y===undefined?rect.height/2:y-rect.top;
  const old=scale, oldTop=board.offsetTop-viewport.offsetTop;
  const contentX=(viewport.scrollLeft+px)/old;
  const contentY=(viewport.scrollTop+py-oldTop)/old;
  scale=Math.max(1,Math.min(4,next));
  board.style.width=(viewport.clientWidth*scale)+'px';
  const newTop=board.offsetTop-viewport.offsetTop;
  viewport.scrollLeft=contentX*scale-px;
  viewport.scrollTop=contentY*scale+newTop-py;
  document.getElementById('zoom-value').textContent=Math.round(scale*100)+'%';
  document.getElementById('zoom-out').disabled=scale<=1;
  document.getElementById('zoom-in').disabled=scale>=4;
  viewport.classList.toggle('is-zoomed',scale>1);
  document.querySelectorAll('.comparison-image').forEach(b=>b.setAttribute('aria-label',scale===1?'Zoom in on both images':'Reset zoom'));
  if(scale===1){viewport.scrollLeft=0;viewport.scrollTop=0;}
 }
 document.getElementById('zoom-in').onclick=()=>zoom(scale+.25);
 document.getElementById('zoom-out').onclick=()=>zoom(scale-.25);
 document.getElementById('zoom-reset').onclick=()=>zoom(1);
 document.querySelectorAll('.comparison-image').forEach(b=>b.onclick=e=>{if(suppressClick){e.preventDefault();return;}zoom(scale===1?1.75:1,e.clientX||undefined,e.clientY||undefined);});
 viewport.addEventListener('dragstart',e=>e.preventDefault());
 let pinch=null;
 viewport.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  suppressClick=false;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale};drag=null;suppressClick=true;}
  else drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
 });
 viewport.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2&&pinch){const [a,b]=[...pointers.values()];zoom(pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance),(a.x+b.x)/2,(a.y+b.y)/2);return;}
  if(!drag||scale<=1)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.hypot(dx,dy)>4){viewport.setPointerCapture(e.pointerId);suppressClick=true;viewport.classList.add('is-grabbing');}
  viewport.scrollLeft=drag.left-dx;viewport.scrollTop=drag.top-dy;
 });
 function endPointer(e){pointers.delete(e.pointerId);drag=null;pinch=null;viewport.classList.remove('is-grabbing');if(pointers.size===1){const [id,p]=[...pointers.entries()][0];drag={id,x:p.x,y:p.y,left:viewport.scrollLeft,top:viewport.scrollTop};}if(!pointers.size)setTimeout(()=>{suppressClick=false;},0);}
 viewport.addEventListener('pointerup',endPointer);
 viewport.addEventListener('pointercancel',endPointer);
 viewport.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))endPointer(e);});
 viewport.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(scale*Math.exp(-e.deltaY*.01),e.clientX,e.clientY);}},{passive:false});
 let gestureScale=1;
 viewport.addEventListener('gesturestart',e=>{e.preventDefault();gestureScale=scale;},{passive:false});
 viewport.addEventListener('gesturechange',e=>{e.preventDefault();zoom(gestureScale*e.scale,e.clientX,e.clientY);},{passive:false});
 viewport.addEventListener('gestureend',e=>e.preventDefault(),{passive:false});
 document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==='Escape'){if(scale>1)zoom(1);else location.href='case.html';}
  if(e.key==='+'||e.key==='='){e.preventDefault();zoom(scale+.25);}
  if(e.key==='-'){e.preventDefault();zoom(scale-.25);}
  if(e.key==='0'){e.preventDefault();zoom(1);}
  if(scale>1&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();viewport.scrollBy({left:e.key==='ArrowLeft'?-80:e.key==='ArrowRight'?80:0,top:e.key==='ArrowUp'?-80:e.key==='ArrowDown'?80:0});}
 });
 addEventListener('resize',()=>zoom(scale));zoom(1);
})();
