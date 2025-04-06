from flask import jsonify, request
import base64

from controller.user import User
from model.design import DesignDAO


def make_json(tuples):
    result = []
    for t in tuples:
        D = {}
        D['design_id'] = t[0]
        D['user_id'] = t[1]
        D['title'] = t[2]
        D['image'] = base64.b64encode(t[3]).decode('utf-8') if t[3] else None
        D['created_at'] = t[4]
        D['is_approved'] = t[5]
        D['status'] = t[6]
        result.append(D)

    return result


def make_json_one(design):
    result = {}
    result['design_id'] = design[0]
    result['user_id'] = design[1]
    result['title'] = design[2]
    result['image'] = base64.b64encode(design[3]).decode('utf-8') if design[3] else None
    result['created_at'] = design[4]
    result['is_approved'] = design[5]
    result['status'] = design[6]
    return result


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

        #TODO: Check that user is verified to be uploading to the system
        ## The user class already has methods for verification.
        ### email verification + admin verification

        if user_id is None:
            return jsonify(error='User not found'), 404

        image = image_file.read()


        #TODO: Check that the user hasn't exceed capacity limits
        ## Nothing stops the user from uploading a gamzillion bytes.
        ## Sum up all images of the user in the system and make sure
        ## it doesn't exceed some size, like 1MB of total images.

        #TODO: Image Processing and Constraints
        ## Transform the image to fit the board and return it to the user
        ## once we get a 201. The view should show and ask if they like it.

        dao = DesignDAO()
        response = dao.add_new_design(user_id, title, image)

        match response:
            case 0:
                return jsonify(message = "Design created"), 201
            case 2:
                return jsonify(error="Design already exists"), 409

        return jsonify(error="Couldn't create design"), 500


    def getDesignById(self, design_id):
        dao = DesignDAO()
        design = dao.getDesignById(design_id)
        if not design:
            return jsonify("Not Found"), 404
        else:
            result = make_json_one(design)
            return result

    def updateDesignById(self, design_id, data):
        dao = DesignDAO()
        design = dao.updateDesignById(design_id, data)
        if not design:
            return jsonify("Not Found"), 404
        else:
            result = make_json_one(design = design)
            return result

    def deleteDesignById(self, design_id):
        dao = DesignDAO()
        design = dao.deleteDesignById(design_id)
        if not design:
            return jsonify("Not Found"), 404
        else:
            return jsonify("Successfully deleted Design with ID " + str(design) + "!"), 200
