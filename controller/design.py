from flask import jsonify
from PIL import Image
import base64
from controller.user import User
from model.design import DesignDAO

MAX_USER_CAPACITY_MB = 2
MAX_USER_CAPACITY_BYTES = MAX_USER_CAPACITY_MB * 1024 * 1024

MAX_WIDTH = 64
MAX_HEIGHT = 64


# TODO: Check that user is verified to be uploading to the system
## The user class already has methods for verification.
### email verification + admin verification


def serialize_design(t):
    return {
        'design_id': t[0],
        'user_id': t[1],
        'title': t[2],
        'image': base64.b64encode(t[3]).decode('utf-8') if t[3] else None,
        'is_approved': t[4],
        'status': t[5],
        'created_at': t[6],
        'updated_at': t[7],
    }


def make_json(tuples):
    return [serialize_design(t) for t in tuples]


def make_json_one(t):
    return serialize_design(t)


def transform_image(image):
    # TODO: Try to transform images with respect to their aspect ratio.
    try:
        with Image.open(image) as im:
            im = im.convert("RGB")  # Ensure 3-channel RGB
            im = im.resize((64, 64))  # This is too static and doesn't respect the original image aspect ratio.
            im_bytes = im.tobytes()  # raw bytes for the executable

            return im_bytes, len(im_bytes)  # return the image object and its number of bytes
    except OSError:
        return None, None


class Design:

    def __init__(self, email=None):
        self.email = email
        if email:
            self.user = User(email=email)

    def add_new_design(self, title=None, files=None):
        if 'image' not in files:
            return jsonify(error="No image file provided"), 400

        image_file = files['image']

        user_id = self.user.get_user_id()

        if user_id is None:
            return jsonify(error='User not found'), 404

        user_bytes = self.get_num_bytes()

        if user_bytes is None:
            return jsonify(error="Couldn't get user memory"), 500

        im, n_bytes = transform_image(image_file)

        if im is None:
            return jsonify(error="Couldn't transform image"), 500

        if self.get_num_bytes() + n_bytes > MAX_USER_CAPACITY_BYTES:
            return jsonify(error="User exceeds the storage limit"), 400

        design_dao = DesignDAO()

        response = design_dao.add_new_design(user_id, title, im)

        match response:
            case 0:
                return jsonify(message="Design created"), 201
            case 2:
                return jsonify(error="Design already exists"), 409

        return jsonify(error="Couldn't create design"), 500

    def get_design(self, design_id=None):
        if design_id is None:
            return jsonify(error="No id provided."), 400

        user_id = self.user.get_user_id()
        if user_id is None:
            return jsonify(error="Couldn't get user id"), 500

        design_dao = DesignDAO()
        response = design_dao.get_design_by_id(design_id)

        if response is None:
            return jsonify(error="No design found."), 404

        design = make_json_one(t=response)

        if user_id != design['user_id']:
            # admin override
            if self.user.is_admin():
                return design, 200
            else:
                return jsonify(error="Unauthorized."), 403

        return design, 200

    def update_design_title(self, design_id, title):
        if design_id is None:
            return jsonify(error="No id provided."), 400

        user_id = self.user.get_user_id()
        if user_id is None:
            return jsonify(error="Couldn't get user id"), 500

        design_dao = DesignDAO()
        design_user_id = design_dao.get_user_id(design_id)

        if design_user_id == user_id or self.user.is_admin():
            response = design_dao.update_design_title(design_id, title)
            if response == 0:
                return jsonify(message="Title updated."), 200
            else:
                return jsonify(error="Couldn't update title"), 500
        else:
            return jsonify(error="Unathorized."), 403

    def update_design_image(self, design_id, files):
        if design_id is None:
            return jsonify(error="No id provided."), 400

        user_id = self.user.get_user_id()
        if user_id is None:
            return jsonify(error="Couldn't get user id"), 500

        if 'image' not in files:
            return jsonify(error="No image file provided"), 400

        image_file = files['image']

        design_dao = DesignDAO()
        design_user_id = design_dao.get_user_id(design_id)

        if design_user_id == user_id or self.user.is_admin():

            user_bytes = self.get_num_bytes()

            if user_bytes is None:
                return jsonify(error="Couldn't get user memory"), 500

            im, im_bytes = transform_image(image_file)

            if im is None:
                return jsonify(error="Couldn't transform image"), 500

            if self.get_num_bytes() + im_bytes > MAX_USER_CAPACITY_BYTES:
                return jsonify(error="User exceeds the storage limit"), 400

            response = design_dao.update_design_image(design_id, im)

            if response == 0:
                return jsonify(message="Title updated."), 200
            else:
                return jsonify(error="Couldn't update title"), 500
        else:
            return jsonify(error="Unauthorized."), 403

    def update_design_approval(self, design_id, approval):
        """
        ADMIN ACTION
        :param design_id:
        :param approval:
        :return:
        """
        if design_id is None:
            return jsonify(error="No id provided."), 400

        if self.user.is_admin():
            design_dao = DesignDAO()
            response = design_dao.update_design_approval(design_id, approval)
            if response == 0:
                return jsonify("Approval updated"), 200
            else:
                return jsonify(error="Couldn't update approval"), 500
        else:
            return jsonify(error="Unauthorized."), 403

    def update_design_status(self, design_id, status):
        if design_id is None:
            return jsonify(error="No id provided."), 400

        user_id = self.user.get_user_id()
        if user_id is None:
            return jsonify(error="Couldn't get user id"), 500

        design_dao = DesignDAO()
        design_user_id = design_dao.get_user_id(design_id)

        if design_user_id == user_id or self.user.is_admin():
            response = design_dao.update_design_status(design_id, status)
            if response == 0:
                return jsonify(message="Status updated."), 200
            else:
                return jsonify(error="Couldn't update status"), 500
        else:
            return jsonify(error="Unauthorized."), 403

    def delete_design(self, design_id):
        user_id = self.user.get_user_id()
        if user_id is None:
            return jsonify(error="Couldn't get user id"), 500

        design_dao = DesignDAO()
        design_user_id = design_dao.get_user_id(design_id)

        if design_user_id == user_id or self.user.is_admin():
            response = design_dao.delete_design(design_id)
            if response == 0:
                return jsonify(message="Design deleted"), 200
            else:
                return jsonify(error="Couldn't delete"), 500
        else:
            return jsonify(error="Unauthorized."), 403

    def get_user_bytes(self):
        """
        HTTP REQUEST VERSION
        Gets the total number of bytes a user has used in storage and the maximum set in system. Use this to tell the user
        how much memory has been used out of the maximum capacity.
        :return:
        """
        user_id = self.user.get_user_id()
        if user_id is None:
            return jsonify(error="Couldn't get user id"), 500

        design_dao = DesignDAO()
        user_bytes = design_dao.get_user_bytes(user_id)

        if user_bytes is None:
            return jsonify(error="Couldn't get user memory usage"), 500

        return jsonify({"bytes": user_bytes, "max": MAX_USER_CAPACITY_MB}), 200

    def get_num_bytes(self):
        """
        INTERNAL USE
        Gets the total number of bytes a user has used in storage. Use this to perform internal checks.
        :return:
        """
        user_id = self.user.get_user_id()
        if user_id is None:
            return None

        design_dao = DesignDAO()
        user_bytes = design_dao.get_user_bytes(user_id)

        if user_bytes is None:
            return None

        return user_bytes
