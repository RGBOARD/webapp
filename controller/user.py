import base64
import json
import random
import re
import string
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

import bcrypt
from flask import jsonify
from flask_jwt_extended import create_access_token
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from model.temp_password import TempPasswordDAO
from model.user import UserDAO
from model.verification_code import VerificationCodeDAO

# File with credentials for sending emails via Gmail API
CREDENTIALS_FILE = "stored_credentials.json"


def make_json_one(user):
    result = {}
    result['user_id'] = user[0]
    result['email'] = user[1]
    result['is_admin'] = user[3]
    result['is_verified'] = user[4]
    result['created_at'] = user[5]
    result['updated_at'] = user[6]

    return result


def make_json(tuples):
    result = []
    for t in tuples:
        D = {
            'user_id': t['user_id'],
            'email': t['email'],
            'is_admin': t['is_admin'],
            'is_verified': t['is_verified'],
            'created_at': t['created_at'],
            'updated_at': t['updated_at']
        }
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


def generate_temp_password(min_length=8, max_length=32):
    if min_length < 4:
        raise ValueError("Minimum length must be at least 4")

    # Character sets
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    letters = uppercase + lowercase
    digits = string.digits
    special_chars = "!@#$%^&*()-_=+[]{};:'\",.<>?/\\|`~"

    all_chars = letters + digits + special_chars

    # Ensure the first character is a letter
    first_char = random.choice(letters)

    # Ensure at least one of each required type
    digit = random.choice(digits)
    special = random.choice(special_chars)
    letter = random.choice(letters)

    total_length = random.randint(min_length, max_length)

    # Remaining characters (excluding the first letter and the three guaranteed chars)
    remaining_length = total_length - 4
    remaining_chars = [random.choice(all_chars) for _ in range(remaining_length)]

    # Build the password
    password_list = [letter, digit, special] + remaining_chars
    random.shuffle(password_list)

    # Prepend the first char (letter)
    password = first_char + ''.join(password_list)
    return password


