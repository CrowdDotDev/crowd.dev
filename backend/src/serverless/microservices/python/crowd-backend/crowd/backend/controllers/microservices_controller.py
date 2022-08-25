import logging
from crowd.backend.repository import Repository
from crowd.backend.controllers import BaseController
from uuid import UUID
from crowd.backend.models import Microservice
from crowd.backend.enums import Operations
from crowd.backend.repository.keys import DBKeys as dbk

logger = logging.getLogger(__name__)


class MicroservicesController(BaseController):
    """
    Controller for microservices in Crowd.dev.

    Args:
        BaseController (BaseController): parent BaseController class.
    """

    def __init__(self, tenant_id: "UUID", repository: "Repository" = False, test: "bool" = False) -> "None":
        super().__init__(tenant_id, repository=repository, test=test)

    def update_microservices(self, updates, send=True):
        """
        Function to update microservices

        Args:
            updates ([{id: update}]): list of dicts with id and corresponding update
        """

        if type(updates) is not list:
            updates = [
                updates,
            ]

        if send:
            return self.sqs.send_message(self.tenant_id, Operations.UPDATE_MICROSERVICES, updates, send)
        else:
            return 1
