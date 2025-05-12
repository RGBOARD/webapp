"""
Database-focused load testing script for RGBOARD application.

This script is specifically designed to test database performance and concurrency
by increasing the weight of tasks that interact heavily with the database,
particularly focusing on the rotation system.
"""

import json
import random
import time
import datetime
from locust import HttpUser, task, between, SequentialTaskSet
from locust.exception import RescheduleTask

# Import base behaviors
from tests.performance.behaviors import UserBehavior


class DBFocusUserBehavior(UserBehavior):
    """
    Modified user behavior with increased focus on database operations.
    """
    
    # Override task weights to focus on database operations
    # Reduce common tasks weights
    @task(1)  # Reduced from 2
    def view_profile(self):
        super().view_profile()

    @task(1)  # Reduced from 3
    def check_email_verification(self):
        super().check_email_verification()
    
    # Increase rotation system related tasks
    @task(8)  # Increased from 5
    def view_current_image(self):
        super().view_current_image()
    
    @task(6)  # Increased from 3
    def view_rotation_items(self):
        super().view_rotation_items()
    
    @task(6)  # Increased from 3
    def view_scheduled_items(self):
        super().view_scheduled_items()


class DBFocusRegularUserBehavior(DBFocusUserBehavior):
    """
    Regular user behavior with focus on database operations.
    """
    
    @task(4)  # Increased from 2
    def create_design(self):
        """Create a new design with pixel data"""
        # Generate proper 2D grid of pixel data
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
            if response.status_code == 201:  # Changed to 201 Created
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
    
    @task(3)  # Increased from 1
    def add_to_rotation(self):
        """Add a design to the rotation queue"""
        if not self.design_ids:
            return
            
        design_id = random.choice(self.design_ids)
        # Current UTC time plus random hours (between 1-24)
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
                "override_current": random.choice([False, False, False, True])  # 25% chance of override
            },
            name="/rotation/add"
        )
    
    @task(3)  # Increased from 1
    def schedule_image(self):
        """Schedule a design for future display"""
        if not self.design_ids:
            return
            
        design_id = random.choice(self.design_ids)
        # Schedule near future in UTC (10 seconds to 5 minutes)
        start_time_dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=random.randint(10, 300))
        # End time (10 minutes to 1 hour from start)
        end_time_dt = start_time_dt + datetime.timedelta(minutes=random.randint(10, 60))
        
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
                "override_current": random.choice([False, False, True])  # 33% chance of override
            },
            name="/rotation/schedule"
        )
    
    @task(2)  # New task specifically for DB focus
    def rotate_manually(self):
        """Manually rotate to the next image"""
        self.client.post(
            "/rotation/rotate",
            headers=self.get_auth_headers(),
            name="/rotation/rotate [Regular]"
        )


