import json

from crowd.backend.enums import Services
from crowd.backend.infrastructure import SQS
from crowd.backend.infrastructure.config import PYTHON_WORKER_QUEUE
from crowd.backend.utils.coordinator import base_coordinator
from crowd.check_merge_members import check_merge_members_worker
from crowd.members_score import members_score_worker

sqs = SQS(PYTHON_WORKER_QUEUE)

print("Listening for messages on: ", PYTHON_WORKER_QUEUE)

while True:
    msg = sqs.receive_message(delete=False, wait_time_seconds=15)
    if msg is not None:
        msg_receipt = msg['ReceiptHandle']

        body = json.loads(msg['Body'])
        msg_type = body.get('type', '')
        service = body.get('service', '')
        tenant_id = body.get('tenant', '')
        microservice_id = body.get('microservice_id', '')
        params = body.get('params', None)

        if service == Services.CHECK_MERGE.value:
            sqs.delete_message(msg_receipt)
            print("triggering check_merge")
            check_merge_members_worker(tenant_id, microservice_id, params)

        elif service == Services.MEMBERS_SCORE.value:
            sqs.delete_message(msg_receipt)
            print("triggering members_score")
            members_score_worker(tenant_id)

        elif msg_type == Services.CHECK_MERGE.value:
            sqs.delete_message(msg_receipt)
            print("triggering check_merge coordinator")
            base_coordinator(str(Services.CHECK_MERGE.value))

        elif msg_type == Services.MEMBERS_SCORE.value:
            sqs.delete_message(msg_receipt)
            print("triggering members_score coordinator")
            base_coordinator(str(Services.MEMBERS_SCORE.value))

        else:
            print("Error while processing a queue message! Unrecognized message format: ", body)
