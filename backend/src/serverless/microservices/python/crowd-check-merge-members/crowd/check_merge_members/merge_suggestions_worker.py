from crowd.check_merge_members.merge_suggestions import MergeSuggestions
from crowd.backend.repository import Repository
from crowd.backend.infrastructure import ServicesSQS


def merge_suggestions_worker(tenant_id, member, repository=False, test=False):
    """
    Trigger the merge suggestions for one member of a tenant
    """

    if not repository:
        repository = Repository(tenant_id)

    sqs_sender = ServicesSQS()
    return MergeSuggestions(tenant_id, sqs_sender, repository=repository, test=test).run(member)


if __name__ == '__main__':
    merge_suggestions_worker("93e9e110-622f-45a3-96eb-4ab9e0581e50", "f2f43f09-c820-47f6-a893-6849e16d4d79")
