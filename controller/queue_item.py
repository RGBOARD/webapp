from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from controller.user import User
from model.queue_item import QueueItemDAO


class QueueItem:
        def __init__(self, email=None):
            self.email = email
            if email:
                self.user = User(email=email)

        def make_json(self, tuples):
            result = []
            for t in tuples:
                D = {}
                D['queue_id'] = t[0]
                D['design_id'] = t[1]
                D['start_time'] = t[2]
                D['end_time'] = t[3]
                D['display_duration'] = t[4]
                D['display_order'] = t[5]
                D['scheduled'] = t[6]
                D['scheduled_at'] = t[7]
                result.append(D)

            return result

        def make_json_one(self, queue_item):
            result = {}
            result['queue_id'] = queue_item[0]
            result['design_id'] = queue_item[1]
            result['start_time'] = queue_item[2]
            result['end_time'] = queue_item[3]
            result['display_duration'] = queue_item[4]
            result['display_order'] = queue_item[5]
            result['scheduled'] = queue_item[6]
            result['scheduled_at'] = queue_item[7]

            return result

        def getAllQueueItem(self):
            model = QueueItemDAO()
            result = model.getAllQueueItem()
            answer = self.make_json(result)
            return answer

        def addNewQueueItem(self, data):
            design_id = data['design_id']
            start_time = data['start_time']
            end_time = data['end_time']
            display_duration = data['display_duration']
            scheduled = data['scheduled']
            scheduled_at = data['scheduled_at']
            dao = QueueItemDAO()
            queue_item = dao.addNewQueueItem(design_id, start_time, end_time, display_duration, scheduled, scheduled_at)
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
            if queue_item:
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
                    "start_time": row[2],
                    "end_time": row[3],
                    "display_duration": row[4],
                    "display_order": row[5],
                    "scheduled": row[6],
                    "scheduled_at": row[7],
                    "pixel_data": row[8],
                    "is_approved": row[9],
                    "design_created_at": row[10],
                    "design_updated_at": row[11]
                }
                result.append(item)
            return result

        def get_all_items_paginated(self, page, page_size):
            if self.email is not None:
                if self.user.is_admin():
                    model = QueueItemDAO()
                    result = model.get_all_items_paginated(page, page_size)

                    formatted_items = []
                    for item in result["queue"]:
                        formatted_items.append({
                            "queue_id": item["queue_id"],
                            "design_id": item["design_id"],
                            "start_time": item["start_time"],
                            "display_order": item["display_order"],
                            "scheduled": item["scheduled"],
                            "scheduled_at": item["scheduled_at"],
                            "is_approved": item["is_approved"],
                            "pixel_data": item["pixel_data"],
                            "title": item["title"]
                        })

                    body = {
                        "items": formatted_items,
                        "total": result["total"],
                        "pages": result["pages"],
                        "page": result["page"]
                    }
                    return body

                return jsonify(error="Unauthorized. Not admin."), 401

            return jsonify(error="Unauthorized. No token."), 401

        @jwt_required()
        def getUserHistory(self):
            user_email = get_jwt_identity()

            rows = QueueItemDAO().getByUserEmail(user_email)

            result = []
            for (history_id, design_id, attempt_time,
                 display_duration, display_order, status,
                 title, pixel_data) in rows:
                result.append({
                    'history_id': history_id,
                    'design_id': design_id,
                    'attempt_time': attempt_time,
                    'display_duration': display_duration,
                    'display_order': display_order,
                    'status': 'scheduled' if status else 'pending',
                    'title': title,
                    'pixel_data': pixel_data,
                })
            return result
