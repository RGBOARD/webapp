import sqlite3

class DesignDAO:

    def __init__(self):
        database_path = 'data.db'
        print("Connecting to SQLite database at:", database_path)

        self.conn = sqlite3.connect(database_path)

    def getAllDesign(self):
        cursor = self.conn.cursor()
        query = "select * from design;"
        cursor.execute(query)
        result = []
        for row in cursor:
            result.append(row)
        cursor.close()
        return result

    def getDesignById(self, design_id):
        cursor = self.conn.cursor()

        query = "select * from design where design_id = ?;"
        cursor.execute(query, (design_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def addNewDesign(self, user_id, title, image):
        cursor = self.conn.cursor()
        query = "INSERT INTO design (user_id, title, image) VALUES (?, ?, ?);"
        try:
            cursor.execute(query, (user_id, title, image))
            new_id = cursor.lastrowid  # Get the auto-generated design_id
            self.conn.commit()
            return new_id
        except sqlite3.IntegrityError:
            return 2
        except sqlite3.Error:
            return 1
        finally:
            cursor.close()

    def updateDesignById(self, design_id, data):
        cursor = self.conn.cursor()

        for key, value in data.items():
            query = "update design set"

            if key == "user_id":
                query += " user_id = ? where design_id = ?;"
            elif key == "title":
                query += " title = ? where design_id = ?;"
            elif key == "image" and data['image'] is not None:
                query += " image = ? where design_id = ?;"
            elif key == "created_at":
                query += " created_at = ? where design_id = ?;"
            elif key == "is_approved":
                query += " is_approved = ? where design_id = ?;"
            else:
                query += " status = ? where design_id = ?;"
            cursor.execute(query, (value,design_id,))
            self.conn.commit()
        query = "select * from design where design_id = ?;"
        cursor.execute(query, (design_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def deleteDesignById(self, design_id):
        cursor = self.conn.cursor()
        select_query = "SELECT * FROM design WHERE design_id = ?"
        cursor.execute(select_query, (design_id,))
        design = cursor.fetchone()

        if design is None:
            cursor.close()
            return None
        else:
            query = "delete from design where design_id = ?;"
            cursor.execute(query, (design_id,))
            self.conn.commit()
            result = design_id
            cursor.close()
            return result

    def getApprovedDesigns(self):
        cursor = self.conn.cursor()
        query = "SELECT * FROM design WHERE is_approved = 1;"
        cursor.execute(query)
        result = []
        for row in cursor:
            result.append(row)
        cursor.close()
        return result
