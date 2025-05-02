import math

from flask import jsonify, request


from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from model.upload_history import UploadHistoryDAO

class UploadHistory:
    def make_json(self, tuples):

        result = []
        for t in tuples:
            D = {}
            D['history_id'] = t[0]
            D['design_id'] = t[1]
            D['attempt_time'] = t[2]
            D['status'] = t[3]
            D['title'] = t[4]
            D['pixel_data'] = t[5]
            result.append(D)
        return result

    def make_json_one(self, row):

        result = {}
        result['history_id'] = row[0]
        result['design_id'] = row[1]
        result['attempt_time'] = row[2]
        result['status'] = row[3]
        result['title'] = row[4]
        result['pixel_data'] = row[5]
        return result

    @jwt_required()
    def getAllUploadHistory(self):
        email = get_jwt_identity()
        dao = UploadHistoryDAO()
        rows = dao.getByUserEmail(email)
        return self.make_json(rows)

    def addNewUploadHistory(self, data):
        design_id    = data['design_id']
        attempt_time = data['attempt_time']
        status       = data['status']
        dao = UploadHistoryDAO()
        row = dao.addNewUploadHistory(design_id, attempt_time, status)
        return self.make_json_one(row)

    def getUploadHistoryById(self, history_id):
        dao = UploadHistoryDAO()
        record = dao.getUploadHistoryById(history_id)
        if not record:
            return jsonify("Not Found"), 404
        else:
            return self.make_json_one(record)

    def updateUploadHistoryById(self, history_id, data):
        dao = UploadHistoryDAO()
        record = dao.updateUploadHistoryById(history_id, data)
        if not record:
            return jsonify("Not Found"), 404
        else:
            return self.make_json_one(record)

    def deleteUploadHistoryById(self, history_id):
        dao = UploadHistoryDAO()
        deleted_id = dao.deleteUploadHistoryById(history_id)
        if not deleted_id:
            return jsonify("Not Found"), 404
        else:
            return jsonify("Successfully deleted UploadHistory with ID " + str(deleted_id) + "!"), 200


    @jwt_required()
    def getAllUploadHistoryPaginated(self):
        email = get_jwt_identity()
        page = int(request.args.get('page', 1))
        size = int(request.args.get('size', 6))
        dao = UploadHistoryDAO()
        total   = dao.countByUserEmail(email)
        rows    = dao.getByUserEmailPaginated(email, page, size)
        items   = self.make_json(rows)
        pages   = math.ceil(total / size)

        return jsonify({
            'items': items,
            'page': page,
            'pages': pages
        }), 200