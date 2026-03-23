/* =====================================================
   admin.js — Vista de inventario (Admin)
   ===================================================== */
import { downloadCSV } from '../utils/export.js';
import { paginate } from '../utils/pagination.js';
import { toastSuccess, toastError } from '../utils/toast.js';

const API = '/api';
let _inventoryItems = [];
let _invPage = 1;
const INV_PAGE_SIZE = 15;

export async function renderAdminView(user, container) {
    await renderInventoryView(user);
    setupModalHandlers();
    setupFormHandler();
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

async function renderInventoryView(user) {
    const view = document.getElementById('main-view');
    if (!view) return;

    view.innerHTML = `
    <!-- Bienvenida -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <p class="welcome-greeting">${getGreeting()},</p>
        <h2 class="welcome-name">${escapeHtml(user?.nombre || 'Admin')} <span class="welcome-wave">👋</span></h2>
      </div>
      <p class="welcome-sub">Aquí tienes el resumen del inventario de hoy.</p>
    </div>

    <!-- Stats del negocio -->
    <div class="stats-row" id="business-stats">
      <div class="stat-card">
        <i class="ri-money-dollar-circle-line stat-icon" style="color:var(--success)"></i>
        <span class="stat-label">Ingresos Totales</span>
        <span class="stat-value is-success" id="bs-ingresos">—</span>
        <span class="stat-sub">pedidos entregados</span>
      </div>
      <div class="stat-card">
        <i class="ri-file-list-3-line stat-icon"></i>
        <span class="stat-label">Total Pedidos</span>
        <span class="stat-value" id="bs-pedidos">—</span>
        <span class="stat-sub">registrados</span>
      </div>
      <div class="stat-card">
        <i class="ri-time-line stat-icon" style="color:var(--warning)"></i>
        <span class="stat-label">Pendientes</span>
        <span class="stat-value is-warning" id="bs-pendientes">—</span>
        <span class="stat-sub">sin iniciar</span>
      </div>
      <div class="stat-card">
        <i class="ri-fire-line stat-icon" style="color:var(--primary-light)"></i>
        <span class="stat-label">En Cocina</span>
        <span class="stat-value" id="bs-preparando">—</span>
        <span class="stat-sub">preparándose</span>
      </div>
    </div>

    <!-- Stats del inventario -->
    <div class="stats-row">
      <div class="stat-card">
        <i class="ri-archive-2-line stat-icon"></i>
        <span class="stat-label">Total Ingredientes</span>
        <span class="stat-value" id="stat-total">—</span>
        <span class="stat-sub">en inventario</span>
      </div>
      <div class="stat-card">
        <i class="ri-alert-line stat-icon" style="color:var(--danger)"></i>
        <span class="stat-label">Bajo Stock</span>
        <span class="stat-value" id="stat-low">—</span>
        <span class="stat-sub">requieren atención</span>
      </div>
      <div class="stat-card">
        <i class="ri-folders-line stat-icon" style="color:var(--warning)"></i>
        <span class="stat-label">Categorías</span>
        <span class="stat-value" id="stat-cats">—</span>
        <span class="stat-sub">diferentes</span>
      </div>
      <div class="stat-card">
        <i class="ri-checkbox-circle-line stat-icon" style="color:var(--success)"></i>
        <span class="stat-label">Stock OK</span>
        <span class="stat-value is-success" id="stat-ok">—</span>
        <span class="stat-sub">con stock adecuado</span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="table-section">
      <div class="table-section-header">
        <h3>Stock de Ingredientes</h3>
        <div style="display:flex;gap:var(--s2);flex-wrap:wrap;">
          <button class="btn-secondary btn-sm" id="btn-export-inv">
            <i class="ri-download-2-line"></i> Exportar CSV
          </button>
          <button class="btn-primary btn-sm" id="btn-add-item">
            <i class="ri-add-line"></i> Nuevo Ingrediente
          </button>
        </div>
      </div>

      <!-- Barra de búsqueda -->
      <div class="table-search-bar">
        <i class="ri-search-line"></i>
        <input type="text" id="inv-search" placeholder="Buscar por nombre o categoría…" autocomplete="off" />
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th>Categoría</th>
              <th>Stock actual</th>
              <th>Stock mínimo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="inventoryBody">
            <tr><td colspan="6" class="table-state">
              <i class="ri-loader-4-line"></i> Cargando datos…
            </td></tr>
          </tbody>
        </table>
      </div>
      <div id="inv-pagination"></div>
    </div>

    <!-- Modal edición completa de ingrediente -->
    <div id="modal-edit-ingredient" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-edit-title">Editar Ingrediente</h3>
          <button type="button" class="btn-icon" id="modal-edit-close">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <form id="form-edit-ingredient" autocomplete="off">
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="edit-nombre">Nombre</label>
              <input type="text" id="edit-nombre" required />
            </div>
            <div class="form-group">
              <label for="edit-categoria">Categoría</label>
              <input type="text" id="edit-categoria" />
            </div>
            <div class="form-group">
              <label for="edit-unidad">Unidad</label>
              <input type="text" id="edit-unidad" placeholder="kg, litros, unidades…" required />
            </div>
            <div class="form-group">
              <label for="edit-stock">Stock actual</label>
              <input type="number" id="edit-stock" min="0" step="0.01" required />
            </div>
            <div class="form-group">
              <label for="edit-minstock">Stock mínimo (alerta)</label>
              <input type="number" id="edit-minstock" min="0" step="0.01" required />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="modal-edit-cancel">Cancelar</button>
            <button type="submit" class="btn-primary" id="btn-save-edit">
              <i class="ri-save-line"></i> Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

    await Promise.all([fetchBusinessStats(), fetchAndRenderTable()]);
    setupSearchHandler();
    setupExportHandler();
    setupEditModal();
}

/* ── Búsqueda ── */
function setupSearchHandler() {
    const input = document.getElementById('inv-search');
    if (!input) return;
    input.addEventListener('input', () => {
        _invPage = 1;
        const q = input.value.toLowerCase().trim();
        renderInventoryTable(q
            ? _inventoryItems.filter(i =>
                i.nombre.toLowerCase().includes(q) ||
                (i.categoria || '').toLowerCase().includes(q)
            )
            : _inventoryItems
        );
    });
}

/* ── Exportar CSV ── */
function setupExportHandler() {
    document.getElementById('btn-export-inv')?.addEventListener('click', () => {
        if (!_inventoryItems.length) { toastError('No hay datos para exportar'); return; }
        const flat = _inventoryItems.map(i => ({
            nombre:    i.nombre,
            categoria: i.categoria || '',
            stock:     i.stock,
            unidad:    i.unidad,
            minStock:  i.minStock,
            estado:    i.stock <= i.minStock ? 'Bajo Stock' : 'OK',
        }));
        downloadCSV(
            flat,
            ['nombre', 'categoria', 'stock', 'unidad', 'minStock', 'estado'],
            ['Ingrediente', 'Categoría', 'Stock', 'Unidad', 'Stock Mínimo', 'Estado'],
            `inventario_${new Date().toISOString().slice(0, 10)}.csv`
        );
    });
}

/* ── Stats del negocio ── */
async function fetchBusinessStats() {
    try {
        const res = await fetch(`${API}/stats`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) return;
        const { data } = await res.json();

        const ingresos   = Number(data.ingresosTotales);
        const ingresosEl = document.getElementById('bs-ingresos');
        if (ingresosEl) ingresosEl.textContent = `$${ingresos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

        setStat('bs-pedidos',    data.totalPedidos);
        setStat('bs-pendientes', data.pedidosPorEstado?.Pendiente ?? 0);
        setStat('bs-preparando', data.pedidosPorEstado?.Preparando ?? 0);
    } catch { /* no crítico */ }
}

/* ── Fetch + render tabla ── */
async function fetchAndRenderTable() {
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API}/inventory`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();
        _inventoryItems = items;

        const total = items.length;
        const low   = items.filter(i => i.stock <= i.minStock).length;
        const cats  = new Set(items.map(i => i.categoria).filter(Boolean)).size;
        const ok    = total - low;

        setStat('stat-total', total);
        setStat('stat-cats',  cats);
        setStat('stat-ok',    ok);

        const lowEl = document.getElementById('stat-low');
        if (lowEl) {
            lowEl.textContent = low;
            lowEl.className   = `stat-value${low > 0 ? ' is-danger' : ' is-success'}`;
        }

        renderInventoryTable(items);
    } catch {
        const tbody = document.getElementById('inventoryBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="table-state">
          <i class="ri-wifi-off-line"></i> Error de conexión</td></tr>`;
    }
}

