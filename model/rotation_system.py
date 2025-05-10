import sqlite3
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Any, Tuple


class RotationSystemDAO:
    """
    Data Access Object for the image rotation system.
    Handles all database operations.
    """
    
    def __init__(self, db_path='data.db'):
        """Initialize the DAO with the database path."""
        self.db_path = db_path
    
    def _get_connection(self):
        """Create and return a database connection."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable row factory for dict-like access
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA busy_timeout = 5000;")
        return conn

    def get_rotation_item_byid(self, item_id):
        conn = self._get_connection()
        cursor = conn.cursor()

        query = "select * from rotation_queue where item_id = ?;"
        cursor.execute(query, (item_id,))
        result = cursor.fetchone()
        cursor.close()
        return result
    
    def get_active_image(self) -> Optional[Dict]:
        """
        Get information about the currently active image.
        
        Returns:
            Dict with image information or None if no active image
        """
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("""
            SELECT rq.*, d.*, ai.activated_at 
            FROM active_item ai
            JOIN rotation_queue rq ON ai.item_id = rq.item_id
            JOIN design d ON rq.design_id = d.design_id
            WHERE ai.id = 1
            """)
            
            result = cur.fetchone()
            
            if result:
                # Convert to dict
                return dict(result)
            
            return None
            
        finally:
            cur.close()
            conn.close()
    
    def add_unscheduled_image(self, design_id: int, end_time: datetime,
                        duration: int = 30, override_current: bool = False) -> int:
        """
        Add an unscheduled image to the rotation queue with default 30-second duration,
        log the upload, and return the new item ID.
        """
        conn = self._get_connection()
        cur = conn.cursor()
        try:
            if override_current:
                # Get current active item's display_order
                active_item_id = self._get_active_item_id(conn)
                if active_item_id:
                    cur.execute("""
                    SELECT display_order FROM rotation_queue
                    WHERE item_id = ?
                    """, (active_item_id,))
                    result = cur.fetchone()
                    current_order = result['display_order'] if result else 0

                    # Shift all items with display_order > current_order up by 1
                    cur.execute("""
                    UPDATE rotation_queue
                    SET display_order = display_order + 1,
                        updated_at = ?
                    WHERE display_order > ?
                    """, (datetime.now(timezone.utc), current_order))
                    
                    # Insert new item at current_order + 1
                    display_order = current_order + 1
                else:
                    # No active item, just use order 1
                    display_order = 1
            else:
                cur.execute("SELECT COALESCE(MAX(display_order), 0) AS max_order FROM rotation_queue")
                display_order = cur.fetchone()['max_order'] + 1
            
            cur.execute(
                "INSERT INTO rotation_queue (design_id, duration, display_order, expiry_time) VALUES (?, ?, ?, ?)",
                (design_id, duration, display_order, end_time)
            )

            item_id = cur.lastrowid
            conn.commit()

            # If override_current is true, make this the active item
            if override_current:
                cur.execute("""
                UPDATE active_item
                SET item_id = ?, activated_at = ?
                WHERE id = 1
                """, (item_id, datetime.now(timezone.utc)))

            # Make active if first
            self._ensure_active_item(conn)

            # Log upload history
            cur.execute(
                "INSERT INTO upload_history (design_id, attempt_time, status) VALUES (?, CURRENT_TIMESTAMP, ?)",
                (design_id, 'successful')
            )
            conn.commit()
            return item_id
        finally:
            cur.close()
            conn.close()
    
    def schedule_image(self, design_id: int, duration: int, start_time: datetime,
                       end_time: Optional[datetime] = None, override_current: bool = False) -> int:
        """
        Schedule an image to be inserted at a specific time, log the upload, and return the schedule ID.
        """
        if duration < 30:
            raise ValueError("Scheduled images must have a duration of at least 30 seconds")
        conn = self._get_connection()
        cur = conn.cursor()
        try:
            if end_time:
                cur.execute(
                    "INSERT INTO scheduled_items (design_id, duration, start_time, end_time, override_current) VALUES (?, ?, ?, ?, ?)",
                    (design_id, duration, start_time, end_time, override_current)
                )
            else:
                cur.execute(
                    "INSERT INTO scheduled_items (design_id, duration, start_time, override_current) VALUES (?, ?, ?, ?)",
                    (design_id, duration, start_time, override_current)
                )
            schedule_id = cur.lastrowid
            conn.commit()
            return schedule_id
        finally:
            cur.close()
            conn.close()

    def update_scheduled_item(self, schedule_id: int, design_id: int, duration: int, 
                          start_time: datetime, end_time: Optional[datetime] = None, 
                          override_current: bool = False) -> None:
        """Update an existing scheduled item."""
        conn = self._get_connection()
        cur = conn.cursor()
        try:
            if end_time:
                cur.execute(
                    "UPDATE scheduled_items SET design_id = ?, duration = ?, start_time = ?, "
                    "end_time = ?, override_current = ? WHERE schedule_id = ?",
                    (design_id, duration, start_time, end_time, override_current, schedule_id)
                )
            else:
                cur.execute(
                    "UPDATE scheduled_items SET design_id = ?, duration = ?, start_time = ?, "
                    "end_time = NULL, override_current = ? WHERE schedule_id = ?",
                    (design_id, duration, start_time, override_current, schedule_id)
                )
            conn.commit()
        finally:
            cur.close()
            conn.close()
    
    def process_scheduled_images(self) -> bool:
        """
        Check for scheduled images that should be active now and insert them into the rotation.
        
        Returns:
            True if any scheduled items were processed, False otherwise
        """
        now = datetime.now(timezone.utc)
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            # Get scheduled items that should be active now
            cur.execute("""
            SELECT * FROM scheduled_items
            WHERE start_time <= ?
            ORDER BY start_time ASC
            """, (now,))
            
            scheduled_items = cur.fetchall()
            if not scheduled_items:
                return False
            
            activated = False
            
            for item in scheduled_items:
                # Calculate expiry time based on end_time if provided, otherwise default to 1 day
                # Convert string representation of end_time to datetime with timezone info
                if item['end_time'] and isinstance(item['end_time'], str):
                    # Parse the string but ensure it's treated as UTC
                    # Remove Z suffix if present to avoid ValueError with fromisoformat
                    clean_end_time = item['end_time'].replace('Z', '')
                    expiry_time = datetime.fromisoformat(clean_end_time).replace(tzinfo=timezone.utc)
                elif item['end_time']:
                    # Already datetime object, just ensure it has UTC timezone
                    expiry_time = item['end_time'].replace(tzinfo=timezone.utc) if item['end_time'].tzinfo is None else item['end_time']
                else:
                    # Default to 1 day from now, in UTC
                    expiry_time = now + timedelta(days=1)
                
                # If override_current is true, need to place it right after current item
                if item['override_current']:
                    # Get current active item's display_order
                    active_item_id = self._get_active_item_id(conn)
                    if active_item_id:
                        cur.execute("""
                        SELECT display_order FROM rotation_queue
                        WHERE item_id = ?
                        """, (active_item_id,))
                        result = cur.fetchone()
                        current_order = result['display_order'] if result else 0

                        # Shift all items with display_order > current_order up by 1
                        cur.execute("""
                        UPDATE rotation_queue
                        SET display_order = display_order + 1,
                            updated_at = ?
                        WHERE display_order > ?
                        """, (now, current_order))
                        
                        # Insert new item at current_order + 1
                        display_order = current_order + 1
                    else:
                        # No active item, just use order 1
                        display_order = 1
                else:
                    # Get the highest display_order for non-override items
                    cur.execute("SELECT COALESCE(MAX(display_order), 0) as max_order FROM rotation_queue")
                    max_order = cur.fetchone()['max_order']
                    display_order = max_order + 1
                
                # Insert into rotation_queue
                cur.execute("""
                INSERT INTO rotation_queue
                (design_id, duration, display_order, expiry_time)
                VALUES (?, ?, ?, ?)
                """, (item['design_id'], item['duration'], display_order, expiry_time))

                item_id = cur.lastrowid
                
                # If override_current is true, make this the active item
                if item['override_current']:
                    cur.execute("""
                    UPDATE active_item
                    SET item_id = ?, activated_at = ?
                    WHERE id = 1
                    """, (item_id, now))

                cur.execute(
                "INSERT INTO upload_history (design_id, attempt_time, status) VALUES (?, ?, ?);",
                (item['design_id'], datetime.utcnow().isoformat(), 'successful')
                )
                
                # Remove from scheduled_items
                cur.execute("DELETE FROM scheduled_items WHERE schedule_id = ?", (item['schedule_id'],))
                
                activated = True
            
            conn.commit()
            
            # If this is the first item, make sure it's active
            if activated:
                self._ensure_active_item(conn)
            
            return activated
            
        finally:
            cur.close()
            conn.close()
    
    def clean_expired_images(self) -> int:
        """
        Remove images that have expired from the rotation queue.
        
        Returns:
            Number of items removed
        """
        now = datetime.now(timezone.utc)
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            # Check if the active item is expired
            active_item_id = self._get_active_item_id(conn)
            
            # Get list of expired items
            cur.execute("""
            SELECT item_id FROM rotation_queue
            WHERE expiry_time <= ?
            """, (now,))
            
            expired_items = [row['item_id'] for row in cur.fetchall()]
            
            if not expired_items:
                return 0
            
            # Delete expired items
            cur.execute("""
            DELETE FROM rotation_queue
            WHERE expiry_time <= ?
            """, (now,))
            
            removed_count = cur.rowcount

            # After removal, update the orders 
            cur.execute("SELECT item_id FROM rotation_queue ORDER BY display_order ASC")
            items = cur.fetchall()
            for index, item in enumerate(items):
                cur.execute(
                "UPDATE rotation_queue SET display_order = ? WHERE item_id = ?",
                (index + 1, item[0])
                )
            
            # If the active item was expired, select a new one
            if active_item_id in expired_items:
                self._select_new_active_item(conn)
            
            conn.commit()
            return removed_count
            
        finally:
            cur.close()
            conn.close()
    
    def check_rotation(self):
        """Check if it's time to rotate to the next image."""
        time_left = self.get_time_left_for_current()
        if time_left is None or (time_left <= 0):
            self.rotate_to_next()
    
    def rotate_to_next(self) -> Optional[Dict]:
        """
        Advance to the next image in the rotation.
        
        Returns:
            Dict containing information about the new active image, or None if no images available
        """
        conn = None
        cur = None
        try:
            conn = self._get_connection()
            cur = conn.cursor()
            
            # Start a transaction to ensure consistency
            cur.execute("BEGIN TRANSACTION")
            
            # Get current active item
            active_item_id = self._get_active_item_id(conn)
            
            if active_item_id is None:
                # No active item, try to select one
                result = self._select_new_active_item(conn)
                conn.commit()
                return result
            
            # Get current display_order
            cur.execute("""
            SELECT display_order FROM rotation_queue
            WHERE item_id = ?
            """, (active_item_id,))
            
            current_order_row = cur.fetchone()
            if current_order_row is None:
                # Item no longer exists, select a new one
                result = self._select_new_active_item(conn)
                conn.commit()
                return result
            
            current_order = current_order_row['display_order']
            
            # Find item with next display_order
            cur.execute("""
            SELECT * FROM rotation_queue
            WHERE display_order > ?
            ORDER BY display_order ASC
            LIMIT 1
            """, (current_order,))
            
            next_item = cur.fetchone()
            
            if next_item is None:
                # No item with higher order, go back to the beginning
                cur.execute("""
                SELECT * FROM rotation_queue
                ORDER BY display_order ASC
                LIMIT 1
                """)
                next_item = cur.fetchone()
            
            if next_item is None:
                # No items at all
                cur.execute("""
                UPDATE active_item 
                SET item_id = NULL, activated_at = ? 
                WHERE id = 1
                """, (datetime.now(timezone.utc),))
                conn.commit()
                return None
            
            # Update active item
            cur.execute("""
            UPDATE active_item
            SET item_id = ?, activated_at = ?
            WHERE id = 1
            """, (next_item['item_id'], datetime.now(timezone.utc)))
            
            # Store the item_id before committing and closing connection
            next_item_id = next_item['item_id']
            conn.commit()
            
            # Return the full information about the active image
            return self._get_image_info_by_id(next_item_id)
            
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error in rotate_to_next: {e}")
            return None
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()

    def _get_image_info_by_id(self, item_id: int) -> Optional[Dict]:
        """
        Get full information about an image by its item_id.
        
        Args:
            item_id: The ID of the item to fetch
            
        Returns:
            Dict containing image information or None if not found
        """
        try:
            conn = self._get_connection()
            cur = conn.cursor()
            
            cur.execute("""
            SELECT rq.*, d.* 
            FROM rotation_queue rq
            JOIN design d ON rq.design_id = d.design_id
            WHERE rq.item_id = ?
            """, (item_id,))
            
            row = cur.fetchone()
            if row:
                return dict(row)
            return None
        except Exception as e:
            print(f"Error fetching image info: {e}")
            return None
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if 'conn' in locals() and conn:
                conn.close()

    def reorder_images(self, item_id: int, new_order: int):

        status = 1
        query = None
        conn = self._get_connection()
        cursor = conn.cursor()
        old_order = self.get_rotation_item_byid(item_id)[3]
        now = datetime.now(timezone.utc)
        if new_order < old_order:
            query = "UPDATE rotation_queue SET display_order = display_order + 1, updated_at = ? WHERE display_order >= ? AND display_order < ?"
        elif new_order > old_order:
            query = "UPDATE rotation_queue SET display_order = display_order - 1, updated_at = ? WHERE display_order <= ? AND display_order > ?"
        try:
            if query:
                cursor.execute(query, (now, new_order, old_order))
            shift = "UPDATE rotation_queue SET display_order = ?, updated_at = ? WHERE item_id = ?"
            cursor.execute(shift,(new_order, now, item_id))
            conn.commit()
            status = 0
        except sqlite3.Error:
            status = 1
        finally:
            cursor.close()
            return status

    def get_time_left_for_current(self) -> Optional[float]:
        """
        Get the number of seconds left for the current active image.
        
        Returns:
            Seconds left or None if no active image
        """
        active_image = self.get_active_image()
        
        if not active_image:
            return None
        
        # Calculate time elapsed since activation using UTC time
        now = datetime.now(timezone.utc)
        
        # Handle the activated_at time, ensuring it's interpreted as UTC
        if active_image['activated_at'] and isinstance(active_image['activated_at'], str):
            # Remove Z suffix if present to avoid ValueError with fromisoformat
            clean_activated_at = active_image['activated_at'].replace('Z', '')
            # Parse the string and ensure it has UTC timezone
            activated_at = datetime.fromisoformat(clean_activated_at).replace(tzinfo=timezone.utc)
        else:
            # Already a datetime object, ensure it has UTC timezone
            activated_at = active_image['activated_at'].replace(tzinfo=timezone.utc) if active_image['activated_at'].tzinfo is None else active_image['activated_at']
        
        # Calculate elapsed time
        elapsed_seconds = (now - activated_at).total_seconds()
        # Calculate time left
        time_left = active_image['duration'] - elapsed_seconds
        # Return 0 if time_left is negative
        return max(0, time_left)
    

    def get_all_rotation_items(self) -> List[Dict]:
        """
        Get all items in the rotation queue with their associated design info.
        
        Returns:
            List of dicts with rotation queue and design information
        """
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("""
            SELECT rq.*, d.* 
            FROM rotation_queue rq
            JOIN design d ON rq.design_id = d.design_id
            ORDER BY rq.display_order ASC
            """)
            
            results = cur.fetchall()
            
            # Convert to list of dicts
            items = [dict(row) for row in results]
            
            return items
            
        finally:
            cur.close()
            conn.close()

    def get_rotation_items_paginated(self, page: int = 1, page_size: int = 6) -> Dict:
        """
        Get paginated items from the rotation queue with their associated design info.
        
        Args:
            page: Page number (starting from 1)
            page_size: Number of items per page
            
        Returns:
            Dict with pagination info and items
        """
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            # Calculate offset
            offset = (page - 1) * page_size
            
            # Get total count
            cur.execute("SELECT COUNT(*) as count FROM rotation_queue")
            total = cur.fetchone()['count']
            
            # Calculate total pages
            total_pages = (total + page_size - 1) // page_size
            
            # Get items for current page
            cur.execute("""
            SELECT rq.*, d.* 
            FROM rotation_queue rq
            JOIN design d ON rq.design_id = d.design_id
            ORDER BY rq.display_order ASC
            LIMIT ? OFFSET ?
            """, (page_size, offset))
            
            results = cur.fetchall()
            
            # Convert to list of dicts
            items = [dict(row) for row in results]
            
            return {
                "page": page,
                "page_size": page_size,
                "total": total,
                "pages": total_pages,
                "items": items
            }
            
        finally:
            cur.close()
            conn.close()

    def remove_item_from_rotation(self, item_id: int) -> bool:
        """
        Remove an item from the rotation queue.
        
        Args:
            item_id: ID of the item to remove
            
        Returns:
            Success status
        """
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            # Check if this is the active item
            active_item_id = self._get_active_item_id(conn)
            
            # Delete the item
            cur.execute("DELETE FROM rotation_queue WHERE item_id = ?", (item_id,))
            
            success = cur.rowcount > 0
            
            # If we deleted the active item, select a new one
            if success and item_id == active_item_id:
                self._select_new_active_item(conn)

            cur.execute("SELECT item_id FROM rotation_queue ORDER BY display_order ASC")
            items = cur.fetchall()
            for index, item in enumerate(items):
                cur.execute(
                "UPDATE rotation_queue SET display_order = ? WHERE item_id = ?",
                (index + 1, item[0])
                )

            conn.commit()
            return success
            
        except Exception as e:
            conn.rollback()
            print(f"Error removing item from rotation: {e}")
            return False
            
        finally:
            cur.close()
            conn.close()
    
    def get_scheduled_items(self) -> List[Dict]:
        """
        Get all pending scheduled items that haven't been inserted yet.
        
        Returns:
            List of scheduled items with their details
        """
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("""
            SELECT s.*, d.title
            FROM scheduled_items s
            JOIN design d ON s.design_id = d.design_id
            ORDER BY s.start_time ASC
            """)
            
            results = cur.fetchall()
            
            # Convert to list of dicts
            scheduled_items = [dict(row) for row in results]
            
            return scheduled_items
            
        finally:
            cur.close()
            conn.close()
        
    def get_scheduled_items_paginated(self, page: int = 1, page_size: int = 6) -> Dict:
        """
        Get paginated items from the scheduled queue with their associated design info.
        
        Args:
            page: Page number (starting from 1)
            page_size: Number of items per page
            
        Returns:
            Dict with pagination info and items
        """
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            # Calculate offset
            offset = (page - 1) * page_size
            
            # Get total count
            cur.execute("SELECT COUNT(*) as count FROM scheduled_items")
            total = cur.fetchone()['count']
            
            # Calculate total pages
            total_pages = (total + page_size - 1) // page_size
            
            # Get items for current page
            cur.execute("""
            SELECT s.*, d.*
            FROM scheduled_items s
            JOIN design d ON s.design_id = d.design_id
            ORDER BY s.start_time ASC
            LIMIT ? OFFSET ?
            """, (page_size, offset))
            
            results = cur.fetchall()
            
            # Convert to list of dicts
            items = [dict(row) for row in results]
            
            return {
                "page": page,
                "page_size": page_size,
                "total": total,
                "pages": total_pages,
                "items": items
            }
            
        finally:
            cur.close()
            conn.close()

    def remove_scheduled_item(self, schedule_id: int) -> None:
        """
        Remove a scheduled item from the database.
        
        Args:
            schedule_id: ID of the scheduled item to remove
        """
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("DELETE FROM scheduled_items WHERE schedule_id = ?", (schedule_id,))
            conn.commit()
            
        finally:
            cur.close()
            conn.close()
        
    def _get_active_item_id(self, conn=None) -> Optional[int]:
        """Get the ID of the currently active item."""
        should_close = False
        if conn is None:
            conn = self._get_connection()
            should_close = True
            
        cur = conn.cursor()
        try:
            cur.execute("SELECT item_id FROM active_item WHERE id = 1")
            result = cur.fetchone()
            return result['item_id'] if result and result['item_id'] is not None else None
        finally:
            cur.close()
            if should_close:
                conn.close()
    
    def _select_new_active_item(self, conn=None) -> Optional[Dict]:
        """Select a new active item from the rotation queue."""
        should_close = False
        if conn is None:
            conn = self._get_connection()
            should_close = True
            
        cur = conn.cursor()
        try:
            # Get the first item in the queue by display_order
            cur.execute("""
            SELECT item_id FROM rotation_queue 
            ORDER BY display_order ASC 
            LIMIT 1
            """)
            
            result = cur.fetchone()
            now = datetime.now(timezone.utc)
            if not result:
                # No items in queue
                cur.execute("UPDATE active_item SET item_id = NULL, activated_at = ? WHERE id = 1", (now,))
                conn.commit()
                return None
            
            # Set as active
            cur.execute("""
            UPDATE active_item
            SET item_id = ?, activated_at = ?
            WHERE id = 1
            """, (result['item_id'], now))
            
            conn.commit()
            
            # Return full information - need to close connection first
            if should_close:
                cur.close()
                conn.close()
                
            # Get full information with fresh connection
            return self.get_active_image()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()
            if should_close and conn:
                conn.close()
    
    def _ensure_active_item(self, conn=None):
        """Make sure there is an active item if the queue isn't empty."""
        should_close = False
        if conn is None:
            conn = self._get_connection()
            should_close = True
        
        try:
            active_item_id = self._get_active_item_id(conn)
            
            if active_item_id is None:
                self._select_new_active_item(conn)
        finally:
            if should_close:
                conn.close()

    def get_user_history(self, email: str) -> List[Dict[str, Any]]:
        """
        Return rotation queue history for designs created by the given user email.
        """
        conn = self._get_connection()
        cur = conn.cursor()
        try:
            query = """
                SELECT
                    rq.item_id       AS history_id,
                    rq.item_id       AS item_id,
                    rq.created_at    AS created_at,
                    rq.duration      AS duration,
                    rq.display_order AS display_order,
                    rq.expiry_time   AS expiry_time,
                    CASE
                        WHEN rq.expiry_time > CURRENT_TIMESTAMP THEN 'active'
                        ELSE 'expired'
                    END             AS status,
                    d.title          AS title,
                    d.pixel_data     AS pixel_data
                FROM rotation_queue rq
                JOIN design d ON d.design_id = rq.design_id
                JOIN user u ON u.user_id = d.user_id
                WHERE u.email = ?
                ORDER BY rq.created_at DESC;
            """
            cur.execute(query, (email,))
            rows = cur.fetchall()
            return [dict(row) for row in rows]
        finally:
            cur.close()
            conn.close()

    def get_scheduled_item(self, schedule_id: int) -> Optional[Dict]:
        """
        Get a scheduled item by ID.
        
        Args:
            schedule_id: ID of the scheduled item to retrieve
            
        Returns:
            Dict with scheduled item details or None if not found
        """
        conn = self._get_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("""
            SELECT s.*, d.title
            FROM scheduled_items s
            JOIN design d ON s.design_id = d.design_id
            WHERE s.schedule_id = ?
            """, (schedule_id,))
            
            result = cur.fetchone()
            
            if result:
                return dict(result)
            
            return None
            
        finally:
            cur.close()
            conn.close()