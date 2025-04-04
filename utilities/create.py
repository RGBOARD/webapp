import sqlite3
con = sqlite3.connect('../data.db')
cur = con.cursor()

cur.execute("""
    CREATE TABLE IF NOT EXISTS user (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT 0,
        is_verified BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS verification_code(
            code_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            code TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES  user(user_id) ON DELETE CASCADE
    );
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS design (
        design_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        image_path TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        is_approved BOOLEAN NOT NULL DEFAULT 0,
        status BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS display_panel (
        panel_id INTEGER PRIMARY KEY AUTOINCREMENT,
        location INTEGER NOT NULL,
        status TEXT CHECK(status IN ('active', 'inactive', 'maintenance'))
    );
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS queue_item (
        queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
        design_id INTEGER NOT NULL,
        panel_id INTEGER NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        display_duration INTEGER NOT NULL,
        display_order INTEGER NOT NULL,
        scheduled BOOLEAN NOT NULL DEFAULT 0,
        scheduled_at DATETIME,
        FOREIGN KEY (design_id) REFERENCES design(design_id) ON DELETE CASCADE,
        FOREIGN KEY (panel_id) REFERENCES display_panel(panel_id) ON DELETE CASCADE
    );
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS admin_action (
        action_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        target_user_id INTEGER,
        target_design_id INTEGER,
        target_queue_id INTEGER,
        action_type TEXT NOT NULL,
        action_details TEXT,
        timestamp DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
        FOREIGN KEY (target_user_id) REFERENCES user(user_id) ON DELETE SET NULL,
        FOREIGN KEY (target_design_id) REFERENCES design(design_id) ON DELETE SET NULL,
        FOREIGN KEY (target_queue_id) REFERENCES queue_item(queue_id) ON DELETE SET NULL
    );
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS upload_history (
        history_id INTEGER PRIMARY KEY AUTOINCREMENT,
        design_id INTEGER NOT NULL,
        attempt_time DATETIME NOT NULL,
        file_size INTEGER NOT NULL,
        status TEXT CHECK(status IN ('pending', 'successful', 'failed')),
        FOREIGN KEY (design_id) REFERENCES design(design_id) ON DELETE CASCADE
    );
""")