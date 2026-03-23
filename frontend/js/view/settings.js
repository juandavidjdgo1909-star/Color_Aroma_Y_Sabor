import { fetchWithAuth } from '../utils/storage.js';

const VERSION = '1.0.0';

export async function renderSettingsView(user, container) {
    const view = container || document.getElementById('main-view');
    if (!view) return;

    const isAdmin  = user?.rol === 'Admin';
    const rolColor = { Admin: 'badge-primary', Mesero: 'badge-warning', Chef: 'badge-success' };

    view.innerHTML = `
    <!-- Encabezado -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <p class="welcome-greeting">Configuración de cuenta,</p>
        <h2 class="welcome-name">${escapeHtml(user?.nombre || 'Usuario')} <span class="welcome-wave">⚙️</span></h2>
      </div>
      <p class="welcome-sub">Gestiona tu perfil y la información del sistema.</p>
    </div>

    <!-- Layout -->
    <div class="settings-layout">

      <!-- ─── Mi Perfil ─── -->
      <section class="settings-card">
        <div class="settings-card-header">
          <i class="ri-user-settings-line"></i>
          <h3>Mi Perfil</h3>
        </div>

        <div class="profile-info">
          <div class="profile-avatar-lg" id="cfg-avatar">
            ${(user?.nombre || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div class="profile-name" id="cfg-name">${escapeHtml(user?.nombre || '—')}</div>
            <div class="profile-email">${escapeHtml(user?.email || '—')}</div>
            <span class="badge ${rolColor[user?.rol] || 'badge-primary'}" style="margin-top:6px;">
              ${user?.rol || '—'}
            </span>
          </div>
        </div>

        <hr class="settings-divider" />

        <form id="form-nombre" class="settings-form" autocomplete="off">
          <div class="form-group">
            <label for="cfg-new-nombre">Actualizar nombre</label>
            <div style="display:flex;gap:var(--s3);">
              <input
                type="text"
                id="cfg-new-nombre"
                placeholder="Nuevo nombre…"
                value="${escapeHtml(user?.nombre || '')}"
                minlength="2"
                required
                style="flex:1;"
              />
              <button type="submit" class="btn-primary btn-sm" id="btn-save-nombre">
                <i class="ri-save-line"></i> Guardar
              </button>
            </div>
          </div>
          <div class="settings-msg" id="msg-nombre"></div>
        </form>
      </section>

      <!-- ─── Seguridad (solo Admin) ─── -->
      ${isAdmin ? `
      <section class="settings-card">
        <div class="settings-card-header">
          <i class="ri-lock-password-line"></i>
          <h3>Seguridad</h3>
        </div>
        <p class="settings-desc">Cambia tu propia contraseña de acceso. Para gestionar las contraseñas de otros usuarios, ve a <strong>Usuarios</strong>.</p>

        <form id="form-password" class="settings-form" autocomplete="off">
          <div class="form-group">
            <label for="cfg-pass-new">Nueva contraseña</label>
            <div class="input-password-wrap">
              <input type="password" id="cfg-pass-new" placeholder="Mínimo 6 caracteres" minlength="6" required />
              <button type="button" class="btn-toggle-password" data-target="cfg-pass-new" aria-label="Mostrar contraseña">
                <i class="ri-eye-line"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="cfg-pass-confirm">Confirmar contraseña</label>
            <div class="input-password-wrap">
              <input type="password" id="cfg-pass-confirm" placeholder="Repite la contraseña" required />
              <button type="button" class="btn-toggle-password" data-target="cfg-pass-confirm" aria-label="Mostrar contraseña">
                <i class="ri-eye-line"></i>
              </button>
            </div>
          </div>
          <div class="settings-msg" id="msg-password"></div>
          <div style="display:flex;justify-content:flex-end;">
            <button type="submit" class="btn-primary btn-sm" id="btn-save-pass">
              <i class="ri-shield-check-line"></i> Cambiar Contraseña
            </button>
          </div>
        </form>
      </section>
      ` : ''}

      <!-- ─── Sesión Activa ─── -->
      <section class="settings-card">
        <div class="settings-card-header">
          <i class="ri-login-box-line"></i>
          <h3>Sesión Activa</h3>
        </div>
        <div class="settings-info-grid">
          <div class="settings-info-item">
            <span class="settings-info-label">Usuario</span>
            <span class="settings-info-value">${escapeHtml(user?.nombre || '—')}</span>
          </div>
          <div class="settings-info-item">
            <span class="settings-info-label">Rol</span>
            <span class="settings-info-value">
              <span class="badge ${rolColor[user?.rol] || 'badge-primary'}">${user?.rol || '—'}</span>
            </span>
          </div>
          <div class="settings-info-item">
            <span class="settings-info-label">Email</span>
            <span class="settings-info-value">${escapeHtml(user?.email || '—')}</span>
          </div>
          <div class="settings-info-item">
            <span class="settings-info-label">Estado</span>
            <span class="settings-info-value">
              <span class="badge badge-success">Activo</span>
            </span>
          </div>
        </div>
        <div style="margin-top:var(--s2);">
          <button class="btn-danger btn-sm" id="btn-logout-cfg" style="width:100%;">
            <i class="ri-logout-box-r-line"></i> Cerrar Sesión
          </button>
        </div>
      </section>

      <!-- ─── Acerca del Sistema ─── -->
      <section class="settings-card">
        <div class="settings-card-header">
          <i class="ri-information-line"></i>
          <h3>Acerca del Sistema</h3>
        </div>
        <div class="settings-info-grid">
          <div class="settings-info-item">
            <span class="settings-info-label">Sistema</span>
            <span class="settings-info-value">GourmetExpress POS</span>
          </div>
          <div class="settings-info-item">
            <span class="settings-info-label">Versión</span>
            <span class="settings-info-value">v${VERSION}</span>
          </div>
          <div class="settings-info-item">
            <span class="settings-info-label">Backend</span>
            <span class="settings-info-value">Node.js + Express</span>
          </div>
          <div class="settings-info-item">
            <span class="settings-info-label">Base de datos</span>
            <span class="settings-info-value">MongoDB + Mongoose</span>
          </div>
          <div class="settings-info-item">
            <span class="settings-info-label">Tiempo real</span>
            <span class="settings-info-value">
              ${window._socket?.connected
                ? '<span class="badge badge-success">Socket.io activo</span>'
                : '<span class="badge" style="background:rgba(255,255,255,0.05);color:var(--text-muted);">Sin conexión WS</span>'
              }
            </span>
          </div>
          <div class="settings-info-item">
            <span class="settings-info-label">Frontend</span>
            <span class="settings-info-value">Vanilla JS + CSS</span>
          </div>
        </div>
      </section>

    </div>
  `;

    setupSettingsHandlers(user);
}

