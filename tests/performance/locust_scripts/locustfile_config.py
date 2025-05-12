"""
RGBOARD Load Testing Setup Instructions

This file contains instructions for setting up and running the Locust load tests
for the RGBOARD application.
"""

import argparse
import os
import json
import sqlite3
import datetime
import sys
import bcrypt
from pathlib import Path

# Add the parent directory to the path so we can import the test_data_setup module
sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_data_setup import setup_test_data, create_test_database

def ensure_test_database(db_path='test_data.db'):
    """
    Ensures a test database exists and is properly set up for load testing.
    If the database doesn't exist, creates it.
    
    Args:
        db_path: Path to the test database
        
    Returns:
        Path to the test database or None if setup failed
    """
    # Check if the database already exists
    if os.path.exists(db_path):
        print(f"Using existing test database at {db_path}")
    else:
        # Create the database and schema
        print(f"Creating new test database at {db_path}")
        created_db = create_test_database(db_path)
        if not created_db:
            return None
    
    # Setup test data
    success = setup_test_data(db_path)
    
    if success:
        return db_path
    else:
        return None

def setup_test_data(db_path='../../test_data.db'):
    """
    Sets up the necessary test data in the database for load testing.
    - Creates admin user
    - Creates some test designs
    
    Run this before starting the Locust tests to ensure proper data availability.
    """
    if not os.path.exists(db_path):
        print(f"Error: Database file {db_path} not found.")
        return False
    
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()
    
    # Create admin user if not exists with proper hashing
    admin_email = "admin@upr.edu"  # Changed to match validation
    admin_password = "AdminPassword123$"  # Changed to meet requirements
    
    try:
        # Check if admin exists
        cur.execute("SELECT user_id FROM user WHERE email = ?", (admin_email,))
        admin = cur.fetchone()
        
        if not admin:
            # Create admin user with hashed password
            password_encoded = admin_password.encode("utf-8")
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password_encoded, salt)
            
            cur.execute(
                "INSERT INTO user (email, password, is_admin, is_verified) VALUES (?, ?, 1, 1)",
                (admin_email, hashed_password)
            )
            print(f"Created admin user with email: {admin_email}")
        else:
            print(f"Admin user already exists with email: {admin_email}")
            
            # Ensure the admin has admin privileges
            cur.execute(
                "UPDATE user SET is_admin = 1, is_verified = 1 WHERE email = ?",
                (admin_email,)
            )
        
        # Create some test designs if needed (optional)
        cur.execute("SELECT COUNT(*) FROM design")
        design_count = cur.fetchone()[0]
        
        if design_count < 10:
            # Get admin user_id
            cur.execute("SELECT user_id FROM user WHERE email = ?", (admin_email,))
            admin_id = cur.fetchone()[0]
            
            # Create some test designs
            for i in range(10):
                # Simple pixel data (64x64 grid)
                pixel_data = json.dumps({
                    "width": 64,
                    "height": 64,
                    "pixels": [[[i*10 % 255, (i*20) % 255, (i*30) % 255]] * 64 for _ in range(64)]
                })
                
                cur.execute(
                    "INSERT INTO design (user_id, title, pixel_data) VALUES (?, ?, ?)",
                    (admin_id, f"Test Design {i+1}", pixel_data)
                )
            
            print(f"Created 10 test designs")
        
        # Add some designs to rotation queue if needed
        cur.execute("SELECT COUNT(*) FROM rotation_queue")
        queue_count = cur.fetchone()[0]
        
        if queue_count < 5:
            # Get some design IDs
            cur.execute("SELECT design_id FROM design LIMIT 5")
            design_ids = [row[0] for row in cur.fetchall()]
            
            # Current time in UTC
            now = datetime.datetime.now(datetime.timezone.utc)
            
            # Add designs to queue
            for i, design_id in enumerate(design_ids):
                expiry_time = now + datetime.timedelta(hours=24)
                
                cur.execute(
                    """
                    INSERT INTO rotation_queue 
                    (design_id, duration, display_order, expiry_time) 
                    VALUES (?, ?, ?, ?)
                    """,
                    (design_id, 30 + i*30, i+1, expiry_time)
                )
            
            print(f"Added {len(design_ids)} designs to rotation queue")
            
            # Set active item
            cur.execute("UPDATE active_item SET item_id = ? WHERE id = 1", (design_ids[0],))
            print("Set active item")
        
        conn.commit()
        print("Test data setup completed successfully")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"Error setting up test data: {e}")
        return False
        
    finally:
        conn.close()