class User:
    def __init__(self, email=None, json_data=None):
        if email:
            self.email = email
        else:
            self.email = json_data.get("email", None)
            self.password = json_data.get("password", None)

    def is_admin(self) -> bool:
        dao = UserDAO()
        response = dao.get_admin_by_email(email=self.email)

        if response is None:  # User was not found
            return False

        if response == 1:
            return True

        return False

    def is_email_verified(self) -> bool:
        dao = UserDAO()
        response = dao.get_email_verification_by_email(email=self.email)

        if response is None:  # User was not found
            return False

        if response == 1:
            return True

        return False

    def get_all_users(self):
        if self.email is not None:
            if self.is_admin():
                model = UserDAO()
                response = model.get_all_users()
                body = make_json(response)
                return body, 200
            else:
                return jsonify(error="Unauthorized. Not admin."), 401

        else:
            return jsonify(error="Unauthorized. No token."), 401

    def get_all_users_paginated(self, page, page_size):
        if self.email is not None:
            if self.is_admin():

                model = UserDAO()
                result = model.get_all_users_paginated(page, page_size)
                body = {
                    "users": make_json(result["users"]),
                    "total": result["total"],
                    "pages": result["pages"],
                    "page": result["page"]
                }
                return body
            else:
                return jsonify(error="Unauthorized. Not admin."), 401
        else:
            return jsonify(error="Unauthorized. No token."), 401

    def get_user_email_verification_status(self):
        if self.email is not None:
            if self.is_email_verified():
                return jsonify(message="User is verified."), 200
            else:
                return jsonify(error="User is not verified."), 403
        else:
            return jsonify(error="Missing authentication."), 401

    ## INTERNAL USE ##
    def get_user_id(self):
        if self.email is not None:
            model = UserDAO()
            user_id = model.get_userid_by_email(self.email)
            if user_id is not None:
                return user_id
            else:
                return None
        else:
            return None

    def add_new_user(self):
        """

        :return:
        """

        # check for missing attributes00
        if self.email is None:
            return jsonify(error="No email provided"), 400
        if self.password is None:
            return jsonify(error="No password provided"), 400

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

        response = dao.add_new_user(self.email, password_hash)

        match response:
            case 0:  # TODO: This could be better written
                verification_code = self.generate_verification_code()
                if verification_code is not None:
                    self.send_verification_email(verification_code)
                return jsonify("User created"), 201
            case 2:
                return jsonify(error="Email already in use."), 409

        return jsonify(error="Couldn't create user"), 500

    def login_user(self):
        # check for missing attributes
        if self.email is None:
            return jsonify(error="Email not provided"), 400

        if self.password is None:
            return jsonify(error="Password not provided"), 400

        # get password from user
        dao = UserDAO()
        response = dao.get_password_by_email(self.email)

        if response is None:
            return jsonify(error="Couldn't find user"), 400

        hashed_password = response

        password_encoded = self.password.encode("utf-8")
        is_admin = self.is_admin()
        user_id = self.get_user_id()
        if bcrypt.checkpw(password_encoded, hashed_password):
            access_token = create_access_token(identity=self.email,
                                               additional_claims={"user_id": user_id, "role": is_admin})
            return jsonify(access_token=access_token), 200
        else:
            return jsonify(error="Wrong password"), 400

    def get_user_by_id(self, user_id):
        dao = UserDAO()
        user = dao.get_user_by_id(user_id)
        if not user:
            return jsonify("Not Found"), 404
        else:
            result = make_json_one(user)
            return result

    def updateUserById(self, user_id, data):

        dao = UserDAO()
        response = dao.updateUserById(user_id, data)
        if not User:
            return jsonify("Not Found"), 404
        else:
            match response:
                case 0:
                    return jsonify(message="User Updated"), 201
                case 2:
                    return jsonify(error="User Conflict"), 409

            return jsonify(error="Couldn't update user"), 500

    def deleteUserById(self, user_id):
        dao = UserDAO()
        user = dao.deleteUserById(user_id)
        if user:
            return jsonify("Not Found"), 404
        else:
            return jsonify("Successfully deleted User!"), 200

    def generate_verification_code(self):
        verification_code = str(random.randint(100000, 999999))
        user_dao = UserDAO()
        user_id = user_dao.get_userid_by_email(self.email)
        if user_id is not None:
            verification_code_dao = VerificationCodeDAO()
            response = verification_code_dao.add_new_verification_code(user_id, verification_code)
            if response == 0:
                return verification_code
        return None

    def get_new_verification_code(self):
        if self.is_email_verified():
            return jsonify(error="User is already verified."), 400

        user_dao = UserDAO()
        user_id = user_dao.get_userid_by_email(self.email)

        verification_code_dao = VerificationCodeDAO()

        time_since_str = verification_code_dao.get_verification_code_time(user_id)

        if time_since_str:
            try:
                time_since = datetime.strptime(time_since_str, "%Y-%m-%d %H:%M:%S")
                time_since = time_since.replace(tzinfo=timezone.utc)
            except ValueError:
                return jsonify(error="Invalid timestamp format."), 500

            now = datetime.now(timezone.utc)
            cooldown = timedelta(seconds=60)

            if now - time_since < cooldown:
                seconds_remaining = int((cooldown - (now - time_since)).total_seconds())
                return jsonify(error=f"Please wait {seconds_remaining} seconds before requesting a new code."), 429

            is_deleted = verification_code_dao.delete_verification_code(user_id)

            if is_deleted != 0:
                return jsonify(error="Couldn't remove previous code"), 500

            verification_code = self.generate_verification_code()

            if verification_code is None:
                return jsonify(error="Couldn't create new code"), 500

            self.send_verification_email(verification_code)
            return jsonify(message="New verification code created."), 201

        else:
            verification_code = self.generate_verification_code()
            if verification_code is not None:
                self.send_verification_email(verification_code)
                return jsonify(message="New verification code created."), 201

        return jsonify(error="Couldn't create new code"), 500

    def get_new_temp_password(self):
        user_dao = UserDAO()
        user_id = user_dao.get_userid_by_email(self.email)

        if user_id is None:
            return jsonify(error="Couldn't find user"), 404

        tp_dao = TempPasswordDAO()

        # check if there is already a temp password and make the user wait for a new one if so
        time_since_str = tp_dao.get_password_timestamp(user_id)

        if time_since_str:  # a temp password was created before and never used
            try:
                time_since = datetime.strptime(time_since_str, "%Y-%m-%d %H:%M:%S")
                time_since = time_since.replace(tzinfo=timezone.utc)
            except ValueError:
                return jsonify(error="Invalid timestamp format."), 500

            now = datetime.now(timezone.utc)
            cooldown = timedelta(seconds=60)

            if now - time_since < cooldown:
                seconds_remaining = int((cooldown - (now - time_since)).total_seconds())
                return jsonify(
                    error=f"Please wait {seconds_remaining} seconds before requesting a new temporary password."), 429

            # delete the old one and get a new one
            is_deleted = tp_dao.delete_temp_password(user_id)

            if is_deleted != 0:
                return jsonify(error="Couldn't delete previous temporary password."), 500

        temp_password = generate_temp_password(min_length=8, max_length=10)

        # turn into bytes
        encoded_temp_password = temp_password.encode("utf-8")

        salt = bcrypt.gensalt()

        # salt and hash the temp password
        temp_password_hash = bcrypt.hashpw(encoded_temp_password, salt)

        response = tp_dao.add_temp_password(user_id, temp_password_hash)

        if response != 0:
            return jsonify(error="Couldn't create a new temporary password"), 500

        self.send_temp_password(temp_password)

        return jsonify(message="Temporary Password Created"), 201

    def verify_email(self, json_data):
        user_dao = UserDAO()
        user_id = user_dao.get_userid_by_email(self.email)

        if user_id is None:
            return jsonify(error="Not a valid user."), 404

        verification_code_dao = VerificationCodeDAO()
        verification_code = verification_code_dao.get_verification_code(user_id)

        if verification_code is None:
            return jsonify(error="Could not get verification code."), 500

        given_code = json_data.get("code", None)

        if given_code is None:
            return jsonify(error="A code was not given."), 400

        if verification_code == given_code:
            response = user_dao.set_user_email_verified_by_id(user_id, 1)
            if response == 0:
                verification_code_dao.delete_verification_code(user_id)
                return jsonify("User has been verified."), 200
            else:
                return jsonify(error="Could not verify user"), 500

        return jsonify(error="Incorrect verification code."), 400

    def reset_password(self, password, new_password):
        user_dao = UserDAO()
        user_id = user_dao.get_userid_by_email(self.email)

        if user_id is None:
            return jsonify(error="Not a valid user"), 404

        tp_dao = TempPasswordDAO()
        temp_password_hashed = tp_dao.get_temp_password(user_id)

        if temp_password_hashed is None:
            return jsonify(error="Couldn't get temporary password"), 404

        password_encoded = password.encode("utf-8")

        if not bcrypt.checkpw(password_encoded, temp_password_hashed):
            return jsonify(error="Wrong temporary password"), 403

        errors = []
        if len(new_password) < 8 or len(new_password) > 32:
            errors.append("Password must be between 8 and 32 characters.")
        if not re.search(r'[A-Z]', new_password):
            errors.append("Password must include at least one uppercase letter.")
        if not re.search(r'[a-z]', new_password):
            errors.append("Password must include at least one lowercase letter.")
        if not re.search(r'\d', new_password):
            errors.append("Password must include at least one number.")
        if not re.search(r'[!@#$%^&*()\-_=+\[\]{};:\'",.<>?/\\|`~]', new_password):
            errors.append("Password must include at least one special character (!@#$%^&* etc).")

        if errors:
            return jsonify(error=" ".join(errors)), 400

        new_password_encoded = new_password.encode("utf-8")

        salt = bcrypt.gensalt()

        new_password_hash = bcrypt.hashpw(new_password_encoded, salt)

        response = user_dao.set_user_password(user_id, new_password_hash)

        if response != 0:
            return jsonify(error="Couldn't reset password."), 500

        # clean up but don't care
        tp_dao.delete_temp_password(user_id)

        return jsonify(message="Password has been reset"), 200

    def send_verification_email(self, verification_code):
        try:
            creds = load_credentials()
        except FileNotFoundError:
            # Credentials missing. Don't do anything
            return

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

    def send_temp_password(self, temp_password):
        try:
            creds = load_credentials()
        except FileNotFoundError:
            # Credentials missing. Don't do anything
            return

        try:
            service = build("gmail", "v1", credentials=creds)
            message = EmailMessage()

            content = (
                f"Your RGBOARD temporary password is: {temp_password}\n\n"
                "Please use it to reset your password as soon as possible.\n\n"
                "If you did not request a temporary password, please ignore this email and contact an RGBoard admin."
            )

            message.set_content(content)

            message["To"] = self.email
            message["Subject"] = 'RGBOARD Temporary Password'

            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

            create_message = {"raw": encoded_message}

            send_message = (
                service.users().messages().send(userId="me", body=create_message).execute()
            )

        except HttpError:
            send_message = None

        return send_message
