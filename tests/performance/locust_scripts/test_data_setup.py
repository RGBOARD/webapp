#!/usr/bin/env python
"""
Test Data Setup Script for RGBOARD Load Testing

This script creates a dedicated test database for load testing,
initializes the schema, and populates it with test data.
"""

import os
import random
import sys
import argparse
import sqlite3
import json
import datetime
import shutil
import bcrypt
from pathlib import Path

def create_test_database(test_db_path='test_data.db', schema_path=None):
    """
    Creates a new test database with the application schema.
    If schema_path is provided, uses that SQL file to create the schema.
    Otherwise, creates the schema based on the app structure.
    
    Returns the path to the created database.
    """
    # If the file already exists, remove it to start fresh
    if os.path.exists(test_db_path):
        os.remove(test_db_path)
    
    conn = sqlite3.connect(test_db_path)
    
    try:
        # Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON")
        cur = conn.cursor()
        
        # If schema file provided, use it
        if schema_path and os.path.exists(schema_path):
            with open(schema_path, 'r') as f:
                schema_sql = f.read()
                conn.executescript(schema_sql)
                print(f"Created database schema from {schema_path}")
        else:
            # Otherwise create schema based on known structure
            # User table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS user
            (
                user_id           INTEGER PRIMARY KEY AUTOINCREMENT,
                email             TEXT     NOT NULL UNIQUE,
                password          TEXT     NOT NULL,
                is_admin          BOOLEAN  NOT NULL DEFAULT 0,
                is_verified       BOOLEAN  NOT NULL DEFAULT 0,
                is_email_verified BOOLEAN  NOT NULL DEFAULT 0,
                created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """)
            
            # Temp password table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS temp_password
            (
                tp_id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id       INTEGER NOT NULL,
                temp_password TEXT    NOT NULL,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE
            );
            """)
            
            # Verification code table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS verification_code
            (
                code_id    INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL,
                code       TEXT    NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE
            );
            """)
            
            # Design table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS design
            (
                design_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER  NOT NULL,
                title       TEXT     NOT NULL,
                pixel_data  TEXT     NOT NULL,
                is_approved BOOLEAN  NOT NULL DEFAULT 1,
                status      BOOLEAN  NOT NULL DEFAULT 0,
                created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE
            );
            """)
            
            # Rotation queue table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS rotation_queue
            (
                item_id       INTEGER PRIMARY KEY AUTOINCREMENT,
                design_id     INTEGER  NOT NULL,
                duration      INTEGER  NOT NULL,
                display_order INTEGER  NOT NULL,
                expiry_time   DATETIME NOT NULL,
                created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (design_id) REFERENCES design (design_id) ON DELETE CASCADE
            );
            """)
            
            # Scheduled items table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS scheduled_items
            (
                schedule_id      INTEGER PRIMARY KEY AUTOINCREMENT,
                design_id        INTEGER  NOT NULL,
                duration         INTEGER  NOT NULL,
                start_time       DATETIME NOT NULL,
                end_time         DATETIME,
                override_current BOOLEAN  NOT NULL DEFAULT 0,
                created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (design_id) REFERENCES design (design_id) ON DELETE CASCADE
            );
            """)
            
            # Active item table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS active_item
            (
                id           INTEGER PRIMARY KEY DEFAULT 1,
                item_id      INTEGER,
                activated_at DATETIME NOT NULL   DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES rotation_queue (item_id) ON DELETE SET NULL
            );
            """)
            
            # Create initial active_item entry
            cur.execute("INSERT INTO active_item (id, item_id, activated_at) VALUES (1, NULL, CURRENT_TIMESTAMP)")
            
            # Admin action table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS admin_action
            (
                action_id        INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id          INTEGER  NOT NULL,
                target_user_id   INTEGER,
                target_design_id INTEGER,
                target_queue_id  INTEGER,
                action_type      TEXT     NOT NULL,
                action_details   TEXT,
                created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE,
                FOREIGN KEY (target_user_id) REFERENCES user (user_id) ON DELETE SET NULL,
                FOREIGN KEY (target_design_id) REFERENCES design (design_id) ON DELETE SET NULL,
                FOREIGN KEY (target_queue_id) REFERENCES rotation_queue (item_id) ON DELETE SET NULL
            );
            """)
            
            # Upload history table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS upload_history
            (
                history_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                design_id    INTEGER  NOT NULL,
                attempt_time DATETIME NOT NULL,
                status       TEXT CHECK (status IN ('pending', 'successful', 'failed')),
                created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (design_id) REFERENCES design (design_id) ON DELETE CASCADE
            );
            """)
            
            print("Created all database tables")
        
        conn.commit()
        print(f"Created new test database at {test_db_path}")
        return test_db_path
    except Exception as e:
        conn.rollback()
        print(f"Error creating test database: {e}")
        return None
    finally:
        conn.close()

def setup_test_data(db_path):
    """
    Sets up the necessary test data in the database for load testing.
    - Creates admin user
    - Creates regular test users
    - Creates test designs
    - Sets up rotation queue
    
    Args:
        db_path: Path to the test database
    
    Returns:
        Boolean indicating success/failure
    """
    if not os.path.exists(db_path):
        print(f"Error: Database file {db_path} not found.")
        return False
    
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()
    
    try:
        # Create admin user with proper password hashing
        admin_email = "admin@upr.edu"
        admin_password = "AdminPassword123$"  # For testing only, meets password requirements
        
        # Hash the admin password
        password_encoded = admin_password.encode("utf-8")
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password_encoded, salt)
        
        cur.execute(
            "INSERT INTO user (email, password, is_admin, is_verified, is_email_verified) VALUES (?, ?, 1, 1, 1)",
            (admin_email, hashed_password)
        )
        admin_id = cur.lastrowid
        print(f"Created admin user with ID: {admin_id}")
        
        # Create some regular test users
        for i in range(1, 6):
            user_email = f"test_user_{i}@upr.edu"
            user_password = f"TestPass{i}123$"  # With proper format
            
            # Hash the user password
            password_encoded = user_password.encode("utf-8")
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password_encoded, salt)
            
            cur.execute(
                "INSERT INTO user (email, password, is_verified, is_email_verified) VALUES (?, ?, 1, 1)",
                (user_email, hashed_password)
            )
            print(f"Created test user: {user_email}")
        
        # Get user IDs for creating designs
        cur.execute("SELECT user_id FROM user")
        user_ids = [row[0] for row in cur.fetchall()]
        
        # Create test designs for each user
        design_ids = []
        for user_id in user_ids:
            designs_per_user = 3 if user_id == admin_id else 2
            
            for i in range(designs_per_user):
                # Create 64x64 pixel data
                pixel_data = json.dumps({
                    "width": 64,
                    "height": 64,
                    "pixels": [[[i*10 % 255, (i*20) % 255, (i*30) % 255]] * 64 for _ in range(64)]
                })
                
                cur.execute(
                    "INSERT INTO design (user_id, title, pixel_data, is_approved) VALUES (?, ?, ?, ?)",
                    (user_id, f"Test Design {user_id}-{i+1}", pixel_data, 1)
                )
                design_ids.append(cur.lastrowid)
        
        print(f"Created {len(design_ids)} test designs")
        
        # Add some designs to rotation queue
        now = datetime.datetime.now(datetime.timezone.utc)
        
        for i, design_id in enumerate(design_ids[:5]):
            expiry_time = now + datetime.timedelta(hours=24)
            
            cur.execute(
                """
                INSERT INTO rotation_queue 
                (design_id, duration, display_order, expiry_time) 
                VALUES (?, ?, ?, ?)
                """,
                (design_id, 30 + i*30, i+1, expiry_time)
            )
        
        print("Added 5 designs to rotation queue")
        
        # Set active item
        cur.execute("UPDATE active_item SET item_id = ?, activated_at = ? WHERE id = 1", 
                   (design_ids[0], now))
        print("Set active item")
        
        # Schedule some designs for future rotation
        for i, design_id in enumerate(design_ids[5:8]):
            # Schedule to start in the future (5-30 minutes from now)
            start_time = now + datetime.timedelta(minutes=5+i*10)
            # End 2 hours after start
            end_time = start_time + datetime.timedelta(hours=2)
            
            cur.execute(
                """
                INSERT INTO scheduled_items
                (design_id, duration, start_time, end_time, override_current)
                VALUES (?, ?, ?, ?, ?)
                """,
                (design_id, 60, start_time, end_time, i % 2)  # Alternate override_current
            )
        
        print("Scheduled 3 designs for future rotation")
        
        # Add some upload history
        for design_id in design_ids:
            attempt_time = now - datetime.timedelta(minutes=random.randint(10, 60))
            
            cur.execute(
                """
                INSERT INTO upload_history
                (design_id, attempt_time, status)
                VALUES (?, ?, ?)
                """,
                (design_id, attempt_time, "successful")
            )
        
        print("Added upload history records")
        
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
    parser = argparse.ArgumentParser(description="Setup test database for RGBOARD load testing")
    parser.add_argument("--db", default="test_data.db", help="Path for the test database file")
    parser.add_argument("--schema", help="Path to SQL schema file (optional)")
    parser.add_argument("--copy-from", help="Copy existing database instead of creating new one")
    return parser.parse_args()

def main():
    """Main function to setup test database for load testing."""
    import random  # Import here to avoid polluting global namespace
    
    args = parse_arguments()
    test_db_path = args.db
    
    # Either copy an existing database or create a new one
    if args.copy_from and os.path.exists(args.copy_from):
        try:
            shutil.copy2(args.copy_from, test_db_path)
            print(f"Copied existing database from {args.copy_from} to {test_db_path}")
        except Exception as e:
            print(f"Error copying database: {e}")
            return 1
    else:
        # Create new test database
        created_db = create_test_database(test_db_path, args.schema)
        if not created_db:
            return 1
    
    # Setup the test data
    success = setup_test_data(test_db_path)
    
    if success:
        print("\nTest database and data setup complete!")
        print(f"\nTest database location: {os.path.abspath(test_db_path)}")
        print("\nTo use this test database with Locust:")
        print(f"1. Start the Flask app with the test database:")
        print(f"   python app.py --db {test_db_path}")
        print("2. Run Locust with:")
        print(f"   locust -f tests/performance/locust_scripts/locustfile.py --host=http://localhost:5000")
        return 0
    else:
        print("\nFailed to setup test data.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
    