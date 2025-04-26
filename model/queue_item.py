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

    def addNewQueueItem(self, design_id, start_time, end_time, display_duration,scheduled, scheduled_at):

        cursor = self.conn.cursor()

        count_query = """ SELECT COUNT(*) FROM queue_item"""
        cursor.execute(count_query)
        items = cursor.fetchone()[0]
        display_order = items + 1

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
        return

    def update_item_order(self, queue_id: int, new_order: int):
        status = 1
        query = None
        cursor = self.conn.cursor()
        old_order = self.getQueueItemById(queue_id)[5]
        if new_order < old_order:
            query = "UPDATE queue_item SET display_order = display_order + 1 WHERE display_order >= ? AND display_order < ?"
        elif new_order > old_order:
            query = "UPDATE queue_item SET display_order = display_order - 1 WHERE display_order <= ? AND display_order > ?"
        try:
            if query:
                cursor.execute(query, (new_order, old_order))
            shift = "UPDATE queue_item SET display_order = ? WHERE queue_id = ?"
            cursor.execute(shift,(new_order, queue_id))
            self.conn.commit()
            status = 0
        except sqlite3.Error:
            status = 1
        finally:
            cursor.close()
            return status

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
            status = 0
            try:
                cursor.execute(query, (queue_id,))

                query = "SELECT queue_id FROM queue_item ORDER BY display_order ASC"

                cursor.execute(query)
                items = cursor.fetchall()

                for index, item in enumerate(items):
                    query = "UPDATE queue_item SET display_order = ? WHERE queue_id = ?"
                    cursor.execute(query, (index + 1, item[0]))

                self.conn.commit()
            except sqlite3.Error:
                status = 1

            finally:
                cursor.close()
                return status

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
                   d.pixel_data,
                   d.is_approved,
                   d.created_at,
                   d.updated_at
            FROM queue_item q
            JOIN design d ON q.design_id = d.design_id
            WHERE d.is_approved = 1 AND q.scheduled = 1 
            AND strftime('%Y-%m-%d %H:%M:%S', q.start_time) <= strftime('%Y-%m-%d %H:%M:%S', 'now')
            AND strftime('%Y-%m-%d %H:%M:%S', q.end_time)   >= strftime('%Y-%m-%d %H:%M:%S', 'now')
            ORDER BY q.display_order ASC;
        """
        try:
            cursor.execute(query)
            result = cursor.fetchall()
            return result
        except sqlite3.Error:
            return []
        finally:
            cursor.close()

    def get_all_items_paginated(self, page, page_size):
        cursor = self.conn.cursor()
        offset = (page - 1) * page_size

        try:
            query = """
            SELECT q.queue_id,
                   q.design_id,
                   q.start_time,
                   q.display_order,
                   q.scheduled,                  
                   q.scheduled_at,
                   d.pixel_data,
                   d.title,
                   d.is_approved
            FROM queue_item q
            JOIN design d ON q.design_id = d.design_id
            ORDER BY q.display_order ASC
            LIMIT ? OFFSET ?;
            """
            cursor.execute(query, (page_size, offset))
            queue = cursor.fetchall()

            columns = [column[0] for column in cursor.description]
            queue_items = [dict(zip(columns, design)) for design in queue]

            count_query = """
            SELECT COUNT(*) 
            FROM queue_item q
            JOIN design d ON q.design_id = d.design_id
            """
            cursor.execute(count_query)
            total_items = cursor.fetchone()[0]

            total_pages = (total_items + page_size - 1) // page_size
            cursor.close()
            return {
                "success": True,
                "queue": queue_items,
                "total": total_items,
                "pages": total_pages,
                "page": page
            }
        except Exception as e:
            cursor.close()
            print("Error during database operation:", str(e))
            return {
                "success": False,
                "error": str(e)
            }