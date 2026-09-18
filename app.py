"""Punto de entrada inicial de TechPay.

Esta primera etapa solamente demuestra cómo Flask sirve la maqueta.
La lógica de SQLite y las rutas de la API se incorporarán en los siguientes
Baby Steps, una funcionalidad comprobable por vez.
"""

from pathlib import Path

from flask import Flask, render_template

from database import init_app


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


if __name__ == "__main__":
    # El modo debug recarga el servidor cuando se modifica el código.
    app.run(debug=True)
