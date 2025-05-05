import signal
import sys

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.middleware.proxy_fix import ProxyFix

from controller.admin_action import AdminAction
from controller.design import Design
from controller.rotation_system import RotationSystem
from controller.setting import authorize_mail, authorize_callback
from controller.upload_history import UploadHistory
from controller.user import User
from services.scheduler_service import scheduler_service


def create_app():
    app = Flask(__name__)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)
    app.secret_key = "super-secret"  # Change this in production
    CORS(app)
    app.config["JWT_SECRET_KEY"] = "super-secret"  # Change this in production
    jwt = JWTManager(app)

    # Register signal handlers for clean shutdown
    def signal_handler(sig, frame):
        print(f"Received shutdown signal {sig}")
        # Since scheduler_service has its own shutdown logic in atexit handler,
        # we don't need to manually shut it down here
        sys.exit(0)

    # Register the signal handler for SIGINT (Ctrl+C) and SIGTERM
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Initialize the scheduler service
    try:
        print("Initializing scheduler service")
        scheduler_service.init_app(app)
        # No need to register a separate atexit handler here
        # The scheduler_service already registers its own in init_app
    except Exception as e:
        print(f"Failed to initialize scheduler: {e}")

    return app


app = create_app()


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
    return handler.add_new_design(
        title=request.form.get('title'),
        pixel_data=request.form.get('pixel_data')
    )


@app.route("/design/<int:design_id>/image", methods=['PUT'])
@jwt_required()
def update_design_image(design_id):
    handler = Design(email=get_jwt_identity())
    return handler.update_design_image(
        design_id=design_id,
        pixel_data=request.form.get('pixel_data')
    )


# @app.route("/design/<int:design_id>", methods=['GET'])
# @jwt_required()
# def get_design():
#     handler = Design(email=get_jwt_identity())
#     return handler.get_design(design_id=request.form.get('design_id'))

@app.route("/design/<int:design_id>", methods=['GET'])
@jwt_required()
def get_design(design_id):
    handler = Design(email=get_jwt_identity())
    return handler.get_design(design_id=design_id)


@app.route("/designs", methods=['GET'])
@jwt_required()
def get_designs():
    page = int(request.args.get('page', 1))  # default 1
    page_size = int(request.args.get('page_size', 10))  # default 10

    handler = Design(email=get_jwt_identity())
    return handler.get_user_designs(page=page, page_size=page_size)


@app.route("/design/<int:design_id>/title", methods=['PUT'])
@jwt_required()
def update_design_title(design_id):
    handler = Design(email=get_jwt_identity())
    return handler.update_design_title(design_id=design_id, title=request.form.get('title'))


@app.route("/design/<int:design_id>/approval", methods=['PUT'])
@jwt_required()
def update_design_approval(design_id):
    data = request.get_json()
    approval = data.get('approval')
    handler = Design(email=get_jwt_identity())
    return handler.update_design_approval(design_id=design_id, approval=approval)


@app.route("/design/<int:design_id>/status", methods=['PUT'])
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


@app.route("/design/bytes", methods=['GET'])
@jwt_required()
def get_user_bytes():
    handler = Design(email=get_jwt_identity())
    return handler.get_user_bytes()


@app.route("/design", methods=['DELETE'])
@jwt_required()
def delete_design():
    data = request.get_json()
    handler = Design(email=get_jwt_identity())
    return handler.delete_design(design_id=data.get('design_id'))


# AdminAction-----------------------------------------------------------------------------------------------------------
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


# Rotation System-----------------------------------------------------------------------------------------------------------
@app.route("/rotation/current", methods=['GET'])
@jwt_required()
def get_current_image():
    handler = RotationSystem(email=get_jwt_identity())
    return handler.get_current_image()


@app.route("/rotation/add", methods=['POST'])
@jwt_required()
def add_unscheduled_image():
    handler = RotationSystem(email=get_jwt_identity(), json_data=request.json)
    return handler.add_unscheduled_image()


@app.route("/rotation/schedule", methods=['POST'])
@jwt_required()
def schedule_image():
    handler = RotationSystem(email=get_jwt_identity(), json_data=request.json)
    return handler.schedule_image()


@app.route("/rotation/reorder", methods=['POST'])
@jwt_required()
def reorder_images():
    handler = RotationSystem(email=get_jwt_identity(), json_data=request.json)
    return handler.reorder_images()


@app.route("/rotation/rotate", methods=['POST'])
@jwt_required()
def rotate_to_next():
    handler = RotationSystem(email=get_jwt_identity())
    return handler.rotate_to_next()


@app.route("/rotation/items", methods=['GET'])
@jwt_required()
def get_all_rotation_items():
    handler = RotationSystem(email=get_jwt_identity())
    return handler.get_all_items()


@app.route("/rotation/items/pagination", methods=['GET'])
@jwt_required()
def get_rotation_items_paginated():
    try:

        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('size', 6))
        handler = RotationSystem(email=get_jwt_identity())
        return handler.get_items_paginated(page, page_size)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/rotation/item/<int:item_id>", methods=['DELETE'])
@jwt_required()
def remove_rotation_item(item_id):
    handler = RotationSystem(email=get_jwt_identity())
    return handler.remove_item(item_id)


@app.route("/rotation/scheduled", methods=['GET'])
@jwt_required()
def get_scheduled_items():
    handler = RotationSystem(email=get_jwt_identity())
    return handler.get_scheduled_items()


@app.route("/rotation/scheduled/pagination", methods=['GET'])
@jwt_required()
def get_scheduled_items_paginated():
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('size', 6))
        handler = RotationSystem(email=get_jwt_identity())
        return handler.get_scheduled_items_paginated(page, page_size)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/rotation/scheduled/<int:schedule_id>", methods=['DELETE'])
@jwt_required()
def remove_scheduled_item(schedule_id):
    try:
        handler = RotationSystem(email=get_jwt_identity())
        return handler.remove_scheduled_item(schedule_id)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UploadHistory-----------------------------------------------------------------------------------------------------------

@app.route("/upload_history", methods=['GET'])
@jwt_required()
def get_upload_history_for_current_user():
    return jsonify(UploadHistory().getAllUploadHistory()), 200


@app.route("/upload_history/pagination", methods=['GET'])
@jwt_required()
def get_upload_history_paginated():
    return UploadHistory().getAllUploadHistoryPaginated()


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
            valid_keys = {'design_id', 'attempt_time', 'status'}
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
