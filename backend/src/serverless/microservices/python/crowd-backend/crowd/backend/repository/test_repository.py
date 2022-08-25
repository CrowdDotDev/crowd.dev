from crowd.backend.models.integration import Integration
from crowd.backend.repository import Repository
from crowd.backend.models.activity import Activity
from crowd.backend.models.community_member import CommunityMember
import uuid


def test_find_in_table(api: "Repository"):
    """Tests the find in table function on an Activity of type pull_request-closed"""
    result = api.find_in_table(Activity, {"type": "pull_request-closed"})
    assert result.id == uuid.UUID("51feeeee-202b-4271-8ef5-2ba8bef973d3")


def test_find_by_id(api: "Repository"):
    """Tests the find by id function for a CommunityMember"""
    result = api.find_by_id(CommunityMember, "26f6d9ed-cf73-4dad-80f2-7f6e23a38370")
    assert result.username == {"github": "0x161e-swei", "crowdUsername": "0x161e-swei"}


def test_find_by_id_empty(api: "Repository"):
    """Tests the find by id function on an unexistant CommunityMember"""
    result = api.find_by_id(CommunityMember, uuid.UUID("123e4567-e89b-12d3-a456-426614174000"))
    assert result is None


def test_find_all(api: "Repository"):
    """Tests the find by id function for a CommunityMember"""
    result = api.find_all(CommunityMember)
    assert len(result) > 0
    assert type(result[0]) == CommunityMember


def test_find_all_single_target(api: "Repository"):
    """Tests the find all function for a CommunityMember and using github username"""
    result = api.find_all(CommunityMember, query={"username.github": "cjqpker"})
    assert len(result) == 1
    assert type(result[0]) == CommunityMember


def test_find_members(api: "Repository"):
    """Tests the find members function"""
    result = api.find_members("ThomasPluck")
    assert len(result) > 0
    assert type(result[0]) == CommunityMember
    assert result[0].username["crowdUsername"] == "ThomasPluck"


def test_count(api: "Repository"):
    """Tests the count function for CommunityMembers that have their slack timzezone in Europe/Amsterdam"""
    result = api.count(CommunityMember, {"crowdInfo.slack.timezone": "Europe/Amsterdam"})
    assert result == 2


def test_validate_tenant_id(api: "Repository"):
    """Tests the validate tenant_id function"""
    result = api._validate_tenant_id()
    assert result is True


def test_find_active_widgets(api: "Repository"):
    """Tests finding active widgets of type benchmark"""
    result = api.find_active_widgets("benchmark")
    assert len(result) == 1
    assert result[0].type == "benchmark"
    assert result[0].settings is not None


def test_find_activities(api: "Repository"):
    """ "Tests finding activities of type "joined_community"""
    result = api.find_activities({"type": "joined_community"})

    assert type(result[0]) == Activity
    assert result[0].type == "joined_community"
    assert len(result) == 3753


def test_find_integration_by_platform(api: "Repository"):
    """ "Tests finding integration by crowd platform"""
    result = api.find_integration_by_platform("crowd")

    assert type(result) == Integration
    assert result.platform == "crowd"


def test_find_integration_by_identifier(api: "Repository"):
    """ "Tests finding integration by github identification"""
    result = api.find_integration_by_identifier("github", "23253548")

    assert type(result) == Integration


def test_find_community_member_order_by_createdAt(api: "Repository"):
    """Tests finding community members and ordering them with descending createdAt dates"""

    members = api.find_all(CommunityMember, query={"type": "member"}, order={CommunityMember.createdAt: False})

    assert members[0].createdAt >= members[len(members) - 1].createdAt
