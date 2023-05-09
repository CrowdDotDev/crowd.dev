import json

from crowd.backend.enums import Services
from crowd.backend.infrastructure import SQS
from crowd.backend.infrastructure.config import PYTHON_WORKER_QUEUE
from crowd.backend.infrastructure.logging import get_logger
from crowd.backend.utils.coordinator import base_coordinator
from crowd.members_score import members_score_worker

logger = get_logger(__name__)

sqs = SQS(PYTHON_WORKER_QUEUE)

logger.info(f"Listening for messages on: {PYTHON_WORKER_QUEUE}")

while True:
    msg = sqs.receive_message(delete=False, wait_time_seconds=15)
    if msg is not None:
        msg_receipt = msg['ReceiptHandle']

        body = json.loads(msg['Body'])
        msg_type = body.get('type', '')
        service = body.get('service', '')
        tenant_id = body.get('tenant', '')
        microservice_id = body.get('microservice_id', '')
        member = body.get('member', '')
        params = body.get('params', None)

        if service == Services.MEMBERS_SCORE.value:
            sqs.delete_message(msg_receipt)
            logger.info("triggering members_score")
            members_score_worker(tenant_id)

        elif msg_type == Services.MEMBERS_SCORE.value:
            sqs.delete_message(msg_receipt)
            logger.info("triggering members_score coordinator")
            base_coordinator(str(Services.MEMBERS_SCORE.value))

        else:
            logger.error(f"Error while processing a queue message! Unrecognized message format: {body}")
