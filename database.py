"""Funciones pequeñas para trabajar con la base de datos SQLite."""

import sqlite3

from flask import current_app, g


def get_db():
    """Devuelve una conexión reutilizable durante la petición actual.

    Flask guarda la conexión en ``g`` y así no abrimos una conexión nueva
    cada vez que una función necesita consultar la base de datos.
    """
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(error=None):
    """Cierra la conexión al finalizar la petición, exista o no un error."""
    database = g.pop("db", None)
    if database is not None:
        database.close()


def init_db():
    """Crea las tablas leyendo las instrucciones del archivo schema.sql."""
    database = get_db()
    with current_app.open_resource("schema.sql") as schema_file:
        database.executescript(schema_file.read().decode("utf-8"))
    database.commit()


def init_app(app):
    """Conecta las funciones de SQLite al ciclo de vida de Flask."""
    app.teardown_appcontext(close_db)

    @app.cli.command("init-db")
    def init_database_command():
        """Comando: flask --app app init-db."""
        init_db()
        print("Base de datos inicializada.")
