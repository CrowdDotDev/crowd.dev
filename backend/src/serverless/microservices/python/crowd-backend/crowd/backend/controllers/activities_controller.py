import uuid
from uuid import UUID
from crowd.backend.models import Member
from crowd.backend.controllers import BaseController
from crowd.backend.enums import Operations
from crowd.backend.repository import Repository
from crowd.backend.models import Activity
import logging
from crowd.backend.repository.keys import DBKeys as dbk


logger = logging.getLogger(__name__)


class ActivitiesController(BaseController):
    """
    Controller for activities in Crowd.dev.
    It can add activities with the members that perform them.

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

    def add_activity_with_member(self, activities, send=True):
        """
        Function to add an activity with a member

        Args:
            activities([dict]): list of activities to be added
        """

        if type(activities) is not list:
            activities = [
                activities,
            ]

        for activity in activities:
            activity_to_validate = activity.copy()
            if dbk.PLATFORM in activity_to_validate[dbk.MEMBER]:
                del activity_to_validate[dbk.MEMBER][dbk.PLATFORM]
            # validation
            member_to_validate = activity_to_validate[dbk.MEMBER].copy()
            Member(**member_to_validate)
            # Replace member by member id in activity if there is an id
            activity_to_validate[dbk.MEMBER + "Id"] = uuid.uuid4()
            del activity_to_validate[dbk.MEMBER]
            # Initialise activity for validation
            Activity(**activity_to_validate)

        # Send the original input as the SQS operation to add activity with member
        return self.sqs.send_message(self.tenant_id, Operations.UPSERT_ACTIVITIES_WITH_MEMBERS, activities, send)
