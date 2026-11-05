(() => {
  'use strict';

  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 180;
  const modalState = new WeakMap();

  const getFocusable = dialog => [...dialog.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(element => !element.hidden && element.getClientRects().length);

  const focusInitial = dialog => {
    const target = dialog.querySelector('[data-modal-initial-focus]') || getFocusable(dialog)[0];
    target?.focus({ preventScroll: true });
  };

  const finalizeClose = dialog => {
    const state = modalState.get(dialog) || {};
    dialog.classList.remove('is-closing');
    document.body.classList.toggle('modal-open', Boolean(document.querySelector('dialog[data-modal][open]')));
    state.trigger?.setAttribute?.('aria-expanded', 'false');
    state.trigger?.focus?.({ preventScroll: true });
    modalState.set(dialog, { ...state, closing: false });
  };

  const open = (dialog, trigger = document.activeElement) => {
    if (!dialog || dialog.open) return;
    dialog.dispatchEvent(new CustomEvent('modal:beforeopen'));
    modalState.set(dialog, { trigger, closing: false });
    dialog.showModal();
    trigger?.setAttribute?.('aria-expanded', 'true');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => focusInitial(dialog));
  };

  const close = dialog => new Promise(resolve => {
    if (!dialog?.open) { resolve(); return; }
    const state = modalState.get(dialog) || {};
    if (state.closing) { resolve(); return; }
    state.closing = true;
    modalState.set(dialog, state);
    dialog.classList.add('is-closing');
    setTimeout(() => {
      dialog.close();
      resolve();
    }, duration);
  });

  document.querySelectorAll('dialog[data-modal]').forEach(dialog => {
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.addEventListener('close', () => finalizeClose(dialog));

    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      close(dialog);
    });

    dialog.addEventListener('click', event => {
      if (event.target === dialog) close(dialog);
    });

    dialog.querySelectorAll('[data-modal-close]').forEach(button => {
      button.addEventListener('click', () => close(dialog));
    });

    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusable(dialog);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  });

  document.querySelectorAll('[data-modal-open]').forEach(trigger => {
    trigger.setAttribute('aria-controls', trigger.dataset.modalOpen);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', () => open(document.getElementById(trigger.dataset.modalOpen), trigger));
  });

  window.portfolioModals = Object.freeze({ open, close });
})();
