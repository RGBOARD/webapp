import sqlite3


class VerificationCodeDAO:
    def __init__(self):
        database_path = 'data.db'
        self.conn = sqlite3.connect(database_path)

    def add_new_verification_code(self, user_id: int, code: str) -> int:
        status = 1 #
        cursor = self.conn.cursor()
        query = "INSERT INTO verification_code (user_id, code) VALUES (?, ?);"

        try:
            cursor.execute(query, (user_id, code))
            self.conn.commit()
            status = 0

        except sqlite3.Error:
            status = 1

        finally:
            cursor.close()
            return status

    def get_verification_code(self, user_id: int) -> str | None:
        cursor = self.conn.cursor()
        query = "SELECT code FROM verification_code WHERE user_id = ?;"

        try:
            cursor.execute(query, (user_id,))
            verification_code = cursor.fetchone()
            return verification_code[0]

        except sqlite3.Error:
            return None

        finally:
            cursor.close()

