(() => {
  'use strict';

  const form = document.querySelector('#password-form');
  if (!form) return;

  // Local files have no server-side login endpoint. Open only the known
  // sibling preview; hosted authentication continues through the API below.
  if (location.protocol === 'file:') {
    const localPages = { service_workspace: 'workflow.html', trading_experience: 'case.html', trading_platform: 'case.html' };
    const page = localPages[form.dataset.caseId];
    if (page) {
      location.replace(new URL(page, location.href).href);
      return;
    }
  }

  const input = form.querySelector('input[name="password"]');
  const button = form.querySelector('button[type="submit"]');
  const error = document.querySelector('#password-error');
  const fallbackNext = form.dataset.next || '/';
  const requestedNext = new URLSearchParams(location.search).get('next');
  const safeNext = value => {
    if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x1f\x7f]/.test(value)) return null;
    try {
      const target = new URL(value, location.origin);
      return target.origin === location.origin ? target.pathname + target.search + target.hash : null;
    } catch (_) { return null; }
  };
  const next = safeNext(requestedNext) || safeNext(fallbackNext) || '/';
  const isLocalPreview = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
  const localNext = /\.[a-z0-9]+$/i.test(next) ? next : `${next}.html`;

  const showError = message => {
    error.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    input.select();
  };

  const openCase = () => {
    const eventProps = { case_id: form.dataset.caseId || 'protected_case' };
    if (window.portfolioAnalytics) window.portfolioAnalytics.trackAndNavigate('case_unlock_success', eventProps, next);
    else location.href = next;
  };

  // Only static preview servers without an authentication endpoint can skip
  // the gate. The secure local server must keep its normal sign-in flow.
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    fetch('/api/case-login', { credentials: 'same-origin', headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(async response => {
        if (isLocalPreview && response.status === 404) {
          location.replace(localNext);
          return;
        }
        if (!response.ok) return;
        const status = await response.json();
        if (status?.authenticated) openCase();
      })
      .catch(() => {});
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    input.removeAttribute('aria-invalid');
    button.disabled = true;

    try {
      const response = await fetch('/api/case-login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ password: input.value })
      });
      if (!response.ok) {
        showError(response.status === 401
          ? 'INCORRECT PASSWORD. PLEASE TRY AGAIN.'
          : 'ACCESS IS TEMPORARILY UNAVAILABLE. PLEASE TRY AGAIN LATER.');
        return;
      }
      input.value = '';
      openCase();
    } catch (_) {
      showError('ACCESS IS TEMPORARILY UNAVAILABLE. PLEASE TRY AGAIN LATER.');
    } finally {
      button.disabled = false;
    }
  });

  input.addEventListener('input', () => {
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  });
})();
