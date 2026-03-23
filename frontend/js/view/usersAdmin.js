import { fetchWithAuth } from '../utils/storage.js';

const ROLES = ['Admin', 'Mesero', 'Chef'];

export async function renderUsersAdminView(user, container) {
    const view = container || document.getElementById('main-view');
    if (!view) return;

    view.innerHTML = `
    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <i class="ri-team-line stat-icon"></i>
        <span class="stat-label">Total Usuarios</span>
        <span class="stat-value" id="us-total">—</span>
        <span class="stat-sub">registrados</span>
      </div>
      <div class="stat-card">
        <i class="ri-shield-user-line stat-icon" style="color:var(--primary-light)"></i>
        <span class="stat-label">Administradores</span>
        <span class="stat-value" id="us-admin">—</span>
        <span class="stat-sub">con acceso total</span>
      </div>
      <div class="stat-card">
        <i class="ri-user-line stat-icon" style="color:var(--warning)"></i>
        <span class="stat-label">Meseros</span>
        <span class="stat-value" id="us-mesero">—</span>
        <span class="stat-sub">activos</span>
      </div>
      <div class="stat-card">
        <i class="ri-knife-line stat-icon" style="color:var(--success)"></i>
        <span class="stat-label">Chefs</span>
        <span class="stat-value" id="us-chef">—</span>
        <span class="stat-sub">en cocina</span>
      </div>
    </div>

    <!-- Tabla de usuarios -->
    <div class="table-section">
      <div class="table-section-header">
        <h3>Usuarios del Sistema</h3>
        <button class="btn-primary btn-sm" id="btn-add-user">
          <i class="ri-user-add-line"></i> Nuevo Usuario
        </button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Registrado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="users-tbody">
            <tr><td colspan="5" class="table-state">
              <i class="ri-loader-4-line"></i> Cargando…
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Nuevo / Editar Usuario -->
    <div id="modal-user" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-user-title">Nuevo Usuario</h3>
          <button type="button" class="btn-icon modal-user-close">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <form id="form-user" autocomplete="off">
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="user-nombre">Nombre completo</label>
              <input type="text" id="user-nombre" placeholder="ej. Juan Pérez" required />
            </div>
            <div class="form-group full-width" id="user-email-group">
              <label for="user-email">Email</label>
              <input type="email" id="user-email" placeholder="juan@example.com" />
            </div>
            <div class="form-group">
              <label for="user-rol">Rol</label>
              <select id="user-rol" required>
                <option value="" disabled selected>Selecciona…</option>
                ${ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="user-password" id="user-password-label">Contraseña</label>
              <input type="password" id="user-password" placeholder="Mínimo 6 caracteres" />
              <span class="form-hint" id="user-password-hint" style="font-size:var(--text-xs);color:var(--text-subtle);margin-top:4px;display:none;">Dejar vacío para no cambiar</span>
            </div>
          </div>
          <div id="form-user-error" style="color:var(--danger);font-size:var(--text-sm);margin-bottom:var(--s3);display:none;padding:var(--s3) var(--s4);background:var(--danger-bg);border-radius:var(--r-md);border:1px solid var(--danger-border);"></div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary modal-user-close">Cancelar</button>
            <button type="submit" class="btn-primary" id="btn-save-user">
              <i class="ri-save-line"></i> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

    await loadUsers(user);
    setupUserHandlers(user);
}

async function loadUsers(currentUser) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    try {
        // fetchWithAuth antepone /api, así que usamos /users
        const data = await fetchWithAuth('/users');
        if (!data || data.status !== 'success') throw new Error(data?.message || 'Error');

        const users = data.data;
        window.__users = users;

        setStat('us-total',  users.length);
        setStat('us-admin',  users.filter(u => u.rol === 'Admin').length);
        setStat('us-mesero', users.filter(u => u.rol === 'Mesero').length);
        setStat('us-chef',   users.filter(u => u.rol === 'Chef').length);

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="table-state">
              <i class="ri-inbox-line"></i> No hay usuarios registrados</td></tr>`;
            return;
        }

        const rolColor = { Admin: 'badge-primary', Mesero: 'badge-warning', Chef: 'badge-success' };

        tbody.innerHTML = users.map(u => {
            const isMe  = u._id === currentUser?.id;
            const fecha = new Date(u.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            return `<tr>
              <td class="td-name">
                ${escapeHtml(u.nombre)}
                ${isMe ? ' <span class="badge badge-primary" style="font-size:0.6rem;padding:1px 6px;">Tú</span>' : ''}
              </td>
              <td class="td-muted">${escapeHtml(u.email)}</td>
              <td><span class="badge ${rolColor[u.rol] || 'badge-primary'}">${u.rol}</span></td>
              <td class="td-muted">${fecha}</td>
              <td>
                <div style="display:flex;gap:var(--s2);">
                  <button class="btn-icon btn-edit-user" data-id="${u._id}" title="Editar">
                    <i class="ri-pencil-line"></i>
                  </button>
                  ${!isMe ? `<button class="btn-icon btn-delete-user" data-id="${u._id}" title="Eliminar"
                    style="color:var(--danger);border-color:rgba(239,68,68,0.2);">
                    <i class="ri-delete-bin-line"></i>
                  </button>` : ''}
                </div>
              </td>
            </tr>`;
        }).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-state">
          <i class="ri-wifi-off-line"></i> ${err.message || 'Error de conexión'}</td></tr>`;
    }
}

function setupUserHandlers(currentUser) {
    document.getElementById('btn-add-user')?.addEventListener('click', () => openUserModal());

    document.addEventListener('click', (e) => {
        if (e.target.closest('.modal-user-close')) closeUserModal();
        if (e.target.id === 'modal-user') closeUserModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeUserModal();
    });

    document.getElementById('users-tbody')?.addEventListener('click', async (e) => {
        const editBtn   = e.target.closest('.btn-edit-user');
        const deleteBtn = e.target.closest('.btn-delete-user');

        if (editBtn) {
            const id   = editBtn.dataset.id;
            const user = window.__users?.find(u => u._id === id);
            if (user) openUserModal(user);
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
            deleteBtn.disabled = true;
            try {
                const res = await fetchWithAuth(`/users/${id}`, { method: 'DELETE' });
                if (res && res.status === 'success') {
                    await loadUsers(currentUser);
                } else {
                    alert(res?.message || 'Error al eliminar');
                    deleteBtn.disabled = false;
                }
            } catch {
                alert('Error de conexión');
                deleteBtn.disabled = false;
            }
        }
    });

    document.getElementById('form-user')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn   = document.getElementById('btn-save-user');
        const errEl = document.getElementById('form-user-error');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ri-loader-4-line"></i> Guardando…'; }
        if (errEl) errEl.style.display = 'none';

        const id       = document.getElementById('form-user').dataset.editId || null;
        const password = document.getElementById('user-password').value;

        const payload = {
            nombre: document.getElementById('user-nombre').value.trim(),
            rol:    document.getElementById('user-rol').value,
        };

        if (!id) {
            payload.email    = document.getElementById('user-email').value.trim();
            payload.password = password;
        } else if (password) {
            payload.password = password;
        }

        try {
            const res = id
                ? await fetchWithAuth(`/users/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                : await fetchWithAuth('/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

            if (res && res.status === 'success') {
                closeUserModal();
                await loadUsers(currentUser);
            } else {
                const msg = res?.errors?.[0]?.message || res?.message || 'Error al guardar';
                if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
            }
        } catch {
            if (errEl) { errEl.textContent = 'Error de conexión'; errEl.style.display = 'block'; }
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ri-save-line"></i> Guardar'; }
        }
    });
}

