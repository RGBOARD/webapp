import sqlite3
from utilities.database import get_db_connection


class TempPasswordDAO:

    def add_temp_password(self, user_id, temp_password):
        status = 1
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "INSERT INTO  temp_password (user_id, temp_password) VALUES (?, ?);"
        try:
            cursor.execute(query, (user_id, temp_password))
            conn.commit()
            status = 0
        except sqlite3.Error:
            status = 1
        finally:
            cursor.close()
            return status

    def get_temp_password(self, user_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT temp_password FROM temp_password WHERE user_id = ?;"
        try:
            cursor.execute(query, (user_id,))
            row = cursor.fetchone()
            return row[0] if row else None
        except sqlite3.Error:
            return None
        finally:
            cursor.close()

    def get_password_timestamp(self, user_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT created_at FROM temp_password WHERE user_id = ?;"
        try:
            cursor.execute(query, (user_id,))
            row = cursor.fetchone()
            return row[0] if row else None
        except sqlite3.Error:
            return None
        finally:
            cursor.close()

    def delete_temp_password(self, user_id):
        status = 1
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "DELETE FROM temp_password WHERE user_id = ?;"
        try:
            cursor.execute(query, (user_id,))
            conn.commit()
            status = 0
        except sqlite3.Error:
            status = 1
        finally:
            cursor.close()
            return status
