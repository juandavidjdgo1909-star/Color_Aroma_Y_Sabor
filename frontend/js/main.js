document.getElementById('toggle-password')?.addEventListener('click', function () {
  const input = document.getElementById('password');
  const icon  = this.querySelector('i');
  const shown = input.type === 'text';
  input.type  = shown ? 'password' : 'text';
  icon.className = shown ? 'ri-eye-line' : 'ri-eye-off-line';
  this.setAttribute('aria-label', shown ? 'Mostrar contraseña' : 'Ocultar contraseña');
});

const form    = document.getElementById("login-form");
const errorEl = document.getElementById("error-msg");
const errorTx = document.getElementById("error-text");
const btnSubmit = document.getElementById("btn-submit");

function showError(msg) {
  if (errorTx) errorTx.textContent = msg;
  errorEl?.classList.add("visible");
}

function hideError() {
  errorEl?.classList.remove("visible");
}

function setLoading(loading) {
  if (!btnSubmit) return;
  btnSubmit.disabled = loading;
  btnSubmit.innerHTML = loading
    ? '<i class="ri-loader-4-line spin"></i> Verificando…'
    : '<span>Acceder al sistema</span><i class="ri-arrow-right-line"></i>';
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();
  setLoading(true);

  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    } else {
      showError(data.message || data.mensaje || "Credenciales incorrectas");
    }
  } catch {
    showError("No se pudo conectar con el servidor");
  } finally {
    setLoading(false);
  }
});
