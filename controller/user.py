import re
from http.client import responses

import bcrypt
import json
import random
from flask import jsonify
from flask_jwt_extended import create_access_token

import base64
from email.message import EmailMessage

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from model.user import UserDAO
from model.verification_code import VerificationCodeDAO


CREDENTIALS_FILE = "stored_credentials.json"


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

def load_credentials():
    with open(CREDENTIALS_FILE, 'r') as f:
        data = json.load(f)
        creds = Credentials(
            token=data['token'],
            refresh_token=data['refresh_token'],
            token_uri=data['token_uri'],
            client_id=data['client_id'],
            client_secret=data['client_secret'],
            scopes=data['scopes']
        )
    return creds


def is_admin(username: str) -> bool:
    dao = UserDAO()
    response = dao.get_admin_by_name(username = username)

    if response is None: # User was not found
        return False

    if response == 1:
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
            case 0: #TODO: This could be better
                verification_code = self.generate_verification_code()
                if verification_code is not None:
                    self.send_verification_email(verification_code)
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

        hashed_password = response

        password_encoded = self.password.encode("utf-8")

        if bcrypt.checkpw(password_encoded, hashed_password):
            access_token = create_access_token(identity=self.name)
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

    def generate_verification_code(self):
        verification_code = str(random.randint(100000, 999999))
        user_dao = UserDAO()
        user_id = user_dao.get_userid_by_name(self.name)
        if user_id is not None:
            verification_code_dao = VerificationCodeDAO()
            response = verification_code_dao.add_new_verification_code(user_id, verification_code)
            if response == 0:
                return verification_code
        return None

    def verify_user(self, json_data):
        user_dao = UserDAO()
        user_id = user_dao.get_userid_by_name(self.jwt_identity)

        if user_id is None:
            return jsonify(error = "Not a valid user."), 404

        verification_code_dao = VerificationCodeDAO()
        verification_code = verification_code_dao.get_verification_code(user_id)

        if verification_code is None:
            return jsonify(error = "Could not get verification code."), 500

        given_code = json_data.get("code", None)

        if given_code is None:
            return jsonify(error="A code was not given."), 400

        if verification_code == given_code:
            response = user_dao.set_user_verified_by_id(user_id, 1)
            if response == 0:
                return jsonify("User has been verified."), 200
            else:
                return jsonify("Could not verify user"), 500

        return jsonify("Incorrect verification code."), 400


    def send_verification_email(self, verification_code):
        creds = load_credentials()

        try:
            service = build("gmail", "v1", credentials=creds)
            message = EmailMessage()

            message.set_content(f"Your RGBOARD verification code is: {verification_code}")

            message["To"] = self.email

            message["Subject"] = 'RGBOARD Verification Code'

            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

            create_message = {"raw": encoded_message}

            send_message = (
                service.users().messages().send(userId="me", body=create_message).execute()
            )

        except HttpError as e:
            send_message = None

        return send_message

