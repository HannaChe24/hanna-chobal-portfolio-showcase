(() => {
  const host=document.querySelector('[data-task-prototype]');if(!host)return;
  host.attachmentHTML=files=>(files||[]).map(file=>{const a=document.createElement('a');a.href=file.url;a.textContent=file.name;a.target='_blank';a.rel='noopener';a.className='tp-message-attachment';return a.outerHTML;}).join('');
  host.mountMessageAttachments=form=>{
    if(form.messageAttachments)return form.messageAttachments;
    const field=form.querySelector('textarea'),send=form.querySelector('[type="submit"]');
    const toolbar=document.createElement('div');toolbar.className='tp-message-compose-actions';
    const upload=document.createElement('button');upload.type='button';upload.className='tp-message-upload';upload.textContent='＋ Upload attachment';
    const input=document.createElement('input');input.type='file';input.multiple=true;input.hidden=true;
    const list=document.createElement('div');list.className='tp-message-pending-files';list.hidden=true;
    toolbar.append(upload,send);form.append(list,toolbar,input);
    form.querySelector('.draft-chat-audience-note')?.remove();field.removeAttribute('aria-describedby');field.required=false;
    let files=[];
    const update=()=>{list.replaceChildren();list.hidden=!files.length;files.forEach((file,index)=>{const row=document.createElement('span'),name=document.createElement('span'),remove=document.createElement('button');name.textContent=file.name;remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove '+file.name);remove.onclick=()=>{URL.revokeObjectURL(file.url);files.splice(index,1);update();};row.append(name,remove);list.append(row);});send.disabled=field.disabled||(!field.value.trim()&&!files.length);upload.disabled=field.disabled;};
    upload.onclick=()=>input.click();input.onchange=()=>{files.push(...[...input.files].map(file=>({name:file.name,url:URL.createObjectURL(file),size:file.size})));input.value='';update();form.dispatchEvent(new Event('attachments-changed'));};
    field.addEventListener('input',update);
    const api={get files(){return files;},clear(){files=[];update();},update};form.messageAttachments=api;update();return api;
  };
})();
