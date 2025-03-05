import sqlite3

class UserDAO:

    def __init__(self):
        database_path = 'data.db'
        print("Connecting to SQLite database at:", database_path)

        self.conn = sqlite3.connect(database_path)

    def getAllUser(self):
        cursor = self.conn.cursor()
        query = "select * from user;"
        cursor.execute(query)
        result = []
        for row in cursor:
            result.append(row)
        cursor.close()
        return result

    def getUserById(self, user_id):
        cursor = self.conn.cursor()

        query = "select * from user where user_id = ?;"
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def addNewUser(self, email, is_admin, is_verified, created_at, username, password):

        cursor = self.conn.cursor()
        query = "insert into user (email, is_admin, is_verified, created_at, username, password) values (?, ?, ?, ?, ?, ?);"
        cursor.execute(query, (email, is_admin, is_verified, created_at, username, password))
        self.conn.commit()
        query = "select * from user order by user_id desc limit 1"
        cursor.execute(query)
        result = cursor.fetchone()
        cursor.close()
        return result

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