from flask import jsonify
from model.upload_history import UploadHistoryDAO

class UploadHistory:
    def make_json(self, tuples):

        result = []
        for t in tuples:
            D = {}
            D['history_id'] = t[0]
            D['design_id'] = t[1]
            D['attempt_time'] = t[2]
            D['file_size'] = t[3]
            D['status'] = t[4]
            result.append(D)
        return result

    def make_json_one(self, row):

        result = {}
        result['history_id'] = row[0]
        result['design_id'] = row[1]
        result['attempt_time'] = row[2]
        result['file_size'] = row[3]
        result['status'] = row[4]
        return result

    def getAllUploadHistory(self):
        dao = UploadHistoryDAO()
        rows = dao.getAllUploadHistory()
        return self.make_json(rows)

    def addNewUploadHistory(self, data):

        design_id = data['design_id']
        attempt_time = data['attempt_time']
        file_size = data['file_size']
        status = data['status']

        dao = UploadHistoryDAO()
        row = dao.addNewUploadHistory(design_id, attempt_time, file_size, status)
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
