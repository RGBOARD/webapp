from flask import Flask, request, jsonify
from flask_cors import CORS

from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_jwt_extended import JWTManager

from werkzeug.middleware.proxy_fix import ProxyFix

from controller.queue_item import QueueItem
from controller.admin_action import AdminAction
from controller.display_panel import DisplayPanel
from controller.upload_history import UploadHistory
from controller.user import User
from controller.design import Design

from controller.setting import authorize_mail, authorize_callback

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)
app.secret_key = "super-secret"  # Change this
CORS(app)

app.config["JWT_SECRET_KEY"] = "super-secret"  # Change this
jwt = JWTManager(app)


@app.route('/')
def hello_world():  # put application's code here
    return 'Hello RGBOARD'


# User-----------------------------------------------------------------------------------------------------------
@app.route("/user", methods=['GET'])
@jwt_required()
def get_all_users():
    handler = User(email=get_jwt_identity())
    return handler.get_all_users()

@app.route("/user/pagination", methods=['GET'])
@jwt_required()
def get_users_paginated():
    try:

        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('size', 6))
        handler = User(email=get_jwt_identity())

        result = handler.get_all_users_paginated(page, page_size)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/user", methods=['POST'])
def create_user():
    handler = User(json_data=request.json)
    return handler.add_new_user()


@app.route("/login", methods=['POST'])
def login_user():
    handler = User(json_data=request.json)
    return handler.login_user()


@app.route("/verify-email", methods=['POST'])
@jwt_required()
def verify_user():
    handler = User(email=get_jwt_identity())
    return handler.verify_email(json_data=request.json)


@app.route("/is-email-verified", methods=['GET'])
@jwt_required()
def is_verified():
    handler = User(email=get_jwt_identity())
    return handler.get_user_email_verification_status()


@app.route("/code", methods=['POST'])
@jwt_required()
def get_verification_code():
    handler = User(email=get_jwt_identity())
    return handler.get_new_verification_code()


