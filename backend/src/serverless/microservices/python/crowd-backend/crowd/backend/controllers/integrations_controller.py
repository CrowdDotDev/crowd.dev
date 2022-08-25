from crowd.backend.controllers import BaseController
from crowd.backend.enums import Operations
from crowd.backend.repository import Repository
from uuid import UUID

import logging


logger = logging.getLogger(__name__)


class IntegrationsController(BaseController):
    """
    Controller for Integration in Crowd.dev.
    It can add Integrations with the community members that perform them.

    Args:
        BaseController (BaseController): parent BaseController class.
    """

    def __init__(self, tenant_id: "UUID", repository: "Repository" = False, test: "bool" = False) -> "None":
        """
        Function to initialise the controller.

        Args:
            tenant_id (UUID): the tenant ID in Crowd web
            repository (Repository, optional): the the db repository to use for transactions. Defaults to False.
            test (bool, optional): Whether we are in test mode. Defaults to False.
        """
        super().__init__(tenant_id, repository=repository, test=test)

    def update(self, updates, send=True):
        """
        Function to update the integrations

        Args:
            updates ([{id, update}]): list of dicts with id and corresponding update
        """

        if type(updates) is not list:
            updates = [
                updates,
            ]

        return self.sqs.send_message(self.tenant_id, Operations.UPDATE_INTEGRATIONS, updates, send)
