from flask import Flask, request, jsonify
import sqlite3
from controller.admin_action import AdminAction
from controller.display_panel import DisplayPanel

app = Flask(__name__)

# Database connection function
def get_db_connection():
    conn = sqlite3.connect('data.db')  # Ensure this is the correct path
    conn.row_factory = sqlite3.Row  # Enables fetching data as dictionaries
    return conn
@app.route('/')
def hello_world():  # put application's code here
    return 'Hello RGBOARD'


# AdminAction
@app.route("/admin_action", methods=['GET', 'POST'])
def handleAdminAction():
    if request.method == 'GET':
        # GET ALL
        handler = AdminAction()
        return handler.getAllAdminAction()
    elif request.method == 'POST':
        # CREATE NEW
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 404

            valid_keys = {
                'user_id',
                'target_user_id',
                'target_design_id',
                'target_queue_id',
                'action_type',
                'action_details',
                'timestamp'
            }
            if not all(key in data for key in valid_keys):
                return jsonify("Missing a key"), 404

            handler = AdminAction()
            return handler.addNewAdminAction(data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid JSON data provided"), 404

@app.route("/admin_action/<int:action_id>", methods=['GET', 'PUT', 'DELETE'])
def handleAdminActionById(action_id):
    if request.method == 'GET':
        # GET BY ID
        handler = AdminAction()
        return handler.getAdminActionById(action_id)

    elif request.method == 'PUT':
        # UPDATE
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 404

            valid_keys = {
                'user_id',
                'target_user_id',
                'target_design_id',
                'target_queue_id',
                'action_type',
                'action_details',
                'timestamp'
            }
            if not all(key in data for key in valid_keys):
                return jsonify("Missing a key"), 404

            handler = AdminAction()
            return handler.updateAdminActionById(action_id, data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid data provided"), 404

    elif request.method == 'DELETE':
        # DELETE
        try:
            handler = AdminAction()
            return handler.deleteAdminActionById(action_id)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Cannot delete record because it is referenced by other records"), 404


# Display Panel
@app.route("/display_panel", methods=['GET', 'POST'])
def handleDisplayPanel():
    if request.method == 'GET':
        handler = DisplayPanel()
        return handler.getAllDisplayPanel()
    else:  # POST
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 404

            valid_keys = {'location', 'status'}
            if not all(key in data for key in valid_keys):
                return jsonify("Missing a key"), 404

            handler = DisplayPanel()
            return handler.addNewDisplayPanel(data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid JSON data provided"), 404

@app.route("/display_panel/<int:panel_id>", methods=['GET', 'PUT', 'DELETE'])
def handleDisplayPanelById(panel_id):
    if request.method == 'GET':
        handler = DisplayPanel()
        return handler.getDisplayPanelById(panel_id)
    elif request.method == 'PUT':
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 404

            # We only have 'location' & 'status', but let's do a soft check:
            valid_keys = {'location', 'status'}
            # If you want partial updates, you can remove this check
            # or adapt it as needed.
            if not any(key in data for key in valid_keys):
                return jsonify("Missing a key"), 404

            handler = DisplayPanel()
            return handler.updateDisplayPanelById(panel_id, data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid data provided"), 404
    else:  # DELETE
        try:
            handler = DisplayPanel()
            return handler.deleteDisplayPanelById(panel_id)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Cannot delete record because it is referenced by other records"), 404

# UploadHistory


if __name__ == '__main__':
    app.run()