class DBFocusAdminUserBehavior(DBFocusUserBehavior):
    """
    Admin user behavior with focus on database operations.
    """
    
    def on_start(self):
        """
        Initialize admin user session.
        Uses a pre-created admin account from test data.
        """
        # Updated to match validation requirements
        self.email = "admin@upr.edu"
        self.password = "AdminPassword123$"
        self.login()
        
    @task(3)  # Increased from 1
    def rotate_image_manually(self):
        """Manually rotate to the next image"""
        self.client.post(
            "/rotation/rotate",
            headers=self.get_auth_headers(),
            name="/rotation/rotate [Admin]"
        )
    
    @task(5)  # Increased from 1
    def reorder_rotation_queue(self):
        """Reorder an item in the rotation queue - this is DB intensive"""
        # First, get the current rotation items
        with self.client.get(
            "/rotation/items",
            headers=self.get_auth_headers(),
            catch_response=True
        ) as response:
            if response.status_code != 200:
                return
                
            try:
                items = response.json()
                if not items or len(items) < 2:
                    return
                    
                # Select a random item
                item = random.choice(items)
                item_id = item.get('item_id')
                max_order = len(items)
                new_order = random.randint(1, max_order)
                
                self.client.put(
                    f"/rotation/{item_id}/reorder",
                    headers=self.get_auth_headers(),
                    json={"new_order": new_order},
                    name="/rotation/[id]/reorder"
                )
            except (json.JSONDecodeError, KeyError):
                return
    
    @task(3)  # New task for DB focus - update scheduled items
    def update_scheduled_item(self):
        """Fetch and update a scheduled item"""
        # First get scheduled items
        with self.client.get(
            "/rotation/scheduled",
            headers=self.get_auth_headers(),
            catch_response=True
        ) as response:
            if response.status_code != 200:
                return
                
            try:
                items = response.json()
                if not items:
                    return
                    
                # Select a random scheduled item
                item = random.choice(items)
                schedule_id = item.get('schedule_id')
                design_id = item.get('design_id')
                
                # Update its properties with ISO format timestamps
                start_time_dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=random.randint(10, 300))
                end_time_dt = start_time_dt + datetime.timedelta(minutes=random.randint(10, 60))
                
                # Format as ISO strings
                start_time = start_time_dt.isoformat()
                end_time = end_time_dt.isoformat()
                
                self.client.put(
                    f"/rotation/scheduled/{schedule_id}",
                    headers=self.get_auth_headers(),
                    json={
                        "design_id": design_id,
                        "start_time": start_time,
                        "end_time": end_time,
                        "duration": random.choice([30, 60, 120]),
                        "override_current": random.choice([False, True])
                    },
                    name="/rotation/scheduled/[id] [Update]"
                )
            except (json.JSONDecodeError, KeyError, IndexError):
                return
    
    @task(2)  # New task for DB focus
    def delete_and_recreate_scheduled_item(self):
        """Delete a scheduled item and create a new one - tests DB transactions"""
        # First get scheduled items
        with self.client.get(
            "/rotation/scheduled",
            headers=self.get_auth_headers(),
            catch_response=True
        ) as response:
            if response.status_code != 200:
                return
                
            try:
                items = response.json()
                if not items:
                    return
                    
                # Select a random scheduled item
                item = random.choice(items)
                schedule_id = item.get('schedule_id')
                design_id = item.get('design_id')
                
                # Delete it
                self.client.delete(
                    f"/rotation/scheduled/{schedule_id}",
                    headers=self.get_auth_headers(),
                    name="/rotation/scheduled/[id] [Delete]"
                )
                
                # Create a new one with ISO format timestamps
                start_time_dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=random.randint(10, 120))
                end_time_dt = start_time_dt + datetime.timedelta(minutes=random.randint(5, 30))
                
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
                        "duration": 30,  # Fixed short duration
                        "override_current": random.choice([False, True])  # 50% chance of override
                    },
                    name="/rotation/schedule [After Delete]"
                )
            except (json.JSONDecodeError, KeyError):
                return


class DBFocusRegularUser(HttpUser):
    """
    Regular user focused on database operations.
    """
    wait_time = between(1, 3)  # Shorter wait times to increase DB pressure
    tasks = [DBFocusRegularUserBehavior]


class DBFocusAdminUser(HttpUser):
    """
    Admin user focused on database operations.
    """
    wait_time = between(1, 3)  # Shorter wait times to increase DB pressure
    tasks = [DBFocusAdminUserBehavior]


