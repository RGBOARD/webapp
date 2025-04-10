from flask import jsonify
import base64


from model.queue_item import QueueItemDAO

class QueueItem:

        def make_json(self, tuples):
            result = []
            for t in tuples:
                D = {}
                D['queue_id'] = t[0]
                D['design_id'] = t[1]
                D['panel_id'] = t[2]
                D['start_time'] = t[3]
                D['end_time'] = t[4]
                D['display_duration'] = t[5]
                D['display_order'] = t[6]
                D['scheduled'] = t[7]
                D['scheduled_at'] = t[8]
                result.append(D)

            return result

        def make_json_one(self, queue_item):
            result = {}
            result['queue_id'] = queue_item[0]
            result['design_id'] = queue_item[1]
            result['panel_id'] = queue_item[2]
            result['start_time'] = queue_item[3]
            result['end_time'] = queue_item[4]
            result['display_duration'] = queue_item[5]
            result['display_order'] = queue_item[6]
            result['scheduled'] = queue_item[7]
            result['scheduled_at'] = queue_item[8]

            return result

        def getAllQueueItem(self):
            model = QueueItemDAO()
            result = model.getAllQueueItem()
            answer = self.make_json(result)
            return answer

        def addNewQueueItem(self, data):
            design_id = data['design_id']
            panel_id = data['panel_id']
            start_time = data['start_time']
            end_time = data['end_time']
            display_duration = data['display_duration']
            display_order = data['display_order']
            scheduled = data['scheduled']
            scheduled_at = data['scheduled_at']
            dao = QueueItemDAO()
            queue_item = dao.addNewQueueItem(design_id, panel_id, start_time, end_time, display_duration, display_order, scheduled, scheduled_at)
            result = self.make_json_one(queue_item)
            return result

        def getQueueItemById(self, queue_id):
            dao = QueueItemDAO()
            queue_item = dao.getQueueItemById(queue_id)
            if not queue_item:
                return jsonify("Not Found"), 404
            else:
                result = self.make_json_one(queue_item)
                return result

        def updateQueueItemById(self, queue_id, data):
            dao = QueueItemDAO()
            queue_item = dao.updateQueueItemById(queue_id, data)
            if not QueueItem:
                return jsonify("Not Found"), 404
            else:
                result = self.make_json_one(queue_item)
                return result

        def deleteQueueItemById(self, queue_id):
            dao = QueueItemDAO()
            queue_item = dao.deleteQueueItemById(queue_id)
            if not queue_item:
                return jsonify("Not Found"), 404
            else:
                return jsonify("Successfully deleted QueueItem with ID " + str(queue_item) + "!"), 200

        def getScheduledDesigns(self):
            dao = QueueItemDAO()
            rows = dao.getScheduledDesigns()
            # Build a list of dicts, merging fields from both tables
            result = []
            for row in rows:
                item = {
                    "queue_id": row[0],
                    "design_id": row[1],
                    "panel_id": row[2],
                    "start_time": row[3],
                    "end_time": row[4],
                    "display_duration": row[5],
                    "display_order": row[6],
                    "scheduled": row[7],
                    "scheduled_at": row[8],
                    "image": base64.b64encode(row[9]).decode('utf-8') if row[9] else None,
                    "is_approved": row[10],
                    "design_created_at": row[11],
                    "design_updated_at": row[12]
                }
                result.append(item)
            return result
