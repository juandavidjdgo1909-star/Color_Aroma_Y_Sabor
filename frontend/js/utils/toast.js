const ICONS = {
    success: 'ri-check-circle-fill',
    error:   'ri-close-circle-fill',
    warning: 'ri-alert-fill',
    info:    'ri-information-fill',
};

let _container = null;

function getContainer() {
    if (!_container || !document.body.contains(_container)) {
        _container = document.createElement('div');
        _container.id = 'toast-container';
        document.body.appendChild(_container);
    }
    return _container;
}

export function toast(message, type = 'info', duration = 3500) {
    const c  = getContainer();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
        <i class="${ICONS[type] || ICONS.info}"></i>
        <span class="toast-msg">${message}</span>
        <button class="toast-close" aria-label="Cerrar"><i class="ri-close-line"></i></button>`;

    c.appendChild(el);

    el.querySelector('.toast-close')?.addEventListener('click', () => dismiss(el));

    requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add('toast-visible'));
    });

    setTimeout(() => dismiss(el), duration);
}

function dismiss(el) {
    if (!el.parentNode) return;
    el.classList.remove('toast-visible');
    el.classList.add('toast-hiding');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
}

export const toastSuccess = (msg, d) => toast(msg, 'success', d);
export const toastError   = (msg, d) => toast(msg, 'error',   d);
export const toastWarning = (msg, d) => toast(msg, 'warning', d);
export const toastInfo    = (msg, d) => toast(msg, 'info',    d);
