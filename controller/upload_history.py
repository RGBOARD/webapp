import math

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from model.upload_history import UploadHistoryDAO

class UploadHistory:
    def make_json(self, tuples):
        result = []
        for t in tuples:
            D = {
                'history_id': t[0],
                'design_id': t[1],
                'attempt_time': t[2],
                'status': t[3],
                'title': t[4],
                'pixel_data': t[5]
            }
            result.append(D)
        return result

    def make_json_one(self, row):
        return {
            'history_id': row[0],
            'design_id': row[1],
            'attempt_time': row[2],
            'status': row[3],
            'title': row[4],
            'pixel_data': row[5]
        }

    @jwt_required()
    def getAllUploadHistory(self):
        email = get_jwt_identity()
        dao = UploadHistoryDAO()
        rows = dao.getByUserEmail(email)
        return self.make_json(rows)

    def addNewUploadHistory(self, data):
        design_id = data['design_id']
        attempt_time = data['attempt_time']
        status = data['status']
        dao = UploadHistoryDAO()
        row = dao.addNewUploadHistory(design_id, attempt_time, status)
        return self.make_json_one(row)

    def getUploadHistoryById(self, history_id):
        dao = UploadHistoryDAO()
        record = dao.getUploadHistoryById(history_id)
        if not record:
            return jsonify("Not Found"), 404
        return self.make_json_one(record)

    def updateUploadHistoryById(self, history_id, data):
        dao = UploadHistoryDAO()
        record = dao.updateUploadHistoryById(history_id, data)
        if not record:
            return jsonify("Not Found"), 404
        return self.make_json_one(record)

    def deleteUploadHistoryById(self, history_id):
        dao = UploadHistoryDAO()
        deleted_id = dao.deleteUploadHistoryById(history_id)
        if not deleted_id:
            return jsonify("Not Found"), 404
        return jsonify(f"Successfully deleted UploadHistory with ID {deleted_id}!"), 200

    @jwt_required()
    def getAllUploadHistoryPaginated(self):
        try:
            email = get_jwt_identity()
            page = int(request.args.get('page', 1))
            size = int(request.args.get('size', 6))
            dao = UploadHistoryDAO()

            total = dao.countByUserEmail(email)
            rows = dao.getByUserEmailPaginated(email, page, size)
            items = self.make_json(rows)
            pages = math.ceil(total / size) if size > 0 else 0

            return jsonify({
                'items': items,
                'page': page,
                'pages': pages
            }), 200
        except Exception as e:
            print(f"Error in paginated upload history: {e}")
            return jsonify({'error': 'Failed to fetch paginated upload history'}), 500