class DBStressTest(HttpUser):
    """
    Sequential task set designed to create database stress by 
    performing batches of related operations that impact the same records.
    """
    wait_time = between(1, 2)  # Very short wait times
    
    @task
    class RotationStressSequence(SequentialTaskSet):
        def on_start(self):
            """Setup the user session"""
            # Updated to match validation requirements
            self.email = f"stress_user_{random.randint(1000, 9999)}@upr.edu"
            self.password = f"TestStress{random.randint(100, 999)}$"
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
                name="/user [Stress Register]"
            )
            
        def login(self):
            """Log in with credentials"""
            with self.client.post(
                "/login",
                json={
                    "email": self.email,
                    "password": self.password
                },
                name="/login [Stress]",
                catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.token = data.get("access_token")
                    if not self.token:
                        response.failure("No access token")
                else:
                    response.failure(f"Login failed: {response.text}")
                    raise RescheduleTask()
        
        def get_auth_headers(self):
            """Return headers with JWT authentication"""
            if not self.token:
                self.login()
            return {"Authorization": f"Bearer {self.token}"}
            
        @task
        def create_many_designs(self):
            """Create multiple designs in quick succession"""
            # Create 3-5 designs rapidly
            for _ in range(random.randint(3, 5)):
                # Generate proper 2D grid of pixel data
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
                        "title": f"Stress Design {random.randint(1, 1000)}",
                        "pixel_data": pixel_data
                    },
                    name="/design [Stress Create]",
                    catch_response=True
                ) as response:
                    if response.status_code == 201:  # Changed to 201 Created
                        try:
                            data = response.json()
                            design_id = data.get("design_id")
                            if design_id:
                                self.design_ids.append(design_id)
                        except (json.JSONDecodeError, KeyError):
                            pass
                
                # Very short wait time between creations to stress the DB
                time.sleep(random.uniform(0.1, 0.5))
        
        @task
        def add_designs_to_rotation(self):
            """Add multiple designs to rotation rapidly"""
            if not self.design_ids:
                return
                
            # Add multiple designs to rotation
            for design_id in self.design_ids[:min(3, len(self.design_ids))]:
                # ISO format timestamps
                end_time_dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=random.randint(1, 24))
                end_time = end_time_dt.isoformat()
                
                self.client.post(
                    "/rotation/add",
                    headers=self.get_auth_headers(),
                    json={
                        "design_id": design_id,
                        "end_time": end_time,
                        "duration": random.choice([30, 60]),
                        "override_current": random.choice([False, True])  # 50% chance of override
                    },
                    name="/rotation/add [Stress]"
                )
                
                # Very short wait time to stress DB
                time.sleep(random.uniform(0.1, 0.3))
        
        @task
        def schedule_multiple_designs(self):
            """Schedule multiple designs in quick succession"""
            if not self.design_ids:
                return
                
            # Schedule multiple designs
            for design_id in self.design_ids[:min(3, len(self.design_ids))]:
                # ISO format timestamps
                start_time_dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=random.randint(10, 120))
                end_time_dt = start_time_dt + datetime.timedelta(minutes=random.randint(5, 30))
                
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
                        "duration": 30,  # Fixed short duration
                        "override_current": random.choice([False, True])  # 50% chance of override
                    },
                    name="/rotation/schedule [Stress]"
                )
                
                # Very short wait time
                time.sleep(random.uniform(0.1, 0.3))
        
        @task
        def rapid_rotation_and_checking(self):
            """Rapidly rotate and check the current image"""
            # Perform multiple rotations in quick succession
            for _ in range(random.randint(3, 5)):
                self.client.post(
                    "/rotation/rotate",
                    headers=self.get_auth_headers(),
                    name="/rotation/rotate [Stress]"
                )
                
                # Immediately check the current image
                self.client.get(
                    "/rotation/current",
                    headers=self.get_auth_headers(),
                    name="/rotation/current [Stress]"
                )
                
                # Very short wait time
                time.sleep(random.uniform(0.1, 0.5))
        
        @task
        def multiple_reorders(self):
            """Reorder multiple items in quick succession"""
            # Get rotation items
            with self.client.get(
                "/rotation/items",
                headers=self.get_auth_headers(),
                catch_response=True
            ) as response:
                if response.status_code != 200:
                    return
                    
                try:
                    items = response.json()
                    if not items or len(items) < 2:
                        return
                        
                    # Reorder multiple items rapidly
                    for _ in range(min(3, len(items))):
                        item = random.choice(items)
                        item_id = item.get('item_id')
                        max_order = len(items)
                        new_order = random.randint(1, max_order)
                        
                        self.client.put(
                            f"/rotation/{item_id}/reorder",
                            headers=self.get_auth_headers(),
                            json={"new_order": new_order},
                            name="/rotation/[id]/reorder [Stress]"
                        )
                        
                        # Very short wait time
                        time.sleep(random.uniform(0.1, 0.3))
                except (json.JSONDecodeError, KeyError):
                    return
                