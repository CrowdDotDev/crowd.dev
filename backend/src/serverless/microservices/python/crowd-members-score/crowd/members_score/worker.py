from crowd.members_score import MembersScore


def members_score_worker(tenant_id):
    MembersScore(tenant_id).main()


if __name__ == "__main__":
    members_score_worker("ab1d6621-9d56-411a-92ad-cd24a2185cd7")
