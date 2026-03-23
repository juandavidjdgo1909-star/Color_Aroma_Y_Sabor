const NAV_CONFIG = {
    Admin: {
        dashboard: { label: 'Inicio',              icon: 'ri-home-4-line' },
        inventory: { label: 'Inventario',          icon: 'ri-archive-2-line' },
        orders:    { label: 'Pedidos',              icon: 'ri-file-list-3-line' },
        menu:      { label: 'Menú',                 icon: 'ri-bill-line' },
        users:     { label: 'Usuarios',             icon: 'ri-team-line' },
        settings:  { label: 'Configuración',        icon: 'ri-settings-3-line' },
    },
    Mesero: {
        orders:   { label: 'Mis Pedidos',   icon: 'ri-receipt-line' },
        menu:     { label: 'Tomar Pedido',  icon: 'ri-shopping-cart-2-line' },
        settings: { label: 'Configuración', icon: 'ri-settings-3-line' },
    },
    Chef: {
        orders:   { label: 'Pedidos Activos', icon: 'ri-fire-line' },
        settings: { label: 'Configuración',   icon: 'ri-settings-3-line' },
    },
};

/* ── Theme helpers ── */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.className = theme === 'light' ? 'ri-sun-line' : 'ri-moon-line';
    }
}

function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    applyTheme(saved);
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });
}

export function setupLayout() {
    initTheme();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // ── Sidebar: datos del usuario ──
    const nameEl   = document.getElementById('user-name');
    const roleEl   = document.getElementById('user-role');
    const avatarEl = document.getElementById('user-avatar');

    if (nameEl)   nameEl.textContent   = user.nombre || 'Usuario';
    if (roleEl)   roleEl.textContent   = user.rol    || '';
    if (avatarEl) avatarEl.textContent = (user.nombre || 'U')[0].toUpperCase();

    // ── Top-nav: pill de usuario ──
    const navNameEl   = document.getElementById('nav-user-name');
    const navRoleEl   = document.getElementById('nav-user-role');
    const navAvatarEl = document.getElementById('nav-user-avatar');

    if (navNameEl)   navNameEl.textContent   = user.nombre || 'Usuario';
    if (navRoleEl)   navRoleEl.textContent   = user.rol    || '';
    if (navAvatarEl) navAvatarEl.textContent = (user.nombre || 'U')[0].toUpperCase();

    // ── Filtrar y personalizar nav según rol ──
    applyNavByRole(user.rol);

    // ── Top nav: fecha ──
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
    }

    // ── Logout con confirmación ──
    document.getElementById('btnLogout')?.addEventListener('click', () => {
        showLogoutConfirm();
    });

    // ── Mobile sidebar toggle ──
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle');

    function openSidebar()  {
        sidebar?.classList.add('is-open');
        overlay?.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        sidebar?.classList.remove('is-open');
        overlay?.classList.remove('is-visible');
        document.body.style.overflow = '';
    }

    toggleBtn?.addEventListener('click', () => {
        sidebar?.classList.contains('is-open') ? closeSidebar() : openSidebar();
    });
    overlay?.addEventListener('click', closeSidebar);

    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.innerWidth < 769) closeSidebar();
        });
    });

    // ── Sistema de alertas por rol ──
    setupNotifications(user);

    return user;
}

function applyNavByRole(rol) {
    const config = NAV_CONFIG[rol] || {};

    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
        const view        = btn.dataset.view;
        const allowedRols = (btn.dataset.roles || '').split(',').map(r => r.trim());
        const allowed     = allowedRols.includes(rol);

        btn.style.display = allowed ? '' : 'none';

        if (allowed && config[view]) {
            // Actualizar icono
            const iconEl = btn.querySelector('i');
            if (iconEl) iconEl.className = config[view].icon;
            // Actualizar etiqueta
            const labelEl = btn.querySelector('.nav-label');
            if (labelEl) labelEl.textContent = config[view].label;
        }
    });

    // Ocultar títulos de sección si no tienen items visibles debajo
    hideSectionTitleIfEmpty('section-principal', ['dashboard', 'inventory', 'orders', 'menu']);
    hideSectionTitleIfEmpty('section-sistema',   ['users', 'settings']);
}

function hideSectionTitleIfEmpty(sectionId, views) {
    const titleEl = document.getElementById(sectionId);
    if (!titleEl) return;
    const anyVisible = views.some(v => {
        const btn = document.querySelector(`.nav-item[data-view="${v}"]`);
        return btn && btn.style.display !== 'none';
    });
    titleEl.style.display = anyVisible ? '' : 'none';
}

