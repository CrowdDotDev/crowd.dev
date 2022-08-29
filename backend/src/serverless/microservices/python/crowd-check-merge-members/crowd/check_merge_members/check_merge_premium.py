from crowd.backend.controllers import MicroservicesController
from crowd.backend.repository import Repository
from crowd.backend.repository.keys import DBKeys as dbk
from crowd.backend.controllers import MembersController
from crowd.backend.models import Member, Integration
import logging
from crowd.backend.enums import Services

from datetime import datetime, timedelta

import heapq
import re

import os
from io import StringIO
import fuzzy
from Levenshtein import distance as levenshtein_distance

logger = logging.getLogger(__name__)


class CheckMergePremium:

    # Static variable threshhold
    threshhold = 0.85
    same_platform_threshhold = 0.90

    def __init__(self, tenant_id, microservice, index, sqs_sender, repository=False, test=False):
        """
        CheckMergeMembers constructor. Coordinator can return a list of tenant_ids.

        Args:
            tenant_id (string): tenant id users will be checked.
            microservice (Microservice) : the microservice we are using
            index (int): the index from which we are going to start comparing
            sqs_sender(ServiceSQS): sqs service which we are going to use to invoke other workers
            repository(Repository): the repository we are using
        """

        self.tenant_id = tenant_id

        if not repository:
            self.repository = Repository(tenant_id=self.tenant_id)
        else:
            self.repository = repository

        self.microservice = microservice

        self.start_time = datetime.now()

        self.index = index

        self.sqs_sender = sqs_sender

        # Compute all members
        all_members = self.repository.find_all(Member, query={"type": "member"})

        if self.microservice.init:
            # Compute new members
            self.to_check = self.repository.find_new_members(self.microservice)
        else:
            self.to_check = all_members

        self.comparison = all_members

        self.test = test

    def run(self):
        """
        Gets all members of the tenant,
        Creates a hash out of same crowdUsernames for easy access
        Generates membersToMerge field out of hash -checks is_mergeable as well-
        """

        # Calculating time needed
        now = datetime.now()

        # Update microservice running to True
        if not self.test:
            updates = [{"id": self.microservice.id, "update": {"running": True}}]
            MicroservicesController(self.tenant_id, repository=self.repository).update_microservices(updates)

        self.to_check = self.to_check[self.index :]

        # Check if tenant has only 1 integration
        tenant_integrations = self.repository.find_in_table(Integration, {dbk.TENANT: self.tenant_id}, many=True)

        if len(tenant_integrations) <= 1:
            same_platform = True
        else:
            same_platform = False

        # Initialize variable for tomerge updates
        out = []
        for i, member_to_check in enumerate(self.to_check):
            now = datetime.now()
            if now - self.start_time >= timedelta(minutes=10):
                # Send new sqs to start new worker
                self.sqs_sender.send_message(
                    self.microservice.tenantId, self.microservice.id, Services.CHECK_MERGE.value, params={"index": i}
                )
            else:
                # Run comparison for member
                top_users, top_scores = self.find_similar_user(
                    member_to_check,
                    self.comparison[0 : self.index] + self.comparison[self.index + i + 1 :],
                    same_platform=same_platform,
                )

                # Checking if we found a similarity
                if top_users:
                    for i, top_user in enumerate(top_users):
                        out.append((str(member_to_check.id), str(top_user.id)))

        # Execute tomerge update
        if not self.test:
            MembersController(self.tenant_id, repository=self.repository).update_members_to_merge(out)

        # Update microservice
        if not self.test:
            updates = [
                {"id": self.microservice.id, "update": {"running": False, "updatedAt": datetime.now(), "init": True}}
            ]
            MicroservicesController(self.tenant_id, repository=self.repository).update_microservices(updates)

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
        v1 = self.word2vec(ws[0])
        v2 = self.word2vec(ws[1])
        # which characters are common to the two words?
        common = v1[1].intersection(v2[1])
        # by definition of cosine distance we have
        out = sum(v1[0][ch] * v2[0][ch] for ch in common) / v1[2] / v2[2]
        # print(time.time() - start)
        return out

    def find_similar_user(self, user, comparison, same_platform=False):
        """
        Function that finds top k similar users to the user given in argument in the database

        Args:
            user (Member): The user to which we are going to find similar users
            comparison (List(Member)): the list of users to compare user with
            same_platform (Boolean): Whether the user and the comaprison set have the same platform or not
        """

        # Get all users
        users = comparison

        top_user_scores = []
        top_users = []
        for i in range(len(users)):
            # Avoiding self comparison
            if users[i].id != user.id:
                average_distance = 0
                number_of_keys = 0
                average_distance_levenshtein = 0

                # Go through all platform usernames
                user_platforms = set(user.username)
                comparison_platforms = set(users[i].username)

                if same_platform:
                    # Set threshhold
                    threshhold = CheckMergePremium.same_platform_threshhold
                    # Compare same platform together
                    for user_platform in user_platforms:
                        for comparison_platform in comparison_platforms:
                            # Calculate cosdis distance
                            average_distance += self.evaluate_distance(
                                user.username[user_platform], users[i].username[comparison_platform]
                            )
                            # Calculate levenshtein nysiis distance
                            average_distance_levenshtein += self.calculate_levenshtein_nysiis_distance(
                                user.username[user_platform], users[i].username[comparison_platform]
                            )
                            number_of_keys += 1

                else:
                    # Set threshhold
                    threshhold = CheckMergePremium.threshhold
                    # Check if members' have different usernames in same platform
                    # In this case, they are not the same
                    common_platforms = user_platforms.intersection(comparison_platforms)
                    if self.check_same_platform(user, users[i], common_platforms):
                        continue

                    # Compare different platforms together
                    for user_platform in user_platforms:
                        for comparison_platform in comparison_platforms:
                            if comparison_platform != user_platform:
                                # Calculate cosdis distance
                                average_distance += self.evaluate_distance(
                                    user.username[user_platform], users[i].username[comparison_platform]
                                )

                                # Calculate levenshtein nysiis distance
                                average_distance_levenshtein += self.calculate_levenshtein_nysiis_distance(
                                    user.username[user_platform], users[i].username[comparison_platform]
                                )
                                number_of_keys += 1

                # Normalizing distance
                if number_of_keys > 0:
                    average_distance = average_distance / number_of_keys
                    average_distance_levenshtein = average_distance_levenshtein / number_of_keys

                # if average_distance > threshhold:
                if average_distance > threshhold and average_distance_levenshtein < 0.25:
                    top_user_scores.append(average_distance)
                    top_users.append(users[i])

        return top_users, top_user_scores

    def check_same_platform(self, user1, user2, platforms):
        """
        Checks the similarity in the same platforms for users
        If two users have two unsimilar usernames in the same platform it returns True, else it returns False

        Args:
            user1 (Member): First user we are going to compare
            user2 (Member): Second user we are going to compare
            platforms (List(str)): the common platforms between users
        """
        for platform in platforms:
            if (
                self.evaluate_distance(user1.username[platform], user2.username[platform])
                < CheckMergePremium.same_platform_threshhold
            ):
                return True

        return False
