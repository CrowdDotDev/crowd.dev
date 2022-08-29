from crowd.backend.repository import Repository
from crowd.backend.repository.keys import DBKeys as dbk
from crowd.backend.controllers import MembersController
from crowd.backend.models import Member
import logging

logger = logging.getLogger(__name__)


class CheckMergeDefault:
    def __init__(self, tenant_id, repository=False, test=False):
        """
        CheckMergeMembers constructor. Coordinator can return a list of tenant_ids.

        Args:
            tenant_id (string): tenant id users will be checked.
            test (dict) : to be passed to the repository instance. Defaults to false
            repository (DBClient, optional): the db client to use for transactions. Defaults to False.
        """
        self.tenant_id = tenant_id

        if not repository:
            self.repository = Repository(tenant_id=self.tenant_id, test=test)
        else:
            self.repository = repository

        self.test = test

    def run(self):
        """
        Gets all members of the tenant,
        Creates a hash out of same crowdUsernames for easy access
        Generates membersToMerge field out of hash -checks is_mergeable as well-
        """
        members = self.get_members()
        mhash = self.get_mergeable_members_hash(members)

        merge_members_list = self.get_merge_members_list(mhash)
        return self.update_members_to_merge(merge_members_list)

    def update_members_to_merge(self, arr_of_merge_members):
        """
        Updates TO_MERGE field with given list
        Returns:
                (dict): Updated document.
        """
        # Replacing  each Member with its respective id
        out = [(str(ms[0].id), str(ms[1].id)) for ms in arr_of_merge_members if ms[0].id != ms[1].id]
        logger.info(f"Adding members to merge: {out}")
        if not self.test:
            MembersController(self.tenant_id, repository=self.repository).update_members_to_merge(out)
        return out

    def populate_merge_couples(self, merge_candidates):
        """
        Generate merge couples from merge candidates
        A merge couple is a 2-element list that holds the user's that going to be proposed to be merged.
        Ex:
        merge_candidates = [u1,u2,u3]
        possible(if mergeable) merge couples for the merge_candidates = [u1,u2], [u1,u3], [u2,u3]

        Args:
            merge_candidates(list): a list of member candidates to be proposed to be merged
        Returns:
            main_list (list): A list of 2-element lists that represents TO_MERGE field
            Ex:
            [[u1,u2],[u2,u3]]

        """
        inner_list = []
        main_list = []

        for x in range(len(merge_candidates) - 1):
            for y in range(x + 1, len(merge_candidates)):
                if self.is_mergeable(merge_candidates[x], merge_candidates[y]):
                    inner_list = [merge_candidates[x], merge_candidates[y]]
                    main_list.append(inner_list)
                    inner_list = []

        return main_list

    def get_merge_members_list(self, member_hash):
        """
        Generates TO_MERGE from member_hash

        Args:
            member_hash(dict): a crowdUsername mapped dictionary that holds all the merge candidates for a crowdUsername.
        Returns:
            merge_members_list(list): a list of 2-element list that expresses a merge candidate
            Ex:
            [
                [m1,m2],
                [m1,m3]
            ]
        """
        merge_members_list = []

        for crowd_username in member_hash:
            if len(member_hash[crowd_username]) > 1:
                temp = self.populate_merge_couples(member_hash[crowd_username])
                if len(temp) > 0:
                    merge_members_list.extend(temp)

        return merge_members_list

    def get_mergeable_members_hash(self, members):
        """
        Gathers the merge candidates into a crowdUsername => [] type of dictionary.
        Args:
            members(list): List of member dicts.
        Returns:
            member_hash(dict): a crowdUsername mapped dictionary that holds all the merge candidates for a crowdUsername.
            Ex:
            {
                'anil'  : [list of comm. member candidates],
                'frodo' : [list of comm. member candidates]
            }
        """

        member_hash = {}

        for member in members:
            crowd_username = member.username[dbk.CROWD_USERNAME]
            added = False

            for platform in member.username:

                if not added and member.username[platform] in member_hash:
                    member_hash[member.username[platform]].append(member)
                    # stop checking for other platforms unnecesarily, we'll check mergeable later
                    added = True

            if crowd_username not in member_hash:
                member_hash[crowd_username] = [member]

        return member_hash

    def get_members(self):
        """
        Gets all the members of a tenant
        Returns:
                (list): List of member documents.
        """
        return self.repository.find_all(Member, query={dbk.TENANT: self.tenant_id})

    def is_mergeable(self, user_1, user_2):
        """
        Two merge candidates considered mergeable when they have no conflicting platform usernames and no 'no_merges'

        Args:
            user_1(dict), user_2(dict): Member dicts to check is_mergeable in between
        Returns:
            (bool): False if no_merge found between users, else True
        """
        return self.check_no_merge(user_1, user_2) and self.check_conflicting_platforms(user_1, user_2)

    def check_no_merge(self, user_1, user_2):
        """
        Checks no_merge field of merge candidates

        Args:
            user_1(dict), user_2(dict): Member dicts to check no_merge in between
        Returns:
            (bool): False if no_merge found between users, else True
        """
        return user_1.id not in user_2.noMerge and user_2.id not in user_1.noMerge

    def check_conflicting_platforms(self, user_1, user_2):
        """
        Checks conflicting platform usernames for merge candidates.
        Two users shouldn't proposed to be merged if they have different usernames for the same platform.

        Args:
            user_1(dict), user_2(dict): Member dicts to check conflicting platform usernames in between
        Returns:
            (bool): False if conflicting platform usernames found between users, else True
        """
        for platform in user_1.username:
            if (platform in user_2.username) and user_1.username[platform] != user_2.username[platform]:
                return False

        return True


if __name__ == "__main__":
    tenant_id = "ad9a1d40-238d-488d-9433-69752a110550"
    ue = CheckMergeDefault(tenant_id, test=False).run()
