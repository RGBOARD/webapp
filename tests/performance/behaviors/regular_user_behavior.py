import json
import random
import datetime
from locust import task
from tests.performance.behaviors.user_behavior import UserBehavior

class RegularUserBehavior(UserBehavior):
    """
    Behavior specific to regular (non-admin) users.
    Includes design creation and upload tasks.
    """
    
    @task(2)
    def create_design(self):
        """Create a new design with pixel data"""
        # Generate random pixel data properly formatted as a 2D grid
        # Create a proper 2D grid of RGB values (64x64 grid)
        pixel_data = json.dumps({
            "width": 64,
            "height": 64,
            "pixels": [
                [
                    [random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)] 
                    for _ in range(64)
                ] 
                for _ in range(64)
            ]
        })
        
        with self.client.post(
            "/design",
            headers=self.get_auth_headers(),
            data={
                "title": f"Test Design {random.randint(1, 1000)}",
                "pixel_data": pixel_data
            },
            name="/design [Create]",
            catch_response=True
        ) as response:
            # Check for 201 status code (created) as returned by your controller
            if response.status_code == 201:
                try:
                    data = response.json()
                    new_design_id = data.get("design_id")
                    if new_design_id:
                        self.design_ids.append(new_design_id)
                        response.success()
                    else:
                        response.failure("No design ID in response")
                except (json.JSONDecodeError, KeyError):
                    response.failure("Invalid response format")
            else:
                response.failure(f"Failed to create design: {response.status_code} - {response.text}")
    
    @task(1)
    def view_design(self):
        """View a specific design"""
        if not self.design_ids:
            return
            
        design_id = random.choice(self.design_ids)
        self.client.get(
            f"/design/{design_id}",
            headers=self.get_auth_headers(),
            name="/design/[id] [Get]"
        )
    
    @task(1)
    def update_design_title(self):
        """Update the title of a design"""
        if not self.design_ids:
            return
            
        design_id = random.choice(self.design_ids)
        self.client.put(
            f"/design/{design_id}/title",
            headers=self.get_auth_headers(),
            data={"title": f"Updated Design {random.randint(1, 1000)}"},
            name="/design/[id]/title [Update]"
        )
    
    @task(1)
    def add_to_rotation(self):
        """Add a design to the rotation queue"""
        if not self.design_ids:
            return
            
        design_id = random.choice(self.design_ids)
        # Current time plus random hours (between 1-24)
        end_time_dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=random.randint(1, 24))
        
        # Format as ISO string
        end_time = end_time_dt.isoformat()
        
        self.client.post(
            "/rotation/add",
            headers=self.get_auth_headers(),
            json={
                "design_id": design_id,
                "end_time": end_time,
                "duration": random.choice([30, 60, 120]),
                "override_current": False
            },
            name="/rotation/add"
        )
    
    @task(1)
    def schedule_image(self):
        """Schedule a design for future display"""
        if not self.design_ids:
            return
            
        design_id = random.choice(self.design_ids)
        
        # Current UTC time plus random minutes (between 5-60)
        start_time_dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=random.randint(5, 60))
        # Start time plus random hours (between 1-12)
        end_time_dt = start_time_dt + datetime.timedelta(hours=random.randint(1, 12))
        
        # Format as ISO strings - what the controller expects
        start_time = start_time_dt.isoformat()
        end_time = end_time_dt.isoformat()
        
        self.client.post(
            "/rotation/schedule",
            headers=self.get_auth_headers(),
            json={
                "design_id": design_id,
                "start_time": start_time,
                "end_time": end_time,
                "duration": random.choice([30, 60, 120]),
                "override_current": False
            },
            name="/rotation/schedule"
        )