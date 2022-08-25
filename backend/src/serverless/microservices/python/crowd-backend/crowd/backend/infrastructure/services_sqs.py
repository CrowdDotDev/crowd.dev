from crowd.backend.infrastructure import SQS
from crowd.backend.enums import Services
import os
import logging

from crowd.backend.models import microservice

logger = logging.getLogger(__name__)


class ServicesSQS(SQS):
    def __init__(self):
        url = os.environ.get("PYTHON_MICROSERVICES_SQS_URL")
        super().__init__(url)

    def send_message(self, tenant_id, microservice_id, service, params=None, send=True):
        """
        Send a message to the SQS queue that will trigger services

        Args:
            tenant_id (str): tenant id
            microservicei_id (str): micrservice id
            service (Service): An valid service to activate
            params: (dict): params to send to the service
        """
        if not params:
            params = {}

        tenant_id = str(tenant_id)
        if service in Services._value2member_map_:  # This checks in the service is in the enum
            message_id = f"{tenant_id}-{service}"
            deduplication_id = ServicesSQS.make_id()

        else:
            raise Exception(f"Service {service} not supported")

        body = dict(tenant=tenant_id, microservice_id=microservice_id, service=service, params=params)

        if send:
            return super().send_message(body, message_id, deduplication_id)
        else:
            return 1
