-- La billetera demo tiene un único registro de saldo.
CREATE TABLE IF NOT EXISTS wallet (
    id INTEGER PRIMARY KEY,
    balance_ars REAL NOT NULL DEFAULT 125000.50,
    balance_usd REAL NOT NULL DEFAULT 102.46
);

-- Los contactos reemplazan el array que antes vivía en localStorage.
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    alias TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT 'a4'
);

-- Cada ingreso, egreso o compra de divisas queda registrado aquí.
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Un servicio se marca como pagado sin eliminarse del historial visual.
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date TEXT NOT NULL,
    paid INTEGER NOT NULL DEFAULT 0
);
