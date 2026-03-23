# GourmetExpress — Sistema de Gestión de Restaurante

> Plataforma web full-stack para la gestión operativa de restaurantes en tiempo real: pedidos, inventario, menú, cocina y usuarios desde un solo lugar.

---

## El problema que resuelve

Los restaurantes medianos y pequeños suelen coordinar su operación con papel, pizarras o apps fragmentadas que no se comunican entre sí. Esto genera:

- **Pedidos perdidos o duplicados** al no existir un canal directo entre sala y cocina.
- **Descontrol de inventario**: se acaban ingredientes sin aviso previo, interrumpiendo el servicio.
- **Falta de visibilidad** para el administrador sobre ventas, ocupación y rendimiento en tiempo real.
- **Errores humanos** al transcribir pedidos de forma manual.

**GourmetExpress** centraliza toda la operación en una SPA (Single Page Application) donde cada actor (Administrador, Mesero, Chef) ve solo lo que necesita y recibe actualizaciones instantáneas sin recargar la página.

---

## Funcionalidades

### Por rol

| Módulo | Admin | Mesero | Chef |
|---|:---:|:---:|:---:|
| Dashboard con estadísticas | ✅ | — | — |
| Gestión de menú | ✅ | — | — |
| Tomar pedidos por mesa | — | ✅ | — |
| Ver y actualizar pedidos | ✅ | ✅ | ✅ |
| Gestión de inventario | ✅ | — | — |
| Gestión de usuarios | ✅ | — | — |
| Alertas en tiempo real | ✅ | ✅ | ✅ |

### Características técnicas destacadas

- **Tiempo real con Socket.IO**: El Chef recibe notificaciones instantáneas cuando llega un nuevo pedido. El Mesero recibe alerta cuando el Chef marca un pedido como *Listo*.
- **Control de stock automático**: Al crear un pedido, el sistema descuenta los ingredientes del inventario y bloquea el plato si los insumos son insuficientes.
- **Propina incluida automáticamente**: El total de cada pedido incluye un 10 % de propina calculada al momento de la orden.
- **Alertas de inventario bajo**: El Admin recibe un badge con el número de ingredientes que están en o por debajo del stock mínimo configurado.
- **Control de acceso por rol**: Cada endpoint de la API verifica el token JWT y el rol del usuario antes de procesar la petición.
- **Modo oscuro / claro**: El tema persiste en `localStorage` y se aplica antes de pintar la página para evitar parpadeo.
- **Diseño responsive**: La interfaz se adapta a tablet y móvil, colapsando el sidebar en pantallas pequeñas.

---

## Flujo operativo típico

```
Mesero                Chef                 Admin
  │                     │                    │
  ├─ Selecciona mesa     │                    │
  ├─ Agrega platos       │                    │
  ├─ Confirma pedido ───►│ 🔔 Alerta nueva    │
  │                      │   orden            │
  │                      ├─ Cambia estado     │
  │                      │   "Preparando"     │
  │                      ├─ Cambia estado     │
  │ 🔔 "Listo" ◄────────┤   "Listo"          │
  ├─ Entrega a mesa      │                    │
  └─ Marca "Entregado"   └────────────────────┤
                                              ├─ Ve ventas del día
                                              ├─ Revisa inventario
                                              └─ Gestiona usuarios
```

---

## Stack tecnológico

### Backend
| Tecnología | Uso |
|---|---|
| Node.js + ES Modules | Entorno de ejecución |
| Express 5 | Framework HTTP y API REST |
| MongoDB + Mongoose | Base de datos y ODM |
| Socket.IO 4 | Comunicación bidireccional en tiempo real |
| JSON Web Token | Autenticación stateless |
| bcryptjs | Hash seguro de contraseñas |
| express-validator | Validación de entradas |
| morgan | Logging de peticiones HTTP |
| dotenv | Variables de entorno |

### Frontend
| Tecnología | Uso |
|---|---|
| HTML + CSS + JavaScript | Sin frameworks — Vanilla JS con ES Modules |
| CSS Custom Properties | Sistema de tokens de diseño (colores, espaciado, tipografía) |
| Socket.IO Client | Actualizaciones en tiempo real |
| Remix Icon | Librería de iconos |

---

## Estructura del proyecto

