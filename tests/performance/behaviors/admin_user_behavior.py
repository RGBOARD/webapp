import json
import random
from locust import task
from tests.performance.behaviors.user_behavior import UserBehavior

class AdminUserBehavior(UserBehavior):
    """
    Behavior specific to admin users.
    Includes admin tasks like managing users and the queue.
    """
    
    def on_start(self):
        """
        Initialize admin user session.
        Uses a pre-created admin account from test data.
        """
        # Using @upr.edu email to match the validation rule
        self.email = "admin@upr.edu"
        # Adding uppercase, lowercase, digit and special characters to meet password requirements
        self.password = "AdminPassword123$"
        self.design_ids = []
        self.login()
        self.fetch_all_users()
        
    def fetch_all_users(self):
        """Fetch all users from the system"""
        with self.client.get(
            "/user",
            headers=self.get_auth_headers(),
            name="/user [Get All]",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.all_user_ids = [user["user_id"] for user in data]
                    response.success()
                except (json.JSONDecodeError, KeyError):
                    response.failure("Invalid response format")
                    self.all_user_ids = []
            else:
                response.failure(f"Failed to get users: {response.status_code}")
                self.all_user_ids = []
    
    @task(5)
    def view_users_paginated(self):
        """View users with pagination"""
        page = random.randint(1, 3)
        page_size = random.choice([6, 10, 20])
        
        self.client.get(
            f"/user/pagination?page={page}&size={page_size}",
            headers=self.get_auth_headers(),
            name="/user/pagination"
        )
    
    @task(2)
    def view_specific_user(self):
        """View details of a specific user"""
        if not hasattr(self, 'all_user_ids') or not self.all_user_ids:
            self.fetch_all_users()
            
        if self.all_user_ids:
            user_id = random.choice(self.all_user_ids)
            self.client.get(
                f"/user/{user_id}",
                headers=self.get_auth_headers(),
                name="/user/[id] [Admin View]"
            )
    
    @task(1)
    def update_user(self):
        """Update a user's details"""
        if not hasattr(self, 'all_user_ids') or not self.all_user_ids:
            self.fetch_all_users()
            
        if self.all_user_ids:
            user_id = random.choice(self.all_user_ids)
            self.client.put(
                f"/user/{user_id}",
                headers=self.get_auth_headers(),
                json={
                    "is_verified": random.choice([True, False])
                },
                name="/user/[id] [Update]"
            )
    
    @task(3)
    def view_approved_designs(self):
        """View all approved designs"""
        self.client.get(
            "/design/approved",
            headers=self.get_auth_headers(),
            name="/design/approved"
        )
    
    @task(2)
    def update_design_approval(self):
        """Update the approval status of a design"""
        if not self.design_ids:
            # Get some designs first
            with self.client.get(
                "/designs?page=1&page_size=10",
                headers=self.get_auth_headers(),
                catch_response=True
            ) as response:
                if response.status_code == 200:
                    try:
                        data = response.json()
                        self.design_ids = [design["design_id"] for design in data.get("designs", [])]
                    except (json.JSONDecodeError, KeyError):
                        pass
            
            if not self.design_ids:
                return
        
        design_id = random.choice(self.design_ids)
        self.client.put(
            f"/design/{design_id}/approval",
            headers=self.get_auth_headers(),
            json={"approval": random.choice([True, False])},
            name="/design/[id]/approval"
        )
    
    @task(1)
    def rotate_image_manually(self):
        """Manually rotate to the next image"""
        self.client.post(
            "/rotation/rotate",
            headers=self.get_auth_headers(),
            name="/rotation/rotate"
        )
    
    @task(1)
    def reorder_rotation_queue(self):
        """Reorder an item in the rotation queue"""
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
    
    @task(1)
    def view_upload_history(self):
        """View the upload history"""
        page = random.randint(1, 2)
        self.client.get(
            f"/upload_history/pagination?page={page}&size=10",
            headers=self.get_auth_headers(),
            name="/upload_history/pagination"
        )
        