
import { getMenu } from '../api/menu.js';
import { getOrders, createOrder, updateOrder } from '../api/order.js';
import { getCart, setCart, clearCart } from '../utils/storage.js';
import { toastSuccess, toastError } from '../utils/toast.js';
import { paginate } from '../utils/pagination.js';

const ORDER_STEPS = ['Pendiente', 'Preparando', 'Listo', 'Entregado'];
let _meseroOrdersPage = 1;
const ORDERS_PAGE_SIZE = 10;

export async function renderMeseroView(user, container) {
    const view = container || document.getElementById('main-view');
    if (!view) return;

    view.innerHTML = `
    <!-- Bienvenida -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <p class="welcome-greeting">${getGreeting()},</p>
        <h2 class="welcome-name">${escapeHtml(user?.nombre || 'Mesero')} <span class="welcome-wave">👋</span></h2>
      </div>
      <p class="welcome-sub">Selecciona los platos y la mesa para armar el pedido.</p>
    </div>

    <!-- Layout: Menú + Carrito -->
    <div class="mesero-layout">

      <!-- Menú -->
      <div class="menu-section">
        <!-- Búsqueda + filtros -->
        <div class="menu-search-bar">
          <i class="ri-search-line"></i>
          <input type="text" id="menu-search" placeholder="Buscar plato…" autocomplete="off" />
        </div>
        <div class="menu-filters" id="menu-filters">
          <button class="filter-btn active" data-cat="all">Todos</button>
        </div>
        <div class="menu-grid" id="menu-grid">
          <div class="view-empty">
            <i class="ri-loader-4-line"></i>
            <p>Cargando menú…</p>
          </div>
        </div>
      </div>

      <!-- Carrito -->
      <aside class="cart-panel">
        <div class="cart-title">
          <i class="ri-shopping-cart-2-line"></i>
          Pedido actual
          <span class="cart-count" id="cart-count">0</span>
        </div>

        <!-- Selector de mesa -->
        <div class="form-group" style="margin-bottom:0;">
          <label for="cart-mesa" style="font-size:var(--text-xs);font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);">Mesa</label>
          <select id="cart-mesa" style="height:36px;font-size:var(--text-sm);">
            ${Array.from({ length: 15 }, (_, i) => `<option value="${i + 1}">Mesa ${i + 1}</option>`).join('')}
          </select>
        </div>

        <div class="cart-items" id="cart-items">
          <div class="cart-empty">
            <i class="ri-inbox-line"></i>
            <p>Agrega platos del menú</p>
          </div>
        </div>

        <hr class="cart-divider" />

        <div class="cart-totals" id="cart-totals" style="display:none;">
          <div class="cart-total-row total">
            <span>Total</span>
            <span id="cart-total">$0</span>
          </div>
        </div>

        <button class="btn-primary btn-full" id="btn-send-order" disabled>
          <i class="ri-send-plane-line"></i>
          Enviar a Cocina
        </button>
      </aside>
    </div>

    <!-- Modal personalizar burrito/producto -->
    <div id="modal-personalizar" class="modal-overlay">
      <div class="modal-content" style="max-width:420px;">
        <div class="modal-header">
          <h3 id="modal-personalizar-title">Personalizar</h3>
          <button type="button" class="btn-icon modal-personalizar-close"><i class="ri-close-line"></i></button>
        </div>
        <div id="modal-personalizar-body"></div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary modal-personalizar-close">Cancelar</button>
          <button type="button" class="btn-primary" id="btn-confirm-personalizar">
            <i class="ri-check-line"></i> Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  `;

    clearCart();
    await loadMenu();
    setupCartHandlers();
}


