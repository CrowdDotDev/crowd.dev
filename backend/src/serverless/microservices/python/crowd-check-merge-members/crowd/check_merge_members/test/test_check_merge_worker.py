from crowd.backend.repository import Repository
from crowd.check_merge_members import check_merge_members_worker
from crowd.check_merge_members.check_merge_premium import CheckMergePremium
from crowd.backend.models import Microservice
from crowd.backend.infrastructure import ServicesSQS


sqs_sender = ServicesSQS()
test = True


def test_check_merge_worker(api: "Repository"):
    """
    Testing check merge with index 5, from which there are 7 similarities
    """

    api.set_tenant_id("2e6fd7f9-aa60-43f4-b120-c1875069e738")
    microservice_id = "e0f7d562-a2f4-42b2-8843-ef673ae74306"

    updates = check_merge_members_worker(api.tenant_id, microservice_id, params={}, repository=api, test=test)

    assert len(updates) == 9
