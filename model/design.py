import sqlite3


class DesignDAO:

    def __init__(self):
        database_path = 'data.db'

        self.conn = sqlite3.connect(database_path)
        self.conn.execute("PRAGMA foreign_keys = ON")

    def get_design_by_id(self, design_id: int):
        cursor = self.conn.cursor()
        query = "SELECT * FROM design WHERE design_id = ?;"
        try:
            cursor.execute(query, (design_id,))
            result = cursor.fetchone()
            return result
        except sqlite3.Error:
            return None
        finally:
            cursor.close()

    def get_designs_by_id(self, user_id: int, page: int, page_size: int):
        cursor = self.conn.cursor()
        query = """
            SELECT d.*, 
                CASE WHEN rq.design_id IS NOT NULL THEN 1 ELSE 0 END AS is_in_queue, 
                CASE WHEN si.design_id IS NOT NULL THEN 1 ELSE 0 END AS is_scheduled 
            FROM design d 
            LEFT JOIN rotation_queue rq ON d.design_id = rq.design_id 
            LEFT JOIN scheduled_items si ON d.design_id = si.design_id 
            WHERE d.user_id = ? 
            GROUP BY d.design_id 
            ORDER BY d.updated_at DESC 
            LIMIT ? OFFSET ?;
            """

        try:
            cursor.execute(query, (user_id, page_size, (page - 1) * page_size))
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            result = [dict(zip(columns, row)) for row in rows]
            return result
        except sqlite3.Error:
            return None
        finally:
            cursor.close()

    def get_user_id(self, design_id: int):
        """
        This so we can verify the user corresponding to the image in a small transaction.
        :param design_id:
        :return:
        """
        cursor = self.conn.cursor()
        query = "SELECT user_id FROM design WHERE design_id = ?;"
        try:
            cursor.execute(query, (design_id,))
            result = cursor.fetchone()
            return result[0] if result else None
        except sqlite3.Error:
            return None
        finally:
            cursor.close()

    def add_new_design(self, user_id, title, pixel_data):
        cursor = self.conn.cursor()
        query = "INSERT INTO design (user_id, title, pixel_data) VALUES (?, ?, ?);"
        try:
            cursor.execute(query, (user_id, title, pixel_data))
            self.conn.commit()
            new_id = cursor.lastrowid
            return new_id
        except sqlite3.IntegrityError:
            return 2
        except sqlite3.Error:
            return 1
        finally:
            cursor.close()

    def update_design_title(self, design_id: int, title: str):
        status = 1
        cursor = self.conn.cursor()
        query = "UPDATE design SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE design_id = ?"

        try:
            cursor.execute(query, (title, design_id))
            self.conn.commit()
            status = 0
        except sqlite3.Error:
            status = 1
        finally:
            cursor.close()
            return status

    def update_design_image(self, design_id: int, pixel_data):
        status = 1
        cursor = self.conn.cursor()
        query = "UPDATE design SET pixel_data = ?, updated_at = CURRENT_TIMESTAMP WHERE design_id = ?"

        try:
            cursor.execute(query, (pixel_data, design_id))
            self.conn.commit()
            status = 0
        except sqlite3.Error:
            status = 1
        finally:
            cursor.close()
            return status

    def update_design_approval(self, design_id: int, is_approved: int):
        status = 1
        cursor = self.conn.cursor()
        query = "UPDATE design SET is_approved = ?, updated_at = CURRENT_TIMESTAMP WHERE design_id = ?"

        try:
            cursor.execute(query, (is_approved, design_id))
            self.conn.commit()
            status = 0
        except sqlite3.Error:
            status = 1
        finally:
            cursor.close()
            return status

    def update_design_status(self, design_id: int, design_status: int):
        status = 1
        cursor = self.conn.cursor()
        query = "UPDATE design SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE design_id = ?"

        try:
            cursor.execute(query, (design_status, design_id))
            self.conn.commit()
            status = 0
        except sqlite3.Error:
            status = 1
        finally:
            cursor.close()
            return status

    def delete_design(self, design_id):
        cursor = self.conn.cursor()
        query = "DELETE FROM design WHERE design_id = ?"

        try:
            cursor.execute(query, (design_id,))
            self.conn.commit()
            if cursor.rowcount == 0:
                return 1  # No row deleted
            return 0
        except sqlite3.Error:
            return 1
        finally:
            cursor.close()

    def getApprovedDesigns(self):
        cursor = self.conn.cursor()
        query = "SELECT * FROM design WHERE is_approved = 1;"
        try:
            cursor.execute(query)
            result = []
            for row in cursor:
                result.append(row)
            return result
        except sqlite3.Error as e:
            return []  # Return an empty list on error
        finally:
            cursor.close()
