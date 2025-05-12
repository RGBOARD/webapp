import sqlite3
from utilities.database import get_db_connection


class VerificationCodeDAO:

    def add_new_verification_code(self, user_id: int, code: str) -> int:
        status = 1  #
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "INSERT INTO verification_code (user_id, code) VALUES (?, ?);"

        try:
            cursor.execute(query, (user_id, code))
            conn.commit()
            status = 0

        except sqlite3.Error:
            status = 1

        finally:
            cursor.close()
            return status

    def get_verification_code(self, user_id: int) -> str | None:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT code FROM verification_code WHERE user_id = ?;"

        try:
            cursor.execute(query, (user_id,))
            verification_code = cursor.fetchone()
            return verification_code[0]

        except sqlite3.Error:
            return None

        finally:
            cursor.close()

    def get_verification_code_time(self, user_id: int) -> str | None:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT created_at FROM verification_code WHERE user_id = ?;"

        try:
            cursor.execute(query, (user_id,))
            time = cursor.fetchone()
            
            if time is None:
                return None

            return time[0]

        except sqlite3.Error:
            return None

        finally:
            cursor.close()

    def delete_verification_code(self, user_id: int) -> int:
        status = 1
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "DELETE FROM verification_code WHERE user_id = ?;"

        try:
            cursor.execute(query, (user_id,))
            conn.commit()
            status = 0

        except sqlite3.Error:
            status = 1

        finally:
            cursor.close()
            return status
