import sqlite3

class UploadHistoryDAO:
    def __init__(self):
        database_path = 'data.db'
        print("Connecting to SQLite database at:", database_path)
        self.conn = sqlite3.connect(database_path)
        self.conn.execute("PRAGMA foreign_keys = ON")

    def getAllUploadHistory(self):
        cursor = self.conn.cursor()
        query = "SELECT * FROM upload_history;"
        cursor.execute(query)
        result = []
        for row in cursor:
            result.append(row)
        cursor.close()
        return result

    def getUploadHistoryById(self, history_id):
        cursor = self.conn.cursor()
        query = "SELECT * FROM upload_history WHERE history_id = ?;"
        cursor.execute(query, (history_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def addNewUploadHistory(self, design_id, attempt_time, status):
        cursor = self.conn.cursor()
        cursor.execute(
            "INSERT INTO upload_history (design_id, attempt_time, status) VALUES (?, ?, ?);",
            (design_id, attempt_time, status)
        )
        self.conn.commit()
        cursor.execute("SELECT * FROM upload_history ORDER BY history_id DESC LIMIT 1;")
        row = cursor.fetchone()
        cursor.close()
        return row

    def updateUploadHistoryById(self, history_id, data):
        cursor = self.conn.cursor()

        for key, value in data.items():
            query = "UPDATE upload_history SET"
            if key == "design_id":
                query += " design_id = ? WHERE history_id = ?;"
            elif key == "attempt_time":
                query += " attempt_time = ? WHERE history_id = ?;"
            else:
                # The only remaining column is "status"
                query += " status = ? WHERE history_id = ?;"
            cursor.execute(query, (value, history_id))
            self.conn.commit()

        query = "SELECT * FROM upload_history WHERE history_id = ?;"
        cursor.execute(query, (history_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def deleteUploadHistoryById(self, history_id):
        cursor = self.conn.cursor()

        select_query = "SELECT * FROM upload_history WHERE history_id = ?;"
        cursor.execute(select_query, (history_id,))
        record = cursor.fetchone()

        if record is None:
            cursor.close()
            return None
        else:
            query = "DELETE FROM upload_history WHERE history_id = ?;"
            cursor.execute(query, (history_id,))
            self.conn.commit()
            cursor.close()
            return history_id

    def getByUserEmail(self, email):
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT
              uh.history_id,
              uh.design_id,
              uh.attempt_time,
              uh.status,
              d.title,
              d.pixel_data
            FROM upload_history uh
            JOIN design d ON d.design_id = uh.design_id
            JOIN user   u ON u.user_id   = d.user_id
            WHERE u.email = ?
            ORDER BY uh.attempt_time DESC;
        """, (email,))
        rows = cursor.fetchall()
        cursor.close()
        return rows

    def countByUserEmail(self, email):
        cursor = self.conn.cursor()
        cursor.execute("""
                       SELECT COUNT(*)
                       FROM upload_history uh
                                JOIN design d ON d.design_id = uh.design_id
                                JOIN user u ON u.user_id = d.user_id
                       WHERE u.email = ?
                       """, (email,))
        total = cursor.fetchone()[0]
        cursor.close()
        return total

    def getByUserEmailPaginated(self, email, page, page_size):
        offset = (page - 1) * page_size
        cursor = self.conn.cursor()
        cursor.execute(f"""
            SELECT
              uh.history_id,
              uh.design_id,
              uh.attempt_time,
              uh.status,
              d.title,
              d.pixel_data
            FROM upload_history uh
            JOIN design d ON d.design_id = uh.design_id
            JOIN user   u ON u.user_id   = d.user_id
            WHERE u.email = ?
            ORDER BY uh.attempt_time DESC
            LIMIT ? OFFSET ?
        """, (email, page_size, offset))
        rows = cursor.fetchall()
        cursor.close()
        return rows
