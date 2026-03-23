/* =====================================================
   menuAdmin.js — Gestión del Menú (Admin)
   ===================================================== */
import { getAllDishes, createDish, updateDish, deleteDish } from '../api/menu.js';
import { downloadCSV } from '../utils/export.js';

const CATEGORIAS = ['Entradas', 'Platos fuertes', 'Bebidas', 'Postres'];

export async function renderMenuAdminView(user, container) {
    const view = container || document.getElementById('main-view');
    if (!view) return;

    view.innerHTML = `
    <!-- Stats rápidas -->
    <div class="stats-row" id="menu-stats-row">
      <div class="stat-card">
        <i class="ri-restaurant-2-line stat-icon"></i>
        <span class="stat-label">Total Platos</span>
        <span class="stat-value" id="ms-total">—</span>
        <span class="stat-sub">en el menú</span>
      </div>
      <div class="stat-card">
        <i class="ri-checkbox-circle-line stat-icon" style="color:var(--success)"></i>
        <span class="stat-label">Disponibles</span>
        <span class="stat-value is-success" id="ms-active">—</span>
        <span class="stat-sub">activos</span>
      </div>
      <div class="stat-card">
        <i class="ri-close-circle-line stat-icon" style="color:var(--text-subtle)"></i>
        <span class="stat-label">Inactivos</span>
        <span class="stat-value" id="ms-inactive">—</span>
        <span class="stat-sub">desactivados</span>
      </div>
    </div>

    <!-- Tabla de platos -->
    <div class="table-section">
      <div class="table-section-header">
        <h3>Platos del Menú</h3>
        <div style="display:flex;gap:var(--s2);">
          <button class="btn-secondary btn-sm" id="btn-export-menu">
            <i class="ri-download-2-line"></i> Exportar CSV
          </button>
          <button class="btn-primary btn-sm" id="btn-add-dish">
            <i class="ri-add-line"></i> Nuevo Plato
          </button>
        </div>
      </div>

      <!-- Búsqueda -->
      <div class="table-search-bar">
        <i class="ri-search-line"></i>
        <input type="text" id="menu-search-admin" placeholder="Buscar plato…" autocomplete="off" />
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Img</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Disponible</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="menu-tbody">
            <tr><td colspan="6" class="table-state">
              <i class="ri-loader-4-line"></i> Cargando…
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Nuevo / Editar plato -->
    <div id="modal-dish" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-dish-title">Nuevo Plato</h3>
          <button type="button" class="btn-icon modal-dish-close">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <form id="form-dish" autocomplete="off">
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="dish-nombre">Nombre del plato</label>
              <input type="text" id="dish-nombre" placeholder="ej. Bandeja Paisa" required />
            </div>
            <div class="form-group">
              <label for="dish-categoria">Categoría</label>
              <select id="dish-categoria" required>
                <option value="" disabled selected>Selecciona…</option>
                ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="dish-precio">Precio ($)</label>
              <input type="number" id="dish-precio" placeholder="0" required min="0" step="0.01" />
            </div>
            <div class="form-group full-width">
              <label for="dish-imageurl">URL de imagen <span style="color:var(--text-subtle);font-weight:400;">(opcional)</span></label>
              <input type="url" id="dish-imageurl" placeholder="https://ejemplo.com/imagen.jpg" />
            </div>
            <div class="form-group full-width">
              <label style="display:flex;align-items:center;gap:var(--s3);text-transform:none;letter-spacing:0;font-size:var(--text-sm);cursor:pointer;">
                <input type="checkbox" id="dish-disponible" checked style="width:16px;height:16px;accent-color:var(--primary);cursor:pointer;" />
                Disponible en el menú
              </label>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary modal-dish-close">Cancelar</button>
            <button type="submit" class="btn-primary" id="btn-save-dish">
              <i class="ri-save-line"></i> Guardar Plato
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

    await loadDishes();
    setupDishHandlers();
}

/* ── Cargar y renderizar platos ── */
let _allDishes = [];

async function loadDishes() {
    const tbody = document.getElementById('menu-tbody');
    if (!tbody) return;

    try {
        const res = await getAllDishes();
        if (!res || res.status !== 'success') throw new Error();
        _allDishes = res.data;
        window.__dishes = _allDishes;
        renderDishTable(_allDishes);

        const total    = _allDishes.length;
        const activos  = _allDishes.filter(d => d.disponible).length;
        const inactivo = total - activos;
        setStat('ms-total',    total);
        setStat('ms-active',   activos);
        setStat('ms-inactive', inactivo);

    } catch {
        tbody.innerHTML = `<tr><td colspan="6" class="table-state">
          <i class="ri-wifi-off-line"></i> Error de conexión
        </td></tr>`;
    }
}

function renderDishTable(dishes) {
    const tbody = document.getElementById('menu-tbody');
    if (!tbody) return;

    if (dishes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-state">
          <i class="ri-inbox-line"></i> No hay platos. ¡Agrega el primero!
        </td></tr>`;
        return;
    }

    tbody.innerHTML = dishes.map(d => `
    <tr>
      <td style="width:48px;">
        ${d.imageUrl
            ? `<img src="${escapeHtml(d.imageUrl)}" alt="${escapeHtml(d.nombre)}" class="dish-thumb" />`
            : `<div class="dish-thumb-placeholder"><i class="ri-image-line"></i></div>`
        }
      </td>
      <td class="td-name">${escapeHtml(d.nombre)}</td>
      <td><span class="badge badge-primary">${escapeHtml(d.categoria)}</span></td>
      <td><strong>$${Number(d.precio).toLocaleString('es-CO')}</strong></td>
      <td>
        <button
          class="toggle-btn ${d.disponible ? 'is-on' : 'is-off'}"
          data-id="${d._id}"
          data-disponible="${d.disponible}"
          title="${d.disponible ? 'Desactivar' : 'Activar'}"
        >
          <i class="ri-${d.disponible ? 'toggle-right' : 'toggle-left'}-line"></i>
          ${d.disponible ? 'Activo' : 'Inactivo'}
        </button>
      </td>
      <td>
        <div style="display:flex;gap:var(--s2);">
          <button class="btn-icon btn-edit-dish" data-id="${d._id}" title="Editar">
            <i class="ri-pencil-line"></i>
          </button>
          <button class="btn-icon btn-delete-dish" data-id="${d._id}" title="Eliminar"
            style="color:var(--danger);border-color:rgba(239,68,68,0.2);">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── Event handlers ── */
function setupDishHandlers() {
    // Búsqueda
    document.getElementById('menu-search-admin')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        renderDishTable(q ? _allDishes.filter(d =>
            d.nombre.toLowerCase().includes(q) ||
            d.categoria.toLowerCase().includes(q)
        ) : _allDishes);
    });

    // Exportar CSV
    document.getElementById('btn-export-menu')?.addEventListener('click', () => {
        if (!_allDishes.length) return alert('No hay datos para exportar');
        downloadCSV(
            _allDishes.map(d => ({
                nombre:     d.nombre,
                categoria:  d.categoria,
                precio:     d.precio,
                disponible: d.disponible ? 'Sí' : 'No',
                imagen:     d.imageUrl || '',
            })),
            ['nombre', 'categoria', 'precio', 'disponible', 'imagen'],
            ['Nombre', 'Categoría', 'Precio', 'Disponible', 'URL Imagen'],
            `menu_${new Date().toISOString().slice(0, 10)}.csv`
        );
    });

    document.getElementById('btn-add-dish')?.addEventListener('click', () => openDishModal());

    document.addEventListener('click', (e) => {
        if (e.target.closest('.modal-dish-close')) closeDishModal();
        if (e.target.id === 'modal-dish') closeDishModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDishModal();
    });

    document.getElementById('menu-tbody')?.addEventListener('click', async (e) => {
        const toggleBtn = e.target.closest('.toggle-btn');
        const editBtn   = e.target.closest('.btn-edit-dish');
        const deleteBtn = e.target.closest('.btn-delete-dish');

        if (toggleBtn) {
            const id     = toggleBtn.dataset.id;
            const actual = toggleBtn.dataset.disponible === 'true';
            toggleBtn.disabled = true;
            const res = await updateDish(id, { disponible: !actual });
            if (res?.status === 'success') await loadDishes();
            else toggleBtn.disabled = false;
        }

        if (editBtn) {
            const id   = editBtn.dataset.id;
            const dish = window.__dishes?.find(d => d._id === id);
            if (dish) openDishModal(dish);
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (!confirm('¿Eliminar este plato del menú?')) return;
            deleteBtn.disabled = true;
            const res = await deleteDish(id);
            if (res?.status === 'success') await loadDishes();
            else deleteBtn.disabled = false;
        }
    });

    document.getElementById('form-dish')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-dish');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ri-loader-4-line"></i> Guardando…'; }

        const id = document.getElementById('form-dish').dataset.editId || null;

        const payload = {
            nombre:     document.getElementById('dish-nombre').value.trim(),
            categoria:  document.getElementById('dish-categoria').value,
            precio:     parseFloat(document.getElementById('dish-precio').value),
            disponible: document.getElementById('dish-disponible').checked,
            imageUrl:   document.getElementById('dish-imageurl').value.trim(),
        };

        try {
            const res = id ? await updateDish(id, payload) : await createDish(payload);
            if (res?.status === 'success') {
                closeDishModal();
                await loadDishes();
            } else {
                alert(res?.message || 'Error al guardar el plato');
            }
        } catch {
            alert('Error de conexión');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ri-save-line"></i> Guardar Plato'; }
        }
    });
}

function openDishModal(dish = null) {
    const modal = document.getElementById('modal-dish');
    const title = document.getElementById('modal-dish-title');
    const form  = document.getElementById('form-dish');
    if (!modal || !form) return;

    if (dish) {
        title.textContent      = 'Editar Plato';
        form.dataset.editId    = dish._id;
        document.getElementById('dish-nombre').value     = dish.nombre;
        document.getElementById('dish-categoria').value  = dish.categoria;
        document.getElementById('dish-precio').value     = dish.precio;
        document.getElementById('dish-imageurl').value   = dish.imageUrl || '';
        document.getElementById('dish-disponible').checked = dish.disponible;
    } else {
        title.textContent = 'Nuevo Plato';
        delete form.dataset.editId;
        form.reset();
    }

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('is-open'));
}

function closeDishModal() {
    const modal = document.getElementById('modal-dish');
    if (!modal) return;
    modal.classList.remove('is-open');
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('form-dish')?.reset();
    }, 380);
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
