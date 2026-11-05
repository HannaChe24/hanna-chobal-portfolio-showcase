// A persistent evidence viewer: changing a decision never resets the open file.
window.createTicketFileViewer = () => {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const files = [
    {name:'Elevator_Photo.webp',type:'Customer photo',image:'../../assets/service-elevator.webp',alt:'Elevator doors and floor indicator panel',
      attribution:'Hotel Stationery',source:'https://commons.wikimedia.org/wiki/File:Elevator_interior_(9487191108).jpg',license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/',
      metadata:[['Uploaded','Today, 09:26'],['Uploaded by','Jamie Cole']],description:'Shared demonstration image of elevator doors and the floor indicator.'},
    {name:'Controller_Log.txt',type:'System log',title:'Controller event log',
      content:'<pre>09:12:08  AHU-04  AIRFLOW_LOW E17\n09:12:13  AHU-04  AIRFLOW_LOW E17\n09:13:04  AHU-04  SERVICE_INTERRUPTED</pre>',
      extracted:[['Equipment','AHU-04'],['Alert','AIRFLOW_LOW · E17'],['Latest event','SERVICE_INTERRUPTED'],['Event time','09:13:04']],description:'Controller events supplied as supporting evidence.'},
    {name:'Service_Report.pdf',type:'Service document',title:'Routine inspection report',
      pages:[{title:'Routine inspection report',content:'<p>18 Aug 2026 · Routine inspection completed.</p><h4>Inspection findings</h4><p>Airflow sensor calibration checked. No fault observed during the inspection.</p>'},{title:'Inspection checklist',content:'<p>Illustrative supporting page · AHU-04</p><h4>Checks recorded</h4><p>Sensor calibration reviewed during the routine inspection.</p>'},{title:'Inspection summary',content:'<p>Illustrative supporting page · 18 Aug 2026</p><h4>Recorded finding</h4><p>No fault observed during the inspection. Compare this historical record with the current controller log.</p>'}],
      content:'<p>18 Aug 2026 · Routine inspection completed.</p><h4>Inspection findings</h4><p>Airflow sensor calibration checked. No fault observed during the inspection.</p>',
      extracted:[['Inspection date','18 Aug 2026'],['Inspection type','Routine inspection'],['Sensor calibration','Checked'],['Finding','No fault observed']],description:'Previous inspection record supplied with this ticket.'},
    {name:'Lobby_Overview.webp',type:'Site context photo',image:'../../assets/service-lobby.webp',alt:'Elevator lobby with two lift doors, call panel and ceiling fire-safety devices',
      attribution:'Warren LeMay',source:'https://commons.wikimedia.org/wiki/File:Elevator_Lobby,_Arizona_Biltmore_Hotel,_Missouri_Ave,_Biltmore_Area,_Phoenix,_AZ_-_54438006348.jpg',license:'CC BY-SA 2.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/2.0/',
      description:'Shared demonstration image of the lobby and lift doors.'}
  ];
  const icon = path => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const previousIcon=icon('m14 6-6 6 6 6'),nextIcon=icon('m10 6 6 6-6 6');
  const element=document.createElement('section');
  element.className='inv-file-viewer is-information-hidden';
  element.setAttribute('aria-label','Ticket supporting files');
  element.innerHTML=`
    <nav class="inv-file-navigation" aria-label="File navigation">
      <label class="inv-file-picker"><span class="sr-only">Select a file</span><select aria-label="Select a file">${files.map((file,index)=>`<option value="${index}">${escape(file.name)}</option>`).join('')}</select></label>
      <div class="inv-file-pagination" role="group" aria-label="Browse files">
        <button type="button" data-file-previous aria-label="Previous file">${previousIcon}<span>Previous</span></button>
        <span class="inv-file-position" role="status" aria-live="polite" aria-atomic="true"></span>
        <button type="button" data-file-next aria-label="Next file"><span>Next</span>${nextIcon}</button>
      </div>
    </nav>
    <div class="inv-file-viewer-header">
        <nav class="inv-file-tools" aria-label="Document tools"><span class="inv-file-tool-group" data-ticket-page-tools hidden><button type="button" data-ticket-page-prev aria-label="Previous document page">${previousIcon}</button><span data-ticket-page-position role="status" aria-live="polite"></span><button type="button" data-ticket-page-next aria-label="Next document page">${nextIcon}</button></span>
          <span class="inv-file-tool-group"><button type="button" data-file-zoom-out aria-label="Zoom out">${icon('M5 12h14')}</button><select data-file-zoom aria-label="Zoom">${[50,75,100,125,150,175,200].map(value=>`<option value="${value}">${value}%</option>`).join('')}</select><button type="button" data-file-zoom-in aria-label="Zoom in">${icon('M5 12h14M12 5v14')}</button></span>
          <button type="button" data-file-rotate aria-label="Rotate clockwise" title="Rotate clockwise">${icon('M20 4v6h-6M20 10a8 8 0 1 0-1 8')}</button>
          <button type="button" data-file-fit aria-label="Fit to width" title="Fit to width">${icon('M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 7h10v10H7z')}</button>
        </nav>

    </div>
    <div class="inv-file-workspace">
      <section class="inv-file-document" aria-label="File preview">
        <div class="inv-file-canvas" tabindex="0" aria-label="Scrollable file preview"><div class="inv-file-stage"><div class="inv-file-sheet"></div></div></div>
        <div class="inv-file-caption"></div>
      </section>
    </div>`;
  let selected=0;
  const states=files.map(()=>({scale:1,rotation:0,page:0}));
  const sheet=element.querySelector('.inv-file-sheet'),stage=element.querySelector('.inv-file-stage'),canvas=element.querySelector('.inv-file-canvas');
  const picker=element.querySelector('.inv-file-picker select');
  const zoom=element.querySelector('[data-file-zoom]');
  const fit = () => {
    if(canvas.clientWidth<1)return;
    const state=states[selected],file=files[selected];
    const width=Math.max(160,Math.min(file.image?720:560,canvas.clientWidth-40));
    sheet.style.width=`${width}px`;
    sheet.style.minHeight=file.image?'0':`${Math.round(width*1.414)}px`;
    const height=sheet.offsetHeight,turned=state.rotation%180!==0;
    stage.style.width=`${(turned?height:width)*state.scale}px`;
    stage.style.height=`${(turned?width:height)*state.scale}px`;
    sheet.style.transform=`translate(-50%,-50%) rotate(${state.rotation}deg) scale(${state.scale})`;
  };
  const updateTools = () => {
    zoom.value=String(Math.round(states[selected].scale*100));
    element.querySelector('[data-file-zoom-out]').disabled=states[selected].scale<=.5;
    element.querySelector('[data-file-zoom-in]').disabled=states[selected].scale>=2;
    fit();
  };
  const draw = () => {
    const file=files[selected];
    const page=states[selected].page||0, pages=file.pages||[{title:file.title,content:file.content}];
    element.querySelector('[data-ticket-page-tools]').hidden=pages.length<=1;
    element.querySelector('[data-ticket-page-position]').textContent=`${page+1} / ${pages.length}`;
    element.querySelector('[data-ticket-page-prev]').disabled=page===0;
    element.querySelector('[data-ticket-page-next]').disabled=page===pages.length-1;
    picker.value=String(selected);
    element.querySelector('.inv-file-position').innerHTML=`<span aria-hidden="true">${selected+1} / ${files.length}</span><span class="sr-only">File ${selected+1} of ${files.length}</span>`;
    element.querySelector('[data-file-previous]').disabled=selected===0;
    element.querySelector('[data-file-next]').disabled=selected===files.length-1;
    sheet.classList.toggle('is-image',Boolean(file.image));
    sheet.innerHTML=file.image?`<img src="${file.image}" width="1000" height="750" alt="${escape(file.alt)}">`:`<span class="inv-file-document-label">SUPPORTING EVIDENCE</span><h3>${escape(pages[page].title)}</h3>${pages[page].content}`;
    sheet.querySelector('img')?.addEventListener('load',fit,{once:true});
    element.querySelector('.inv-file-caption').innerHTML=file.image?`Demo photo · <a href="${file.source}" target="_blank" rel="noopener noreferrer">${file.attribution}</a> · <a href="${file.licenseUrl}" target="_blank" rel="noopener noreferrer">${file.license}</a> · Monochrome, resized`:'';
    element.querySelector('.inv-file-caption').hidden=!file.image;
    canvas.scrollTop=0;canvas.scrollLeft=0;updateTools();
  };
  const selectFile = index => {selected=Math.max(0,Math.min(files.length-1,index));draw();};
  element.querySelector('[data-ticket-page-prev]').addEventListener('click',()=>{if(states[selected].page>0){states[selected].page--;draw();}});
  element.querySelector('[data-ticket-page-next]').addEventListener('click',()=>{if(states[selected].page<(files[selected].pages?.length||1)-1){states[selected].page++;draw();}});
  picker.addEventListener('change',()=>selectFile(Number(picker.value)));
  element.querySelector('[data-file-previous]').addEventListener('click',()=>selectFile(selected-1));
  element.querySelector('[data-file-next]').addEventListener('click',()=>selectFile(selected+1));
  zoom.addEventListener('change',()=>{states[selected].scale=Number(zoom.value)/100;updateTools();});
  element.querySelector('[data-file-zoom-out]').addEventListener('click',()=>{states[selected].scale=Math.max(.5,states[selected].scale-.25);updateTools();});
  element.querySelector('[data-file-zoom-in]').addEventListener('click',()=>{states[selected].scale=Math.min(2,states[selected].scale+.25);updateTools();});
  element.querySelector('[data-file-rotate]').addEventListener('click',()=>{states[selected].rotation=(states[selected].rotation+90)%360;fit();});
  element.querySelector('[data-file-fit]').addEventListener('click',()=>{states[selected]={...states[selected],scale:1,rotation:0};updateTools();});
  let pan=null;
  canvas.addEventListener('dragstart',event=>event.preventDefault());
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('a,button,input,select,textarea'))return;
    if(canvas.scrollWidth<=canvas.clientWidth&&canvas.scrollHeight<=canvas.clientHeight)return;
    pan={id:event.pointerId,x:event.clientX,y:event.clientY,left:canvas.scrollLeft,top:canvas.scrollTop};
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-panning');
    canvas.focus({preventScroll:true});
    event.preventDefault();
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pan||event.pointerId!==pan.id)return;
    canvas.scrollLeft=pan.left-(event.clientX-pan.x);
    canvas.scrollTop=pan.top-(event.clientY-pan.y);
  });
  const endPan=event=>{
    if(!pan||event.pointerId!==pan.id)return;
    pan=null;canvas.classList.remove('is-panning');
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener('pointerup',endPan);
  canvas.addEventListener('pointercancel',endPan);
  canvas.addEventListener('lostpointercapture',endPan);
  new ResizeObserver(fit).observe(canvas);
  draw();
  return element;
};
