import sqlite3

class UploadHistoryDAO:
    def __init__(self):
        database_path = 'data.db'
        print("Connecting to SQLite database at:", database_path)
        self.conn = sqlite3.connect(database_path)

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

    def addNewUploadHistory(self, design_id, attempt_time, file_size, status):
        cursor = self.conn.cursor()
        query = """
            INSERT INTO upload_history (design_id, attempt_time, file_size, status)
            VALUES (?, ?, ?, ?);
        """
        cursor.execute(query, (design_id, attempt_time, file_size, status))
        self.conn.commit()

        # Return the newly inserted row
        query = "SELECT * FROM upload_history ORDER BY history_id DESC LIMIT 1;"
        cursor.execute(query)
        result = cursor.fetchone()
        cursor.close()
        return result

    def updateUploadHistoryById(self, history_id, data):
        cursor = self.conn.cursor()

        for key, value in data.items():
            query = "UPDATE upload_history SET"
            if key == "design_id":
                query += " design_id = ? WHERE history_id = ?;"
            elif key == "attempt_time":
                query += " attempt_time = ? WHERE history_id = ?;"
            elif key == "file_size":
                query += " file_size = ? WHERE history_id = ?;"
            else:
                # The only remaining column is "status"
                query += " status = ? WHERE history_id = ?;"
            cursor.execute(query, (value, history_id))
            self.conn.commit()

        # Return the updated record
        query = "SELECT * FROM upload_history WHERE history_id = ?;"
        cursor.execute(query, (history_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def deleteUploadHistoryById(self, history_id):
        cursor = self.conn.cursor()

        # Check if record exists
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
