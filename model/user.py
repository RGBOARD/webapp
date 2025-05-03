import sqlite3


class UserDAO:

    def __init__(self):
        database_path = 'data.db'
        self.conn = sqlite3.connect(database_path)
        self.conn.execute("PRAGMA foreign_keys = ON")

    def get_all_users(self):
        cursor = self.conn.cursor()
        query = "select * from user;"
        cursor.execute(query)
        users = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        result = [dict(zip(columns, user)) for user in users]

        cursor.close()
        return result

    def get_all_users_paginated(self, page, page_size):
        cursor = self.conn.cursor()
        offset = (page - 1) * page_size

        try:
            query = "SELECT * FROM user LIMIT ? OFFSET ?"
            cursor.execute(query, (page_size, offset))
            users = cursor.fetchall()

            columns = [column[0] for column in cursor.description]
            users = [dict(zip(columns, user)) for user in users]

            count_query = "SELECT COUNT(*) FROM user"
            cursor.execute(count_query)
            total_users = cursor.fetchone()[0]

            total_pages = (total_users + page_size - 1) // page_size
            cursor.close()
            return {
                "success": True,
                "users": users,
                "total": total_users,
                "pages": total_pages,
                "page": page
            }
        except Exception as e:
            cursor.close()
            print("Error during database operation:", str(e))
            return {
                "success": False,
                "error": str(e)
            }

    def get_user_by_id(self, user_id):
        cursor = self.conn.cursor()
        query = "select * from user where user_id = ?;"
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def get_password_by_email(self, email):
        cursor = self.conn.cursor()
        query = "SELECT password FROM user WHERE email = ?;"

        try:
            cursor.execute(query, (email,))
            password = cursor.fetchone()
            return password[0] if password else None

        except sqlite3.Error:
            return None

        finally:
            cursor.close()

    def get_admin_by_email(self, email):
        cursor = self.conn.cursor()
        query = "SELECT is_admin FROM user WHERE email = ?;"

        try:
            cursor.execute(query, (email,))
            is_admin = cursor.fetchone()
            return is_admin[0]

        except sqlite3.Error:
            return None

        finally:
            cursor.close()

    def get_userid_by_email(self, email):
        cursor = self.conn.cursor()
        query = "SELECT user_id FROM user WHERE email = ?;"

        try:
            cursor.execute(query, (email,))
            result = cursor.fetchone()

            if result is not None:
                return result[0]
            else:
                return None

        except sqlite3.Error as e:
            return None

        finally:
            cursor.close()

    def get_email_verification_by_email(self, email):
        status = 1
        cursor = self.conn.cursor()
        query = "SELECT is_email_verified FROM user WHERE email = ?;"

        try:
            cursor.execute(query, (email,))
            is_verified = cursor.fetchone()
            return is_verified[0]

        except sqlite3.Error:
            return None

        finally:
            cursor.close()

    def set_user_email_verified_by_id(self, user_id: int, is_verified: int):
        status = 1
        cursor = self.conn.cursor()
        query = "UPDATE user SET is_email_verified = ? WHERE user_id = ?;"

        try:
            cursor.execute(query, (is_verified, user_id))
            self.conn.commit()
            status = 0

        except sqlite3.Error:
            status = 1

        finally:
            cursor.close()
            return status

    def add_new_user(self, email, password):

        cursor = self.conn.cursor()
        query = "INSERT INTO user (email, password) VALUES (?, ?);"

        try:
            cursor.execute(query, (email, password))
            self.conn.commit()
            return 0

        except sqlite3.IntegrityError:
            return 2

        except sqlite3.Error:
            return 1

        finally:
            cursor.close()

    def updateUserById(self, user_id, data):

        cursor = self.conn.cursor()
        for key, value in data.items():
            query = "update user set"

            if key == "email":
                query += " email = ? where user_id = ?;"
            elif key == "is_admin":
                query += " is_admin = ? where user_id = ?;"
            elif key == "is_verified":
                query += " is_verified = ? where user_id = ?;"
            elif key == "created_at":
                query += " created_at = ? where user_id = ?;"
            elif key == "username":
                query += " username = ? where user_id = ?;"
            else:
                query += " password = ? where user_id = ?;"
            try:
                cursor.execute(query, (value, user_id,))
                self.conn.commit()

            except sqlite3.IntegrityError:
                return 2

            except sqlite3.Error:
                return 1

        cursor.close()
        return 0

    def deleteUserById(self, user_id):
        cursor = self.conn.cursor()
        select_query = "SELECT * FROM user WHERE user_id = ?"
        cursor.execute(select_query, (user_id,))
        user = cursor.fetchone()

        if user is None:
            cursor.close()
            return None
        else:
            query = "delete from user where user_id = ?;"
            status = 0
            try:
                cursor.execute(query, (user_id,))
                self.conn.commit()
            except sqlite3.Error:
                status = 1

            finally:
                cursor.close()
                return status