def parse_arguments():
    """Parse command-line arguments for the setup script."""
    parser = argparse.ArgumentParser(description="Setup test data for RGBOARD load testing")
    parser.add_argument("--db", default="test_data.db", help="Path to the test database file")
    parser.add_argument("--create-new", action="store_true", help="Force creation of a new test database")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_arguments()
    
    # If create-new flag is set, delete the existing database
    if args.create_new and os.path.exists(args.db):
        try:
            os.remove(args.db)
            print(f"Removed existing database at {args.db}")
        except Exception as e:
            print(f"Failed to remove existing database: {e}")
    
    # Ensure the test database exists and is properly set up
    db_path = ensure_test_database(args.db)
    
    if db_path:
        abs_path = os.path.abspath(db_path)
        print("\nTest database setup complete!")
        print(f"\nTest database location: {abs_path}")
        print("\nNext steps:")
        print(f"1. Run the Flask server with the test database:")
        print(f"   python app.py --db {abs_path}")
        print("2. Run Locust:")
        print(f"   locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000")
        print("3. Open Locust web interface at: http://localhost:8089")
        print("\nRecommended test parameters:")
        print("- Number of users: Start with 10-50, then scale up")
        print("- Spawn rate: 1-5 users per second")
        print("- Runtime: 5-10 minutes for initial tests, longer for stability testing")
    else:
        print("\nFailed to setup test database. Please check the errors above.")
        sys.exit(1)
    
"""
Locust Command Line Options:

To run Locust from the command line with specific options:

1. Basic run with web UI:
   locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000

2. Run without web UI (headless mode):
   locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000 --headless -u 50 -r 5 -t 10m

3. Run with specific user classes:
   locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000 --class-picker
   or
   locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000 -u 50 -r 5 -t 10m RegularUser AdminUser

4. Save results to CSV files:
   locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000 --headless -u 50 -r 5 -t 10m --csv=tests/performance/results/baseline/baseline

Parameters:
  -f, --locustfile: Python file with the test definitions
  --host: Target host to load test
  -u, --users: Number of concurrent users to simulate
  -r, --spawn-rate: Rate at which users are spawned (users per second)
  -t, --run-time: Stop after the specified time (e.g., 10m for 10 minutes, 1h for 1 hour)
  --headless: Run without web interface
  --csv: Store results in CSV files with the specified name prefix
  --class-picker: Show a picker that lets you select which User classes to run
  
For more options, run: locust --help
"""

# Test Scenarios

"""
Test Scenario 1: Basic Load Testing
----------------------------------
Goal: Establish baseline performance under normal load

Configuration:
- Users: 20 (15 RegularUsers, 5 AdminUsers)
- Spawn rate: 2 users per second
- Run time: 5 minutes
- Command:
  ```
  locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000 --headless -u 20 -r 2 -t 5m --csv=tests/performance/results/baseline/baseline
  ```

Expected Outcome:
- Response times under 200ms for most endpoints
- No failures
- Establish baseline metrics for comparison with other scenarios


Test Scenario 2: High Concurrency
--------------------------------
Goal: Test application performance under high user load

Configuration:
- Users: 100 (80 RegularUsers, 20 AdminUsers)
- Spawn rate: 5 users per second
- Run time: 10 minutes
- Command:
  ```
  locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000 --headless -u 100 -r 5 -t 10m --csv=tests/performance/results/high_concurrency/high_concurrency
  ```

Expected Outcome:
- Identify potential concurrency issues
- Measure degradation in response times compared to baseline
- Pinpoint bottlenecks in the application


Test Scenario 3: Extended Duration Stability
------------------------------------------
Goal: Verify application stability over a longer period

Configuration:
- Users: 50 (40 RegularUsers, 10 AdminUsers)
- Spawn rate: 2 users per second
- Run time: 30 minutes
- Command:
  ```
  locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000 --headless -u 50 -r 2 -t 30m --csv=tests/performance/results/stability/stability
  ```

Expected Outcome:
- No memory leaks or performance degradation over time
- Stable response times throughout the test duration
- Consistent error rates (ideally zero)


Test Scenario 4: Spike Testing
----------------------------
Goal: Test how the application handles sudden traffic spikes

Configuration:
- Start with 10 users, quickly ramp up to 100, then back down
- Use the MixedLoadTest class for realistic user journeys
- Command:
  ```
  locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000 --headless --class-picker MixedLoadTest -u 10 -r 1 -t 1m
  # Then manually change to 100 users with 20 spawn rate, wait 5 minutes
  # Then back to 10 users
  # Total duration: ~15 minutes
  ```

Expected Outcome:
- Measure recovery time after traffic spike
- Identify any failures during peak load
- Test background scheduler service under varying load conditions


Test Scenario 5: Database-Heavy Operations
----------------------------------------
Goal: Focus on database performance, particularly rotation system

Configuration:
- Use a custom weight distribution favoring rotation operations
- Users: 30
- Run time: 15 minutes
- Command:
  ```
  # Use a modified copy of the locustfile with increased weights for DB operations
  locust -f tests/performance/locust_scripts/locustfile_db_focus.py --host=http://localhost:5000 --headless -u 30 -r 3 -t 15m --csv=tests/performance/results/db_operations/db_operations
  ```
  
Modifications to make in locustfile_db_focus.py:
- Increase weight of tasks that interact with rotation system 
- Add more reordering operations
- Focus on scheduled item operations

Expected Outcome:
- Identify any SQLite contention issues
- Measure scheduler service performance
- Detect potential database locks or timeout issues
"""
