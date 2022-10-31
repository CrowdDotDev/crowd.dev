from crowd.members_score import MembersScore


def members_score_worker(tenant_id):
    MembersScore(tenant_id).main()
