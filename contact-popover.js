(() => {
  'use strict';

  const copyText = async value => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (_) {
      const input = document.createElement('textarea');
      input.value = value;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
  };

  const email = 'chobal777@gmail.com';
  document.querySelectorAll('[data-copy-email]').forEach(copyButton => {
    const copyEmailLabel = copyButton.querySelector('.copy-email-label');
    const copyEmailIcon = copyButton.querySelector('.copy-icon');
    const originalCopyLabel = copyEmailLabel.textContent;
    const originalCopyIcon = copyEmailIcon.textContent;
    let resetTimer;

    copyButton.addEventListener('click', async () => {
      await copyText(email);

      clearTimeout(resetTimer);
      copyEmailLabel.textContent = 'EMAIL COPIED';
      copyEmailIcon.textContent = '✓';
      copyButton.classList.add('is-copied');
      resetTimer = setTimeout(() => {
        copyEmailLabel.textContent = originalCopyLabel;
        copyEmailIcon.textContent = originalCopyIcon;
        copyButton.classList.remove('is-copied');
      }, 2000);
    });
  });
})();