function openUserModal(user = null) {
    const modal      = document.getElementById('modal-user');
    const title      = document.getElementById('modal-user-title');
    const form       = document.getElementById('form-user');
    const emailGroup = document.getElementById('user-email-group');
    const pwdHint    = document.getElementById('user-password-hint');
    const pwdInput   = document.getElementById('user-password');
    if (!modal || !form) return;

    document.getElementById('form-user-error').style.display = 'none';

    if (user) {
        title.textContent      = 'Editar Usuario';
        form.dataset.editId    = user._id;
        document.getElementById('user-nombre').value = user.nombre;
        document.getElementById('user-rol').value    = user.rol;
        document.getElementById('user-password').value = '';
        if (emailGroup) emailGroup.style.display = 'none';
        if (pwdHint)    pwdHint.style.display    = 'block';
        if (pwdInput)   pwdInput.removeAttribute('required');
    } else {
        title.textContent = 'Nuevo Usuario';
        delete form.dataset.editId;
        form.reset();
        if (emailGroup) emailGroup.style.display = '';
        if (pwdHint)    pwdHint.style.display    = 'none';
        if (pwdInput)   pwdInput.setAttribute('required', '');
    }

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('is-open'));
}

function closeUserModal() {
    const modal = document.getElementById('modal-user');
    if (!modal) return;
    modal.classList.remove('is-open');
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('form-user')?.reset();
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