function renderInventoryTable(items) {
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-state">
          <div class="empty-state">
            <i class="ri-inbox-line"></i>
            <p>No hay ingredientes que coincidan con la búsqueda</p>
          </div></td></tr>`;
        document.getElementById('inv-pagination').innerHTML = '';
        return;
    }

    paginate({
        items:       items,
        page:        _invPage,
        pageSize:    INV_PAGE_SIZE,
        containerId: 'inv-pagination',
        renderPage:  (pageItems) => {
            tbody.innerHTML = pageItems.map(item => {
                const isLow = item.stock <= item.minStock;
                return `
              <tr class="${isLow ? 'row-low-stock' : ''}">
                <td class="td-name">${escapeHtml(item.nombre)}</td>
                <td class="td-muted">${escapeHtml(item.categoria || '—')}</td>
                <td>
                  <strong class="${isLow ? 'text-danger' : ''}">${item.stock}</strong>
                </td>
                <td class="td-muted">${item.minStock}</td>
                <td>
                  <span class="badge ${isLow ? 'badge-danger' : 'badge-success'}">
                    ${isLow ? '<i class="ri-alert-line"></i> Bajo Stock' : 'OK'}
                  </span>
                </td>
                <td>
                  <div style="display:flex;gap:var(--s2);">
                    <button class="btn-icon btn-edit-ingredient" data-id="${item._id}" title="Editar">
                      <i class="ri-pencil-line"></i>
                    </button>
                    <button class="btn-icon btn-delete-ingredient"
                      data-id="${item._id}" data-nombre="${escapeHtml(item.nombre)}"
                      title="Eliminar" style="color:var(--danger);border-color:rgba(239,68,68,0.2);">
                      <i class="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </td>
              </tr>`;
            }).join('');

            tbody.querySelectorAll('.btn-edit-ingredient').forEach(btn => {
                btn.addEventListener('click', () => {
                    const item = _inventoryItems.find(i => i._id === btn.dataset.id);
                    if (item) openEditModal(item);
                });
            });
            tbody.querySelectorAll('.btn-delete-ingredient').forEach(btn => {
                btn.addEventListener('click', () => deleteIngredient(btn.dataset.id, btn.dataset.nombre));
            });
        },
        onPageChange: (p) => {
            _invPage = p;
            const q = document.getElementById('inv-search')?.value.toLowerCase().trim() || '';
            renderInventoryTable(q
                ? _inventoryItems.filter(i =>
                    i.nombre.toLowerCase().includes(q) ||
                    (i.categoria || '').toLowerCase().includes(q))
                : _inventoryItems
            );
        },
    });
}

/* ── Modal de edición completa ── */
function setupEditModal() {
    document.getElementById('modal-edit-close')?.addEventListener('click', closeEditModal);
    document.getElementById('modal-edit-cancel')?.addEventListener('click', closeEditModal);
    document.getElementById('modal-edit-ingredient')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-edit-ingredient') closeEditModal();
    });

    document.getElementById('form-edit-ingredient')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-edit');
        const id  = document.getElementById('form-edit-ingredient').dataset.editId;
        if (!id) return;

        btn.disabled  = true;
        btn.innerHTML = '<i class="ri-loader-4-line"></i> Guardando…';

        const payload = {
            nombre:    document.getElementById('edit-nombre').value.trim(),
            categoria: document.getElementById('edit-categoria').value.trim(),
            unidad:    document.getElementById('edit-unidad').value.trim(),
            stock:     parseFloat(document.getElementById('edit-stock').value),
            minStock:  parseFloat(document.getElementById('edit-minstock').value),
        };

        try {
            const res = await fetch(`${API}/inventory/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toastSuccess('Ingrediente actualizado');
                closeEditModal();
                await fetchAndRenderTable();
            } else {
                const d = await res.json().catch(() => ({}));
                toastError(d.message || 'Error al guardar');
            }
        } catch {
            toastError('Error de conexión');
        } finally {
            btn.disabled  = false;
            btn.innerHTML = '<i class="ri-save-line"></i> Guardar cambios';
        }
    });
}

