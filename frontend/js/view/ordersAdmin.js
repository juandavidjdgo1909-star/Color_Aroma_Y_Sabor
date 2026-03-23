import { getOrders, updateOrder } from '../api/order.js';
import { downloadCSV } from '../utils/export.js';
import { paginate } from '../utils/pagination.js';
import { toastSuccess, toastError } from '../utils/toast.js';

const ESTADOS = ['Todos', 'Pendiente', 'Preparando', 'Listo', 'Entregado', 'Cancelado'];

let allOrders    = [];
let currentPage  = 1;
const PAGE_SIZE  = 15;

export async function renderOrdersAdminView(user, container) {
    const view = container || document.getElementById('main-view');
    if (!view) return;

    const todayStr = new Date().toISOString().slice(0, 10);

    view.innerHTML = `
    <!-- Stats de pedidos -->
    <div class="stats-row" id="orders-stats-row">
      <div class="stat-card">
        <i class="ri-file-list-3-line stat-icon"></i>
        <span class="stat-label">Total Pedidos</span>
        <span class="stat-value" id="os-total">—</span>
        <span class="stat-sub">registrados</span>
      </div>
      <div class="stat-card">
        <i class="ri-time-line stat-icon" style="color:var(--warning)"></i>
        <span class="stat-label">Pendientes</span>
        <span class="stat-value is-warning" id="os-pendiente">—</span>
        <span class="stat-sub">sin iniciar</span>
      </div>
      <div class="stat-card">
        <i class="ri-money-dollar-circle-line stat-icon" style="color:var(--success)"></i>
        <span class="stat-label">Ingresos del día</span>
        <span class="stat-value is-success" id="os-ingresos">—</span>
        <span class="stat-sub">pedidos entregados</span>
      </div>
    </div>

    <!-- Filtros + Tabla -->
    <div class="table-section">
      <div class="table-section-header">
        <h3>Todos los Pedidos</h3>
        <div style="display:flex;gap:var(--s2);flex-wrap:wrap;align-items:center;">
          <!-- Filtro de fecha -->
          <div class="date-filter-group">
            <i class="ri-calendar-line"></i>
            <input type="date" id="filter-date-from" value="${todayStr}" title="Desde" />
            <span style="color:var(--text-muted);font-size:var(--text-xs);">—</span>
            <input type="date" id="filter-date-to"   value="${todayStr}" title="Hasta" />
            <button class="btn-secondary btn-sm" id="btn-date-clear" title="Ver todos">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <button class="btn-secondary btn-sm" id="btn-export-orders">
            <i class="ri-download-2-line"></i> CSV
          </button>
          <button class="btn-secondary btn-sm" id="btn-refresh-admin-orders">
            <i class="ri-refresh-line"></i>
          </button>
        </div>
      </div>

      <!-- Tabs de estado -->
      <div class="orders-filter-tabs" id="orders-filter-tabs">
        ${ESTADOS.map((e, i) => `
          <button class="filter-tab ${i === 0 ? 'active' : ''}" data-estado="${e}">
            ${e}
          </button>`).join('')}
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Mesa</th>
              <th>Mesero</th>
              <th>Platos</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Hora</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody id="admin-orders-body">
            <tr><td colspan="8" class="table-state">
              <i class="ri-loader-4-line"></i> Cargando…
            </td></tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div id="orders-pagination"></div>
    </div>
  `;

    await loadAdminOrders('Todos');
    setupOrdersHandlers();

    // Socket: actualizar en tiempo real
    if (window._socket) {
        window._socket.on('order-updated', async () => {
            const activeTab = document.querySelector('.filter-tab.active')?.dataset.estado || 'Todos';
            await loadAdminOrders(activeTab);
        });
        window._socket.on('new-order', async () => {
            const activeTab = document.querySelector('.filter-tab.active')?.dataset.estado || 'Todos';
            await loadAdminOrders(activeTab);
        });
    }
}