function setupSettingsHandlers(user) {
    // Toggle mostrar/ocultar contraseña
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = this.dataset.target;
            const input    = targetId ? document.getElementById(targetId) : this.previousElementSibling;
            if (!input) return;
            const shown    = input.type === 'text';
            input.type     = shown ? 'password' : 'text';
            const icon     = this.querySelector('i');
            if (icon) icon.className = shown ? 'ri-eye-line' : 'ri-eye-off-line';
        });
    });

    // Cambiar nombre (todos los roles)
    document.getElementById('form-nombre')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn    = document.getElementById('btn-save-nombre');
        const msgEl  = document.getElementById('msg-nombre');
        const nombre = document.getElementById('cfg-new-nombre').value.trim();

        if (!nombre || nombre.length < 2) return;

        btn.disabled  = true;
        btn.innerHTML = '<i class="ri-loader-4-line"></i>';

        try {
            const res = await fetchWithAuth('/auth/profile', {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ nombre }),
            });

            if (res?.status === 'success') {
                const stored = JSON.parse(localStorage.getItem('user') || '{}');
                stored.nombre = res.data.nombre;
                localStorage.setItem('user', JSON.stringify(stored));

                // Actualizar sidebar en vivo
                const nameEl   = document.getElementById('user-name');
                const avatarEl = document.getElementById('user-avatar');
                if (nameEl)   nameEl.textContent   = res.data.nombre;
                if (avatarEl) avatarEl.textContent = res.data.nombre[0].toUpperCase();
                document.getElementById('cfg-name').textContent   = res.data.nombre;
                document.getElementById('cfg-avatar').textContent = res.data.nombre[0].toUpperCase();

                showMsg(msgEl, '✓ Nombre actualizado correctamente', 'success');
            } else {
                showMsg(msgEl, res?.message || 'Error al actualizar', 'error');
            }
        } catch {
            showMsg(msgEl, 'Error de conexión', 'error');
        } finally {
            btn.disabled  = false;
            btn.innerHTML = '<i class="ri-save-line"></i> Guardar';
        }
    });

    // Cambiar contraseña (solo Admin)
    document.getElementById('form-password')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn     = document.getElementById('btn-save-pass');
        const msgEl   = document.getElementById('msg-password');
        const pass    = document.getElementById('cfg-pass-new').value;
        const confirm = document.getElementById('cfg-pass-confirm').value;

        if (pass !== confirm) {
            showMsg(msgEl, 'Las contraseñas no coinciden', 'error');
            return;
        }
        if (pass.length < 6) {
            showMsg(msgEl, 'La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        btn.disabled  = true;
        btn.innerHTML = '<i class="ri-loader-4-line"></i>';

        try {
            const res = await fetchWithAuth('/auth/profile', {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ password: pass }),
            });

            if (res?.status === 'success') {
                document.getElementById('form-password').reset();
                showMsg(msgEl, '✓ Contraseña actualizada correctamente', 'success');
            } else {
                showMsg(msgEl, res?.message || 'Error al cambiar la contraseña', 'error');
            }
        } catch {
            showMsg(msgEl, 'Error de conexión', 'error');
        } finally {
            btn.disabled  = false;
            btn.innerHTML = '<i class="ri-shield-check-line"></i> Cambiar Contraseña';
        }
    });

    // Cerrar sesión
    document.getElementById('btn-logout-cfg')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
}

function showMsg(el, msg, type) {
    if (!el) return;
    el.textContent      = msg;
    el.style.display    = 'block';
    el.style.color      = type === 'success' ? 'var(--success)' : 'var(--danger)';
    el.style.background = type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)';
    el.style.border     = `1px solid ${type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`;
    el.style.padding    = '8px 12px';
    el.style.borderRadius = 'var(--r-md)';
    el.style.fontSize   = 'var(--text-sm)';
    el.style.fontWeight = '500';
    el.style.marginTop  = 'var(--s3)';
    setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
