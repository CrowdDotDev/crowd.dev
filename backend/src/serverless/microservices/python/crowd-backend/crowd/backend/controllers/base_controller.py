from crowd.backend.repository import Repository
from crowd.backend.infrastructure import DbOperationsSQS

import uuid

import logging


logger = logging.getLogger(__name__)


class BaseController(object):
    """
    Base controller class. It has functions and variables common for all controllers.
    This class is to be used as a parent for a specific controller only.
    """

    def __init__(self, tenant_id, repository=False, test=False):
        """
        Function to initialise the controller.

        Args:
            tenant_id (UUID): the tenant ID in Crowd web
            repository (Repository, optional): the repository to use for transactions. Defaults to False.
            test (bool, optional): Whether we are in test mode. Defaults to False.
        """
        self.tenant_id = tenant_id
        # If the Repository was not sent, initialise one.
        if not repository:
            self.repository = Repository(tenant_id=tenant_id, test=test)
        else:
            self.repository = repository

        self.test = test
        self.sqs = DbOperationsSQS()