function showLogoutConfirm() {
    const existing = document.getElementById('logout-confirm-dialog');
    if (existing) return;

    const dialog = document.createElement('div');
    dialog.id        = 'logout-confirm-dialog';
    dialog.className = 'confirm-dialog-overlay';
    dialog.innerHTML = `
    <div class="confirm-dialog">
      <div class="confirm-dialog-icon"><i class="ri-logout-box-r-line"></i></div>
      <h3 class="confirm-dialog-title">¿Cerrar sesión?</h3>
      <p class="confirm-dialog-msg">Serás redirigido a la pantalla de inicio de sesión.</p>
      <div class="confirm-dialog-actions">
        <button class="btn-secondary" id="confirm-cancel">Cancelar</button>
        <button class="btn-danger" id="confirm-logout">Cerrar sesión</button>
      </div>
    </div>`;

    document.body.appendChild(dialog);
    requestAnimationFrame(() => dialog.classList.add('visible'));

    dialog.querySelector('#confirm-cancel').addEventListener('click', () => {
        dialog.classList.remove('visible');
        dialog.addEventListener('transitionend', () => dialog.remove(), { once: true });
    });

    dialog.querySelector('#confirm-logout').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.classList.remove('visible');
            dialog.addEventListener('transitionend', () => dialog.remove(), { once: true });
        }
    });
}

/* ════════════════════════════════════════
   SISTEMA DE NOTIFICACIONES POR ROL
   ════════════════════════════════════════ */
function setupNotifications(user) {
    const notifBtn = document.getElementById('btn-notifications');
    const badge    = document.getElementById('nav-notif-count');

    let count = 0;

    function increment() {
        count++;
        if (badge) {
            badge.textContent   = count;
            badge.style.display = 'inline-flex';
        }
        if (notifBtn) {
            // Reiniciar animación para que se repita en cada alerta nueva
            notifBtn.classList.remove('nav-notif-ring');
            void notifBtn.offsetWidth;
            notifBtn.classList.add('nav-notif-ring');
        }
    }

    function reset() {
        count = 0;
        if (badge) badge.style.display = 'none';
        notifBtn?.classList.remove('nav-notif-ring');
    }

    if (user.rol === 'Admin') {
        // Admin → alertas de inventario bajo, navega a Inventario
        notifBtn?.addEventListener('click', () => {
            document.querySelector('.nav-item[data-view="inventory"]')?.click();
            reset();
        });
        checkLowStock();

    } else if (user.rol === 'Chef' || user.rol === 'Mesero') {
        // Chef y Mesero → alertas en tiempo real via Socket.IO
        notifBtn?.addEventListener('click', () => {
            document.querySelector('.nav-item[data-view="orders"]')?.click();
            reset();
        });

        // Registrar listeners cuando el socket esté listo
        function attachSocketListeners() {
            const socket = window._socket;
            if (!socket) return;

            if (user.rol === 'Chef') {
                // Nuevo pedido creado por un Mesero
                socket.on('new-order', (order) => {
                    increment();
                    // Actualizar tooltip con contexto
                    if (notifBtn) notifBtn.title = `${count} pedido(s) nuevo(s) — Mesa ${order?.mesa ?? ''}`.trim();
                });
            } else if (user.rol === 'Mesero') {
                // Chef marcó un pedido como Listo
                socket.on('order-updated', (order) => {
                    if (order?.estado === 'Listo') {
                        increment();
                        if (notifBtn) notifBtn.title = `${count} pedido(s) listo(s) para entregar`;
                    }
                });
            }
        }

        // El socket se crea en el inline script antes del módulo;
        // si ya existe lo usamos, si no esperamos al evento load.
        if (window._socket) {
            attachSocketListeners();
        } else {
            window.addEventListener('load', attachSocketListeners, { once: true });
        }

    } else {
        // Rol desconocido → ocultar campana
        if (notifBtn) notifBtn.style.display = 'none';
    }
}

async function checkLowStock() {
    const badge    = document.getElementById('nav-badge-inventory');
    const topBadge = document.getElementById('nav-notif-count');
    try {
        const res = await fetch('/api/inventory', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) return;
        const items    = await res.json();
        const lowCount = items.filter(i => i.stock <= i.minStock).length;
        if (lowCount > 0) {
            if (badge) {
                badge.textContent   = lowCount;
                badge.style.display = 'inline-flex';
            }
            if (topBadge) {
                topBadge.textContent   = lowCount;
                topBadge.style.display = 'inline-flex';
            }
            // Animar la campana para llamar la atención
            const bellBtn = document.getElementById('btn-notifications');
            bellBtn?.classList.add('nav-notif-ring');
        }
    } catch { /* silencioso */ }
}

export function setActiveNav(viewId, title) {
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewId);
    });

    const titleEl = document.getElementById('view-title');
    if (titleEl && title) titleEl.textContent = title;

    // Sincronizar ícono del breadcrumb con el nav item activo
    const activeBtn   = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    const navIconEl   = document.getElementById('nav-view-icon');
    if (navIconEl && activeBtn) {
        const btnIcon = activeBtn.querySelector('i');
        if (btnIcon) {
            navIconEl.className = `nav-view-icon ${btnIcon.className}`;
        }
    }
}

export function showComingSoon(container, label = 'Esta sección') {
    if (!container) return;
    container.innerHTML = `
    <div class="view-empty">
      <i class="ri-tools-line"></i>
      <p>${label} — Próximamente</p>
    </div>`;
}

export function showNoAccess(container) {
    if (!container) return;
    container.innerHTML = `
    <div class="view-empty">
      <i class="ri-lock-line" style="color:var(--danger);"></i>
      <p>No tienes acceso a esta sección</p>
    </div>`;
}
