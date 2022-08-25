from crowd.backend.repository import Repository
from crowd.backend.models import Activity
from crowd.backend.models import CommunityMember
import datetime


def test_find_all_activities_for_member(api: "Repository"):
    result = api.find_in_table(CommunityMember, {"id": "cc38b881-9d6a-4690-b1a7-bd4636b1ce82"})

    assert len(result.activities.all()) > 1
    assert type(result.activities[0]) == Activity


def test_find_noMerge_for_member(api: "Repository"):
    result = api.find_in_table(CommunityMember, {"id": "cc38b881-9d6a-4690-b1a7-bd4636b1ce82"})
    assert getattr(result, "noMerge") == []


def test_find_member_of_activity(api: "Repository"):
    result = api.find_in_table(Activity, {"id": "673cebb3-38a0-474c-82f5-b2f86c0f69b0"})

    assert result.parentCommunityMember is not None
    assert type(result.parentCommunityMember) == CommunityMember


def test_find_members_with_activities_after_time(api: "Repository"):

    query = api.session.query(CommunityMember)
    result = query.filter(
        CommunityMember.activities.any(Activity.timestamp >= datetime.datetime.fromisoformat("2022-02-01 16:17:52"))
    ).all()

    assert len(result) == 1587
    assert type(result[0]) == CommunityMember