@app.route("/user/<int:user_id>", methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def handleUserById(user_id):
    if request.method == 'GET':
        handler = User(email=get_jwt_identity())
        return handler.getUserById(user_id)
    elif request.method == 'PUT':
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 400

            valid_keys = {'email', 'is_admin', 'is_verified', 'created_at', 'username', 'password'}
            if not any(key in data for key in valid_keys):
                return jsonify("Missing a key"), 400

            handler = User(email=get_jwt_identity())
            return handler.updateUserById(user_id, data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid data provided"), 400
    else:
        try:
            handler = User(email=get_jwt_identity())
            return handler.deleteUserById(user_id)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Couldn't delete the requested record"), 400


# Design-----------------------------------------------------------------------------------------------------------

@app.route("/design", methods=['POST'])
@jwt_required()
def upload_design():
    handler = Design(email=get_jwt_identity())
    return handler.add_new_design(title=request.form.get('title'), files=request.files)

@app.route("/design/<int:design_id>", methods=['GET'])
@jwt_required()
def get_design():
    handler = Design(email=get_jwt_identity())
    return handler.get_design(design_id=request.form.get('design_id'))

@app.route("/design/<int>:design_id/title", methods=['PUT'])
@jwt_required()
def update_design_title():
    handler = Design(email=get_jwt_identity())
    return handler.update_design_title(design_id=request.form.get('design_id'), title=request.form.get('title'))

@app.route("/design/<int>:design_id/image", methods=['PUT'])
@jwt_required()
def update_design_image():
    handler = Design(email=get_jwt_identity())
    return handler.update_design_image(design_id=request.form.get('design_id'), image=request.files.get('image'))

@app.route("/design/<int>:design_id/approval", methods=['PUT'])
@jwt_required()
def update_design_approval():
    handler = Design(email=get_jwt_identity())
    return handler.update_design_approval(design_id=request.form.get('design_id'),
                                          approval=request.form.get('approval'))
@app.route("/design/<int>:design_id/status", methods=['PUT'])
@jwt_required()
def update_design_status():
    handler = Design(email=get_jwt_identity())
    return handler.update_design_status(design_id=request.form.get('design_id'), status=request.form.get('status'))

@app.route("/design/approved", methods=['GET'])
@jwt_required()
def get_approved_designs():
    handler = Design(email=get_jwt_identity())
    approved = handler.getApprovedDesigns()
    return jsonify(approved), 200

#AdminAction-----------------------------------------------------------------------------------------------------------
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
                return jsonify("No data provided"), 400

            valid_keys = {
                'user_id',
                'target_user_id',
                'target_design_id',
                'target_queue_id',
                'action_type',
                'action_details',
                'timestamp'
            }
            if not any(key in data for key in valid_keys):
                return jsonify("Missing a key"), 400

            handler = AdminAction()
            return handler.addNewAdminAction(data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid JSON data provided"), 400


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
                return jsonify("No data provided"), 400

            valid_keys = {
                'user_id',
                'target_user_id',
                'target_design_id',
                'target_queue_id',
                'action_type',
                'action_details',
                'timestamp'
            }
            if not any(key in data for key in valid_keys):
                return jsonify("Missing a key"), 400

            handler = AdminAction()
            return handler.updateAdminActionById(action_id, data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid data provided"), 400

    elif request.method == 'DELETE':
        # DELETE
        try:
            handler = AdminAction()
            return handler.deleteAdminActionById(action_id)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Cannot delete record because it is referenced by other records"), 400


# QueueItem-----------------------------------------------------------------------------------------------------------
@app.route("/queue_item", methods=['GET', 'POST'])
def handleQueueItem():
    if request.method == 'GET':
        handler = QueueItem()
        return handler.getAllQueueItem()
    else:
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 400

            valid_keys = {'design_id', 'panel_id', 'start_time', 'end_time', 'display_duration', 'display_order',
                          'scheduled', 'scheduled_at'}
            if not any(key in data for key in valid_keys):
                return jsonify("Missing a key"), 400

            handler = QueueItem()
            return handler.addNewQueueItem(data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid JSON data provided:"), 400


@app.route("/queue_item/<int:queue_id>", methods=['GET', 'PUT', 'DELETE'])
def handleQueueItemById(queue_id):
    if request.method == 'GET':
        handler = QueueItem()
        return handler.getQueueItemById(queue_id)
    elif request.method == 'PUT':
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 400

            valid_keys = {'design_id', 'panel_id', 'start_time', 'end_time', 'display_duration', 'display_order',
                          'scheduled', 'scheduled_at'}
            if not any(key in data for key in valid_keys):
                return jsonify("Missing a key"), 400

            handler = QueueItem()
            return handler.updateQueueItemById(queue_id, data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid data provided"), 400
    else:
        try:
            handler = QueueItem()
            return handler.deleteQueueItemById(queue_id)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Can not delete record because it is referenced by other records"), 400



@app.route("/queue_item/scheduled", methods=['GET'])
@jwt_required()
def get_scheduled_designs():
    # If needed, you can also pass the identity to restrict results
    # For example: identity = get_jwt_identity()
    handler = QueueItem()  # Assumes your QueueItem controller exists similarly to Design.
    scheduled_items = handler.getScheduledDesigns()
    return jsonify(scheduled_items), 200



# Display Panel-----------------------------------------------------------------------------------------------------------
@app.route("/display_panel", methods=['GET', 'POST'])
def handleDisplayPanel():
    if request.method == 'GET':
        handler = DisplayPanel()
        return handler.getAllDisplayPanel()
    else:  # POST
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 400

            valid_keys = {'location', 'status'}
            if not any(key in data for key in valid_keys):
                return jsonify("Missing a key"), 400

            handler = DisplayPanel()
            return handler.addNewDisplayPanel(data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid JSON data provided"), 400


@app.route("/display_panel/<int:panel_id>", methods=['GET', 'PUT', 'DELETE'])
def handleDisplayPanelById(panel_id):
    if request.method == 'GET':
        handler = DisplayPanel()
        return handler.getDisplayPanelById(panel_id)
    elif request.method == 'PUT':
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 400

            # We only have 'location' & 'status', but let's do a soft check:
            valid_keys = {'location', 'status'}
            # If you want partial updates, you can remove this check
            # or adapt it as needed.
            if not any(key in data for key in valid_keys):
                return jsonify("Missing a key"), 400

            handler = DisplayPanel()
            return handler.updateDisplayPanelById(panel_id, data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid data provided"), 400
    else:  # DELETE
        try:
            handler = DisplayPanel()
            return handler.deleteDisplayPanelById(panel_id)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Cannot delete record because it is referenced by other records"), 400


# UploadHistory-----------------------------------------------------------------------------------------------------------
@app.route("/upload_history", methods=['GET', 'POST'])
def handleUploadHistory():
    if request.method == 'GET':
        handler = UploadHistory()
        return handler.getAllUploadHistory()
    else:  # POST
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 400

            valid_keys = {'design_id', 'attempt_time', 'file_size', 'status'}
            if not any(key in data for key in valid_keys):
                return jsonify("Missing a key"), 400

            handler = UploadHistory()
            return handler.addNewUploadHistory(data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid JSON data provided"), 400


@app.route("/upload_history/<int:history_id>", methods=['GET', 'PUT', 'DELETE'])
def handleUploadHistoryById(history_id):
    if request.method == 'GET':
        handler = UploadHistory()
        return handler.getUploadHistoryById(history_id)
    elif request.method == 'PUT':
        try:
            data = request.json
            if not data:
                return jsonify("No data provided"), 400

            # For partial updates, you might remove this check or adapt it
            valid_keys = {'design_id', 'attempt_time', 'file_size', 'status'}
            if not any(key in data for key in valid_keys):
                return jsonify("Missing a key"), 400

            handler = UploadHistory()
            return handler.updateUploadHistoryById(history_id, data)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Invalid data provided"), 400
    else:  # DELETE
        try:
            handler = UploadHistory()
            return handler.deleteUploadHistoryById(history_id)
        except Exception as e:
            print("Error processing request:", e)
            return jsonify("Cannot delete record because it is referenced by other records"), 400


# Settings-----------------------------------------------------------------------------------------------------------
@app.route("/settings/mail")
def authorize():
    # TODO: Check that an user is admin to set the email system.
    return authorize_mail()


@app.route("/settings/mail/oauth2callback")
def callback():
    return authorize_callback()

if __name__ == '__main__':
    app.run()
