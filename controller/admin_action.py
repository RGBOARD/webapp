from flask import jsonify
from model.admin_action import AdminActionDAO

class AdminAction:

    def make_json(self, tuples):

        result = []
        for t in tuples:
            D = {}
            D['action_id'] = t[0]
            D['user_id'] = t[1]
            D['target_user_id'] = t[2]
            D['target_design_id'] = t[3]
            D['target_queue_id'] = t[4]
            D['action_type'] = t[5]
            D['action_details'] = t[6]
            D['timestamp'] = t[7]
            result.append(D)
        return result

    def make_json_one(self, row):

        result = {}
        result['action_id'] = row[0]
        result['user_id'] = row[1]
        result['target_user_id'] = row[2]
        result['target_design_id'] = row[3]
        result['target_queue_id'] = row[4]
        result['action_type'] = row[5]
        result['action_details'] = row[6]
        result['timestamp'] = row[7]
        return result

    def getAllAdminAction(self):
        dao = AdminActionDAO()
        rows = dao.getAllAdminAction()
        answer = self.make_json(rows)
        return answer

    def getAdminActionById(self, action_id):
        dao = AdminActionDAO()
        record = dao.getAdminActionById(action_id)
        if not record:
            return jsonify("Not Found"), 404
        else:
            return self.make_json_one(record)

    def addNewAdminAction(self, data):
        user_id = data['user_id']
        target_user_id = data['target_user_id']
        target_design_id = data['target_design_id']
        target_queue_id = data['target_queue_id']
        action_type = data['action_type']
        action_details = data['action_details']
        timestamp = data['timestamp']

        dao = AdminActionDAO()
        record = dao.addNewAdminAction(user_id, target_user_id, target_design_id,
                                       target_queue_id, action_type, action_details, timestamp)
        if record:
            return self.make_json_one(record)
        else:
            return jsonify("Error creating admin action"), 400

    def updateAdminActionById(self, action_id, data):
        dao = AdminActionDAO()
        record = dao.updateAdminActionById(action_id, data)
        if not record:
            return jsonify("Not Found"), 404
        else:
            return self.make_json_one(record)

    def deleteAdminActionById(self, action_id):
        dao = AdminActionDAO()
        deleted_id = dao.deleteAdminActionById(action_id)
        if not deleted_id:
            return jsonify("Not Found"), 404
        else:
            return jsonify(f"Successfully deleted AdminAction with ID {deleted_id}!"), 200
