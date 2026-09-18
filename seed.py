"""Carga datos demo para poder probar TechPay desde el primer arranque."""

from app import app
from database import get_db, init_db


def seed_database():
    """Inserta datos iniciales solamente cuando cada tabla está vacía."""
    init_db()
    database = get_db()

    # El saldo usa un registro fijo porque esta versión todavía no tiene usuarios.
    wallet_exists = database.execute("SELECT id FROM wallet WHERE id = 1").fetchone()
    if wallet_exists is None:
        database.execute(
            "INSERT INTO wallet (id, balance_ars, balance_usd) VALUES (?, ?, ?)",
            (1, 125000.50, 102.46),
        )

    contacts_exist = database.execute("SELECT COUNT(*) AS total FROM contacts").fetchone()["total"]
    if contacts_exist == 0:
        database.executemany(
            "INSERT INTO contacts (name, alias, color) VALUES (?, ?, ?)",
            [
                ("Lucas", "lucas.dev", "a1"),
                ("Camila", "camila.ui", "a2"),
                ("Mateo", "mateo.design", "a3"),
                ("Sofía", "sofia.crea", "a4"),
            ],
        )

    transactions_exist = database.execute("SELECT COUNT(*) AS total FROM transactions").fetchone()["total"]
    if transactions_exist == 0:
        database.executemany(
            """
            INSERT INTO transactions (type, description, amount, currency)
            VALUES (?, ?, ?, ?)
            """,
            [
                ("expense", "Transferencia a Camila", 4500, "ARS"),
                ("income", "Dinero recibido", 25000, "ARS"),
                ("currency", "Compra de dólares", 50, "USD"),
            ],
        )

    services_exist = database.execute("SELECT COUNT(*) AS total FROM services").fetchone()["total"]
    if services_exist == 0:
        database.executemany(
            "INSERT INTO services (name, amount, due_date) VALUES (?, ?, ?)",
            [
                ("Energía Sur", 18500, "22 Sep"),
                ("FibraNet", 12400, "25 Sep"),
                ("Celular Móvil", 8900, "28 Sep"),
            ],
        )

    database.commit()


if __name__ == "__main__":
    with app.app_context():
        seed_database()
        print("Datos demo cargados.")
