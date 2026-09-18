"""Punto de entrada inicial de TechPay.

Esta primera etapa solamente demuestra cómo Flask sirve la maqueta.
La lógica de SQLite y las rutas de la API se incorporarán en los siguientes
Baby Steps, una funcionalidad comprobable por vez.
"""

from flask import Flask, render_template


# Flask busca las plantillas HTML dentro de la carpeta templates.
app = Flask(__name__)


@app.get("/")
def home():
    """Renderiza la pantalla principal de la billetera."""
    return render_template("index.html")


if __name__ == "__main__":
    # El modo debug recarga el servidor cuando se modifica el código.
    app.run(debug=True)