```
resto-oder-pro/
├── server.js                  # Punto de entrada: HTTP + Socket.IO
├── package.json
├── .env                       # Variables de entorno (no incluido en git)
│
├── src/
│   ├── app.js                 # Configuración de Express y rutas
│   ├── config/
│   │   └── db.js              # Conexión a MongoDB
│   ├── controllers/           # Lógica de peticiones HTTP
│   │   ├── authController.js
│   │   ├── menuController.js
│   │   ├── orderController.js
│   │   ├── inventoryController.js
│   │   ├── statsController.js
│   │   └── userController.js
│   ├── services/              # Lógica de negocio
│   │   ├── authService.js
│   │   ├── orderService.js    # Validación de stock + cálculo de totales
│   │   └── statsService.js
│   ├── models/                # Esquemas de Mongoose
│   │   ├── user.js
│   │   ├── menuItem.js
│   │   ├── order.js
│   │   └── ingredient.js
│   ├── routes/                # Definición de endpoints
│   │   ├── authRoutes.js
│   │   ├── menuRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── statsRoutes.js
│   │   └── userRoutes.js
│   └── middlewares/
│       ├── authMiddleware.js  # Verificación JWT
│       ├── roleMiddleware.js  # Control de acceso por rol
│       ├── validate.js        # Manejo de errores de validación
│       └── logger.js          # Logger de peticiones personalizado
│
└── frontend/
    ├── index.html             # Página de login
    ├── dashboard.html         # Shell del dashboard (SPA)
    ├── css/
    │   ├── main.css           # Variables globales e imports
    │   └── layouts/
    │       ├── _login.css
    │       └── _dashboard.css
    └── js/
        ├── auth-guard.js      # Protección de rutas frontend
        ├── router.js          # Router de vistas (SPA)
        ├── layout.js          # Navbar, sidebar, tema, notificaciones
        └── view/              # Vistas por rol
            ├── dashboardAdmin.js
            ├── admin.js
            ├── mesero.js
            ├── chef.js
            ├── menuAdmin.js
            ├── ordersAdmin.js
            ├── usersAdmin.js
            └── settings.js
```

---

## Endpoints de la API

### Autenticación
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registrar usuario | Público |
| `POST` | `/api/auth/login` | Iniciar sesión → devuelve JWT | Público |

### Menú
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/menu` | Listar platos | Todos |
| `POST` | `/api/menu` | Crear plato | Admin |
| `PATCH` | `/api/menu/:id` | Actualizar plato | Admin |
| `DELETE` | `/api/menu/:id` | Eliminar plato | Admin |

### Pedidos
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/order` | Listar todos los pedidos | Todos |
| `POST` | `/api/order` | Crear pedido (descuenta stock) | Mesero |
| `PATCH` | `/api/order/:id` | Actualizar estado | Chef, Mesero |

### Inventario
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/inventory` | Listar ingredientes | Admin |
| `POST` | `/api/inventory` | Agregar ingrediente | Admin |
| `PATCH` | `/api/inventory/:id` | Actualizar stock | Admin |
| `DELETE` | `/api/inventory/:id` | Eliminar ingrediente | Admin |

### Usuarios
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/users` | Listar usuarios | Admin |
| `POST` | `/api/users` | Crear usuario | Admin |
| `PATCH` | `/api/users/:id` | Editar usuario | Admin |
| `DELETE` | `/api/users/:id` | Eliminar usuario | Admin |

### Estadísticas
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/stats` | Resumen del día | Admin |

---

## Instalación y puesta en marcha

### Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [MongoDB](https://www.mongodb.com/) local o una cadena de conexión de [MongoDB Atlas](https://cloud.mongodb.com/)
- npm (incluido con Node.js)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/gourmet-express.git
cd gourmet-express
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Cadena de conexión a MongoDB
MONGO_URI=mongodb://localhost:27017/gourmetexpress

# Secreto para firmar los JWT (usa una cadena larga y aleatoria)
JWT_SECRET=tu_secreto_super_seguro_aqui

# Puerto del servidor (opcional, por defecto 3000)
PORT=3000

# URL del frontend para CORS (en desarrollo puedes usar *)
FRONTEND_URL=*
```

> **Atlas (nube):** Reemplaza `MONGO_URI` con la cadena que te proporciona MongoDB Atlas, por ejemplo:
> `MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/gourmetexpress`

### 4. Poblar la base de datos con usuarios iniciales

Ejecuta el script de seed para crear los tres usuarios predeterminados (uno por rol):

```bash
npm run seed
```

Esto creará los siguientes usuarios (solo si no existen):

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@gourmetexpress.com | admin123 |
| Chef | chef@gourmetexpress.com | chef123 |
| Mesero | mesero@gourmetexpress.com | mesero123 |

> El seed es **idempotente**: puedes ejecutarlo varias veces sin duplicar usuarios. Si un usuario ya existe, lo omite.

> **En producción**, cambia las contraseñas desde el panel de Usuarios una vez que hayas iniciado sesión como Admin.

### 5. Ejecutar el servidor

**Modo desarrollo** (reinicia automáticamente al guardar cambios):
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

### 6. Acceder a la aplicación

Abre tu navegador en:

```
http://localhost:3000
```

Inicia sesión con cualquiera de las credenciales del paso 4 según el rol que quieras probar. Desde el panel de **Usuarios** (rol Admin) puedes crear, editar y eliminar cuentas.

---

## Estados de un pedido

```
Pendiente → Preparando → Listo → Entregado
                              ↘
                           Cancelado
```

| Estado | Quién lo asigna |
|---|---|
| `Pendiente` | Automático al crear el pedido |
| `Preparando` | Chef |
| `Listo` | Chef (notifica al Mesero) |
| `Entregado` | Mesero |
| `Cancelado` | Chef o Mesero |

---

## Eventos de Socket.IO

| Evento | Dirección | Consumidor | Cuándo se emite |
|---|---|---|---|
| `join-role` | Cliente → Servidor | — | Al conectar, para unirse a la sala del rol |
| `new-order` | Servidor → Chef | Chef | Mesero crea un nuevo pedido |
| `order-updated` | Servidor → Chef, Mesero, Admin | Todos | Cualquier cambio de estado en un pedido |

---

## Licencia

ISC — libre para uso educativo y personal.
