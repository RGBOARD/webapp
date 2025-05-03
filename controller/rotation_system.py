from flask import jsonify
from datetime import datetime, timedelta
from model.rotation_system import RotationSystemDAO
from utilities.validators import validate_required_fields

class RotationSystem:
    """
    Handler for image rotation operations.
    Sits between the routes and the DAO layer.
    """
    
    def __init__(self, email=None, json_data=None):
        """Initialize the handler with user email and request data."""
        self.email = email
        self.json_data = json_data
        self.dao = RotationSystemDAO()
    
    def get_current_image(self):
        """Get the currently active image."""
        try:
            active_image = self.dao.get_active_image()
            if not active_image:
                return jsonify({"error": "No active image"}), 404
            
            # Calculate time left
            time_left = self.dao.get_time_left_for_current()
            
            # Add time_left to the response
            response = {
                "image": active_image,
                "time_left": time_left
            }
            
            return jsonify(response), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def add_unscheduled_image(self):
        """Add an unscheduled image to the rotation queue."""
        try:
            # Validate required fields
            required_fields = ['design_id']
            validation_result = validate_required_fields(self.json_data, required_fields)
            if validation_result:
                return validation_result
            
            design_id = self.json_data.get('design_id')
            
            # Check if design exists (you might want to add this check)
            # if not self.dao.design_exists(design_id):
            #     return jsonify({"error": f"Design ID {design_id} not found"}), 404
            
            # Add to rotation queue
            item_id = self.dao.add_unscheduled_image(design_id)
            
            return jsonify({
                "success": True,
                "item_id": item_id,
                "message": f"Image with design ID {design_id} added to rotation"
            }), 201
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def schedule_image(self):
        """Schedule an image to be inserted at a specific time."""
        try:
            # Validate required fields
            required_fields = ['design_id', 'duration', 'start_time']
            validation_result = validate_required_fields(self.json_data, required_fields)
            if validation_result:
                return validation_result
            
            design_id = self.json_data.get('design_id')
            duration = self.json_data.get('duration')
            start_time_str = self.json_data.get('start_time')
            end_time_str = self.json_data.get('end_time')  # Optional
            override_current = self.json_data.get('override_current', False)
            
            # Parse start time
            try:
                start_time = datetime.fromisoformat(start_time_str)
                # Set seconds and microseconds to zero for minute-level comparison
                start_time = start_time.replace(second=0, microsecond=0)
            except ValueError:
                return jsonify({
                    "error": "Invalid start_time format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
                }), 400
            
            # Parse end time if provided
            end_time = None
            if end_time_str:
                try:
                    end_time = datetime.fromisoformat(end_time_str)
                    # Set seconds and microseconds to zero for minute-level comparison
                    end_time = end_time.replace(second=0, microsecond=0)
                    
                    # Validate end_time is after start_time
                    if end_time <= start_time:
                        return jsonify({
                            "error": "end_time must be after start_time"
                        }), 400
                except ValueError:
                    return jsonify({
                        "error": "Invalid end_time format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
                    }), 400
            
            # Validate duration
            if not isinstance(duration, int) or duration < 30:
                return jsonify({
                    "error": "Duration must be an integer of at least 30 seconds"
                }), 400
            
            # Check for duplicate start times at minute precision
            existing_scheduled = self.dao.get_scheduled_items()
            
            # Check if any item has the same start time (at minute precision)
            for item in existing_scheduled:
                existing_start = datetime.fromisoformat(item['start_time']) if isinstance(item['start_time'], str) else item['start_time']
                # Set seconds and microseconds to zero for minute-level comparison
                existing_start = existing_start.replace(second=0, microsecond=0)
                
                if existing_start == start_time:
                    # Find next available 5-minute slot
                    suggested_time = self._suggest_next_available_time(start_time, existing_scheduled)
                    
                    return jsonify({
                        "error": "Another item is already scheduled for this time slot",
                        "suggested_time": suggested_time.isoformat()
                    }), 409  # Using 409 Conflict status code
            
            # Schedule the image
            schedule_id = self.dao.schedule_image(
                design_id, duration, start_time, end_time, override_current
            )
            
            response = {
                "success": True,
                "schedule_id": schedule_id,
                "message": f"Image with design ID {design_id} scheduled for {start_time.isoformat()}"
            }
            
            if end_time:
                response["end_time"] = end_time.isoformat()
                
            return jsonify(response), 201
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def reorder_images(self):
        """Set a custom display order for images in the rotation."""
        try:
            # Validate required fields
            required_fields = ['order']
            validation_result = validate_required_fields(self.json_data, required_fields)
            if validation_result:
                return validation_result
            
            order = self.json_data.get('order')
            
            # Validate order is a list
            if not isinstance(order, list):
                return jsonify({"error": "Order must be a list of design IDs"}), 400
            
            # Reorder images
            success = self.dao.reorder_images(order)
            
            if success:
                return jsonify({
                    "success": True,
                    "message": "Images reordered successfully"
                }), 200
            else:
                return jsonify({
                    "error": "Failed to reorder images"
                }), 500
                
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def rotate_to_next(self):
        """Manually rotate to the next image."""
        try:
            new_active = self.dao.rotate_to_next()
            
            if new_active:
                return jsonify({
                    "success": True,
                    "message": "Rotated to next image",
                    "active_image": new_active
                }), 200
            else:
                return jsonify({
                    "error": "No images available for rotation"
                }), 404
                
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    def get_all_items(self):
        """Get all items in the rotation queue."""
        try:
            items = self.dao.get_all_rotation_items()
            return jsonify({"items": items}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def get_items_paginated(self, page, page_size):
        """Get paginated items from the rotation queue."""
        try:    
            # Get paginated items
            result = self.dao.get_rotation_items_paginated(page, page_size)
            
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def remove_item(self, item_id):
        """Remove an item from the rotation queue."""
        try:
            success = self.dao.remove_item_from_rotation(item_id)
            
            if success:
                return jsonify({
                    "success": True,
                    "message": f"Item {item_id} removed from rotation"
                }), 200
            else:
                return jsonify({
                    "error": f"Item {item_id} not found or could not be removed"
                }), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    def get_scheduled_items(self):
        """Get all pending scheduled items."""
        try:
            items = self.dao.get_scheduled_items()
            return jsonify({"items": items}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def _suggest_next_available_time(self, start_time, scheduled_items):
        """
        Suggest the next available time slot in 5-minute increments.
        
        Args:
            start_time: The requested start time that had a conflict
            scheduled_items: List of currently scheduled items
            
        Returns:
            A datetime object for the next available slot
        """
        # Make a copy to avoid modifying the original
        current_time = start_time
        
        # Try increments of 5 minutes
        for _ in range(24):  # Try up to 2 hours in 5-minute increments
            # Add 5 minutes
            current_time = current_time + timedelta(minutes=5)
            
            # Check if this time is available
            conflict = False
            for item in scheduled_items:
                item_start = datetime.fromisoformat(item['start_time']) if isinstance(item['start_time'], str) else item['start_time']
                item_start = item_start.replace(second=0, microsecond=0)
                
                if item_start == current_time:
                    conflict = True
                    break
            
            if not conflict:
                return current_time
        
        # If we couldn't find a slot within 2 hours, suggest the next day at the same time
        next_day = start_time + timedelta(days=1)
        return next_day

    def get_scheduled_items_paginated(self, page, page_size):
        """Get paginated scheduled items."""
        try:    
            # Get paginated scheduled items
            result = self.dao.get_scheduled_items_paginated(page, page_size)
        
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def remove_scheduled_item(self, schedule_id):
        """Remove a scheduled item by its ID."""
        try:
            self.dao.remove_scheduled_item(schedule_id)
            return jsonify({"message": "Scheduled item removed successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
