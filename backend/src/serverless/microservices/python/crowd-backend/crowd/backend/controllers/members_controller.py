import logging
from crowd.backend.models import CommunityMember
from crowd.backend.repository import Repository
from crowd.backend.controllers import BaseController
from uuid import UUID
from crowd.backend.enums import Operations
from crowd.backend.repository.keys import DBKeys as dbk

logger = logging.getLogger(__name__)


class MembersController(BaseController):
    """
    Controller for community members in Crowd.dev.
    It can add or update members, detect members to merge and do the merge, and mark members as not merging.

    Args:
        BaseController (BaseController): parent BaseController class.
    """

    def __init__(self, tenant_id: "UUID", repository: "Repository" = False, test: "bool" = False) -> "None":
        super().__init__(tenant_id, repository=repository, test=test)

    def upsert(self, members, send=True):
        """
        Function to upsert a list of Members

        Args:
            members ([dict]): List of community members to be upserted
        """
        if type(members) is not list:
            members = [
                members,
            ]

        for member in members:
            member_to_validate = member.copy()
            if dbk.USERNAME in member_to_validate:
                if type(member_to_validate[dbk.USERNAME]) == str:
                    member_to_validate[dbk.USERNAME] = {member_to_validate[dbk.USERNAME]}
            if dbk.PLATFORM in member_to_validate:
                del member_to_validate[dbk.PLATFORM]

            # validation
            CommunityMember(**member_to_validate)

        # SQS function call
        return self.sqs.send_message(self.tenant_id, Operations.UPSERT_MEMBERS, members, send)

    def update_members_to_merge(self, to_merge, send=True):
        """
        Function to update members to merge

        Args:
            to_merge ([tuple]): list of tuples
        """
        return self.sqs.send_message(self.tenant_id, Operations.UPDATE_MEMBERS_TO_MERGE, to_merge, send)

    def update(self, updates, send=True):
        """
        Function to update the integrations

        Args:
            updates ([{id, update}]): list of dicts with id and corresponding update
        """
        logger.info("UPDATES")
        logger.info(updates)
        if type(updates) is not list:
            updates = [
                updates,
            ]
        return self.sqs.send_message(self.tenant_id, Operations.UPDATE_MEMBERS, updates, send)
