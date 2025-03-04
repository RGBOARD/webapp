import sqlite3
con = sqlite3.connect('data.db')
cur = con.cursor()

cur.execute("CREATE TABLE IF NOT EXISTS "
            "user(user_id serial primary key,"
            "email varchar,is_admin bool,"
            "is_verified bool,"
            "created_at datetime)")

cur.execute("CREATE TABLE IF NOT EXISTS "
            "design(design_id serial primary key,"
            "user_id varchar references user(user_id),"
            "title varchar,"
            "image_path varchar,"
            "created_at datetime,"
            "is_approved bool,"
            "status enum)")

cur.execute("CREATE TABLE IF NOT EXISTS "
            "display_panel(panel_id serial primary key,"
            "location integer,"
            "status enum)")

cur.execute("CREATE TABLE IF NOT EXISTS "
            "queue_item(queue_id serial primary key,"
            "design_id varchar references design(design_id),"
            "panel_id varchar references display_panel(panel_id),"
            "start_time datetime,"
            "end_time datetime,"
            "display_duration integer,"
            "display_order integer,"
            "scheduled bool,"
            "scheduled_at datetime)")

cur.execute("CREATE TABLE IF NOT EXISTS "
            "admin_action(action_id serial primary key,"
            "user_id varchar references user(user_id),"
            "target_user_id varchar references design(user_id),"
            "target_design_id varchar references design(design_id),"
            "target_queue_id varchar references queue_item(queue_id),"
            "action_type varchar,"
            "action_details varchar,"
            "timestamp datetime)")

cur.execute("CREATE TABLE IF NOT EXISTS "
            "upload_history(history_id serial primary key,"
            "design_id varchar references design(design_id),"
            "attempt_time datetime,"
            "file_size integer,"
            "status enum)")