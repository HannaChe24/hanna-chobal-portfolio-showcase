(() => {
  const OWNER_EMAIL = 'chobal777@gmail.com';

  document.querySelectorAll('[data-request-form]').forEach(form => {
    const dialog = form.closest('dialog[data-modal]');
    const submit = form.querySelector('.request-submit');
    const name = form.querySelector('[name="name"]');
    const email = form.querySelector('[name="email"]');
    const reason = form.querySelector('[name="reason"]');
    const counter = form.querySelector('.request-character-counter');
    const fields = [name, email, reason];
    let emailPrepared = false;

    const errorFor = field => form.querySelector(`#${field.id}-error`);

    const clearError = field => {
      const error = errorFor(field);
      error.textContent = '';
      error.hidden = true;
      field.removeAttribute('aria-invalid');
      if (field === reason) field.setAttribute('aria-describedby', counter.id);
      else field.removeAttribute('aria-describedby');
    };

    const showError = (field, message) => {
      const error = errorFor(field);
      error.textContent = message;
      error.hidden = false;
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', [error.id, field === reason ? counter.id : ''].filter(Boolean).join(' '));
    };

    const trimField = field => {
      const trimmed = field.value.trim();
      if (trimmed !== field.value) field.value = trimmed;
      return trimmed;
    };

    const hasRequiredValues = () => fields.every(field => field.value.trim().length > 0);

    const updateSubmitState = () => {
      submit.disabled = emailPrepared || !hasRequiredValues();
    };

    const updateCounter = () => {
      const remaining = Math.max(0, reason.maxLength - reason.value.length);
      counter.textContent = `${remaining} ${remaining === 1 ? 'character' : 'characters'} remaining`;
      counter.hidden = false;
    };

    const validateEmailFormat = () => {
      const value = trimField(email);
      clearError(email);
      if (!value) return true;
      if (email.validity.typeMismatch) {
        showError(email, 'Enter a valid email address.');
        return false;
      }
      if (value.length > 254) {
        showError(email, 'Email address must be 254 characters or fewer.');
        return false;
      }
      return true;
    };

    const validateForm = () => {
      fields.forEach(field => {
        trimField(field);
        clearError(field);
      });
      updateCounter();

      const invalid = [];

      if (!name.value) {
        showError(name, 'Enter your name.');
        invalid.push(name);
      } else if (name.value.length > 80) {
        showError(name, 'Name must be 80 characters or fewer.');
        invalid.push(name);
      }

      if (!email.value) {
        showError(email, 'Enter your email address.');
        invalid.push(email);
      } else if (email.value.length > 254) {
        showError(email, 'Email address must be 254 characters or fewer.');
        invalid.push(email);
      } else if (email.validity.typeMismatch) {
        showError(email, 'Enter a valid email address.');
        invalid.push(email);
      }

      if (!reason.value) {
        showError(reason, 'Enter a reason for your request.');
        invalid.push(reason);
      } else if (reason.value.length > 300) {
        showError(reason, 'Reason must be 300 characters or fewer.');
        invalid.push(reason);
      }

      updateSubmitState();
      if (invalid.length) invalid[0].focus();
      return invalid.length === 0;
    };

    fields.forEach(field => {
      field.addEventListener('input', () => {
        clearError(field);
        if (field === reason) updateCounter();
        updateSubmitState();
      });

      field.addEventListener('blur', () => {
        trimField(field);
        if (field === email) validateEmailFormat();
        if (field === reason) updateCounter();
        updateSubmitState();
      });
    });

    dialog.addEventListener('modal:beforeopen', () => {
      emailPrepared = false;
      fields.forEach(clearError);
      updateCounter();
      updateSubmitState();
    });

    form.addEventListener('reset', () => queueMicrotask(() => {
      fields.forEach(clearError);
      updateCounter();
      updateSubmitState();
    }));

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (emailPrepared || !validateForm()) return;

      emailPrepared = true;
      updateSubmitState();

      const caseName = form.dataset.caseName;
      const subject = `Request to view ${caseName} case study`;
      const body = `Hello Hanna,\n\nI would like to request access to the ${caseName} case study.\n\nName: ${name.value}\nEmail: ${email.value}\nReason for request: ${reason.value}\n\nThank you.`;

      await window.portfolioModals.close(dialog);
      window.location.href = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });

    updateCounter();
    updateSubmitState();
  });
})();
