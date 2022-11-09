from crowd.backend.infrastructure.logging import LOGGER
from crowd.backend.repository import Repository
from crowd.backend.controllers import MembersController
from crowd.backend.models import Member, Integration
import time
import logging
import re
import fuzzy
from Levenshtein import distance as levenshtein_distance

logger = logging.getLogger(__name__)


class MergeSuggestions:

    # Static variable threshold
    threshold = 0.85
    levenshtein_threshold = 0.5
    same_platform_threshold = 0.90

    def __init__(self, tenant_id, sqs_sender, repository=False, test=False):
        """
        CheckMergeMembers constructor. Coordinator can return a list of tenant_ids.

        Args:
            tenant_id (string): tenant id members will be checked.
            sqs_sender(ServiceSQS): sqs service which we are going to use to invoke other workers
            repository(Repository): the repository we are using
        """

        self.tenant_id = tenant_id

        if not repository:
            self.repository = Repository(tenant_id=self.tenant_id)
        else:
            self.repository = repository

        self.sqs_sender = sqs_sender

        # Compute all members
        self.comparison = self.repository.find_all_usernames()
        LOGGER.info(f"Found {self.comparison} members to compare")

        self.test = test

    def run(self, member_to_check_id):
        """
        Gets all members of the tenant,
        Creates a hash out of same crowdUsernames for easy access
        Generates membersToMerge field out of hash -checks is_mergeable as well-
        """

        # We moght need to try a few times to allow the db to be from write to read replicas
        member_to_check = None
        attempts = 0
        while not member_to_check and attempts < 10:
            time.sleep(1)
            member_to_check = self.repository.find_by_id(Member, member_to_check_id)
            attempts += 1

        if not member_to_check:
            logger.info("Member to check not found")
            return

        # Check if tenant has only 1 integration
        tenant_integrations = self.repository.find_in_table(Integration, {'tenantId': self.tenant_id}, many=True)

        if len(tenant_integrations) <= 1:
            same_platform = True
        else:
            same_platform = False

        # Initialize variable for tomerge updates
        out = []

        # Run comparison for member
        top_members, top_scores = self.find_similar_member(
            member_to_check,
            self.comparison,
            same_platform=same_platform,
        )

        # Checking if we found a similarity
        if top_members:
            for i, top_member in enumerate(top_members):
                out.append((str(member_to_check.id), str(top_member.id)))

        if not self.test:
            MembersController(self.tenant_id, repository=self.repository).update_members_to_merge(out)

        logger.info(f"Adding members to merge: {out}")

        return out

    def preprocess(self, name):
        """
        Function that removes stop words like callme, mynameis, iam, etc.. from string

        Args:
            name (str): string input that will be preprocessed
        """

        return re.sub(r"(call[_.\s-]*me|my[_.\s-]*name[_.\s-]*is)|i[_.\s-]*am|hq|eth|btc", "", name.lower())

    def evaluate_distance(self, token1, token2):
        """
        Returns the cosdis between token1 and token2
        """
        # Preprocessing tokens
        token1 = self.preprocess(token1)
        token2 = self.preprocess(token2)
        if (token1 == '' or token2 == ''):
            return 0
        return self.cosdis(((token1), (token2)))

    def calculate_levenshtein_nysiis_distance(self, token1, token2):
        """
        Returns the levenshtein distance between the nysiis result of token1 and token2

        The nysiis result of token1 and token2 is a phonetic representation of the word.
        The Levenshtein distance between two strings is the minimum number of inserting, deleting, and replacing operations to transform the first string into the second.
        """
        return levenshtein_distance(fuzzy.nysiis(token1), fuzzy.nysiis(token2)) / min(len(token1), len(token2))

    def word2vec(self, word):
        from collections import Counter
        from math import sqrt

        # count the characters in word
        cw = Counter(word)
        # precomputes a set of the different characters
        sw = set(cw)
        # precomputes the "length" of the word vector
        lw = sqrt(sum(c * c for c in cw.values()))

        # return a tuple
        return cw, sw, lw

    def cosdis(self, ws):
        logger.debug("Calculating cosdis for: {}".format(ws))
        v1 = self.word2vec(ws[0])
        v2 = self.word2vec(ws[1])
        # which characters are common to the two words?
        common = v1[1].intersection(v2[1])
        # by definition of cosine distance we have
        out = sum(v1[0][ch] * v2[0][ch] for ch in common) / v1[2] / v2[2]
        return out

    def find_similar_member(self, member, comparison, same_platform=False):
        """
        Function that finds top k similar members to the member given in argument in the database

        Args:
            member (Member): The member to which we are going to find similar members
            comparison (List(Member)): the list of members to compare member with
            same_platform (Boolean): Whether the member and the comaprison set have the same platform or not
        """

        # Get all members
        members = comparison

        top_member_scores = []
        top_members = []
        for i in range(len(members)):
            # Avoiding self comparison
            if members[i].id != member.id:
                average_distance = 0
                number_of_keys = 0
                average_distance_levenshtein = 0

                # Go through all platform usernames
                member_platforms = set(member.username)
                comparison_platforms = set(members[i].username)

                if same_platform:
                    # Set threshold
                    threshold = MergeSuggestions.same_platform_threshold
                    levenshtein_threshold = MergeSuggestions.levenshtein_threshold
                    # Compare same platform together
                    for member_platform in member_platforms:
                        for comparison_platform in comparison_platforms:
                            # Calculate cosdis distance
                            average_distance += self.evaluate_distance(
                                member.username[member_platform], members[i].username[comparison_platform]
                            )
                            # Calculate levenshtein nysiis distance
                            average_distance_levenshtein += self.calculate_levenshtein_nysiis_distance(
                                member.username[member_platform], members[i].username[comparison_platform]
                            )
                            number_of_keys += 1

                else:
                    # Set threshold
                    threshold = MergeSuggestions.threshold
                    levenshtein_threshold = MergeSuggestions.levenshtein_threshold

                    # Check if members' have different usernames in same platform
                    # In this case, they are not the same
                    common_platforms = member_platforms.intersection(comparison_platforms)
                    if self.check_same_platform(member, members[i], common_platforms):
                        continue

                    # Compare different platforms together
                    for member_platform in member_platforms:
                        for comparison_platform in comparison_platforms:
                            if comparison_platform != member_platform:
                                # Calculate cosdis distance
                                average_distance += self.evaluate_distance(
                                    member.username[member_platform], members[i].username[comparison_platform]
                                )

                                # Calculate levenshtein nysiis distance
                                average_distance_levenshtein += self.calculate_levenshtein_nysiis_distance(
                                    member.username[member_platform], members[i].username[comparison_platform]
                                )

                                number_of_keys += 1

                # Normalizing distance
                if number_of_keys > 0:
                    average_distance = average_distance / number_of_keys
                    average_distance_levenshtein = average_distance_levenshtein / number_of_keys

                # if average_distance > threshold:
                if average_distance >= threshold and average_distance_levenshtein <= levenshtein_threshold:
                    top_member_scores.append(average_distance)
                    top_members.append(members[i])

        return top_members, top_member_scores

    def check_same_platform(self, member1, member2, platforms):
        """
        Checks the similarity in the same platforms for members
        If two members have two unsimilar usernames in the same platform it returns True, else it returns False

        Args:
            member1 (Member): First member we are going to compare
            member2 (Member): Second member we are going to compare
            platforms (List(str)): the common platforms between members
        """
        # for platform in platforms:
        #     if (
        #         self.evaluate_distance(member1.username[platform], member2.username[platform])
        #         < MergeSuggestions.same_platform_threshold
        #     ):
        #         return True

        return False
