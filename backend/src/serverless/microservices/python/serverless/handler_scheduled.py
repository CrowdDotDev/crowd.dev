from crowd.backend.utils.coordinator import base_coordinator
from crowd.backend.enums import Services
from crowd.members_score import members_score_worker
from crowd.backend.infrastructure import StateMachine
from datetime import datetime
import json

"""
Handler file for all scheduled microservices
"""


def coordinator(event, context):
    """
    Coordinator function for all scheduled microservices

    Args:
        event (dict): Event from the cloudwatch event

    Returns:
        str: Response from sending coordinator messages
    """
    service = event.get("service", "")
    if service == Services.MEMBERS_SCORE.value:
        return base_coordinator(service)

def worker(msg, context):
    events = msg["Records"]
    for event in events:
        event = json.loads(event["body"])
        tenant_id = event["tenant"]
        service = event.get("service", "")
        microservice_id = event.get("microservice_id", "")
        params = event.get("params", None)

        if service == Services.MEMBERS_SCORE.value:
            members_score_worker(tenant_id)


if __name__ == "__main__":
    worker(
        {
            "Records": [
                {"body": '{\n  "service": "members_score",\n  "tenant": "e78fcbbe-3b1f-4d0f-b7ce-1105fc985d0d"\n}\n'}
            ]
        },
        None,
    )
