from crowd.check_merge_members.test.test_members_list import members_1, members_2
from crowd.check_merge_members.check_merge_default import CheckMergeDefault
from crowd.backend.repository import Repository
from crowd.backend.repository.keys import DBKeys as dbk

test = True


def test_simple_merge(api: "Repository"):
    """Tests a tenant for merges"""
    api.set_tenant_id("b044af41-657a-4925-9541-cf8dfbdc687b")
    updates = CheckMergeDefault(api.tenant_id, api, test=test).run()

    merge_result = members_1

    assert merge_result == updates


def test_more_than_two_merges(api: "Repository"):
    """Tests a tenant where there are more than two merges for a member"""
    api.set_tenant_id("b044af41-657a-4925-9541-cf8dfbdc687b")
    current_members_to_merge = CheckMergeDefault(api.tenant_id, api, test=test).run()

    merge_result = members_2

    assert set(merge_result).issubset(current_members_to_merge)


def test_simple_no_merge(api: "Repository"):
    """Tests a tenant where there are no merges"""
    api.set_tenant_id("62bf698d-f3e9-47ca-891b-b00455d1425c")

    current_members_to_merge = CheckMergeDefault(api.tenant_id, api, test=test).run()

    assert current_members_to_merge == []


# TODO-test (add test cases)

# def test_conflicting_platform_merge(mongodb_client):
#     repository = Repository(tenant_id=tenant_id, client=mongodb_client)

#     refresh_environment(ma)

#     repository.add_many(col.com_member, members_5)

#     CheckMergeMembers(tenant_id, repository=ma).run()

#     # m[0] and m[2] has conflicting platform usernames,
#     # a merge proposal shouldn't happen between m[0] and m[2]
#     merge_result = [[members_5[0], members_5[1]], [members_5[1], members_5[2]]]

#     current_members_to_merge = get_members_to_merge(mongodb_client)

#     assert merge_result == current_members_to_merge


# def test_merge_variations_together(mongodb_client):
#     repository = Repository(tenant_id=tenant_id, client=mongodb_client)

#     refresh_environment(ma)
#     repository.add_many(col.com_member, members_6)

#     CheckMergeMembers(tenant_id, repository=ma).run()

#     merge_result = [[members_6[1], members_6[2]], [members_6[4], members_6[5]], [members_6[4], members_6[6]]]

#     current_members_to_merge = get_members_to_merge(mongodb_client)

#     assert merge_result == current_members_to_merge
