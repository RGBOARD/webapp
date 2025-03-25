import sqlite3

class DisplayPanelDAO:
    def __init__(self):
        database_path = 'data.db'
        print("Connecting to SQLite database at:", database_path)
        self.conn = sqlite3.connect(database_path)

    def getAllDisplayPanel(self):
        cursor = self.conn.cursor()
        query = "SELECT * FROM display_panel;"
        cursor.execute(query)
        result = []
        for row in cursor:
            result.append(row)
        cursor.close()
        return result

    def getDisplayPanelById(self, panel_id):
        cursor = self.conn.cursor()
        query = "SELECT * FROM display_panel WHERE panel_id = ?;"
        cursor.execute(query, (panel_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def addNewDisplayPanel(self, location, status):
        cursor = self.conn.cursor()
        query = "INSERT INTO display_panel (location, status) VALUES (?, ?);"
        cursor.execute(query, (location, status))
        self.conn.commit()

        # Retrieve the newly inserted row
        query = "SELECT * FROM display_panel ORDER BY panel_id DESC LIMIT 1;"
        cursor.execute(query)
        result = cursor.fetchone()
        cursor.close()
        return result

    def updateDisplayPanelById(self, panel_id, data):
        cursor = self.conn.cursor()

        for key, value in data.items():
            query = "UPDATE display_panel SET"
            if key == "location":
                query += " location = ? WHERE panel_id = ?;"
            else:
                # The only other column in this table is 'status'
                # If you added more columns, you'd add more conditions here
                query += " status = ? WHERE panel_id = ?;"

            cursor.execute(query, (value, panel_id))
            self.conn.commit()

        # Return the updated record
        query = "SELECT * FROM display_panel WHERE panel_id = ?;"
        cursor.execute(query, (panel_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def deleteDisplayPanelById(self, panel_id):
        cursor = self.conn.cursor()

        # Check if the record exists
        select_query = "SELECT * FROM display_panel WHERE panel_id = ?;"
        cursor.execute(select_query, (panel_id,))
        record = cursor.fetchone()

        if record is None:
            cursor.close()
            return None
        else:
            query = "DELETE FROM display_panel WHERE panel_id = ?;"
            cursor.execute(query, (panel_id,))
            self.conn.commit()
            cursor.close()
            return panel_id
