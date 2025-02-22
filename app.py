from flask import Flask, request, jsonify
import sqlite3
from controller.user import User
from controller.design import Design


app = Flask(__name__)

# Database connection function
def get_db_connection():
    conn = sqlite3.connect('data.db')  # Ensure this is the correct path
    conn.row_factory = sqlite3.Row  # Enables fetching data as dictionaries
    return conn

@app.route('/')
def hello_world():  # put application's code here
    return 'Hello RGBOARD'

# User-----------------------------------------------------------------------------------------------------------
@app.route("/user", methods=['GET', 'POST'])
def handleUser():
    if request.method == 'GET':
        handler = User()
        return handler.getAllUser()
    else:
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 404

            valid_keys = {'email','is_admin', 'is_verified', 'created_at', 'username', 'password'}
            if not all(key in data for key in valid_keys):
                return jsonify("Missing a key"), 404

            handler = User()
            return handler.addNewUser(data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid JSON data provided:"), 404


@app.route("/user/<int:user_id>", methods=['GET', 'PUT', 'DELETE'])
def handleUserById(user_id):
    if request.method == 'GET':
        handler = User()
        return handler.getUserById(user_id)
    elif request.method == 'PUT':
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 404

            valid_keys = {'email','is_admin', 'is_verified', 'created_at', 'username', 'password'}
            if not all(key in data for key in valid_keys):
                return jsonify("Missing a key"), 404

            handler = User()
            return handler.updateUserById(user_id, data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid data provided"), 404
    else:
        try:
            handler = User()
            return handler.deleteUserById(user_id)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Can not delete record because it is referenced by other records"), 404

# Design-----------------------------------------------------------------------------------------------------------
@app.route("/design", methods=['GET', 'POST'])
def handleDesign():
    if request.method == 'GET':
        handler = Design()
        return handler.getAllDesign()
    else:
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 404

            valid_keys = {'user_id', 'title', 'image_path', 'created_at', 'is_approved', 'status'}
            if not all(key in data for key in valid_keys):
                return jsonify("Missing a key"), 404

            handler = Design()
            return handler.addNewDesign(data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid JSON data provided:"), 404


@app.route("/design/<int:design_id>", methods=['GET', 'PUT', 'DELETE'])
def handleDesignById(design_id):
    if request.method == 'GET':
        handler = Design()
        return handler.getDesignById(design_id)
    elif request.method == 'PUT':
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 404

            valid_keys = {'user_id', 'title', 'image_path', 'created_at', 'is_approved', 'status'}
            if not all(key in data for key in valid_keys):
                return jsonify("Missing a key"), 404

            handler = Design()
            return handler.updateDesignById(design_id, data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid data provided"), 404
    else:
        try:
            handler = Design()
            return handler.deleteDesignById(design_id)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Can not delete record because it is referenced by other records"), 404





if __name__ == '__main__':
    app.run()

