import json
import random
from locust import TaskSet, task

class UserBehavior(TaskSet):
    """
    Base user behavior representing common tasks that both regular users
    and admin users will perform.
    """
    
    def on_start(self):
        """
        Initialize user session when simulation starts.
        All users must first log in.
        """
        self.token = None
        # Create a UPR email address to match email_rule in your main code
        self.email = f"test_user_{random.randint(1000, 9999)}@upr.edu"
        # Ensure password meets validation requirements: uppercase, lowercase, digit, and special char, 8-32 chars
        self.password = f"TestPassword{random.randint(100, 999)}$"
        self.user_id = None
        self.design_ids = []
        
        # Register first, then login
        self.register()
        self.login()
        
    def register(self):
        """Register a new user account"""
        with self.client.post(
            "/user", 
            json={
                "email": self.email,
                "password": self.password
            },
            name="/user [Register]",
            catch_response=True
        ) as response:
            # Check for 201 (created) status code as per your main application code
            if response.status_code == 201:
                response.success()
            elif response.status_code == 409 and "Email already in use" in response.text:
                # User already exists, which is fine
                response.success()
            else:
                response.failure(f"Registration failed: {response.status_code} - {response.text}")

    def login(self):
        """Log in with the created user credentials"""
        with self.client.post(
            "/login", 
            json={
                "email": self.email,
                "password": self.password
            },
            name="/login",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.token = data.get("access_token")
                    self.user_id = data.get("user_id")
                    if not self.token:
                        response.failure("No access token received after login")
                except json.JSONDecodeError:
                    response.failure("Invalid JSON response from login")
            else:
                response.failure(f"Login failed: {response.status_code} {response.text}")

    def get_auth_headers(self):
        """Return headers with JWT authentication"""
        if not self.token:
            self.login()
        return {"Authorization": f"Bearer {self.token}"}

    @task(2)
    def view_profile(self):
        """View the user's own profile"""
        if not self.user_id:
            return
            
        self.client.get(
            f"/user/{self.user_id}", 
            headers=self.get_auth_headers(),
            name="/user/[id] [Get]"
        )

    @task(3)
    def check_email_verification(self):
        """Check if the user's email is verified"""
        self.client.get(
            "/is-email-verified",
            headers=self.get_auth_headers(),
            name="/is-email-verified"
        )
    
    @task(5)
    def view_current_image(self):
        """View the currently active image in rotation"""
        self.client.get(
            "/rotation/current",
            headers=self.get_auth_headers(),
            name="/rotation/current"
        )
    
    @task(3)
    def view_rotation_items(self):
        """View all items in the rotation queue"""
        page = random.randint(1, 3)
        page_size = random.choice([6, 10, 20])
        
        self.client.get(
            f"/rotation/items/pagination?page={page}&size={page_size}",
            headers=self.get_auth_headers(),
            name="/rotation/items/pagination"
        )
    
    @task(3)
    def view_scheduled_items(self):
        """View all scheduled items"""
        page = random.randint(1, 2)
        
        self.client.get(
            f"/rotation/scheduled/pagination?page={page}&size=6",
            headers=self.get_auth_headers(),
            name="/rotation/scheduled/pagination"
        )
    
    @task(2)
    def view_user_bytes(self):
        """Check user's design bytes stats"""
        self.client.get(
            "/design/bytes",
            headers=self.get_auth_headers(),
            name="/design/bytes"
        )

    @task(3)
    def view_designs(self):
        """View the user's designs"""
        page = random.randint(1, 3)
        
        with self.client.get(
            f"/designs?page={page}&page_size=10",
            headers=self.get_auth_headers(),
            name="/designs",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    designs = data.get("designs", [])
                    # Store design IDs for later use
                    self.design_ids = [design["design_id"] for design in designs]
                    response.success()
                except (json.JSONDecodeError, KeyError):
                    response.failure("Invalid response format")
            else:
                response.failure(f"Failed to get designs: {response.status_code}")
                