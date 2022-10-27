from crowd.backend.repository import Repository
from crowd.backend.models.activity import Activity
from crowd.backend.models.member import Member
import uuid


def test_find_in_table(api: "Repository"):
    result = api.find_in_table(Activity, {"type": "pull_request-closed"})
    assert result.id == uuid.UUID("51feeeee-202b-4271-8ef5-2ba8bef973d3")


def test_find_by_id(api: "Repository"):
    result = api.find_by_id(Member, "26f6d9ed-cf73-4dad-80f2-7f6e23a38370")
    assert result.username == {"github": "0x161e-swei", "crowdUsername": "0x161e-swei"}


def test_find_by_id_empty(api: "Repository"):
    result = api.find_by_id(Member, uuid.UUID("123e4567-e89b-12d3-a456-426614174000"))
    assert result is None


def test_find_all(api: "Repository"):
    result = api.find_all(Member)
    assert len(result) > 0
    assert type(result[0]) == Member


def test_find_all_single_target(api: "Repository"):
    result = api.find_all(Member, query={"username.github": "cjqpker"})
    assert len(result) == 1
    assert type(result[0]) == Member


def test_find_members(api: "Repository"):
    result = api.find_members("ThomasPluck")
    assert len(result) > 0
    assert type(result[0]) == Member
    assert result[0].username["crowdUsername"] == "ThomasPluck"


def test_count(api: "Repository"):
    result = api.count(Member, {"crowdInfo.slack.timezone": "Europe/Amsterdam"})
    assert result == 2


def test_validate_tenant_id(api: "Repository"):
    result = api._validate_tenant_id()
    assert result is True
