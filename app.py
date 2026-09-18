"""Punto de entrada inicial de TechPay.

Esta primera etapa solamente demuestra cómo Flask sirve la maqueta.
La lógica de SQLite y las rutas de la API se incorporarán en los siguientes
Baby Steps, una funcionalidad comprobable por vez.
"""

import sqlite3
from pathlib import Path

from flask import Flask, jsonify, render_template, request

from database import get_db, init_app


app = Flask(__name__)
app.config.from_mapping(
    # instance permite guardar datos locales que no deben versionarse.
    DATABASE=Path(app.instance_path) / "techpay.db"
)
Path(app.instance_path).mkdir(parents=True, exist_ok=True)
init_app(app)


@app.get("/")
def home():
    """Renderiza la pantalla principal de la billetera."""
    return render_template("index.html")


@app.get("/api/wallet")
def wallet_data():
    """Devuelve todos los datos necesarios para pintar el dashboard.

    Una API responde datos, no HTML. JavaScript podrá recibir este JSON
    y decidir cómo actualizar cada componente de la interfaz.
    """
    database = get_db()
    wallet = database.execute(
        "SELECT balance_ars, balance_usd FROM wallet WHERE id = 1"
    ).fetchone()
    contacts = database.execute(
        "SELECT id, name, alias, color FROM contacts ORDER BY id"
    ).fetchall()
    transactions = database.execute(
        """
        SELECT id, type, description, amount, currency, status, created_at
        FROM transactions
        ORDER BY id DESC
        """
    ).fetchall()
    services = database.execute(
        """
        SELECT id, name, amount, due_date, paid
        FROM services
        ORDER BY id
        """
    ).fetchall()

    if wallet is None:
        return jsonify({"error": "La billetera no está inicializada"}), 500

    return jsonify(
        {
            "balanceARS": wallet["balance_ars"],
            "balanceUSD": wallet["balance_usd"],
            "contacts": [dict(contact) for contact in contacts],
            "transactions": [dict(transaction) for transaction in transactions],
            "services": [dict(service) for service in services],
        }
    )


