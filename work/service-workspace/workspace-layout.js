// The draft uses the same thin, rounded outline treatment for generated SVG controls.
(() => {
  const paths = {
    description:'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M14 3v6h6 M8 13h8 M8 17h5',
    image:'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M21 15l-6-6L3 21 M8 7h.01',
    upload:'M12 16V3 M7 8l5-5 5 5 M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
    info:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v6 M12 7h.01',
    mail:'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M3 7l9 6 9-6',
    call:'M9 3H5a2 2 0 0 0-2 2c0 9 7 16 16 16a2 2 0 0 0 2-2v-4l-5-1-2 3a13 13 0 0 1-7-7l3-2z',
    chat:'M5 4h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-5 3V6a2 2 0 0 1 2-2z M7 9h10 M7 13h7',
    chevron_left:'M14 6l-6 6 6 6',chevron_right:'M10 6l6 6-6 6',
    remove:'M5 12h14',add:'M12 5v14 M5 12h14',
    rotate_right:'M20 4v6h-6 M20 10a8 8 0 1 0 0 5',width:'M3 4v16 M21 4v16 M5 12h14 M8 9l-3 3 3 3 M16 9l3 3-3 3'
  };
  const signatures = [['M6 2h8','description'],['M5 3h14','image'],['m12 3 6','upload'],['M12 2a10','info'],['m15 5-7','chevron_left'],['m9 5 7','chevron_right'],['M5 11h14','remove'],['M11 5h2','add'],['M19 3v5','rotate_right'],['M3 4h2','width'],['M4 4h16','mail'],['M6 2h4','call'],['M4 3h16','chat']];
  function refresh(){
    document.querySelectorAll('.relay-component-icon > svg:not([data-divider-outline])').forEach(svg=>{
      const d=svg.querySelector('path')?.getAttribute('d')||'';
      const name=signatures.find(([prefix])=>d.startsWith(prefix))?.[1];
      if(!name)return;
      svg.setAttribute('data-divider-outline','');svg.setAttribute('fill','none');svg.removeAttribute('fill-rule');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.65');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.classList.add('divider-outline-icon');svg.innerHTML='<path d="'+paths[name]+'"/>';
    });
  }
  refresh();new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
})();
