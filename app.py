from flask import Flask, request, jsonify
from controller.admin_action import AdminAction
from controller.display_panel import DisplayPanel
from controller.upload_history import UploadHistory
from controller.user import User
from controller.design import Design

app = Flask(__name__)

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
@app.route("/upload_history", methods=['GET', 'POST'])
def handleUploadHistory():
    if request.method == 'GET':
        handler = UploadHistory()
        return handler.getAllUploadHistory()
    else:  # POST
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 404

            valid_keys = {'design_id', 'attempt_time', 'file_size', 'status'}
            if not all(key in data for key in valid_keys):
                return jsonify("Missing a key"), 404

            handler = UploadHistory()
            return handler.addNewUploadHistory(data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid JSON data provided"), 404

@app.route("/upload_history/<int:history_id>", methods=['GET', 'PUT', 'DELETE'])
def handleUploadHistoryById(history_id):
    if request.method == 'GET':
        handler = UploadHistory()
        return handler.getUploadHistoryById(history_id)
    elif request.method == 'PUT':
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 404

            # For partial updates, you might remove this check or adapt it
            valid_keys = {'design_id', 'attempt_time', 'file_size', 'status'}
            if not any(key in data for key in valid_keys):
                return jsonify("Missing a key"), 404

            handler = UploadHistory()
            return handler.updateUploadHistoryById(history_id, data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid data provided"), 404
    else:  # DELETE
        try:
            handler = UploadHistory()
            return handler.deleteUploadHistoryById(history_id)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Cannot delete record because it is referenced by other records"), 404


if __name__ == '__main__':
    app.run()

