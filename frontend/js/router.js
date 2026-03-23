import { setupLayout, setActiveNav, showComingSoon } from './layout.js';

const PAGE_TITLES = {
    dashboard: 'Inicio',
    inventory: 'Inventario',
    orders:    'Pedidos',
    menu:      'Menú',
    users:     'Usuarios',
    settings:  'Configuración',
};

const VIEW_TITLES = {
    Admin:  { dashboard: 'Inicio', inventory: 'Inventario', orders: 'Pedidos', menu: 'Menú', users: 'Usuarios', settings: 'Configuración' },
    Mesero: { orders: 'Mis Pedidos', menu: 'Tomar Pedido', settings: 'Configuración' },
    Chef:   { orders: 'Pedidos Activos', settings: 'Configuración' },
};

document.addEventListener('DOMContentLoaded', async () => {
    const user     = setupLayout();
    const mainView = document.getElementById('main-view');

    await loadDefaultView(user, mainView);
    setupSidebarNav(user, mainView);
});

async function loadDefaultView(user, container) {
    switch (user.rol) {
        case 'Admin':
            setActiveNav('dashboard', 'Inicio');
            setDocTitle('Inicio');
            await loadDashboardAdminView(user, container);
            break;
        case 'Mesero':
            setActiveNav('menu', 'Tomar Pedido');
            setDocTitle('Tomar Pedido');
            await loadMeseroView(user, container);
            break;
        case 'Chef':
            setActiveNav('orders', 'Pedidos Activos');
            setDocTitle('Pedidos Activos');
            await loadChefView(user, container);
            break;
        default:
            if (container) container.innerHTML = `
          <div class="empty-state">
            <i class="ri-error-warning-line" style="color:var(--danger);"></i>
            <p>Rol no reconocido: <strong>${user.rol || 'desconocido'}</strong></p>
          </div>`;
    }
}

function setupSidebarNav(user, mainView) {
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const viewId = btn.dataset.view;
            const title  = VIEW_TITLES[user.rol]?.[viewId]
                        || PAGE_TITLES[viewId]
                        || btn.querySelector('.nav-label')?.textContent.trim()
                        || viewId;

            setActiveNav(viewId, title);
            setDocTitle(title);
            await loadView(viewId, user, mainView);
        });
    });
}

async function loadView(viewId, user, mainView) {
    switch (viewId) {
        case 'dashboard':
            await loadDashboardAdminView(user, mainView);
            break;

        case 'inventory':
            await loadAdminView(user, mainView);
            break;

        case 'orders':
            if (user.rol === 'Chef')        await loadChefView(user, mainView);
            else if (user.rol === 'Mesero') await loadMeseroOrdersView(user, mainView);
            else                            await loadOrdersAdminView(user, mainView);
            break;

        case 'menu':
            if (user.rol === 'Mesero') await loadMeseroView(user, mainView);
            else                       await loadMenuAdminView(user, mainView);
            break;

        case 'users':
            await loadUsersAdminView(user, mainView);
            break;

        case 'settings':
            await loadSettingsView(user, mainView);
            break;

        default:
            showComingSoon(mainView, viewId);
    }
}

export function setDocTitle(viewTitle) {
    document.title = viewTitle ? `${viewTitle} | Color Aroma Y Sabor` : 'Color Aroma Y Sabor';
}

async function loadDashboardAdminView(user, container) {
    const { renderDashboardAdmin } = await import('./view/dashboardAdmin.js');
    await renderDashboardAdmin(user, container);
}

async function loadAdminView(user, container) {
    const { renderAdminView } = await import('./view/admin.js');
    await renderAdminView(user, container);
}

async function loadMeseroView(user, container) {
    const { renderMeseroView } = await import('./view/mesero.js');
    await renderMeseroView(user, container);
}

async function loadMeseroOrdersView(user, container) {
    const { renderMeseroOrdersView } = await import('./view/mesero.js');
    await renderMeseroOrdersView(user, container);
}

async function loadChefView(user, container) {
    const { renderChefView } = await import('./view/chef.js');
    await renderChefView(user, container);
}

async function loadMenuAdminView(user, container) {
    const { renderMenuAdminView } = await import('./view/menuAdmin.js');
    await renderMenuAdminView(user, container);
}

async function loadOrdersAdminView(user, container) {
    const { renderOrdersAdminView } = await import('./view/ordersAdmin.js');
    await renderOrdersAdminView(user, container);
}

async function loadUsersAdminView(user, container) {
    const { renderUsersAdminView } = await import('./view/usersAdmin.js');
    await renderUsersAdminView(user, container);
}

async function loadSettingsView(user, container) {
    const { renderSettingsView } = await import('./view/settings.js');
    await renderSettingsView(user, container);
}