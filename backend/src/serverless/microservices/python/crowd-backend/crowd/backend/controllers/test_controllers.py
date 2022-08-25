from crowd.backend.controllers import ActivitiesController
from crowd.backend.controllers import MembersController
from crowd.backend.controllers import IntegrationsController
from crowd.backend.repository import Repository


def test_upsert_member(api: "Repository"):
    members_controller = MembersController(api.tenant_id, api)
    member_to_upsert = {
        "id": "c5c1e44d-86d7-40b7-80ef-55fc281620ca",
        "username": '{"apis": "jacqueline_love", "discord": "jacqueline_love", "crowdUsername": "jacqueline_love"}',
        "type": "member",
        "info": "{}",
        "platform": "github",
        "crowdInfo": '{"discord": {"name": "Jacqueline Love", "sample": True}}',
        "email": "jacqueline.love@gmail.com",
        "score": 10,
        "bio": "",
        "organisation": "",
        "location": "",
        "signals": None,
        "joinedAt": "2021-09-13T17:27:36.421Z",
        "importHash": None,
        "createdAt": "2022-02-28T12:52:12.598Z",
        "updatedAt": "2022-02-28T12:52:12.598Z",
        "deletedAt": None,
        "tenantId": "49e74479-63c3-46c0-89f5-b31700f36d80",
        "createdById": "0772da68-f887-4ef9-9dbd-a67495a8ab9f",
        "updatedById": "0772da68-f887-4ef9-9dbd-a67495a8ab9f",
    }
    result = members_controller.upsert([member_to_upsert], send=False)
    assert result == 1


def test_update_members_to_merge(api: "Repository"):
    """Tests updating the members to merge"""
    members_controller = MembersController(api.tenant_id, api)
    members_to_merge = ({"id": "160f1462-7df1-4bc0-bc16-8b357608725c"}, {"id": "c5c1e44d-86d7-40b7-80ef-55fc281620ca"})
    result = members_controller.update_members_to_merge([members_to_merge], send=False)
    assert result == 1


def test_update_members(api: "Repository"):
    """Tests updating a members using the members_controller"""
    members_controller = MembersController(api.tenant_id, api)
    updates = {"id": "160f1462-7df1-4bc0-bc16-8b357608725c", "update": {"organisation": "crowd.dev"}}
    result = members_controller.update([updates], send=False)
    assert result == 1


def test_add_activity_with_member(api: "Repository"):
    """Tests adding an activity with a CommunityMember"""
    activities_controller = ActivitiesController(api.tenant_id, api)

    activity = {
        "id": "097240d7-2bd9-4296-89a9-f697222cf98a",
        "type": "issue-comment",
        "timestamp": "2021-01-11T10:40:01.000Z",
        "platform": "github",
        "info": "{}",
        "crowdInfo": '{"url": "test", "body": "test", "repo": "test", "title": "Client returns different total number of entities in a non-deterministic way", "parent_url": "htest"}',  # noqa
        "isKeyAction": True,
        "score": 3,
        "sourceId": None,
        "importHash": None,
        "createdAt": "2022-02-28T12:54:27.761Z",
        "updatedAt": "2022-02-28T12:54:27.761Z",
        "deletedAt": None,
        "communityMember": {
            "id": "c5c1e44d-86d7-40b7-80ef-55fc281620ca",
            "username": '{"apis": "jacqueline_love", "discord": "jacqueline_love", "crowdUsername": "jacqueline_love"}',
            "type": "member",
            "info": "{}",
            "crowdInfo": '{"discord": {"name": "Jacqueline Love", "sample": True}}',
            "email": "jacqueline.love@gmail.com",
            "score": 10,
            "bio": "",
            "organisation": "",
            "location": "",
            "signals": None,
            "joinedAt": "2021-09-13T17:27:36.421Z",
            "importHash": None,
            "createdAt": "2022-02-28T12:52:12.598Z",
            "updatedAt": "2022-02-28T12:52:12.598Z",
            "deletedAt": None,
            "tenantId": "49e74479-63c3-46c0-89f5-b31700f36d80",
            "createdById": "0772da68-f887-4ef9-9dbd-a67495a8ab9f",
            "updatedById": "0772da68-f887-4ef9-9dbd-a67495a8ab9f",
        },
        "parentId": None,
        "tenantId": "2d19aa2c-2ae5-48d0-b501-ef07271879c9",
        "createdById": "0d03387c-afe6-4519-a2e6-70f174a55390",
        "updatedById": "0d03387c-afe6-4519-a2e6-70f174a55390",
    }

    result = activities_controller.add_activity_with_member([activity], send=False)
    assert result == 1


def test_update_integrations(api: "Repository"):
    """Tests updating an integration"""
    integrations_controller = IntegrationsController(api.tenant_id, api)

    updates = {"id": "6aa8b316-3386-401b-9fa9-dda6ab1f3649", "update": {"status": "in-progress"}}
    result = integrations_controller.update([updates], send=False)
    assert result == 1