async function loadMenu() {
    const grid    = document.getElementById('menu-grid');
    const filters = document.getElementById('menu-filters');
    const search  = document.getElementById('menu-search');
    if (!grid) return;

    try {
        const res = await getMenu();
        if (!res || res.status !== 'success') throw new Error('Error al cargar menú');

        const items = res.data;
        if (!items || items.length === 0) {
            grid.innerHTML = `<div class="view-empty"><i class="ri-restaurant-line"></i><p>No hay platos disponibles</p></div>`;
            return;
        }

        const cats = [...new Set(items.map(i => i.categoria))];
        filters.innerHTML = `
      <button class="filter-btn active" data-cat="all">Todos</button>
      ${cats.map(c => `<button class="filter-btn" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
    `;

        window.__menuItems = items;
        renderMenuCards(items);

        let activeCat = 'all';

        // Filtros de categoría
        filters.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCat = btn.dataset.cat;
            applyFilters();
        });

        // Búsqueda
        search?.addEventListener('input', applyFilters);

        function applyFilters() {
            const q = (search?.value || '').toLowerCase().trim();
            let filtered = activeCat === 'all' ? items : items.filter(i => i.categoria === activeCat);
            if (q) filtered = filtered.filter(i => i.nombre.toLowerCase().includes(q));
            renderMenuCards(filtered);
        }

    } catch {
        grid.innerHTML = `<div class="view-empty"><i class="ri-wifi-off-line"></i><p>Error de conexión</p></div>`;
    }
}

function renderMenuCards(items) {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = `<div class="view-empty" style="min-height:120px;"><i class="ri-search-line"></i><p>Sin resultados</p></div>`;
        return;
    }

    grid.innerHTML = items.map(item => {
        const esPers = item.esPersonalizable && item.ingredientesOpcionales?.length;
        const precioStr = esPers ? `Desde ${item.precio.toLocaleString('es-CO')}` : `${item.precio.toLocaleString('es-CO')}`;
        return `
    <article class="menu-card ${item.disponible ? '' : 'unavailable'}" data-id="${item._id}">
      ${item.imageUrl ? `<div class="menu-card-img"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.nombre)}" loading="lazy" /></div>` : ''}
      <span class="menu-card-category">${escapeHtml(item.categoria)}</span>
      <h4 class="menu-card-name">${escapeHtml(item.nombre)}</h4>
      <div class="menu-card-footer">
        <span class="menu-card-price">${precioStr}</span>
        <button
          class="btn-primary btn-sm btn-add-to-cart ${esPers ? 'btn-add-personalizable' : ''}"
          data-id="${item._id}"
          data-nombre="${escapeHtml(item.nombre)}"
          data-precio="${item.precio}"
          ${item.disponible ? '' : 'disabled'}
        >
          ${item.disponible ? (esPers ? '<i class="ri-add-line"></i> Elegir' : '<i class="ri-add-line"></i>') : 'Agotado'}
        </button>
      </div>
    </article>
  `}).join('');
}

/* ── Carrito ── */
function setupCartHandlers() {
    document.getElementById('menu-grid')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-to-cart');
        if (!btn) return;
        const item = window.__menuItems?.find(i => i._id === btn.dataset.id);
        if (item?.esPersonalizable && item?.ingredientesOpcionales?.length) {
            openPersonalizarModal(item);
        } else {
            addToCart({
                _id:    btn.dataset.id,
                nombre: btn.dataset.nombre,
                precio: parseFloat(btn.dataset.precio),
            });
        }
    });

    document.querySelectorAll('.modal-personalizar-close').forEach(el => {
        el.addEventListener('click', closePersonalizarModal);
    });
    document.getElementById('modal-personalizar')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-personalizar') closePersonalizarModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _pendingPersonalizarItem) closePersonalizarModal();
    });
    document.getElementById('btn-confirm-personalizar')?.addEventListener('click', confirmPersonalizar);

    document.getElementById('cart-items')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const idx    = parseInt(btn.dataset.cartIdx, 10);
        const action = btn.dataset.action;

        let cart = getCart();
        if (isNaN(idx) || idx < 0 || idx >= cart.length) return;

        if (action === 'inc') {
            cart[idx].qty++;
        } else if (action === 'dec') {
            cart[idx].qty--;
            if (cart[idx].qty <= 0) cart = cart.filter((_, i) => i !== idx);
        } else if (action === 'remove') {
            cart = cart.filter((_, i) => i !== idx);
        }
        setCart(cart);
        renderCart();
    });

    document.getElementById('btn-send-order')?.addEventListener('click', sendOrder);
}

let _pendingPersonalizarItem = null;

function openPersonalizarModal(item) {
    _pendingPersonalizarItem = item;
    const modal = document.getElementById('modal-personalizar');
    const title = document.getElementById('modal-personalizar-title');
    const body  = document.getElementById('modal-personalizar-body');
    if (!modal || !body) return;

    title.textContent = `Elige ingredientes: ${item.nombre}`;
    const opts = item.ingredientesOpcionales || [];
    body.innerHTML = `
      <div class="personalizar-grid">
        ${opts.map((o, idx) => {
            const ing = o.ingredienteId;
            const nombre = ing?.nombre || 'Ingrediente';
            const extra = Number(o.precioExtra) || 0;
            const extraStr = extra > 0 ? ` (+${extra.toLocaleString('es-CO')})` : '';
            return `
              <label class="personalizar-option">
                <input type="checkbox" class="ingrediente-opc-check" data-idx="${idx}" data-id="${ing?._id || ing}" data-nombre="${escapeHtml(nombre)}" data-precio="${extra}" />
                <div class="personalizar-option-content">
                  <span class="personalizar-option-name">${escapeHtml(nombre)}</span>
                  <span class="personalizar-option-price">${extraStr}</span>
                </div>
              </label>`;
        }).join('')}
      </div>`;

    if (opts.length === 0) {
        body.innerHTML = '<p style="color:var(--text-subtle);">No hay ingredientes configurados.</p>';
    }

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('is-open'));
}

function closePersonalizarModal() {
    _pendingPersonalizarItem = null;
    const modal = document.getElementById('modal-personalizar');
    if (!modal) return;
    modal.classList.remove('is-open');
    setTimeout(() => { modal.style.display = 'none'; }, 200);
}

function confirmPersonalizar() {
    if (!_pendingPersonalizarItem) return;
    const checks = document.querySelectorAll('.ingrediente-opc-check:checked');
    const seleccionados = Array.from(checks).map(cb => ({
        ingredienteId: cb.dataset.id,
        nombre:        cb.dataset.nombre,
        precioExtra:   parseFloat(cb.dataset.precio) || 0,
    }));
    const precioBase = _pendingPersonalizarItem.precio;
    const precioExtra = seleccionados.reduce((s, i) => s + i.precioExtra, 0);
    const precioTotal = precioBase + precioExtra;

    addToCart({
        _id:    _pendingPersonalizarItem._id,
        nombre: _pendingPersonalizarItem.nombre,
        precio: precioTotal,
        esPersonalizable: true,
        ingredientesSeleccionados: seleccionados,
    });

    closePersonalizarModal();

    const btn = document.querySelector(`.btn-add-to-cart[data-id="${_pendingPersonalizarItem._id}"]`);
    if (btn) {
        btn.innerHTML = '<i class="ri-check-line"></i>';
        setTimeout(() => {
            btn.innerHTML = _pendingPersonalizarItem.esPersonalizable ? '<i class="ri-add-line"></i> Personalizar' : '<i class="ri-add-line"></i>';
        }, 600);
    }
}

function addToCart(item) {
    const cart = getCart();
    const key = item.ingredientesSeleccionados?.length
        ? `${item._id}__${JSON.stringify(item.ingredientesSeleccionados.map(i => i.ingredienteId).sort())}`
        : item._id;
    const existing = cart.find(i =>
        i._id === item._id && (
            !item.ingredientesSeleccionados?.length
                ? !i.ingredientesSeleccionados?.length
                : JSON.stringify((i.ingredientesSeleccionados || []).map(x => x.ingredienteId).sort()) ===
                  JSON.stringify(item.ingredientesSeleccionados.map(x => x.ingredienteId).sort())
        )
    );
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    setCart(cart);
    renderCart();

    const btn = document.querySelector(`.btn-add-to-cart[data-id="${item._id}"]`);
    if (btn && !item.esPersonalizable) {
        btn.innerHTML = '<i class="ri-check-line"></i>';
        setTimeout(() => { btn.innerHTML = '<i class="ri-add-line"></i>'; }, 600);
    }
}

function renderCart() {
    const cart      = getCart();
    const itemsEl   = document.getElementById('cart-items');
    const countEl   = document.getElementById('cart-count');
    const totalsEl  = document.getElementById('cart-totals');
    const sendBtn   = document.getElementById('btn-send-order');

    const totalQty  = cart.reduce((s, i) => s + i.qty, 0);
    const total     = cart.reduce((s, i) => s + i.precio * i.qty, 0);

    if (countEl) countEl.textContent = totalQty;
    if (sendBtn) sendBtn.disabled = cart.length === 0;
    if (totalsEl) totalsEl.style.display = cart.length > 0 ? 'flex' : 'none';

    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

    if (!itemsEl) return;

    if (cart.length === 0) {
        itemsEl.innerHTML = `<div class="cart-empty"><i class="ri-inbox-line"></i><p>Agrega platos del menú</p></div>`;
        return;
    }

    itemsEl.innerHTML = cart.map((item, idx) => {
        const ingList = item.ingredientesSeleccionados?.length
            ? `<small style="display:block;color:var(--text-subtle);font-size:0.75rem;margin-top:2px;">${item.ingredientesSeleccionados.map(i => i.nombre).join(', ')}</small>`
            : '';
        const cartKey = item.ingredientesSeleccionados?.length
            ? `data-cart-idx="${idx}"`
            : `data-id="${item._id}"`;
        return `
    <div class="cart-item" ${cartKey}>
      <span class="cart-item-name">${escapeHtml(item.nombre)}${ingList}</span>
      <div class="cart-qty">
        <button class="cart-qty-btn" data-action="dec" data-id="${item._id}" data-cart-idx="${idx}">−</button>
        <span class="cart-qty-num">${item.qty}</span>
        <button class="cart-qty-btn" data-action="inc" data-id="${item._id}" data-cart-idx="${idx}">+</button>
      </div>
      <span class="cart-item-price">$${(item.precio * item.qty).toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
      <button class="btn-icon cart-remove" data-action="remove" data-id="${item._id}" data-cart-idx="${idx}" title="Eliminar">
        <i class="ri-delete-bin-line"></i>
      </button>
    </div>`;
    }).join('');
}


async function sendOrder() {
    const cart = getCart();
    if (cart.length === 0) return;

    const mesa = parseInt(document.getElementById('cart-mesa')?.value) || 1;
    const btn  = document.getElementById('btn-send-order');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ri-loader-4-line"></i> Enviando…'; }

    const items = cart.map(i => ({
        platoId: i._id,
        cantidad: i.qty,
        ...(i.ingredientesSeleccionados?.length ? { ingredientesSeleccionados: i.ingredientesSeleccionados } : {}),
    }));

    try {
        const res = await createOrder(items, mesa);
        if (res && res.status === 'success') {
            clearCart();
            renderCart();
            toastSuccess(`¡Pedido enviado a cocina! (Mesa ${mesa})`);
        } else {
            toastError(res?.message || 'Error al enviar el pedido');
        }
    } catch {
        toastError('Error de conexión al servidor');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ri-send-plane-line"></i> Enviar a Cocina'; }
    }
}


export async function renderMeseroOrdersView(user, container) {
    const view = container || document.getElementById('main-view');
    if (!view) return;

    view.innerHTML = `
    <div class="table-section">
      <div class="table-section-header">
        <h3>Mis Pedidos</h3>
        <button class="btn-secondary btn-sm" id="btn-refresh-orders">
          <i class="ri-refresh-line"></i> Actualizar
        </button>
      </div>

      <!-- Resumen de progreso -->
      <div id="orders-stepper-summary"></div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Mesa</th>
              <th>Progreso</th>
              <th>Total</th>
              <th>Hora</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody id="orders-body">
            <tr><td colspan="6" class="table-state"><i class="ri-loader-4-line"></i> Cargando…</td></tr>
          </tbody>
        </table>
      </div>
      <div id="mesero-orders-pagination"></div>
    </div>`;

    _meseroOrdersPage = 1;
    await fetchMeseroOrders();
    document.getElementById('btn-refresh-orders')?.addEventListener('click', () => {
        _meseroOrdersPage = 1;
        fetchMeseroOrders();
    });

    if (window._socket) {
        window._socket.on('order-updated', () => fetchMeseroOrders());
    }
}

let _allMeseroOrders = [];

async function fetchMeseroOrders() {
    const tbody = document.getElementById('orders-body');
    if (!tbody) return;

    try {
        const res = await getOrders();
        if (!res || res.status !== 'success') throw new Error();
        _allMeseroOrders = res.data;

        renderStepperSummary(_allMeseroOrders);
        renderMeseroOrdersTable();
    } catch {
        tbody.innerHTML = `<tr><td colspan="6" class="table-state">
          <div class="empty-state"><i class="ri-wifi-off-line"></i><p>Error de conexión</p></div>
        </td></tr>`;
    }
}

function renderStepperSummary(orders) {
    const el = document.getElementById('orders-stepper-summary');
    if (!el) return;

    const active = orders.filter(o => !['Entregado', 'Cancelado'].includes(o.estado));
    if (active.length === 0) {
        el.innerHTML = '';
        return;
    }

    const counts = {};
    ORDER_STEPS.forEach(s => { counts[s] = 0; });
    active.forEach(o => { if (counts[o.estado] !== undefined) counts[o.estado]++; });

    el.innerHTML = `
    <div class="order-stepper">
      ${ORDER_STEPS.map((step, i) => {
          const done   = i < ORDER_STEPS.indexOf(ORDER_STEPS.find(s => counts[s] > 0) || step);
          const active = counts[step] > 0;
          return `
          <div class="stepper-step ${active ? 'active' : ''} ${done ? 'done' : ''}">
            <div class="stepper-circle">${active ? counts[step] : (done ? '<i class="ri-check-line"></i>' : '')}</div>
            <span class="stepper-label">${step}</span>
          </div>
          ${i < ORDER_STEPS.length - 1 ? '<div class="stepper-line"></div>' : ''}`;
      }).join('')}
    </div>`;
}

function renderMeseroOrdersTable() {
    const tbody = document.getElementById('orders-body');
    if (!tbody) return;

    if (_allMeseroOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-state">
          <div class="empty-state">
            <i class="ri-receipt-line"></i>
            <p>No tienes pedidos registrados aún</p>
          </div>
        </td></tr>`;
        document.getElementById('mesero-orders-pagination').innerHTML = '';
        return;
    }

    paginate({
        items:       _allMeseroOrders,
        page:        _meseroOrdersPage,
        pageSize:    ORDERS_PAGE_SIZE,
        containerId: 'mesero-orders-pagination',
        renderPage:  (pageItems) => {
            tbody.innerHTML = pageItems.map(o => {
                const hora     = new Date(o.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                const isListo  = o.estado === 'Listo';
                return `
              <tr class="${isListo ? 'row-highlight-success' : ''}">
                <td class="td-muted" style="font-size:0.75rem;font-weight:700;">#${o._id.slice(-6).toUpperCase()}</td>
                <td class="td-muted">${o.mesa ? `Mesa ${o.mesa}` : '—'}</td>
                <td>${orderStepperInline(o.estado)}</td>
                <td><strong>$${Number(o.total).toLocaleString('es-CO', { minimumFractionDigits: 0 })}</strong></td>
                <td class="td-muted">${hora}</td>
                <td>
                  ${isListo ? `
                    <button class="btn-primary btn-sm btn-deliver" data-id="${o._id}">
                      <i class="ri-checkbox-circle-line"></i> Entregar
                    </button>` : estadoBadge(o.estado)}
                </td>
              </tr>`;
            }).join('');

            tbody.querySelectorAll('.btn-deliver').forEach(btn => {
                btn.addEventListener('click', async () => {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="ri-loader-4-line"></i>';
                    const res = await updateOrder(btn.dataset.id, 'Entregado');
                    if (res?.status === 'success') {
                        toastSuccess('Pedido entregado al cliente');
                    } else {
                        toastError('Error al actualizar el pedido');
                    }
                    await fetchMeseroOrders();
                });
            });
        },
        onPageChange: (p) => {
            _meseroOrdersPage = p;
            renderMeseroOrdersTable();
        },
    });
}

function orderStepperInline(estadoActual) {
    const steps = ['Pendiente', 'Preparando', 'Listo', 'Entregado'];
    const idx   = steps.indexOf(estadoActual);
    if (estadoActual === 'Cancelado') {
        return `<span class="badge badge-danger">Cancelado</span>`;
    }
    return `<div class="order-progress-inline">
        ${steps.map((s, i) => `
        <span class="progress-dot ${i < idx ? 'done' : ''} ${i === idx ? 'active' : ''}" title="${s}"></span>
        ${i < steps.length - 1 ? `<span class="progress-line ${i < idx ? 'done' : ''}"></span>` : ''}
        `).join('')}
        <span class="progress-label">${estadoActual}</span>
    </div>`;
}

/* ── Helpers ── */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
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

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}