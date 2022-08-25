from crowd.backend.repository import Repository
from crowd.backend.repository.keys import DBKeys as dbk
from datetime import datetime
from dateutil import parser
from crowd.backend.controllers import MembersController
from crowd.backend.models import CommunityMember, Tenant
import time
from crowd.backend.utils.datetime import CrowdDateTime as cdt
import logging
from sklearn.cluster import KMeans
import numpy as np

logger = logging.getLogger(__name__)


class MembersScore:
    def __init__(self, tenant_id, repository=False, test=False, send=True):

        self.tenant_id = tenant_id

        if not repository:
            self.repository = Repository(tenant_id=self.tenant_id, test=test)
        else:
            self.repository = repository

        self.fetch_scores()
        # print([
        #     member.id for member in self.repository.find_all(Tenant, query={})
        # ])

        print(self.tenants.fetchall())
        self.team_members = [
            member.id for member in self.repository.find_all(CommunityMember, query={"crowdInfo.team": True})
        ]

        self.send = send

        self.original_scores = {}
        self.scores = {}

    def fetch_scores(self):
        """
        This function accesses the database and fetches the mean scores for each community member for the last year

        The sql query selects all community members for a tenant,
        and joins it with a table containing every single day for the past year.
        This resulting table is then used to calculate the monthly mean score of
        engagement for each community member for the past year.
        The results of this query should be a table where each row contains a community member and his/her engagement
        for each month of the past year.
        """
        with self.repository.engine.connect() as con:

            id = self.repository.tenant_id

            self.mean_scores = con.execute(
                f'select "communityMemberId", avg(number_daily_activities) as average_daily_activities, avg(summed_daily_score) as summed_daily_score, coalesce(stddev(number_daily_activities),0), coalesce(stddev(summed_daily_score),0)  ,extract(month from MyJoinDate) as month, extract(year from MyJoinDate) as year\
                from (\
                select FullDates."communityMemberId", FullDates.MyJoinDate, coalesce(sum(e), 0) as number_daily_activities, coalesce(sum(s), 0) as summed_daily_score from \
                (\
                select "communityMemberId", AllDays.MyJoinDate, coalesce(sum(e), 0) as number_daily_activities, coalesce(sum(s), 0) as summed_daily_score\
                from\
                (SELECT date_trunc(\'day\', dd):: date as MyJoinDate\
                FROM generate_series\
                    ( (now() - INTERVAL \'364 DAY\')::timestamp\
                    , (now())::timestamp\
                    , \'1 day\'::interval) dd\
                    ) AllDays\
                cross join ( select "communityMemberId", count(*) as e, sum(score) as s, date("timestamp") as "timestamp"  \
                from public.activities where "activities"."tenantId" = CAST(\'{id}\' as uuid) \
                group by "communityMemberId", date("timestamp") ) U\
                group by "communityMemberId", Alldays.MyJoinDate order by Alldays.MyJoinDate ASC\
                ) FullDates \
                left join (select "communityMemberId" as cm_id, count(*) as e, sum(score) as s, date("timestamp") as "timestamp"  \
                from public.activities where "activities"."tenantId" = CAST(\'{id}\' as uuid) \
                group by "communityMemberId", date("timestamp")) T on T."cm_id"=FullDates."communityMemberId" and T."timestamp" = FullDates.MyJoinDate\
                group by FullDates."communityMemberId", FullDates.MyJoinDate order by FullDates.MyJoinDate asc\
                ) Daily group by "communityMemberId", extract(month from MyJoinDate), extract(year from MyJoinDate)'
            )

            self.tenants = con.execute(
                'select count(*), "tenantId" from "communityMembers" cm group by "tenantId" order by count(*) ASC'
            )

    def _calculate_months(self, date):
        """
        Calculate time difference

        Args:
            date (datime.datetime): the date to calculate months from
        """
        now = cdt.format(datetime.now())
        date = cdt.format(date)
        diff = now - date
        return (diff.days) / 30

    def calculate_member_score(self, i, row):

        result = 0

        k = 10
        m = 13  # Number of months to take into account

        average_monthly_score = row[2]
        stddev_score_activities = row[4]
        month = int(row[5])
        year = int(row[6])

        sm = float(average_monthly_score) / float(1 + stddev_score_activities)

        time_from_month = self._calculate_months(datetime.strptime(f"{int(year)}-{int(month)}", "%Y-%m"))

        result = ((0.9**time_from_month) * sm) * (k / m)

        return result

    def _member_lookalike_score(self, lookalikes):
        out = {}
        for member in lookalikes:
            score = 0
            if dbk.ACTIONS in member.crowdInfo.get("github", {}):
                for action in member.crowdInfo["github"][dbk.ACTIONS]:
                    timestamp = timestamp = parser.parse(action["timestamp"])
                    timestamp = timestamp.replace(tzinfo=None)
                    score += (0.9 ** self._calculate_months(timestamp)) * action["score"]

            twitter = "twitter" in member.username
            email = member.email
            if email and twitter:
                score *= 4
            elif email or twitter:
                score *= 2.5
            out[member.id] = round(score, 2)
        return out

    def _member_scores_(self, members):
        """
        Calculate the raw score for all members based on the activities they performed.
        Loop through the list of all activities and add the score of the activity weighted by the time since the activity
        to the score of the member.
        """

        id = self.repository.tenant_id

        mean_scores = self.mean_scores.fetchall()

        scores = {}
        for i, row in enumerate(mean_scores):

            member_id = row[0]

            # Checking that member is not team member
            # if "team" not in member.crowdInfo:
            if member_id not in self.team_members:
                if member_id not in scores:
                    scores[member_id] = 0

                scores[member_id] += self.calculate_member_score(i, row)
            else:
                scores[member_id] = -1

        return scores

    def normalise(self, scores):
        """
        Normalise the scores of all members based on the median raw score of all members.
        """

        # Getting a list of members who have 0 engagement
        # And a list of raw scores for noramlization
        inactive_members = [k for k, v in scores.items() if v == 0]

        active_members_scores = {k: v for k, v in scores.items() if v != 0}

        active_members_raw_scores = [active_members_scores[x] for x in active_members_scores.keys()]

        # Initialize the k means cluster
        if len(active_members_raw_scores) < 10:
            k = len(active_members_raw_scores)
        else:
            k = 10
        kmeans = KMeans(n_clusters=k, random_state=0)
        # Fit predict on our scores
        normalized_scores = kmeans.fit_predict(np.array(active_members_raw_scores).reshape(-1, 1))

        ord_idx = np.argsort(kmeans.cluster_centers_.flatten())

        cntrs = np.zeros_like(normalized_scores) - 1
        for i in np.arange(k):
            cntrs[normalized_scores == ord_idx[i]] = i

        normalized_scores = cntrs

        # Assigning inactive member engagement level
        for key in inactive_members:
            scores[key] = 0

        # Assigning other engagement level
        i = 0
        for key in active_members_scores:
            scores[key] = normalized_scores[i] + 1
            i += 1
        return scores

    def main(self):
        # Keeping track of time for lambda timeout
        start = time.time()
        logger.info("Finding members...")
        members = self.repository.find_all(CommunityMember, query={})
        logger.info("Found all members")

        logger.info("Saving original scores...")
        for member in members:
            self.original_scores[member.id] = member.score
        logger.info("Done")

        logger.info("Calculating member raw scores...")
        self.scores = self._member_scores_(members)
        logger.info("Done")

        logger.info("Normalising scores...")
        scores_to_update = self.normalise(self.scores)
        logger.info("Done")

        length = len(scores_to_update)
        changed = 0

        members_controller = MembersController(self.tenant_id, repository=self.repository)

        for n, member_id in enumerate(scores_to_update):
            if n % 500 == 0:
                logger.info(f"Updating {n} / {length}")
            if time.time() - start > 800:
                logger.info("Time limit reached. Will continue next time")
                break
            # We only update the score if it has changed
            if scores_to_update[member_id] != self.original_scores.get(member_id, -2):
                changed += 1
                members_controller.update(
                    [{"id": str(member_id), "update": {dbk.SCORE: scores_to_update[member_id]}}], send=self.send
                )

        return scores_to_update
