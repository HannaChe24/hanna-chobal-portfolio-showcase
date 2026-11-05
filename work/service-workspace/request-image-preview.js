(() => {
  const links = [...document.querySelectorAll('[data-request-image]')];
  if (!links.length) return;
  const ru = document.documentElement.lang === 'ru';
  const dialog = document.createElement('dialog');
  dialog.className = 'request-image-preview';
  dialog.setAttribute('aria-label', ru ? 'Просмотр интерфейса' : 'Interface preview');
  const toolbar = document.createElement('div');
  toolbar.className = 'request-image-preview-toolbar';
  const title = document.createElement('span');
  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', ru ? 'Закрыть' : 'Close');
  close.title = ru ? 'Закрыть' : 'Close';
  close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  const image = document.createElement('img');
  let opener;
  toolbar.append(title, close);
  dialog.append(toolbar, image);
  document.body.append(dialog);
  links.forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.removeAttribute('target');
    link.addEventListener('click', event => {
      event.preventDefault();
      opener = link;
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      title.textContent = link.dataset.previewTitle || image.alt;
      document.querySelector('.case-hover-invite')?.classList.remove('is-visible');
      document.body.classList.remove('has-case-invite');
      dialog.showModal();
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus({preventScroll: true}));
})();
