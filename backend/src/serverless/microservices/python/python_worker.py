import os

from crowd.backend.enums import Operations
from crowd.backend.infrastructure import DbOperationsSQS
from crowd.backend.infrastructure.config import SQS_ENDPOINT_URL

sqs = DbOperationsSQS()

sqs.send_message('1234', Operations.UPDATE_INTEGRATIONS, [{"id": "testid", "update": True}])