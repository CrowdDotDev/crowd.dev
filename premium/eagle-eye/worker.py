import json

from crowd.eagle_eye.infrastructure.sqs import SQS
from crowd.eagle_eye.infrastructure.logging import get_logger
from crowd.eagle_eye.config import PREMIUM_PYTHON_WORKER_QUEUE
from crowd.eagle_eye.scheduled import scheduled_main

logger = get_logger(__name__)

sqs = SQS(PREMIUM_PYTHON_WORKER_QUEUE)

logger.info(f"Listening for messages on: {PREMIUM_PYTHON_WORKER_QUEUE}")

while True:
    msg = sqs.receive_message(delete=True, wait_time_seconds=15)
    if msg is not None:
        body = json.loads(msg['Body'])
        platform = body['platform']
        scheduled_main(platform)
