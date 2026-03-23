/* =====================================================
   chef.js — Vista del Chef: Pedidos activos (con socket)
   ===================================================== */
import { getOrders, updateOrder } from '../api/order.js';

let _socketListeners = [];

/* =====================================================
   VISTA PRINCIPAL: Pedidos Activos
   ===================================================== */
export async function renderChefView(user, container) {
    const view = container || document.getElementById('main-view');
    if (!view) return;

    // Limpiar listeners de socket previos
    _removeSocketListeners();

    view.innerHTML = `
    <!-- Bienvenida -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <p class="welcome-greeting">${getGreeting()},</p>
        <h2 class="welcome-name">${escapeHtml(user?.nombre || 'Chef')} <span class="welcome-wave">👨‍🍳</span></h2>
      </div>
      <div style="display:flex;align-items:center;gap:var(--s3);">
        <span class="socket-status text-subtle" id="socket-status" style="font-size:var(--text-xs);display:flex;align-items:center;gap:4px;">
          <span class="status-dot" id="status-dot" style="width:7px;height:7px;border-radius:50%;background:var(--text-subtle);flex-shrink:0;"></span>
          Conectando…
        </span>
        <button class="btn-secondary btn-sm" id="btn-refresh">
          <i class="ri-refresh-line"></i> Actualizar
        </button>
      </div>
    </div>

    <!-- Stats rápidas -->
    <div class="stats-row">
      <div class="stat-card">
        <i class="ri-time-line stat-icon" style="color:var(--warning)"></i>
        <span class="stat-label">Por Preparar</span>
        <span class="stat-value is-warning" id="stat-pendiente">—</span>
        <span class="stat-sub">pendientes</span>
      </div>
      <div class="stat-card">
        <i class="ri-fire-line stat-icon" style="color:var(--primary-light)"></i>
        <span class="stat-label">En Cocina</span>
        <span class="stat-value" id="stat-preparando">—</span>
        <span class="stat-sub">en preparación</span>
      </div>
      <div class="stat-card">
        <i class="ri-checkbox-circle-line stat-icon" style="color:var(--success)"></i>
        <span class="stat-label">Listos</span>
        <span class="stat-value is-success" id="stat-listo">—</span>
        <span class="stat-sub">esperando entrega</span>
      </div>
    </div>

    <!-- Sección de pedidos -->
    <div id="orders-sections"></div>
  `;

    await loadChefOrders();
    setupChefHandlers();
    _setupSocket();
}

/* ── Socket: escuchar eventos en tiempo real ── */
function _setupSocket() {
    if (!window._socket) return;

    const onNew     = () => loadChefOrders();
    const onUpdated = () => loadChefOrders();

    window._socket.on('new-order',     onNew);
    window._socket.on('order-updated', onUpdated);

    // Guardar referencias para cleanup
    _socketListeners = [
        { event: 'new-order',     fn: onNew },
        { event: 'order-updated', fn: onUpdated },
    ];

    // Status indicator
    const dot    = document.getElementById('status-dot');
    const status = document.getElementById('socket-status');

    function updateStatus() {
        const connected = window._socket.connected;
        if (dot)    dot.style.background    = connected ? 'var(--success)' : 'var(--danger)';
        if (status) {
            const text = status.querySelector('span:last-child') || status;
            status.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:${connected ? 'var(--success)' : 'var(--danger)'};flex-shrink:0;display:inline-block;"></span> ${connected ? 'Tiempo real activo' : 'Sin conexión en tiempo real'}`;
        }
    }

    window._socket.on('connect',    updateStatus);
    window._socket.on('disconnect', updateStatus);
    updateStatus();

    _socketListeners.push(
        { event: 'connect',    fn: updateStatus },
        { event: 'disconnect', fn: updateStatus },
    );
}

function _removeSocketListeners() {
    if (!window._socket || !_socketListeners.length) return;
    _socketListeners.forEach(({ event, fn }) => window._socket.off(event, fn));
    _socketListeners = [];
}

