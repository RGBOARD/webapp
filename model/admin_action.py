from utilities.database import get_db_connection

class AdminActionDAO:

    def getAllAdminAction(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM admin_action;"
        cursor.execute(query)
        result = []
        for row in cursor:
            result.append(row)
        cursor.close()
        return result

    def getAdminActionById(self, action_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM admin_action WHERE action_id = ?;"
        cursor.execute(query, (action_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def addNewAdminAction(self, user_id, target_user_id, target_design_id, target_queue_id,
                          action_type, action_details, timestamp):
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """INSERT INTO admin_action 
                   (user_id, target_user_id, target_design_id, target_queue_id, action_type, action_details, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?, ?);"""
        cursor.execute(query, (user_id, target_user_id, target_design_id, target_queue_id,
                               action_type, action_details, timestamp))
        conn.commit()

        # Return the newly inserted record
        query = "SELECT * FROM admin_action ORDER BY action_id DESC LIMIT 1;"
        cursor.execute(query)
        result = cursor.fetchone()
        cursor.close()
        return result

    def updateAdminActionById(self, action_id, data):
        conn = get_db_connection()
        cursor = conn.cursor()

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
            conn.commit()

        # Return the updated record
        query = "SELECT * FROM admin_action WHERE action_id = ?;"
        cursor.execute(query, (action_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def deleteAdminActionById(self, action_id):
        conn = get_db_connection()
        cursor = conn.cursor()

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
            conn.commit()
            cursor.close()
            return action_id
