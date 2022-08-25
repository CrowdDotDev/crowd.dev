from crowd.backend.repository import Repository
from crowd.check_merge_members import check_merge_members_worker
from crowd.check_merge_members.check_merge_premium import CheckMergePremium
from crowd.backend.models import Microservice
from crowd.backend.infrastructure import ServicesSQS


sqs_sender = ServicesSQS()
test = True


def test_check_merge(api: "Repository"):
    """
    Testing check merge with index 5, from which there are 14 similarities
    """

    api.set_tenant_id("92b2045c-6821-4266-8f92-3a71e5ef1dd8")
    microservice_id = "280d830a-e784-44de-908a-9b512a8b85f9"
    index = 5

    microservice = api.find_by_id(Microservice, microservice_id)

    if microservice.type == "check_merge":
        updates = CheckMergePremium(api.tenant_id, microservice, index, sqs_sender, repository=api, test=test).run()

    assert len(updates) == 14


def test_check_merge_different_tenant(api: "Repository"):
    """
    Testing check merge with a different tenant to check for 10 similarities
    """

    api.set_tenant_id("2e6fd7f9-aa60-43f4-b120-c1875069e738")
    microservice_id = "e0f7d562-a2f4-42b2-8843-ef673ae74306"
    index = 5

    microservice = api.find_by_id(Microservice, microservice_id)
    if microservice.type == "check_merge":
        updates = CheckMergePremium(api.tenant_id, microservice, index, sqs_sender, repository=api, test=test).run()

    assert len(updates) == 12


def test_check_merge_wrong_tenant_id(api: "Repository"):
    """
    Testing check merge with tenant_id that doesn't exist
    """
    api.set_tenant_id("f26d90ab-3685-4ee1-a3e9-ac275e3c5f9e")
    microservice_id = "0ef931fb-a7e2-47f2-a7a2-4bd161eb130a"
    index = 3000

    microservice = api.find_by_id(Microservice, microservice_id)
    if microservice.type == "check_merge":
        updates = CheckMergePremium(api.tenant_id, microservice, index, sqs_sender, repository=api, test=test).run()

    assert len(updates) == 0
