/* =====================================================
   dashboardAdmin.js — Dashboard de KPIs (Admin)
   ===================================================== */
import { fetchWithAuth } from '../utils/storage.js';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function fmt(n) {
    return Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0 });
}

const ESTADO_CONFIG = {
    Pendiente:  { color: 'var(--warning)', icon: 'ri-time-line' },
    Preparando: { color: 'var(--primary-light)', icon: 'ri-fire-line' },
    Listo:      { color: 'var(--success)', icon: 'ri-checkbox-circle-line' },
    Entregado:  { color: 'var(--success)', icon: 'ri-check-double-line' },
    Cancelado:  { color: 'var(--danger)',  icon: 'ri-close-circle-line' },
};

export async function renderDashboardAdmin(user, container) {
    const view = container || document.getElementById('main-view');
    if (!view) return;

    const today = new Date().toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    view.innerHTML = `
    <!-- Bienvenida -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <p class="welcome-greeting">${getGreeting()},</p>
        <h2 class="welcome-name">${escapeHtml(user?.nombre || 'Admin')} <span class="welcome-wave">👋</span></h2>
      </div>
      <p class="welcome-sub">${today}</p>
    </div>

    <!-- KPIs principales -->
    <div class="stats-row" id="dash-kpis">
      <div class="stat-card stat-card-loading">
        <i class="ri-money-dollar-circle-line stat-icon" style="color:var(--success)"></i>
        <span class="stat-label">Ventas del Día</span>
        <span class="stat-value is-success" id="dk-ventas">—</span>
        <span class="stat-sub" id="dk-ventas-sub">cargando…</span>
      </div>
      <div class="stat-card stat-card-loading">
        <i class="ri-file-list-3-line stat-icon" style="color:var(--primary-light)"></i>
        <span class="stat-label">Pedidos Hoy</span>
        <span class="stat-value" id="dk-pedidos">—</span>
        <span class="stat-sub" id="dk-pedidos-sub">cargando…</span>
      </div>
      <div class="stat-card stat-card-loading">
        <i class="ri-time-line stat-icon" style="color:var(--warning)"></i>
        <span class="stat-label">En Curso</span>
        <span class="stat-value is-warning" id="dk-activos">—</span>
        <span class="stat-sub">pendiente + preparando</span>
      </div>
      <div class="stat-card stat-card-loading">
        <i class="ri-alert-line stat-icon" style="color:var(--danger)"></i>
        <span class="stat-label">Bajo Stock</span>
        <span class="stat-value" id="dk-lowstock">—</span>
        <span class="stat-sub">ingredientes críticos</span>
      </div>
    </div>

    <!-- Segunda fila: Top platillo + Distribución de estados -->
    <div class="dash-row-2">

      <!-- Top platos -->
      <div class="table-section dash-card">
        <div class="table-section-header">
          <h3><i class="ri-bar-chart-2-line" style="color:var(--primary-light);margin-right:6px;"></i>Top Platos del Día</h3>
        </div>
        <div id="dash-top-dishes">
          <div class="empty-state"><i class="ri-loader-4-line spin"></i><p>Cargando…</p></div>
        </div>
      </div>

      <!-- Estado de pedidos -->
      <div class="table-section dash-card">
        <div class="table-section-header">
          <h3><i class="ri-pie-chart-line" style="color:var(--primary-light);margin-right:6px;"></i>Estado de Pedidos</h3>
        </div>
        <div id="dash-status-chart">
          <div class="empty-state"><i class="ri-loader-4-line spin"></i><p>Cargando…</p></div>
        </div>
      </div>

    </div>

    <!-- Últimos pedidos -->
    <div class="table-section">
      <div class="table-section-header">
        <h3>Últimos Pedidos</h3>
        <span class="badge badge-primary" id="dash-live-badge" style="display:none;">
          En vivo
        </span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Mesa</th><th>Mesero</th>
              <th>Platos</th><th>Total</th><th>Estado</th><th>Hora</th>
            </tr>
          </thead>
          <tbody id="dash-orders-body">
            <tr><td colspan="7" class="table-state">
              <i class="ri-loader-4-line"></i> Cargando…
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>`;

    await loadDashboardData();
    setupSocketUpdates();
}

async function loadDashboardData() {
    try {
        const [ordersRes, inventoryRes] = await Promise.all([
            fetchWithAuth('/order'),
            fetchWithAuth('/inventory'),
        ]);

        const orders    = ordersRes?.data  || [];
        const inventory = Array.isArray(inventoryRes) ? inventoryRes : [];

        renderKPIs(orders, inventory);
        renderTopDishes(orders);
        renderStatusChart(orders);
        renderRecentOrders(orders.slice(0, 12));

        document.querySelectorAll('.stat-card-loading').forEach(c => c.classList.remove('stat-card-loading'));

        // Disparar animaciones con un tick de delay para que el DOM esté listo
        setTimeout(animateCharts, 60);
    } catch (err) {
        console.error('Dashboard error:', err);
        // Mostrar valores de fallback en lugar de quedarse en "cargando"
        ['dk-ventas','dk-pedidos','dk-activos','dk-lowstock'].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.textContent === '—') el.textContent = '0';
        });
        document.getElementById('dk-ventas-sub').textContent  = 'sin datos';
        document.getElementById('dk-pedidos-sub').textContent = 'sin datos';
        document.querySelectorAll('.stat-card-loading').forEach(c => c.classList.remove('stat-card-loading'));
        const empty = `<div class="empty-state"><i class="ri-wifi-off-line"></i><p>Error al cargar datos</p></div>`;
        ['dash-top-dishes','dash-status-chart'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = empty;
        });
    }
}

