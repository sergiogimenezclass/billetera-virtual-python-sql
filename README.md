# TechPay: Flask, SQLite y JavaScript

Esta es la segunda versión educativa de TechPay.

La versión anterior funcionaba únicamente en el navegador con HTML, CSS, JavaScript y `localStorage`. En esta versión se conserva la interfaz visual, pero los datos se gestionan desde un servidor Flask y una base de datos SQLite.

## Objetivo

Aprender a conectar una interfaz creada con HTML, CSS y JavaScript con un backend en Python que persiste información en SQL.

La aplicación permite practicar:

- Rutas de Flask.
- APIs que devuelven JSON.
- Peticiones `GET` y `POST` con `fetch`.
- Consultas `SELECT`, `INSERT` y `UPDATE`.
- Validaciones en el navegador y en el servidor.
- Persistencia con SQLite.
- Separación entre frontend y backend.
- Manejo de errores.

## Tecnologías

- HTML5.
- CSS3.
- JavaScript Vanilla.
- Python 3.
- Flask.
- SQLite.
- `sqlite3`, sin ORM.

## Qué se conserva del frontend

La interfaz mantiene:

- La maqueta responsive.
- La paleta visual.
- Grid para el layout general.
- Flexbox para los componentes.
- Colores escritos directamente, sin variables CSS.
- Medidas en `px` y `%`.
- Comentarios pedagógicos en HTML, CSS y JavaScript.

JavaScript continúa controlando las interacciones visuales:

- Ocultar y mostrar el saldo.
- Abrir y cerrar modales.
- Mostrar notificaciones.
- Copiar el alias.
- Filtrar y buscar movimientos.
- Actualizar el DOM.

## Qué pasó al servidor

Flask y SQLite ahora gestionan:

- Saldo ARS y USD.
- Ingresos.
- Transferencias.
- Contactos.
- Servicios.
- Movimientos.
- Compra de dólares.
- Cotización externa y fallback.

`localStorage` fue eliminado de esta versión. SQLite es la única fuente de persistencia.

## Estructura

```text
billetera-virtual-python-sql/
├── app.py
├── database.py
├── schema.sql
├── seed.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
├── static/
│   ├── styles.css
│   └── app.js
├── assets/
│   └── images/
└── instance/
    └── techpay.db
```

La base `instance/techpay.db` se crea localmente y no se sube al repositorio.

## Instalación

Crear un entorno virtual:

```bash
python3 -m venv .venv
```

Activarlo en Linux o macOS:

```bash
source .venv/bin/activate
```

Instalar Flask:

```bash
pip install -r requirements.txt
```

## Inicializar la base de datos

Crear las tablas:

```bash
flask --app app init-db
```

Cargar los datos de ejemplo:

```bash
python3 seed.py
```

El seed puede ejecutarse más de una vez sin duplicar los datos iniciales.

## Levantar el servidor

Desde la raíz del proyecto:

```bash
flask --app app run --debug
```

Abrir en el navegador:

```text
http://127.0.0.1:5000/
```

## Endpoints actuales

### Estado de la billetera

```text
GET /api/wallet
```

Devuelve saldo, contactos, movimientos y servicios.

### Ingresos

```text
POST /api/transactions/income
```

Recibe:

```json
{
  "amount": 25000,
  "description": "Dinero recibido"
}
```

### Transferencias

```text
POST /api/transactions/transfer
```

Recibe:

```json
{
  "amount": 4500,
  "alias": "camila.ui"
}
```

### Contactos

```text
GET  /api/contacts
POST /api/contacts
```

### Pago de servicios

```text
POST /api/services/<id>/pay
```

### Cotización

```text
GET /api/exchange
```

### Compra de dólares

```text
POST /api/transactions/currency
```

## Baby Steps realizados

1. Servir la maqueta desde Flask.
2. Crear el esquema SQLite.
3. Cargar datos iniciales.
4. Crear el endpoint de estado de la billetera.
5. Crear el endpoint de ingresos.
6. Conectar el formulario de ingresos.
7. Crear y conectar transferencias.
8. Crear y conectar contactos.
9. Crear y conectar pagos de servicios.
10. Crear y conectar la cotización.
11. Crear y conectar la compra de dólares.
12. Retirar `localStorage`.

Cada etapa se desarrolla, prueba y registra por separado. No se implementan varias funcionalidades nuevas en un mismo Baby Step.

## Pruebas manuales

- Abrir la interfaz desde Flask.
- Comprobar que el saldo llegue desde SQLite.
- Registrar un ingreso y recargar la página.
- Realizar una transferencia válida.
- Intentar transferir más dinero que el saldo.
- Crear un contacto.
- Repetir un alias existente.
- Pagar un servicio.
- Intentar pagar dos veces el mismo servicio.
- Comprar dólares con saldo suficiente.
- Intentar comprar dólares sin saldo suficiente.
- Probar la cotización sin conexión.
- Revisar que no haya errores en la consola.

## Comentarios pedagógicos

Los comentarios del código explican conceptos importantes dentro del contexto en que aparecen:

- Flask y las rutas.
- Conexiones y consultas SQLite.
- JSON y respuestas de API.
- `fetch`, `async` y `await`.
- Validaciones del cliente y del servidor.
- Actualización del DOM.
- Diferencia entre estado local y persistencia en una base de datos.

La aplicación es una simulación educativa. No procesa dinero real ni debe utilizarse para guardar información financiera verdadera.
