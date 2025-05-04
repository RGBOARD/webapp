import sqlite3

con = sqlite3.connect('data.db')
cur = con.cursor()

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

print("Created table: user")

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

print("Created table: verification_code")

cur.execute("""
    CREATE TABLE IF NOT EXISTS design
    (
        design_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER  NOT NULL,
        title       TEXT     NOT NULL,
        pixel_data   TEXT     NOT NULL, -- Changed to pixel_data since conversion is client-side
        is_approved BOOLEAN  NOT NULL DEFAULT 1,
        status      BOOLEAN  NOT NULL DEFAULT 0,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE
    );
""")

print("Created table: design")

cur.execute("""
            CREATE TABLE IF NOT EXISTS rotation_queue
            (
                item_id           INTEGER PRIMARY KEY AUTOINCREMENT,
                design_id         INTEGER NOT NULL,
                duration          INTEGER NOT NULL,  -- Duration in seconds
                display_order     INTEGER NOT NULL,  -- For custom ordering
                expiry_time       DATETIME NOT NULL, -- When to remove from rotation
                created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (design_id) REFERENCES design (design_id) ON DELETE CASCADE
            );
            """)

print("Created table: rotation_queue")

cur.execute("""
            CREATE TABLE IF NOT EXISTS scheduled_items
            (
                schedule_id       INTEGER PRIMARY KEY AUTOINCREMENT,
                design_id         INTEGER NOT NULL,
                duration          INTEGER NOT NULL,  -- Duration in seconds (min 60)
                start_time        DATETIME NOT NULL, -- When to insert into rotation
                end_time          DATETIME,          -- When to remove from rotation (NULL = 1 day default)
                override_current  BOOLEAN NOT NULL DEFAULT 0, -- Whether to make it active immediately
                created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (design_id) REFERENCES design (design_id) ON DELETE CASCADE
            );
            """)

print("Created table: scheduled_items")

cur.execute("""
            CREATE TABLE IF NOT EXISTS active_item
            (
                id                INTEGER PRIMARY KEY DEFAULT 1,
                item_id           INTEGER,
                activated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES rotation_queue (item_id) ON DELETE SET NULL
            );
            """)

print("Created table: active_item")

cur.execute("INSERT INTO active_item (id, item_id, activated_at) VALUES (1, NULL, CURRENT_TIMESTAMP)")
print("Created initial active_item entry")

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

print("Created table: admin_action")

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

print("Created table: upload_history")
con.commit()