/* ── KPIs ── */
function renderKPIs(orders, inventory) {
    const today = new Date().toDateString();

    const ordersHoy     = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const entregadosHoy = ordersHoy.filter(o => o.estado === 'Entregado');
    const ventasHoy     = entregadosHoy.reduce((s, o) => s + Number(o.total), 0);
    const activos       = ordersHoy.filter(o => ['Pendiente', 'Preparando'].includes(o.estado)).length;
    const lowStock      = inventory.filter(i => i.stock <= i.minStock).length;

    setText('dk-ventas',      `$${fmt(ventasHoy)}`);
    setText('dk-ventas-sub',  `${entregadosHoy.length} pedido${entregadosHoy.length !== 1 ? 's' : ''} entregado${entregadosHoy.length !== 1 ? 's' : ''}`);
    setText('dk-pedidos',     ordersHoy.length);
    setText('dk-pedidos-sub', `${ordersHoy.filter(o => o.estado === 'Cancelado').length} cancelado${ordersHoy.filter(o => o.estado === 'Cancelado').length !== 1 ? 's' : ''}`);
    setText('dk-activos',     activos);
    setText('dk-lowstock',    lowStock);

    if (lowStock > 0) {
        const el = document.getElementById('dk-lowstock');
        if (el) el.classList.add('is-danger');
    }
}

