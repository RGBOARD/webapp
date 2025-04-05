import re
import bcrypt
from flask import jsonify
from flask_jwt_extended import create_access_token

from model.user import UserDAO


def make_json_one(user):
    result = {}
    result['user_id'] = user[0]
    result['username'] = user[1]
    result['email'] = user[3]
    result['is_admin'] = user[4]
    result['is_verified'] = user[5]
    result['created_at'] = user[6]
    result['updated_at'] = user[7]

    return result

def make_json(tuples):
    result = []
    for t in tuples:
        D = {}
        D['user_id'] = t[0]
        D['username'] = t[1]
        D['email'] = t[3]
        D['is_admin'] = t[4]
        D['is_verified'] = t[5]
        D['created_at'] = t[6]
        D['updated_at'] = t[7]
        result.append(D)

    return result


def is_admin(username: str) -> bool:
    dao = UserDAO()
    response = dao.get_admin_by_name(username = username)

    if response is None: # User was not found
        return False

    if response[0] == 1:
        return True

    return False

class User:
    def __init__(self, jwt = None, json = None):
        if jwt:
            self.jwt_identity = jwt
        else:
            self.name = json.get("username", None)
            self.password = json.get("password", None)
            self.email = json.get("email", None)

    def get_all_users(self):
        if self.jwt_identity is not None:
            if is_admin(self.jwt_identity):
                model = UserDAO()
                response = model.get_all_users()
                body = make_json(response)
                return body, 200
            else:
               return jsonify(error="Unauthorized. Not admin."), 401

        else:
            return jsonify(error="Unauthorized. No token."), 401

    def get_user_by_username(self):
        dao = UserDAO
        user = dao.get_user_by_username(self.name)
        if not user:
            return jsonify("Not Found"), 404
        else:
            result = make_json_one(user)
            return result



    def add_new_user(self):
        """

        :return:
        """

        # check for missing attributes
        if self.name is None:
            return jsonify(error="No username provided"), 400
        if self.email is None:
            return jsonify(error="No email provided"), 400
        if self.password is None:
            return jsonify(error="No password provided"), 400

        # enforce rules with regular expressions
        name_rule = r'^(?!.*[_.]{2})[a-z][a-z0-9._]{2,15}(?<![_.])$'
        if not bool(re.match(name_rule, self.name)):
            return jsonify(error="Invalid username"), 400

        email_rule = r'^[a-zA-Z0-9._%+-]+@upr\.edu$'
        if not bool(re.match(email_rule, self.email)):
            return jsonify(error="Invalid email"), 400

        password_rule = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:\'",.<>?/\\|`~]).{8,32}$'
        if not bool(re.match(password_rule, self.password)):
            return jsonify(error="Invalid password"), 400

        # encode password into an array of bytes
        password_encoded = self.password.encode("utf-8")

        # get the salt
        salt = bcrypt.gensalt()

        # salt and hash the password
        password_hash = bcrypt.hashpw(password_encoded, salt)

        dao = UserDAO()

        response = dao.add_new_user(self.name, self.email, password_hash)

        match response:
            case 0:
                return jsonify("User created"), 201
            case 2:
                return jsonify(error="Username already exists"), 409

        return jsonify(error="Couldn't create user"), 500

    def login_user(self):
        # check for missing attributes
        if self.name is None:
            return jsonify(error="Username not provided"), 400

        if self.password is None:
            return jsonify(error="Password not provided"), 400

        # get password from user
        dao = UserDAO()
        response = dao.get_password_by_name(self.name)

        if response is None:
            return jsonify(error="Couldn't find user"), 400

        hashed_password = response[0]

        password_encoded = self.password.encode("utf-8")

        user_id = dao.get_user_by_username(self.name)[0]

        if bcrypt.checkpw(password_encoded, hashed_password):
            access_token = create_access_token(identity=self.name, additional_claims={"user_id":user_id})
            return jsonify(access_token=access_token), 200
        else:
            return jsonify(error="Wrong password"), 400

    def getUserById(self, user_id):
        dao = UserDAO()
        user = dao.getUserById(user_id)
        if not user:
            return jsonify("Not Found"), 404
        else:
            result = make_json_one(user)
            return result

    def updateUserById(self, user_id, data):
        dao = UserDAO()
        user = dao.updateUserById(user_id, data)
        if not User:
            return jsonify("Not Found"), 404
        else:
            result = make_json_one(user)
            return result

    def deleteUserById(self, user_id):
        dao = UserDAO()
        user = dao.deleteUserById(user_id)
        if not user:
            return jsonify("Not Found"), 404
        else:
            return jsonify("Successfully deleted User with ID " + str(user) + "!"), 200
