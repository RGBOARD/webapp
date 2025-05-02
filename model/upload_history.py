import sqlite3

class UploadHistoryDAO:
    def __init__(self):
        database_path = 'data.db'
        print("Connecting to SQLite database at:", database_path)
        try:
            self.conn = sqlite3.connect(database_path)
            self.conn.execute("PRAGMA foreign_keys = ON")
        except sqlite3.Error as e:
            print(f"Database connection error: {e}")
            raise

    def getAllUploadHistory(self):
        cursor = None
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT * FROM upload_history;")
            return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"Error fetching all upload history: {e}")
            raise
        finally:
            if cursor:
                cursor.close()

    def getUploadHistoryById(self, history_id):
        cursor = None
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT * FROM upload_history WHERE history_id = ?;", (history_id,))
            return cursor.fetchone()
        except sqlite3.Error as e:
            print(f"Error fetching upload history by ID {history_id}: {e}")
            raise
        finally:
            if cursor:
                cursor.close()

    def addNewUploadHistory(self, design_id, attempt_time, status):
        cursor = None
        try:
            cursor = self.conn.cursor()
            cursor.execute(
                "INSERT INTO upload_history (design_id, attempt_time, status) VALUES (?, ?, ?);",
                (design_id, attempt_time, status)
            )
            self.conn.commit()
            cursor.execute("SELECT * FROM upload_history ORDER BY history_id DESC LIMIT 1;")
            return cursor.fetchone()
        except sqlite3.Error as e:
            print(f"Error adding new upload history: {e}")
            self.conn.rollback()
            raise
        finally:
            if cursor:
                cursor.close()

    def updateUploadHistoryById(self, history_id, data):
        cursor = None
        try:
            cursor = self.conn.cursor()
            for key, value in data.items():
                if key == "design_id":
                    query = "UPDATE upload_history SET design_id = ? WHERE history_id = ?;"
                elif key == "attempt_time":
                    query = "UPDATE upload_history SET attempt_time = ? WHERE history_id = ?;"
                else:
                    query = "UPDATE upload_history SET status = ? WHERE history_id = ?;"
                cursor.execute(query, (value, history_id))
            self.conn.commit()
            cursor.execute("SELECT * FROM upload_history WHERE history_id = ?;", (history_id,))
            return cursor.fetchone()
        except sqlite3.Error as e:
            print(f"Error updating upload history ID {history_id}: {e}")
            self.conn.rollback()
            raise
        finally:
            if cursor:
                cursor.close()

    def deleteUploadHistoryById(self, history_id):
        cursor = None
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT * FROM upload_history WHERE history_id = ?;", (history_id,))
            record = cursor.fetchone()
            if not record:
                return None
            cursor.execute("DELETE FROM upload_history WHERE history_id = ?;", (history_id,))
            self.conn.commit()
            return history_id
        except sqlite3.Error as e:
            print(f"Error deleting upload history ID {history_id}: {e}")
            self.conn.rollback()
            raise
        finally:
            if cursor:
                cursor.close()

    def getByUserEmail(self, email):
        cursor = None
        try:
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
            return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"Error fetching upload history for user {email}: {e}")
            raise
        finally:
            if cursor:
                cursor.close()

    def countByUserEmail(self, email):
        cursor = None
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                           SELECT COUNT(*)
                           FROM upload_history uh
                                    JOIN design d ON d.design_id = uh.design_id
                                    JOIN user u ON u.user_id = d.user_id
                           WHERE u.email = ?
                           """, (email,))
            return cursor.fetchone()[0]
        except sqlite3.Error as e:
            print(f"Error counting upload history for user {email}: {e}")
            raise
        finally:
            if cursor:
                cursor.close()

    def getByUserEmailPaginated(self, email, page, page_size):
        cursor = None
        offset = (page - 1) * page_size
        try:
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
                ORDER BY uh.attempt_time DESC
                LIMIT ? OFFSET ?
            """, (email, page_size, offset))
            return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"Error fetching paginated upload history for user {email}: {e}")
            raise
        finally:
            if cursor:
                cursor.close()