/* ── Cargar y renderizar pedidos ── */
async function loadChefOrders() {
    const sectionsEl = document.getElementById('orders-sections');
    if (!sectionsEl) return;

    try {
        const res = await getOrders();
        if (!res || res.status !== 'success') throw new Error();
        const all = res.data;

        const pendiente  = all.filter(o => o.estado === 'Pendiente');
        const preparando = all.filter(o => o.estado === 'Preparando');
        const listo      = all.filter(o => o.estado === 'Listo');

        setStat('stat-pendiente',  pendiente.length);
        setStat('stat-preparando', preparando.length);
        setStat('stat-listo',      listo.length);

        const totalActivos = pendiente.length + preparando.length + listo.length;
        if (totalActivos === 0) {
            sectionsEl.innerHTML = `
          <div class="view-empty" style="padding:var(--s12);">
            <i class="ri-restaurant-line"></i>
            <p>No hay pedidos activos en este momento</p>
          </div>`;
            return;
        }

        sectionsEl.innerHTML = `
      ${pendiente.length  > 0 ? renderSection('Por Preparar',  pendiente,  'Pendiente')  : ''}
      ${preparando.length > 0 ? renderSection('En Cocina',     preparando, 'Preparando') : ''}
      ${listo.length      > 0 ? renderSection('Listos',        listo,      'Listo')      : ''}
    `;

    } catch {
        sectionsEl.innerHTML = `
      <div class="view-empty">
        <i class="ri-wifi-off-line"></i>
        <p>Error de conexión al servidor</p>
      </div>`;
    }
}

/* ── Render de una sección ── */
function renderSection(title, orders, estado) {
    const colorMap = {
        'Pendiente':  'var(--warning)',
        'Preparando': 'var(--primary-light)',
        'Listo':      'var(--success)',
    };
    return `
    <div class="orders-group">
      <div class="orders-section-title" style="color:${colorMap[estado] || 'var(--text-muted)'};">
        <span>${title}</span>
        <span class="orders-count">${orders.length}</span>
      </div>
      <div class="orders-grid">
        ${orders.map(order => renderOrderCard(order, estado)).join('')}
      </div>
    </div>
  `;
}

/* ── Card individual de pedido ── */
function renderOrderCard(order, estado) {
    const timeAgo  = getTimeAgo(order.createdAt);
    const mesero   = order.meseroId?.nombre || 'Mesero';
    const shortId  = `#${order._id.slice(-6).toUpperCase()}`;
    const mesa     = order.mesa ? `Mesa ${order.mesa}` : '';

    const nextState = { 'Pendiente': 'Preparando', 'Preparando': 'Listo' };
    const nextBtn   = {
        'Pendiente':  { label: 'Comenzar', icon: 'ri-fire-line',            cls: 'btn-primary' },
        'Preparando': { label: 'Listo',    icon: 'ri-checkbox-circle-line', cls: 'btn-primary' },
    };

    const btn  = nextBtn[estado];
    const next = nextState[estado];

    return `
    <div class="order-card ${estado === 'Preparando' ? 'is-preparing' : estado === 'Listo' ? 'is-ready' : ''}">
      <div class="order-card-header">
        <div>
          <div class="order-number">${shortId}${mesa ? ` · ${mesa}` : ''}</div>
          <div class="order-mesero"><i class="ri-user-line" style="font-size:0.85rem;"></i> ${escapeHtml(mesero)}</div>
        </div>
        <div class="order-time">
          <i class="ri-time-line"></i> ${timeAgo}
        </div>
      </div>

      <ul class="order-items-list">
        ${order.items.map(item => `
          <li>
            <strong>${item.cantidad}×</strong>
            ${escapeHtml(item.platoId?.nombre || 'Plato')}
          </li>
        `).join('')}
      </ul>

      <div class="order-card-actions">
        ${btn ? `
          <button
            class="${btn.cls} btn-sm btn-change-status"
            data-id="${order._id}"
            data-next="${next}"
          >
            <i class="${btn.icon}"></i>
            ${btn.label}
          </button>
        ` : `<span class="badge badge-success">Esperando al mesero</span>`}
      </div>
    </div>
  `;
}

/* ── Event handlers ── */
function setupChefHandlers() {
    document.getElementById('btn-refresh')?.addEventListener('click', loadChefOrders);

    document.getElementById('orders-sections')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-change-status');
        if (!btn) return;

        const id   = btn.dataset.id;
        const next = btn.dataset.next;

        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line"></i>';

        try {
            const res = await updateOrder(id, next);
            if (res && res.status === 'success') {
                await loadChefOrders();
            } else {
                btn.disabled = false;
                btn.innerHTML = `<i class="ri-error-warning-line"></i> Error`;
            }
        } catch {
            btn.disabled = false;
            btn.innerHTML = `<i class="ri-error-warning-line"></i> Error`;
        }
    });
}

/* ── Helpers ── */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

function getTimeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 1)  return 'Ahora';
    if (diff < 60) return `${diff} min`;
    const h = Math.floor(diff / 60);
    return `${h}h ${diff % 60}m`;
}

function setStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
