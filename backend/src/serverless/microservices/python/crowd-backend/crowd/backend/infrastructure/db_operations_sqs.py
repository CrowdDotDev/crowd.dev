from crowd.backend.infrastructure import SQS
from crowd.backend.enums import Operations
import os
from uuid import uuid1 as uuid
from functools import reduce
import logging
import json

from crowd.backend.infrastructure.config import KUBE_MODE, NODEJS_WORKER_QUEUE

logger = logging.getLogger(__name__)


class DbOperationsSQS(SQS):
    def __init__(self):
        if KUBE_MODE:
            db_operations_sqs_url = NODEJS_WORKER_QUEUE
        else:
            db_operations_sqs_url = os.environ.get("DB_OPERATIONS_SQS_URL")
        super().__init__(db_operations_sqs_url)

    @staticmethod
    def validate_update(records):
        out = []
        for record in records:
            if "id" not in record:
                raise ValueError(f"Missing id in {record} Expected: 'id': <id>, 'update': <update>")
            if "update" not in record:
                raise ValueError(f"Missing value in {record} Expected: 'id': <id>, 'update': <update>")
            record["id"] = str(record["id"])
            out.append(record)

        return out

    def send_message(self, tenant_id, operation, records, send=True):
        """
        Send a message to the SQS queue that will trigger Write operations

        Args:
            tenant_id (str): tenant id
            operation (Operation): An operation from crowd.sqs_api.operations
            records ([dict]): list of records to be added or updated
        """
        tenant_id = str(tenant_id)

        if records:
            message_id = f"{tenant_id}-{operation.value}-"
            if operation == Operations.UPDATE_INTEGRATIONS:
                DbOperationsSQS.validate_update(records)
                deduplication_id = DbOperationsSQS.make_id()
                message_id = message_id + deduplication_id

            elif operation == Operations.UPDATE_MEMBERS:
                DbOperationsSQS.validate_update(records)
                deduplication_id = DbOperationsSQS.make_id()
                message_id = message_id + deduplication_id

            elif operation == Operations.UPSERT_ACTIVITIES_WITH_MEMBERS:
                platform = records[0]["platform"]
                type = records[0]["type"]
                deduplication_id = message_id + platform + "-" + type
                deduplication_id = DbOperationsSQS.make_id()

            elif operation == Operations.UPDATE_MEMBERS_TO_MERGE:
                deduplication_id = DbOperationsSQS.make_id()
                message_id = message_id + deduplication_id

            elif operation == Operations.UPSERT_MEMBERS:
                deduplication_id = DbOperationsSQS.make_id()
                platform = records[0]["platform"]
                type = records[0]["type"]
            elif operation == Operations.UPDATE_MICROSERVICES:
                deduplication_id = DbOperationsSQS.make_id()

            else:
                return None

            chuncked = [records[i : i + 5] for i in range(0, len(records), 5)]

            for chunk in chuncked:
                body = dict(tenant_id=tenant_id, operation=operation.value, records=chunk)
                if KUBE_MODE:
                    body["type"] = "db_operations"
                if send:
                    super().send_message(body, message_id, DbOperationsSQS.make_id())
                else:
                    return 1
        return None