@app.post("/api/transactions/income")
def create_income():
    """Registra un ingreso y actualiza el saldo de la billetera.

    El navegador puede validar rápidamente el formulario, pero el servidor
    siempre debe validar otra vez antes de modificar la base de datos.
    """
    payload = request.get_json(silent=True) or {}

    try:
        amount = float(payload.get("amount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "El importe debe ser un número"}), 400

    if amount <= 0:
        return jsonify({"error": "El importe debe ser mayor que cero"}), 400

    description = str(payload.get("description", "Dinero ingresado")).strip()
    if not description:
        description = "Dinero ingresado"

    database = get_db()
    wallet = database.execute(
        "SELECT balance_ars FROM wallet WHERE id = 1"
    ).fetchone()
    if wallet is None:
        return jsonify({"error": "La billetera no está inicializada"}), 500

    new_balance = wallet["balance_ars"] + amount
    database.execute(
        "UPDATE wallet SET balance_ars = ? WHERE id = 1",
        (new_balance,),
    )
    transaction = database.execute(
        """
        INSERT INTO transactions (type, description, amount, currency)
        VALUES (?, ?, ?, ?)
        """,
        ("income", description, amount, "ARS"),
    )
    database.commit()

    return jsonify(
        {
            "balanceARS": new_balance,
            "transaction": {
                "id": transaction.lastrowid,
                "type": "income",
                "description": description,
                "amount": amount,
                "currency": "ARS",
                "status": "completed",
            },
        }
    ), 201


@app.post("/api/transactions/transfer")
def create_transfer():
    """Registra una transferencia si la billetera tiene saldo suficiente."""
    payload = request.get_json(silent=True) or {}

    try:
        amount = float(payload.get("amount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "El importe debe ser un número"}), 400

    alias = str(payload.get("alias", "")).strip()
    if amount <= 0:
        return jsonify({"error": "El importe debe ser mayor que cero"}), 400
    if not alias:
        return jsonify({"error": "El alias es obligatorio"}), 400

    database = get_db()
    wallet = database.execute(
        "SELECT balance_ars FROM wallet WHERE id = 1"
    ).fetchone()
    if wallet is None:
        return jsonify({"error": "La billetera no está inicializada"}), 500
    if amount > wallet["balance_ars"]:
        return jsonify({"error": "No hay saldo suficiente"}), 400

    new_balance = wallet["balance_ars"] - amount
    description = f"Transferencia a {alias}"
    database.execute(
        "UPDATE wallet SET balance_ars = ? WHERE id = 1",
        (new_balance,),
    )
    transaction = database.execute(
        """
        INSERT INTO transactions (type, description, amount, currency)
        VALUES (?, ?, ?, ?)
        """,
        ("expense", description, amount, "ARS"),
    )
    database.commit()

    return jsonify(
        {
            "balanceARS": new_balance,
            "transaction": {
                "id": transaction.lastrowid,
                "type": "expense",
                "description": description,
                "amount": amount,
                "currency": "ARS",
                "status": "completed",
            },
        }
    ), 201


@app.get("/api/contacts")
def contacts_data():
    """Devuelve los contactos ordenados por el momento en que se crearon."""
    database = get_db()
    contacts = database.execute(
        "SELECT id, name, alias, color FROM contacts ORDER BY id"
    ).fetchall()
    return jsonify({"contacts": [dict(contact) for contact in contacts]})


@app.post("/api/contacts")
def create_contact():
    """Valida y guarda un contacto nuevo en SQLite."""
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    alias = str(payload.get("alias", "")).strip().lower()

    if not name or not alias:
        return jsonify({"error": "El nombre y el alias son obligatorios"}), 400

    database = get_db()
    try:
        contact = database.execute(
            """
            INSERT INTO contacts (name, alias, color)
            VALUES (?, ?, ?)
            RETURNING id, name, alias, color
            """,
            (name, alias, "a4"),
        ).fetchone()
        database.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "Ese alias ya está guardado"}), 409

    return jsonify({"contact": dict(contact)}), 201


@app.post("/api/services/<int:service_id>/pay")
def pay_service(service_id):
    """Paga un servicio y crea su egreso dentro de SQLite."""
    database = get_db()
    service = database.execute(
        "SELECT id, name, amount, paid FROM services WHERE id = ?",
        (service_id,),
    ).fetchone()

    if service is None:
        return jsonify({"error": "El servicio no existe"}), 404
    if service["paid"]:
        return jsonify({"error": "El servicio ya fue pagado"}), 400

    wallet = database.execute(
        "SELECT balance_ars FROM wallet WHERE id = 1"
    ).fetchone()
    if wallet is None:
        return jsonify({"error": "La billetera no está inicializada"}), 500
    if service["amount"] > wallet["balance_ars"]:
        return jsonify({"error": "No hay saldo suficiente"}), 400

    new_balance = wallet["balance_ars"] - service["amount"]
    database.execute(
        "UPDATE wallet SET balance_ars = ? WHERE id = 1",
        (new_balance,),
    )
    database.execute(
        "UPDATE services SET paid = 1 WHERE id = ?",
        (service_id,),
    )
    transaction = database.execute(
        """
        INSERT INTO transactions (type, description, amount, currency)
        VALUES (?, ?, ?, ?)
        """,
        ("expense", f"Pago de {service['name']}", service["amount"], "ARS"),
    )
    database.commit()

    return jsonify(
        {
            "balanceARS": new_balance,
            "service": {"id": service_id, "paid": True},
            "transaction": {
                "id": transaction.lastrowid,
                "type": "expense",
                "description": f"Pago de {service['name']}",
                "amount": service["amount"],
                "currency": "ARS",
                "status": "completed",
            },
        }
    ), 200


if __name__ == "__main__":
    # El modo debug recarga el servidor cuando se modifica el código.
    app.run(debug=True)
