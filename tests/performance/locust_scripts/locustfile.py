import json
import random
import time
import datetime
from locust import HttpUser, task, between, SequentialTaskSet

from tests.performance.behaviors import RegularUserBehavior
from tests.performance.behaviors import AdminUserBehavior


class RegularUser(HttpUser):
    """
    Simulates a regular (non-admin) user of the application.
    Will randomly perform user actions with realistic think times.
    """
    wait_time = between(3, 7)  # 3-7 seconds between each task
    tasks = [RegularUserBehavior]


class AdminUser(HttpUser):
    """
    Simulates an admin user of the application.
    Will perform admin-specific tasks with slightly shorter think times.
    """
    wait_time = between(2, 5)  # 2-5 seconds between each task
    tasks = [AdminUserBehavior]


class MixedLoadTest(HttpUser):
    """
    A more advanced test that mixes regular user behavior with design creation,
    viewing, and rotation scheduling.
    Uses a sequential set of tasks to simulate a real user's journey.
    """
    wait_time = between(1, 3)  # 1-3 seconds between task sequences
    
    @task
    class UserJourney(SequentialTaskSet):
        def on_start(self):
            """Setup the user session"""
            # Use @upr.edu email format to match validation requirements
            self.email = f"journey_user_{random.randint(1000, 9999)}@upr.edu"
            # Use proper password format with uppercase, lowercase, digit, and special char
            self.password = f"TestJourney{random.randint(100, 999)}$"
            self.token = None
            self.design_ids = []
            
            # Register and login
            self.register()
            self.login()
            
        def register(self):
            """Register a new user"""
            self.client.post(
                "/user",
                json={
                    "email": self.email,
                    "password": self.password
                },
                name="/user [Journey Register]"
            )
            
        def login(self):
            """Log in with credentials"""
            with self.client.post(
                "/login",
                json={
                    "email": self.email,
                    "password": self.password
                },
                name="/login [Journey]",
                catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.token = data.get("access_token")
                    if not self.token:
                        response.failure("No access token")
                else:
                    response.failure(f"Login failed: {response.text}")
                    # Handle task rescheduling
                    from locust.exception import RescheduleTask
                    raise RescheduleTask()
        
        def get_auth_headers(self):
            """Return headers with JWT authentication"""
            if not self.token:
                self.login()
            return {"Authorization": f"Bearer {self.token}"}
            
        @task
        def browse_designs(self):
            """Browse designs and check email verification"""
            # Check if email is verified
            self.client.get(
                "/is-email-verified",
                headers=self.get_auth_headers(),
                name="/is-email-verified [Journey]"
            )
            
            # Request verification code
            self.client.post(
                "/code",
                headers=self.get_auth_headers(),
                name="/code [Journey]"
            )
            
            # Browse existing designs (pagination)
            self.client.get(
                "/designs?page=1&page_size=10",
                headers=self.get_auth_headers(),
                name="/designs [Journey]"
            )
            
            # Wait a bit between subtasks
            time.sleep(random.uniform(1, 2))
        
        @task
        def create_designs(self):
            """Create multiple designs"""
            # Create 1-3 designs
            for _ in range(random.randint(1, 3)):
                # Generate random pixel data with proper 2D structure
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
                        "title": f"Journey Design {random.randint(1, 1000)}",
                        "pixel_data": pixel_data
                    },
                    name="/design [Journey Create]",
                    catch_response=True
                ) as response:
                    if response.status_code == 201:  # Changed to 201 Created
                        data = response.json()
                        design_id = data.get("design_id")
                        if design_id:
                            self.design_ids.append(design_id)
                            response.success()
                        else:
                            response.failure("No design ID in response")
                    else:
                        response.failure(f"Failed to create design: {response.status_code} - {response.text}")
                
                # Wait between design creations
                time.sleep(random.uniform(1, 3))
        
        @task
        def manage_designs(self):
            """View and manage created designs"""
            if not self.design_ids:
                return
                
            # View each design
            for design_id in self.design_ids:
                self.client.get(
                    f"/design/{design_id}",
                    headers=self.get_auth_headers(),
                    name="/design/[id] [Journey View]"
                )
                time.sleep(random.uniform(0.5, 1.5))
            
            # Update a random design title
            if self.design_ids:
                design_id = random.choice(self.design_ids)
                self.client.put(
                    f"/design/{design_id}/title",
                    headers=self.get_auth_headers(),
                    data={"title": f"Updated Journey Design {random.randint(1, 1000)}"},
                    name="/design/[id]/title [Journey Update]"
                )
        
        @task
        def queue_management(self):
            """Add designs to rotation and view queue"""
            if not self.design_ids:
                return
                
            # Add a design to immediate rotation
            design_id = random.choice(self.design_ids)
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
                name="/rotation/add [Journey]"
            )
            
            # Schedule another design for later
            if len(self.design_ids) > 1:
                # Choose a different design
                other_designs = [d for d in self.design_ids if d != design_id]
                if other_designs:
                    design_id = random.choice(other_designs)
                    
                    # Current UTC time plus random minutes (between 5-60)
                    start_time_dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=random.randint(5, 60))
                    # Start time plus random hours (between 1-12)
                    end_time_dt = start_time_dt + datetime.timedelta(hours=random.randint(1, 12))
                    
                    # Format as ISO strings
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
                        name="/rotation/schedule [Journey]"
                    )
            
            # View the rotation queue
            self.client.get(
                "/rotation/items",
                headers=self.get_auth_headers(),
                name="/rotation/items [Journey]"
            )
            
            # View scheduled items
            self.client.get(
                "/rotation/scheduled",
                headers=self.get_auth_headers(),
                name="/rotation/scheduled [Journey]"
            )
            
            # Check current image
            self.client.get(
                "/rotation/current",
                headers=self.get_auth_headers(),
                name="/rotation/current [Journey]"
            )
