from crowd.backend.repository import Repository
from crowd.members_score import MembersScore


def test_calculate_member_score(api: "Repository"):

    api.set_tenant_id("f5c97d75-b919-4be6-9e57-b851efb336a1")
    members_score = MembersScore(api.tenant_id, api, send=False)

    updates = members_score.main()

    assert len(updates) == 207
    assert type(updates) == dict


def test_calculate_tenant_with_less_than_10_members(api: "Repository"):

    api.set_tenant_id("f6ea695e-cd8d-437b-acaa-474c53d76b05")
    members_score = MembersScore(api.tenant_id, api, send=False)

    updates = members_score.main()

    assert len(updates) == 4
    assert type(updates) == dict


def test_check_updates_when_scores_dont_change(api: "Repository"):

    id = "f6ea695e-cd8d-437b-acaa-474c53d76b05"
    api.set_tenant_id(id)
    members_score = MembersScore(api.tenant_id, api, send=False)

    updates = members_score.main()

    with api.engine.connect() as con:
        number_of_members = con.execute(
            f'select count(*) from "members" cm where "tenantId" = \'{id}\''
        ).fetchall()[0][0]

    # Check that if length of updates is less than the number of members
    assert len(updates) < number_of_members
    assert type(updates) == dict


def test_check_specific_member_scores(api: "Repository"):

    id = "b044af41-657a-4925-9541-cf8dfbdc687b"
    api.set_tenant_id(id)
    members_score = MembersScore(api.tenant_id, api, send=False)

    updates = members_score.main()

    updates_str = {str(k): v for k, v in updates.items()}

    assert updates_str["f97995cd-6400-49e9-84a6-6ef9f38ffbf6"] == 6
    assert updates_str["f2e355ed-3a45-4b63-b228-59ee7aeafe0c"] == 7
    assert updates_str["bc6665c0-203c-4d9c-b95f-07877df7f9be"] == 1
