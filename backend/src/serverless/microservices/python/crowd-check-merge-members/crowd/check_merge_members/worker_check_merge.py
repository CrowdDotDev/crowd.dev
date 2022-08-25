from crowd.check_merge_members.check_merge_default import CheckMergeDefault
from crowd.check_merge_members.check_merge_premium import CheckMergePremium
from crowd.backend.repository import Repository
from crowd.backend.models import Microservice
from crowd.backend.infrastructure import ServicesSQS


def check_merge_members_worker(tenant_id, microservice_id, params, repository=False, test=False):
    """
    Check merge worker function handler that runs the merge checker for each distinct tenant.
    Args:
        event(dict): event dict that contains tenant_id.
    """

    if not repository:
        repository = Repository(tenant_id)

    sqs_sender = ServicesSQS()

    microservice = repository.find_by_id(Microservice, microservice_id)
    if microservice.type == "check_merge":

        # Check if microservice is premium or default
        # Default:
        if microservice.variant == "default":
            return CheckMergeDefault(tenant_id, repository=repository, test=test).run()
        # Premium:
        else:
            if "index" in params:
                index = params["index"]
            else:
                index = 0
            return CheckMergePremium(tenant_id, microservice, index, sqs_sender, repository=repository, test=test).run()
