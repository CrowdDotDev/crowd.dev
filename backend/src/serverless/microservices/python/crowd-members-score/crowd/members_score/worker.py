from crowd.members_score import MembersScore


def members_score_worker(tenant_id):
    MembersScore(tenant_id).main()


if __name__ == "__main__":
    members_score_worker("93e9e110-622f-45a3-96eb-4ab9e0581e50")
