import sqlite3
from flask import g, current_app

def get_db_path():
    """
    Get the database path from the application config or use default.
    """
    if current_app and 'DATABASE_PATH' in current_app.config:
        return current_app.config['DATABASE_PATH']
    return 'data.db'

def get_db_connection():
    """
    Create a new database connection if there is none yet for the
    current application context.
    """
    if 'db_conn' not in g:
        g.db_conn = sqlite3.connect(get_db_path())
        g.db_conn.row_factory = sqlite3.Row
        g.db_conn.execute("PRAGMA foreign_keys = ON")
        g.db_conn.execute("PRAGMA busy_timeout = 5000;")
    return g.db_conn

def close_db(e=None):
    """
    If this request has a database connection, close it.
    """
    db_conn = g.pop('db_conn', None)
    if db_conn is not None:
        db_conn.close()

def init_db(app):
    """
    Register database functions with the Flask app.
    """
    app.teardown_appcontext(close_db)