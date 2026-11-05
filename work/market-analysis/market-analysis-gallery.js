(() => {
 const root=document.querySelector('.portfolio-carousel');if(!root)return;
 root.classList.add('is-layer-motion');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),pointer=matchMedia('(hover:hover) and (pointer:fine)');
 const panel=document.createElement('div');panel.className='portfolio-pinned';while(root.firstChild)panel.append(root.firstChild);root.append(panel);
 const stage=root.querySelector('.portfolio-carousel-stage'),slides=[...root.querySelectorAll('[data-gallery-item]')],title=root.querySelector('.portfolio-carousel-title'),count=root.querySelector('.portfolio-carousel-count');
 const exit=root.querySelector('.portfolio-carousel-top a');exit.textContent='Exit gallery ×';
 let index=0,busy=false,pending=null,raf=0,visible=false;
 const stacks=slides.map(slide=>{
  const img=slide.querySelector('img'),stack=document.createElement('div');stack.className='motion-image-stack';
  for(let n=0;n<2;n++){const copy=img.cloneNode();copy.alt='';copy.setAttribute('aria-hidden','true');stack.append(copy);}
  stack.append(img);slide.prepend(stack);slide.hidden=false;slide.tabIndex=-1;slide.setAttribute('role','group');slide.removeAttribute('aria-label');return stack;
 });
 root.querySelector('.portfolio-carousel-actions').remove();
 const nav=document.createElement('div');nav.className='portfolio-layer-navigation';nav.innerHTML='<button type="button" aria-label="Previous screen">←</button><button type="button" aria-label="Next screen">→</button>';stage.append(nav);
 const thumbs=document.createElement('div');thumbs.className='portfolio-thumbnails';thumbs.setAttribute('role','group');thumbs.setAttribute('aria-label','Choose a screen');
 slides.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Show '+s.querySelector('figcaption').textContent.toLowerCase());const img=s.querySelector('img').cloneNode();img.alt='';b.append(img);b.onclick=()=>go(i);thumbs.append(b);});root.querySelector('.portfolio-carousel-bottom').append(thumbs);
 function setTitle(){
  const text=slides[index].querySelector('figcaption').textContent;title.replaceChildren();title.setAttribute('aria-label',text);
  for(let n=0;n<3;n++){const layer=document.createElement('span');layer.className='motion-title-layer';layer.setAttribute('aria-hidden','true');for(const char of text){const letter=document.createElement('span');letter.textContent=char;layer.append(letter);}title.append(layer);}
 }
 function paint(){slides.forEach((s,i)=>{s.dataset.position=i===index?'active':'away';s.setAttribute('aria-hidden',String(i!==index));});[...thumbs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));count.textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;setTitle();}
 async function go(value,fromScroll=false){
  const target=(value+slides.length)%slides.length;if(target===index)return;if(busy){pending={target,fromScroll};return;}
  busy=true;const direction=target===(index-1+slides.length)%slides.length?-1:1;
  if(!fromScroll&&!root.classList.contains('is-scroll-released')&&root.getBoundingClientRect().top<=1&&root.getBoundingClientRect().bottom>=innerHeight){const top=root.getBoundingClientRect().top+scrollY;window.scrollTo({top:top+(root.offsetHeight-innerHeight)*target/(slides.length-1),behavior:'instant'});}
  if(!reduced.matches){
   const outgoing=stacks[index].animate([{clipPath:'inset(0)',transform:'translateX(0)'},{clipPath:direction>0?'inset(0 100% 0 0)':'inset(0 0 0 100%)',transform:`translateX(${-direction*35}px)`}],{duration:380,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'});
   title.animate([{opacity:1},{opacity:0,transform:'translateY(-12px)'}],{duration:260});
   await outgoing.finished.catch(()=>{});outgoing.cancel();
  }
  index=target;paint();
  if(!reduced.matches){
   const incoming=stacks[index].animate([{clipPath:direction>0?'inset(0 0 0 100%)':'inset(0 100% 0 0)',transform:`translateX(${direction*35}px)`},{clipPath:'inset(0)',transform:'translateX(0)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
   title.querySelectorAll('.motion-title-layer').forEach((layer,n)=>[...layer.children].forEach((letter,i)=>letter.animate([{opacity:0,transform:'translateY(100%)'},{opacity:1,transform:'translateY(0)'}],{duration:500,delay:n*40+i*12,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'})));
   await incoming.finished.catch(()=>{});
  }
  busy=false;if(pending){const p=pending;pending=null;go(p.target,p.fromScroll);}
 }
 nav.children[0].onclick=()=>go(index-1);nav.children[1].onclick=()=>go(index+1);
 root.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(index+(e.key==='ArrowRight'?1:-1));}});
 let touch=null;stage.addEventListener('touchstart',e=>touch=e.touches[0].clientX,{passive:true});stage.addEventListener('touchend',e=>{if(touch!==null&&Math.abs(e.changedTouches[0].clientX-touch)>50)go(index+(e.changedTouches[0].clientX<touch?1:-1));touch=null;},{passive:true});
 exit.onclick=e=>{
  e.preventDefault();const top=root.getBoundingClientRect().top+scrollY;
  const released=root.classList.toggle('is-scroll-released');
  exit.hidden=false;exit.textContent=released?'View full screen ↗':'Exit gallery ×';
  exit.setAttribute('aria-label',released?'Open full-screen gallery':'Exit full-screen gallery');
  window.scrollTo({top:released?top:top+(root.offsetHeight-innerHeight)*index/(slides.length-1),behavior:'instant'});
 };
 let scrollFrame=0;addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(root.classList.contains('is-scroll-released'))return;const b=root.getBoundingClientRect();if(b.top<=0&&b.bottom>=innerHeight)go(Math.round(Math.min(1,Math.max(0,-b.top/(root.offsetHeight-innerHeight)))*(slides.length-1)),true);});},{passive:true});
 const target={x:0,y:0},positions=Array.from({length:3},()=>({x:0,y:0}));
 function render(){raf=0;if(!visible||reduced.matches||!pointer.matches)return;
  const images=stacks[index].children,layers=title.children;let moving=false;
  positions.forEach((p,n)=>{p.x+=(target.x-p.x)*(.045+n*.04);p.y+=(target.y-p.y)*(.045+n*.04);if(Math.abs(p.x-target.x)+Math.abs(p.y-target.y)>.05)moving=true;if(!busy){images[n].style.transform=`translate(${p.x}px,${p.y}px)`;layers[n].style.transform=`translate(${-p.x*1.25}px,${-p.y*1.25}px)`;}});
  if(moving)raf=requestAnimationFrame(render);
 }
 stage.addEventListener('pointermove',e=>{if(!pointer.matches||reduced.matches)return;const b=stage.getBoundingClientRect();target.x=((e.clientX-b.left)/b.width-.5)*24;target.y=((e.clientY-b.top)/b.height-.5)*18;if(!raf)raf=requestAnimationFrame(render);});
 stage.addEventListener('pointerleave',()=>{target.x=target.y=0;if(!raf)raf=requestAnimationFrame(render);});
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;document.body.classList.toggle('is-viewing-product-gallery',visible);if(!visible){cancelAnimationFrame(raf);raf=0;}}).observe(root);
 paint();
})();
