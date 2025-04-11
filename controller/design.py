from flask import jsonify, request
import base64
from controller.user import User
from model.design import DesignDAO


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


class Design:

    def __init__(self, email=None):
        self.email = email
        if email:
            self.user = User(email=email)

    def add_new_design(self, title=None, files=None):
        if 'image' not in files:
            return jsonify(error="No image file provided"), 400

        image_file = files['image']
        if not image_file:
            return jsonify(error="No image file provided"), 400

        user_id = self.user.get_user_id()
        if user_id is None:
            return jsonify(error='User not found'), 404

        image = image_file.read()
        dao = DesignDAO()
        new_id = dao.add_new_design(user_id, title, image)

        if isinstance(new_id, int) and new_id > 0:
            return jsonify(message="Design created", design_id=new_id), 201
        elif new_id == 2:
            return jsonify(error="Design already exists"), 409

        return jsonify(error="Couldn't create design"), 500

    def get_design(self, design_id=None):
        if design_id is None:
            return jsonify(error="No id provided."), 400

        user_id = self.user.get_user_id()
        if user_id is None:
            return jsonify(error="Couldn't verify user"), 500

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
            return jsonify(error="Couldn't verify user"), 500

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

    def update_design_image(self, design_id, image):
        if design_id is None:
            return jsonify(error="No id provided."), 400

        user_id = self.user.get_user_id()
        if user_id is None:
            return jsonify(error="Couldn't verify user"), 500

        design_dao = DesignDAO()
        design_user_id = design_dao.get_user_id(design_id)

        if design_user_id == user_id or self.user.is_admin():

            # TODO: Check that the user hasn't exceed capacity limits
            ## Nothing stops the user from uploading a gamzillion bytes.
            ## Sum up all images of the user in the system and make sure
            ## it doesn't exceed some size, like 1MB of total images.

            # TODO: Image Processing and Constraints
            ## Transform the image to fit the board and return it to the user
            ## once we get a 201. The view should show and ask if they like it.

            response = design_dao.update_design_image(design_id, image)
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
            return jsonify(error="Couldn't verify user"), 500

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
            return jsonify(error="Couldn't verify user"), 500

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

    def getApprovedDesigns(self):
        dao = DesignDAO()
        approved_records = dao.getApprovedDesigns()
        answer = [serialize_design(record) for record in approved_records]
        return answer

