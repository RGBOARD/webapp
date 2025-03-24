import sqlite3
import datetime

class UserDAO:

    def __init__(self):
        database_path = 'data.db'
        self.conn = sqlite3.connect(database_path)

    def get_all_users(self):
        cursor = self.conn.cursor()
        query = "select * from user;"
        cursor.execute(query)
        result = []
        for row in cursor:
            result.append(row)
        cursor.close()
        return result

    def get_user_by_id(self, user_id):
        cursor = self.conn.cursor()
        query = "select * from user where user_id = ?;"
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def get_password_by_name(self, username):
        cursor = self.conn.cursor()
        query = "SELECT password FROM user WHERE username = ?;"

        try:
            cursor.execute(query, (username, ))
            return cursor.fetchone()

        except sqlite3.Error:
            return None

        finally:
            cursor.close()

    def get_admin_by_name(self, username):
        cursor = self.conn.cursor()
        query = "SELECT is_admin FROM user WHERE username = ?;"

        try:
            cursor.execute(query, (username, ))
            return cursor.fetchone()

        except sqlite3.Error:
            return None

        finally:
            cursor.close()

    def add_new_user(self,username, email, password):

        cursor = self.conn.cursor()
        query = "INSERT INTO user (username, email, password) VALUES (?, ?, ?);"

        try:
            cursor.execute(query, (username, email, password))
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
            cursor.execute(query, (value,user_id,))
            self.conn.commit()
        query = "select * from user where user_id = ?;"
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

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
            cursor.execute(query, (user_id,))
            self.conn.commit()
            result = user_id
            cursor.close()
            return result