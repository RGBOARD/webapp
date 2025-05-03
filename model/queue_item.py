import datetime
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
        
        try:
            # Get current display_order of the target item
            cursor.execute("SELECT display_order FROM queue_item WHERE queue_id = ?", (queue_id,))
            old_order = cursor.fetchone()[0]
            
            # Only reorder among active items
            if new_order < old_order:
                query = """
                    UPDATE queue_item 
                    SET display_order = display_order + 1 
                    WHERE is_active = 1 
                    AND display_order >= ? AND display_order < ?
                """
            elif new_order > old_order:
                query = """
                    UPDATE queue_item 
                    SET display_order = display_order - 1 
                    WHERE is_active = 1
                    AND display_order <= ? AND display_order > ?
                """
                
            if query:
                cursor.execute(query, (new_order, old_order))
                
            # Update the target item's display_order
            shift = "UPDATE queue_item SET display_order = ? WHERE queue_id = ?"
            cursor.execute(shift, (new_order, queue_id))
            
            self.conn.commit()
            status = 0
        except sqlite3.Error as e:
            print(f"Database error: {e}")
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
            WHERE d.is_approved = 1
            AND q.is_active = 1
            ORDER BY
                q.scheduled ASC,
                q.display_order ASC
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
            WHERE q.is_active = 1
            ORDER BY
                q.scheduled ASC,
                CASE 
                    WHEN q.scheduled = 0 THEN q.scheduled_at 
                    ELSE q.start_time 
                END ASC,
                q.display_order ASC
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
    
    def updateActiveItems(self):
        try:
            cursor = self.conn.cursor()

            # First, update which items are active
            active_update_query = """
            UPDATE queue_item
            SET is_active = (
                (scheduled = 1 AND strftime('%Y-%m-%d %H:%M:%S', end_time) >= strftime('%Y-%m-%d %H:%M:%S', 'now'))
                OR
                (scheduled = 0 AND strftime('%Y-%m-%d %H:%M:%S', 'now') >= strftime('%Y-%m-%d %H:%M:%S', scheduled_at) AND scheduled_at IS NOT NULL)
            ),
            updated_at = datetime('now')
            """
            cursor.execute(active_update_query)

            # Then reindex display_order for active items
            reindex_query = """
            WITH ranked AS (
                SELECT
                    queue_id,
                    ROW_NUMBER() OVER (
                        ORDER BY 
                            scheduled ASC,  -- Unscheduled first (0 then 1)
                            CASE 
                                WHEN scheduled = 1 THEN start_time  -- Scheduled items sorted by start_time
                                ELSE scheduled_at  -- Unscheduled items sorted by scheduled_at
                            END ASC,
                            display_order ASC  -- Secondary sort by display_order
                    ) as new_order
                FROM queue_item
                WHERE is_active = 1
            )
            UPDATE queue_item
            SET display_order = (
                SELECT new_order
                FROM ranked
                WHERE ranked.queue_id = queue_item.queue_id
            )
            WHERE is_active = 1
            """
            cursor.execute(reindex_query)
            self.conn.commit()
            print(f"Active items updated at {datetime.datetime.now()}")
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
        finally:
            cursor.close()