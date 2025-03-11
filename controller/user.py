from flask import jsonify

from model.user import UserDAO

class User:

        def make_json(self, tuples):
            result = []
            for t in tuples:
                D = {}
                D['user_id'] = t[0]
                D['email'] = t[1]
                D['is_admin'] = t[2]
                D['is_verified'] = t[3]
                D['created_at'] = t[4]
                D['username'] = t[5]
                D['password'] = t[6]
                result.append(D)

            return result

        def make_json_one(self, user):
            result = {}
            result['user_id'] = user[0]
            result['email'] = user[1]
            result['is_admin'] = user[2]
            result['is_verified'] = user[3]
            result['created_at'] = user[4]
            result['username'] = user[5]
            result['password'] = user[6]

            return result

        def getAllUser(self):
            model = UserDAO()
            result = model.getAllUser()
            answer = self.make_json(result)
            return answer

        def addNewUser(self, data):

            email = data['email']
            username = data['username']
            password = data['password']
            dao = UserDAO()
            user = dao.addNewUser(email, username, password)
            result = self.make_json_one(user)
            return result

        def getUserById(self, user_id):
            dao = UserDAO()
            user = dao.getUserById(user_id)
            if not user:
                return jsonify("Not Found"), 404
            else:
                result = self.make_json_one(user)
                return result

        def updateUserById(self, user_id, data):
            dao = UserDAO()
            user = dao.updateUserById(user_id, data)
            if not User:
                return jsonify("Not Found"), 404
            else:
                result = self.make_json_one(user)
                return result

        def deleteUserById(self, user_id):
            dao = UserDAO()
            user = dao.deleteUserById(user_id)
            if not user:
                return jsonify("Not Found"), 404
            else:
                return jsonify("Successfully deleted User with ID " + str(user) + "!"), 200