async function loadAdminOrders(filtro = 'Todos') {
    const tbody = document.getElementById('admin-orders-body');
    if (!tbody) return;

    try {
        const res = await getOrders();
        if (!res || res.status !== 'success') throw new Error();
        allOrders = res.data;

        const today     = new Date().toDateString();
        const pendientes = allOrders.filter(o => o.estado === 'Pendiente').length;
        const ingresos   = allOrders
            .filter(o => o.estado === 'Entregado' && new Date(o.createdAt).toDateString() === today)
            .reduce((s, o) => s + Number(o.total), 0);

        setStat('os-total',    allOrders.length);
        setStat('os-pendiente', pendientes);
        document.getElementById('os-ingresos').textContent =
            `$${ingresos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

        currentPage = 1;
        renderOrdersTable(filtro);
    } catch {
        tbody.innerHTML = `<tr><td colspan="8" class="table-state">
          <div class="empty-state"><i class="ri-wifi-off-line"></i><p>Error de conexión</p></div>
        </td></tr>`;
    }
}

function getDateFiltered(orders) {
    const fromInput = document.getElementById('filter-date-from')?.value;
    const toInput   = document.getElementById('filter-date-to')?.value;
    if (!fromInput && !toInput) return orders;

    const from = fromInput ? new Date(fromInput + 'T00:00:00') : null;
    const to   = toInput   ? new Date(toInput   + 'T23:59:59') : null;

    return orders.filter(o => {
        const d = new Date(o.createdAt);
        if (from && d < from) return false;
        if (to   && d > to)   return false;
        return true;
    });
}

function renderOrdersTable(filtro) {
    const tbody = document.getElementById('admin-orders-body');
    if (!tbody) return;

    let filtered = filtro === 'Todos' ? allOrders : allOrders.filter(o => o.estado === filtro);
    filtered = getDateFiltered(filtered);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="table-state">
          <div class="empty-state">
            <i class="ri-inbox-line"></i>
            <p>No hay pedidos${filtro !== 'Todos' ? ` con estado "${filtro}"` : ''} en el rango seleccionado</p>
          </div>
        </td></tr>`;
        document.getElementById('orders-pagination').innerHTML = '';
        return;
    }

    paginate({
        items:      filtered,
        page:       currentPage,
        pageSize:   PAGE_SIZE,
        containerId: 'orders-pagination',
        renderPage: (pageItems) => {
            tbody.innerHTML = pageItems.map(o => {
                const mesero    = o.meseroId?.nombre || '—';
                const items     = o.items?.length || 0;
                const hora      = new Date(o.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                const fecha     = new Date(o.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                const shortId   = `#${o._id.slice(-6).toUpperCase()}`;
                const canCancel = !['Entregado', 'Cancelado'].includes(o.estado);

                return `
              <tr>
                <td class="td-muted" style="font-size:0.75rem;font-weight:700;">${shortId}</td>
                <td class="td-muted">${o.mesa ? `Mesa ${o.mesa}` : '—'}</td>
                <td class="td-name">${escapeHtml(mesero)}</td>
                <td class="td-muted">${items} plato${items !== 1 ? 's' : ''}</td>
                <td><strong>$${Number(o.total).toLocaleString('es-CO', { minimumFractionDigits: 0 })}</strong></td>
                <td>${estadoBadge(o.estado)}</td>
                <td class="td-muted">${fecha} ${hora}</td>
                <td>
                  ${canCancel ? `
                    <button class="btn-danger btn-sm btn-cancel-order" data-id="${o._id}">
                      <i class="ri-close-circle-line"></i> Cancelar
                    </button>` : '—'}
                </td>
              </tr>`;
            }).join('');

            tbody.querySelectorAll('.btn-cancel-order').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('¿Cancelar este pedido?')) return;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="ri-loader-4-line"></i>';
                    const res = await updateOrder(btn.dataset.id, 'Cancelado');
                    if (res?.status === 'success') {
                        toastSuccess('Pedido cancelado');
                        const activeTab = document.querySelector('.filter-tab.active')?.dataset.estado || 'Todos';
                        await loadAdminOrders(activeTab);
                    } else {
                        toastError('Error al cancelar el pedido');
                        btn.disabled = false;
                        btn.innerHTML = '<i class="ri-close-circle-line"></i> Cancelar';
                    }
                });
            });
        },
        onPageChange: (p) => {
            currentPage = p;
            renderOrdersTable(filtro);
        },
    });
}

function setupOrdersHandlers() {
    const tabs = document.getElementById('orders-filter-tabs');
    tabs?.addEventListener('click', (e) => {
        const tab = e.target.closest('.filter-tab');
        if (!tab) return;
        tabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentPage = 1;
        renderOrdersTable(tab.dataset.estado);
    });

    document.getElementById('btn-refresh-admin-orders')?.addEventListener('click', async () => {
        const activeTab = document.querySelector('.filter-tab.active')?.dataset.estado || 'Todos';
        await loadAdminOrders(activeTab);
    });

    // Filtro de fechas
    document.getElementById('filter-date-from')?.addEventListener('change', () => {
        currentPage = 1;
        renderOrdersTable(document.querySelector('.filter-tab.active')?.dataset.estado || 'Todos');
    });
    document.getElementById('filter-date-to')?.addEventListener('change', () => {
        currentPage = 1;
        renderOrdersTable(document.querySelector('.filter-tab.active')?.dataset.estado || 'Todos');
    });
    document.getElementById('btn-date-clear')?.addEventListener('click', () => {
        const fromEl = document.getElementById('filter-date-from');
        const toEl   = document.getElementById('filter-date-to');
        if (fromEl) fromEl.value = '';
        if (toEl)   toEl.value   = '';
        currentPage = 1;
        renderOrdersTable(document.querySelector('.filter-tab.active')?.dataset.estado || 'Todos');
    });

    // Exportar CSV
    document.getElementById('btn-export-orders')?.addEventListener('click', () => {
        const activeTab  = document.querySelector('.filter-tab.active')?.dataset.estado || 'Todos';
        let toExport = activeTab === 'Todos' ? allOrders : allOrders.filter(o => o.estado === activeTab);
        toExport = getDateFiltered(toExport);

        if (!toExport.length) { toastError('No hay datos para exportar'); return; }

        const flat = toExport.map(o => ({
            id:     o._id.slice(-6).toUpperCase(),
            mesa:   o.mesa || '',
            mesero: o.meseroId?.nombre || '—',
            items:  o.items?.length || 0,
            total:  o.total,
            estado: o.estado,
            fecha:  new Date(o.createdAt).toLocaleString('es-ES'),
        }));
        downloadCSV(
            flat,
            ['id', 'mesa', 'mesero', 'items', 'total', 'estado', 'fecha'],
            ['ID', 'Mesa', 'Mesero', 'Platos', 'Total', 'Estado', 'Fecha'],
            `pedidos_${new Date().toISOString().slice(0, 10)}.csv`
        );
    });
}

function estadoBadge(estado) {
    const map = {
        'Pendiente':  'badge-warning',
        'Preparando': 'badge-primary',
        'Listo':      'badge-success',
        'Entregado':  'badge-success',
        'Cancelado':  'badge-danger',
    };
    return `<span class="badge ${map[estado] || 'badge-primary'}">${estado}</span>`;
}

function setStat(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
