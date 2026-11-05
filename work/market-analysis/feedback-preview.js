(() => {
  const link = document.querySelector('[data-feedback-preview]');
  if (!link) return;
  const ru = document.documentElement.lang === 'ru';
  const dialog = document.createElement('dialog');
  dialog.className = 'feedback-preview';
  dialog.setAttribute('aria-label', ru ? 'Отчёт о тестировании' : 'Usability testing report');
  const toolbar = document.createElement('div');
  toolbar.className = 'feedback-preview-toolbar';
  const title = document.createElement('span');
  title.textContent = ru ? 'Перевод отчёта с украинского на английский' : 'Report translated from Ukrainian into English';
  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', ru ? 'Закрыть' : 'Close');
  close.title = ru ? 'Закрыть' : 'Close';
  close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  const img = document.createElement('img');
  img.src = link.href;
  img.alt = ru ? 'Обратная связь участников тестирования, перевод на английский' : 'Participant feedback translated into English';
  toolbar.append(title, close);
  dialog.append(toolbar, img);
  document.body.append(dialog);
  link.setAttribute('aria-haspopup', 'dialog');
  link.setAttribute('aria-label', ru ? 'Открыть отчёт поверх страницы' : 'Open report preview');
  link.addEventListener('click', event => {
    event.preventDefault();
    document.querySelector('.case-hover-invite')?.classList.remove('is-visible');
    document.body.classList.remove('has-case-invite');
    dialog.showModal();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => link.focus({preventScroll: true}));
})();
