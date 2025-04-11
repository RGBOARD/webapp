import sqlite3

class QueueItemDAO:

    def __init__(self):
        database_path = 'data.db'
        print("Connecting to SQLite database at:", database_path)

        self.conn = sqlite3.connect(database_path)
        self.conn.execute("PRAGMA foreign_keys = ON")

    def getAllQueueItem(self):
        cursor = self.conn.cursor()
        query = """
            SELECT * FROM queue_item
            ORDER BY 
              CASE WHEN scheduled = 1 THEN start_time ELSE '9999-12-31 23:59:59' END ASC,
              display_order ASC;
        """
        try:
            cursor.execute(query)
            result = [row for row in cursor]
            return result
        except sqlite3.Error:
            return []
        finally:
            cursor.close()

    def getQueueItemById(self, queue_id):
        cursor = self.conn.cursor()

        query = "select * from queue_item where queue_id = ?;"
        cursor.execute(query, (queue_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def addNewQueueItem(self, design_id, start_time, end_time, display_duration, display_order, scheduled, scheduled_at):

        cursor = self.conn.cursor()
        query = "insert into queue_item (design_id, start_time, end_time, display_duration, display_order, scheduled, scheduled_at) values (?, ?, ?, ?, ?, ?, ?);"
        cursor.execute(query, (design_id, start_time, end_time, display_duration,display_order,scheduled, scheduled_at))
        self.conn.commit()
        query = "select * from queue_item order by queue_id desc limit 1"
        cursor.execute(query)
        result = cursor.fetchone()
        cursor.close()
        return result

    def updateQueueItemById(self, queue_id, data):
        cursor = self.conn.cursor()

        for key, value in data.items():
            query = "update queue_item set"

            if key == "design_id":
                query += " design_id = ? where queue_id = ?;"
            elif key == "start_time":
                query += " start_time = ? where queue_id = ?;"
            elif key == "end_time":
                query += " end_time = ? where queue_id = ?;"
            elif key == "display_duration":
                query += " display_duration = ? where queue_id = ?;"
            elif key == "display_order":
                query += " display_order = ? where queue_id = ?;"
            elif key == "scheduled":
                query += " scheduled = ? where queue_id = ?;"
            else:
                query += " scheduled_at = ? where queue_id = ?;"
            cursor.execute(query, (value,queue_id,))
            self.conn.commit()
        query = "select * from queue_item where queue_id = ?;"
        cursor.execute(query, (queue_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def deleteQueueItemById(self, queue_id):
        cursor = self.conn.cursor()
        select_query = "SELECT * FROM queue_item WHERE queue_id = ?"
        cursor.execute(select_query, (queue_id,))
        queue_item = cursor.fetchone()

        if queue_item is None:
            cursor.close()
            return None
        else:
            query = "delete from queue_item where queue_id = ?;"
            cursor.execute(query, (queue_id,))
            self.conn.commit()
            result = queue_id
            cursor.close()
            return result

    def getScheduledDesigns(self):
        cursor = self.conn.cursor()
        # Join queue_item and design, only returning records where the design is approved.
        query = """
            SELECT q.queue_id,
                   q.design_id,
                   q.start_time,
                   q.end_time,
                   q.display_duration,
                   q.display_order,
                   q.scheduled,
                   q.scheduled_at,
                   d.image,
                   d.is_approved,
                   d.created_at,
                   d.updated_at
            FROM queue_item q
            JOIN design d ON q.design_id = d.design_id
            WHERE d.is_approved = 1
            ORDER BY 
                CASE WHEN q.scheduled = 1 THEN q.start_time ELSE '9999-12-31 23:59:59' END ASC,
                q.display_order ASC;
        """
        try:
            cursor.execute(query)
            result = cursor.fetchall()
            return result
        except sqlite3.Error:
            return []
        finally:
            cursor.close()
