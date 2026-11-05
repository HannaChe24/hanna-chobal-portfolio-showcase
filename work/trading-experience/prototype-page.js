(()=>{
  const root=document.getElementById('mobile-trading-demo');
  function fitPrototype(){const toolbar=document.querySelector('.prototype-toolbar').getBoundingClientRect().height;const scale=Math.max(.4,Math.min(1.35,(window.innerWidth-32)/318,(window.innerHeight-toolbar-48)/666));root.style.setProperty('--prototype-scale',String(scale));}
  document.getElementById('restart-prototype').addEventListener('click',()=>window.location.reload());
  window.addEventListener('resize',fitPrototype,{passive:true});
  fitPrototype();
})();
