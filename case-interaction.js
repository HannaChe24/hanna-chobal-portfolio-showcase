(() => {
  const invite = document.createElement('div');
  invite.className = 'case-hover-invite';
  invite.setAttribute('aria-hidden', 'true');
  document.body.append(invite);
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let pointerX = -1, pointerY = -1;
  const hide = () => {
    invite.classList.remove('is-visible');
    document.body.classList.remove('has-case-invite');
  };
  document.querySelectorAll('.case-index .case, [data-hover-invite]').forEach(card => {
    const link = card.matches('[data-hover-invite]') ? card : card.querySelector('.case-cta');
    if (!link) return;
    card.addEventListener('click', event => {
      if (event.defaultPrevented || event.target.closest('a,button,input,textarea,select')) return;
      if (getSelection().toString()) return;
      if (event.metaKey || event.ctrlKey) window.open(link.href, '_blank', 'noopener');
      else location.assign(link.href);
    });
    card.addEventListener('pointermove', event => {
      pointerX = event.clientX; pointerY = event.clientY;
      if (!fine.matches || event.target.closest('.case-cta')) { hide(); return; }
      invite.replaceChildren(document.createTextNode(card.dataset.hoverInvite ? `${card.dataset.hoverInvite} ` : card.classList.contains('case-bank-ai') ? 'View Concept ' : 'View Case Study '));
      const arrow = document.createElement('span');
      arrow.className = 'case-invite-arrow';
      arrow.textContent = '↗';
      invite.append(arrow);
      const x = Math.min(event.clientX - invite.offsetWidth / 2, innerWidth - invite.offsetWidth - 12);
      const y = Math.min(event.clientY - invite.offsetHeight / 2, innerHeight - invite.offsetHeight - 12);
      invite.style.transform = `translate(${Math.max(12, x)}px, ${Math.max(12, y)}px)`;
      invite.classList.add('is-visible');
      document.body.classList.add('has-case-invite');
    });
    card.addEventListener('pointerleave', hide);
  });
  addEventListener('scroll', () => {
    const underPointer = document.elementFromPoint(pointerX, pointerY);
    if (!underPointer?.closest('.case-index .case, [data-hover-invite]') || underPointer.closest('.case-cta')) hide();
  }, {passive:true});
  addEventListener('blur', hide);
})();