/* ── Top platos: Gráfico de barras verticales ── */
function renderTopDishes(orders) {
    const el = document.getElementById('dash-top-dishes');
    if (!el) return;

    const today  = new Date().toDateString();
    const counts = {};

    orders
        .filter(o => new Date(o.createdAt).toDateString() === today && o.estado !== 'Cancelado')
        .forEach(o => {
            (o.items || []).forEach(item => {
                const name = item.platoId?.nombre || item.nombre || null;
                if (!name) return;
                counts[name] = (counts[name] || 0) + (item.cantidad || 1);
            });
        });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    if (sorted.length === 0) {
        el.innerHTML = renderEmpty('ri-restaurant-line', 'Sin pedidos registrados hoy');
        return;
    }

    const max   = sorted[0][1];
    const total = sorted.reduce((s, [, c]) => s + c, 0);
    const BAR_COLORS = [
        '#6366f1', '#f59e0b', '#10b981',
        '#06b6d4', '#8b5cf6', '#ec4899',
    ];

    // Líneas de guía del eje Y
    const yMax   = Math.ceil(max / 5) * 5 || 5;
    const ySteps = 4;
    const yLines = Array.from({ length: ySteps + 1 }, (_, i) =>
        Math.round((yMax / ySteps) * (ySteps - i))
    );

    el.innerHTML = `
    <div class="bar-chart-wrap">
      <!-- Eje Y -->
      <div class="bar-chart-y-axis">
        ${yLines.map(v => `<span>${v}</span>`).join('')}
      </div>

      <!-- Área del gráfico -->
      <div class="bar-chart-area">
        <!-- Grid lines -->
        <div class="bar-chart-grid">
          ${yLines.map(() => '<div class="bar-chart-gridline"></div>').join('')}
        </div>

        <!-- Barras -->
        <div class="bar-chart-bars">
          ${sorted.map(([name, count], i) => {
              const heightPct = Math.max(4, Math.round((count / yMax) * 100));
              const shortName = name.length > 12 ? name.slice(0, 11) + '…' : name;
              const color     = BAR_COLORS[i % BAR_COLORS.length];
              return `
              <div class="bar-chart-col">
                <span class="bar-chart-value">${count}</span>
                <div class="bar-chart-bar-wrap">
                  <div class="bar-chart-bar"
                    style="--bar-h:${heightPct}%;--bar-color:${color};"
                    title="${escapeHtml(name)}: ${count} unidades">
                  </div>
                </div>
                <span class="bar-chart-label" title="${escapeHtml(name)}">${escapeHtml(shortName)}</span>
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>
    <div class="top-dishes-footer">
      <span class="top-dishes-total">
        <i class="ri-restaurant-2-line"></i>
        ${total} unidades en ${sorted.length} plato${sorted.length !== 1 ? 's' : ''} hoy
      </span>
      <span class="top-dishes-total">
        <i class="ri-trophy-line" style="color:#f59e0b;"></i>
        Más pedido: <strong>${escapeHtml(sorted[0][0])}</strong>
      </span>
    </div>`;
}

/* ── Estado de pedidos: Gráfico de barras horizontales con métricas ── */
function renderStatusChart(orders) {
    const el = document.getElementById('dash-status-chart');
    if (!el) return;

    const today       = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);

    if (todayOrders.length === 0) {
        el.innerHTML = renderEmpty('ri-pie-chart-line', 'Sin pedidos hoy');
        return;
    }

    const ESTADOS_DEF = [
        { key: 'Pendiente',  color: '#f59e0b', icon: 'ri-time-line' },
        { key: 'Preparando', color: '#6366f1', icon: 'ri-fire-line' },
        { key: 'Listo',      color: '#06b6d4', icon: 'ri-checkbox-circle-line' },
        { key: 'Entregado',  color: '#10b981', icon: 'ri-check-double-line' },
        { key: 'Cancelado',  color: '#ef4444', icon: 'ri-close-circle-line' },
    ];

    const counts = {};
    ESTADOS_DEF.forEach(e => { counts[e.key] = 0; });
    todayOrders.forEach(o => { if (counts[o.estado] !== undefined) counts[o.estado]++; });

    const total       = todayOrders.length;
    const active      = counts['Pendiente'] + counts['Preparando'];
    const completados = counts['Entregado'];
    const eficiencia  = total > 0 ? Math.round((completados / total) * 100) : 0;
    const activos     = ESTADOS_DEF.filter(e => counts[e.key] > 0);
    const maxCount    = Math.max(...activos.map(e => counts[e.key]));

    el.innerHTML = `
    <!-- KPIs rápidos -->
    <div class="status-kpi-row">
      <div class="status-kpi">
        <span class="status-kpi-num" style="color:var(--warning)">${active}</span>
        <span class="status-kpi-label">En curso</span>
      </div>
      <div class="status-kpi-divider"></div>
      <div class="status-kpi">
        <span class="status-kpi-num" style="color:var(--success)">${completados}</span>
        <span class="status-kpi-label">Entregados</span>
      </div>
      <div class="status-kpi-divider"></div>
      <div class="status-kpi">
        <span class="status-kpi-num" style="color:var(--primary-light)">${eficiencia}%</span>
        <span class="status-kpi-label">Eficiencia</span>
      </div>
      <div class="status-kpi-divider"></div>
      <div class="status-kpi">
        <span class="status-kpi-num">${total}</span>
        <span class="status-kpi-label">Total hoy</span>
      </div>
    </div>

    <!-- Gráfico barras horizontales -->
    <div class="hbar-chart">
      ${activos.map(e => {
          const count  = counts[e.key];
          const pct    = total > 0 ? Math.round((count / total) * 100) : 0;
          const barPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
          return `
          <div class="hbar-row">
            <div class="hbar-label">
              <i class="${e.icon}" style="color:${e.color};"></i>
              <span>${e.key}</span>
            </div>
            <div class="hbar-track">
              <div class="hbar-fill" style="--w:${barPct}%;--c:${e.color};"></div>
              <span class="hbar-count">${count}</span>
            </div>
            <span class="hbar-pct">${pct}%</span>
          </div>`;
      }).join('')}
    </div>`;
}

/* ── Últimos pedidos ── */
function renderRecentOrders(orders) {
    const tbody = document.getElementById('dash-orders-body');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-state">
            ${renderEmpty('ri-inbox-line', 'No hay pedidos registrados')}
        </td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(o => {
        const cfg   = ESTADO_CONFIG[o.estado] || { color: 'var(--text-muted)' };
        const hora  = new Date(o.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `
        <tr>
          <td class="td-muted" style="font-size:.75rem;font-weight:700;">#${o._id.slice(-6).toUpperCase()}</td>
          <td class="td-muted">${o.mesa ? `Mesa ${o.mesa}` : '—'}</td>
          <td class="td-name">${escapeHtml(o.meseroId?.nombre || '—')}</td>
          <td class="td-muted">${o.items?.length ?? 0}</td>
          <td><strong>$${fmt(o.total)}</strong></td>
          <td><span class="order-status-dot" style="color:${cfg.color};">
            <i class="${cfg.icon || 'ri-circle-line'}"></i> ${o.estado}
          </span></td>
          <td class="td-muted">${hora}</td>
        </tr>`;
    }).join('');
}

/* ── Animación de barras (trigger después del render) ── */
function animateCharts() {
    // Barras verticales
    requestAnimationFrame(() => {
        document.querySelectorAll('.bar-chart-bar').forEach(bar => {
            bar.classList.add('animated');
        });
        // Barras horizontales
        document.querySelectorAll('.hbar-fill').forEach(bar => {
            bar.classList.add('animated');
        });
    });
}

/* ── Socket live updates ── */
function setupSocketUpdates() {
    const badge = document.getElementById('dash-live-badge');

    if (window._socket) {
        if (badge) badge.style.display = 'inline-flex';

        window._socket.on('new-order',     () => loadDashboardData());
        window._socket.on('order-updated', () => loadDashboardData());
    }
}

/* ── Helpers ── */
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function renderEmpty(icon, text) {
    return `<div class="empty-state">
        <i class="${icon}"></i>
        <p>${text}</p>
    </div>`;
}
