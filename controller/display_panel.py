from flask import jsonify
from model.display_panel import DisplayPanelDAO

class DisplayPanel:

    def make_json(self, tuples):
        """
        Convert a list of rows from the display_panel table into a list of dictionaries.
        Each tuple is assumed to have columns in this order:
          panel_id, location, status
        """
        result = []
        for row in tuples:
            D = {}
            D['panel_id'] = row[0]
            D['location'] = row[1]
            D['status'] = row[2]
            result.append(D)
        return result

    def make_json_one(self, row):
        """
        Convert a single row from display_panel into a dictionary.
        """
        result = {}
        result['panel_id'] = row[0]
        result['location'] = row[1]
        result['status'] = row[2]
        return result

    def getAllDisplayPanel(self):
        dao = DisplayPanelDAO()
        rows = dao.getAllDisplayPanel()
        return self.make_json(rows)

    def addNewDisplayPanel(self, data):
        """
        data should contain:
          'location', 'status'
        """
        location = data['location']
        status = data['status']

        dao = DisplayPanelDAO()
        row = dao.addNewDisplayPanel(location, status)
        return self.make_json_one(row)

    def getDisplayPanelById(self, panel_id):
        dao = DisplayPanelDAO()
        row = dao.getDisplayPanelById(panel_id)
        if not row:
            return jsonify("Not Found"), 404
        else:
            return self.make_json_one(row)

    def updateDisplayPanelById(self, panel_id, data):
        """
        data can contain any or all of:
          'location', 'status'
        """
        dao = DisplayPanelDAO()
        row = dao.updateDisplayPanelById(panel_id, data)
        if not row:
            return jsonify("Not Found"), 404
        else:
            return self.make_json_one(row)

    def deleteDisplayPanelById(self, panel_id):
        dao = DisplayPanelDAO()
        deleted_id = dao.deleteDisplayPanelById(panel_id)
        if not deleted_id:
            return jsonify("Not Found"), 404
        else:
            return jsonify("Successfully deleted DisplayPanel with ID " + str(deleted_id) + "!"), 200
