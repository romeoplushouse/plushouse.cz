(function () {
  'use strict';

  const messages = {
    required: 'Vyplňte prosím pole',
    email: 'Zadejte platný email.',
    phone: 'Zadejte platné telefonní číslo.',
    messageLength: 'Zpráva by měla mít alespoň 10 znaků.',
    select: 'Vyberte prosím jednu z nabízených možností.',
    server: 'Omlouváme se, něco se pokazilo. Zkuste to prosím znovu.'
  };

  const setAriaLabel = (element, fallback) => {
    if (element && !element.getAttribute('aria-label') && fallback) {
      element.setAttribute('aria-label', fallback);
    }
  };

  const enhanceNavigation = () => {
    document.querySelectorAll('nav.navbar').forEach((nav) => {
      if (!nav.getAttribute('aria-label')) {
        nav.setAttribute('aria-label', 'Hlavní navigace');
      }
      const toggle = nav.querySelector('.navbar-toggle');
      if (toggle) {
        setAriaLabel(toggle, 'Přepnout navigaci');
      }
      nav.querySelectorAll('a').forEach((link) => {
        const text = (link.textContent || '').trim();
        let label = text;
        if (!label && link.href) {
          if (link.href.includes('facebook')) {
            label = 'Facebook';
          } else if (link.href.includes('instagram')) {
            label = 'Instagram';
          } else if (link.href.includes('mailto')) {
            label = 'Email';
          }
        }
        setAriaLabel(link, label || link.getAttribute('title') || 'Navigační odkaz');
      });
    });
  };

  const ensureLabel = (field, index, formId) => {
    if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button') {
      return;
    }
    if (!field.id) {
      field.id = `${formId}-${field.name || 'field'}-${index}`;
    }
    const existingLabel = document.querySelector(`label[for="${field.id}"]`);
    if (existingLabel) {
      return;
    }
    const label = document.createElement('label');
    label.className = 'pix-form-label';
    label.setAttribute('for', field.id);
    label.textContent =
      field.getAttribute('data-label') ||
      field.getAttribute('placeholder') ||
      (field.name ? field.name.replace(/[-_]/g, ' ') : 'Pole formuláře');
    if (field.parentElement) {
      field.parentElement.insertBefore(label, field);
    }
  };

  const validateField = (field) => {
    if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button') {
      return '';
    }
    const value = (field.value || '').trim();
    const name = (field.getAttribute('aria-label') || field.getAttribute('placeholder') || field.name || 'pole').trim();

    if (field.required && value === '') {
      return `${messages.required} ${name}.`;
    }

    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return messages.email;
    }

    const fieldName = (field.name || '').toLowerCase();
    if ((fieldName.includes('phone') || field.type === 'tel') && value && !/^[+()0-9\s-]{6,}$/.test(value)) {
      return messages.phone;
    }

    if ((fieldName.includes('message') || fieldName.includes('zpr')) && value && value.length < 10) {
      return messages.messageLength;
    }

    if (field.tagName.toLowerCase() === 'select' && field.required && value === '') {
      return messages.select;
    }

    return '';
  };

  const clearFieldState = (field) => {
    field.classList.remove('has-error');
    field.removeAttribute('aria-invalid');
  };

  const enhanceForms = () => {
    const forms = document.querySelectorAll('.pixfort-form');
    forms.forEach((form, formIndex) => {
      form.setAttribute('novalidate', 'novalidate');
      const formId = form.id || `pixform-${formIndex}`;
      if (!form.id) {
        form.id = formId;
      }

      const status = document.createElement('div');
      const statusId = `form-status-${formIndex}`;
      status.className = 'form-status';
      status.id = statusId;
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      form.appendChild(status);

      const fields = Array.from(form.querySelectorAll('input, textarea, select'));
      fields.forEach((field, fieldIndex) => {
        ensureLabel(field, fieldIndex, formId);
        const labelText =
          field.getAttribute('data-label') ||
          (field.previousElementSibling &&
          field.previousElementSibling.tagName &&
          field.previousElementSibling.tagName.toLowerCase() === 'label'
            ? field.previousElementSibling.textContent.trim()
            : field.getAttribute('placeholder') || field.name || 'Formulář');
        setAriaLabel(field, labelText);
      });

      form.querySelectorAll('button[type="submit"]').forEach((button) => {
        setAriaLabel(button, (button.textContent || button.value || 'Odeslat formulář').trim());
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        status.textContent = '';
        status.className = 'form-status';
        fields.forEach(clearFieldState);

        let errorMessage = '';
        fields.forEach((field) => {
          const validationMessage = validateField(field);
          if (!errorMessage && validationMessage) {
            errorMessage = validationMessage;
            field.classList.add('has-error');
            field.setAttribute('aria-invalid', 'true');
            field.focus();
          }
        });

        if (errorMessage) {
          status.textContent = errorMessage;
          status.classList.add('error-message');
          return;
        }

        const formData = new FormData(form);
        fetch('new_contact.php', {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: formData
        })
          .then((response) => response.json())
          .then((data) => {
            const isError = !data || data.type !== 'message';
            status.textContent = data && data.text ? data.text : messages.server;
            status.classList.add(isError ? 'error-message' : 'success-message');
            if (!isError) {
              fields.forEach(clearFieldState);
              form.reset();
            }
          })
          .catch(() => {
            status.textContent = messages.server;
            status.classList.add('error-message');
          });
      });
    });
  };

  const enhanceCtas = () => {
    document.querySelectorAll('a.btn, button.btn').forEach((btn) => {
      const text = (btn.textContent || btn.getAttribute('title') || '').trim();
      setAriaLabel(btn, text || 'Volba akce');
    });
  };

  enhanceNavigation();
  enhanceForms();
  enhanceCtas();
})();
