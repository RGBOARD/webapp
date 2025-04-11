import sqlite3

class AdminActionDAO:

    def __init__(self):
        database_path = 'data.db'
        print("Connecting to SQLite database at:", database_path)
        self.conn = sqlite3.connect(database_path)
        self.conn.execute("PRAGMA foreign_keys = ON")

    def getAllAdminAction(self):
        cursor = self.conn.cursor()
        query = "SELECT * FROM admin_action;"
        cursor.execute(query)
        result = []
        for row in cursor:
            result.append(row)
        cursor.close()
        return result

    def getAdminActionById(self, action_id):
        cursor = self.conn.cursor()
        query = "SELECT * FROM admin_action WHERE action_id = ?;"
        cursor.execute(query, (action_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def addNewAdminAction(self, user_id, target_user_id, target_design_id, target_queue_id,
                          action_type, action_details, timestamp):
        cursor = self.conn.cursor()
        query = """INSERT INTO admin_action 
                   (user_id, target_user_id, target_design_id, target_queue_id, action_type, action_details, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?, ?);"""
        cursor.execute(query, (user_id, target_user_id, target_design_id, target_queue_id,
                               action_type, action_details, timestamp))
        self.conn.commit()

        # Return the newly inserted record
        query = "SELECT * FROM admin_action ORDER BY action_id DESC LIMIT 1;"
        cursor.execute(query)
        result = cursor.fetchone()
        cursor.close()
        return result

    def updateAdminActionById(self, action_id, data):
        cursor = self.conn.cursor()

        for key, value in data.items():
            query = "UPDATE admin_action SET"
            if key == "user_id":
                query += " user_id = ? WHERE action_id = ?;"
            elif key == "target_user_id":
                query += " target_user_id = ? WHERE action_id = ?;"
            elif key == "target_design_id":
                query += " target_design_id = ? WHERE action_id = ?;"
            elif key == "target_queue_id":
                query += " target_queue_id = ? WHERE action_id = ?;"
            elif key == "action_type":
                query += " action_type = ? WHERE action_id = ?;"
            elif key == "action_details":
                query += " action_details = ? WHERE action_id = ?;"
            else:  # timestamp
                query += " timestamp = ? WHERE action_id = ?;"

            cursor.execute(query, (value, action_id))
            self.conn.commit()

        # Return the updated record
        query = "SELECT * FROM admin_action WHERE action_id = ?;"
        cursor.execute(query, (action_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def deleteAdminActionById(self, action_id):
        cursor = self.conn.cursor()

        # Check if record exists
        select_query = "SELECT * FROM admin_action WHERE action_id = ?;"
        cursor.execute(select_query, (action_id,))
        record = cursor.fetchone()

        if record is None:
            cursor.close()
            return None
        else:
            query = "DELETE FROM admin_action WHERE action_id = ?;"
            cursor.execute(query, (action_id,))
            self.conn.commit()
            cursor.close()
            return action_id