function openEditModal(item) {
    const modal = document.getElementById('modal-edit-ingredient');
    const form  = document.getElementById('form-edit-ingredient');
    if (!modal || !form) return;

    form.dataset.editId = item._id;
    document.getElementById('edit-nombre').value    = item.nombre;
    document.getElementById('edit-categoria').value = item.categoria || '';
    document.getElementById('edit-unidad').value    = item.unidad;
    document.getElementById('edit-stock').value     = item.stock;
    document.getElementById('edit-minstock').value  = item.minStock;

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.getElementById('edit-nombre')?.focus();
}

function closeEditModal() {
    const modal = document.getElementById('modal-edit-ingredient');
    if (!modal) return;
    modal.classList.remove('is-open');
    setTimeout(() => { modal.style.display = 'none'; }, 380);
}

/* ── Eliminar ingrediente ── */
async function deleteIngredient(id, nombre) {
    if (!confirm(`¿Eliminar el ingrediente "${nombre}"? Esta acción no se puede deshacer.`)) return;

    try {
        const res = await fetch(`${API}/inventory/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.ok) {
            toastSuccess(`"${nombre}" eliminado`);
            await fetchAndRenderTable();
        } else {
            const d = await res.json().catch(() => ({}));
            toastError(d.message || 'Error al eliminar');
        }
    } catch {
        toastError('Error de conexión');
    }
}

/* ── Modal nuevo ingrediente ── */
function setupModalHandlers() {
    const modal = document.getElementById('modal-ingrediente');
    if (!modal) return;

    document.addEventListener('click', (e) => {
        if (e.target.closest('#btn-add-item')) openModal();
        if (e.target.closest('.modal-close'))  closeModal();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeEditModal();
        }
    });
}

function openModal() {
    const modal = document.getElementById('modal-ingrediente');
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('is-open'));
}

function closeModal() {
    const modal = document.getElementById('modal-ingrediente');
    if (!modal) return;
    modal.classList.remove('is-open');
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('form-ingrediente')?.reset();
    }, 380);
}

function setupFormHandler() {
    document.getElementById('form-ingrediente')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-ingrediente');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ri-loader-4-line"></i> Guardando…'; }

        const payload = {
            nombre:    document.getElementById('nombre').value.trim(),
            categoria: document.getElementById('categoria').value.trim(),
            stock:     Number(document.getElementById('stock').value),
            minStock:  Number(document.getElementById('minStock').value),
            unidad:    document.getElementById('unidad').value.trim(),
        };

        try {
            const res = await fetch(`${API}/inventory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                toastSuccess('Ingrediente agregado al inventario');
                closeModal();
                await fetchAndRenderTable();
            } else {
                const d = await res.json().catch(() => ({}));
                toastError(d.message || 'Error al guardar el ingrediente');
            }
        } catch {
            toastError('Error de conexión al servidor');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ri-save-line"></i> Guardar'; }
        }
    });
}

/* ── Helpers ── */
function setStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
