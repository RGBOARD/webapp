from flask import jsonify

from model.design import DesignDAO

class Design:

        def make_json(self, tuples):
            result = []
            for t in tuples:
                D = {}
                D['design_id'] = t[0]
                D['user_id'] = t[1]
                D['title'] = t[2]
                D['image_path'] = t[3]
                D['created_at'] = t[4]
                D['is_approved'] = t[5]
                D['status'] = t[6]
                result.append(D)

            return result

        def make_json_one(self, design):
            result = {}
            result['design_id'] = design[0]
            result['user_id'] = design[1]
            result['title'] = design[2]
            result['image_path'] = design[3]
            result['created_at'] = design[4]
            result['is_approved'] = design[5]
            result['status'] = design[6]
            return result

        def getAllDesign(self):
            model = DesignDAO()
            result = model.getAllDesign()
            answer = self.make_json(result)
            return answer

        def addNewDesign(self, data):
            user_id = data['user_id']
            title = data['title']
            image_path = data['image_path']
            created_at = data['created_at']
            is_approved = data['is_approved']
            status = data['status']
            dao = DesignDAO()
            design = dao.addNewDesign(user_id, title, image_path, created_at, is_approved, status)
            result = self.make_json_one(design)
            return result

        def getDesignById(self, design_id):
            dao = DesignDAO()
            design = dao.getDesignById(design_id)
            if not design:
                return jsonify("Not Found"), 404
            else:
                result = self.make_json_one(design)
                return result

        def updateDesignById(self, design_id, data):
            dao = DesignDAO()
            design = dao.updateDesignById(design_id, data)
            if not design:
                return jsonify("Not Found"), 404
            else:
                result = self.make_json_one(design)
                return result

        def deleteDesignById(self, design_id):
            dao = DesignDAO()
            design = dao.deleteDesignById(design_id)
            if not design:
                return jsonify("Not Found"), 404
            else:
                return jsonify("Successfully deleted Design with ID " + str(design) + "!"), 200