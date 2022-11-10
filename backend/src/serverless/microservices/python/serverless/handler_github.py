from crowd.github.onboarding.coordinator import coordinator
from crowd.github.onboarding.check_status import github_onboarding_status
from crowd.github.onboarding.worker import github_onboarding_worker
from crowd.backend.infrastructure.logging import get_logger

logger = get_logger(__name__)


def onboarding_coordinator(event, context):
    """
    Handler for the onboarding coordinator.

    Args:
        event (dict): event coming from the state machine

    Returns:
        dict: success message
    """
    token = event["token"]
    tenant_id = event["tenant_id"]
    for param in [token, tenant_id]:
        if not param:
            raise Exception({"status": "failed", "error": f"Missing {param}"})
    logger.info(f"Received onboarding request for tenant {tenant_id} and token {token}")
    return {"status": "ok", "repos": coordinator(tenant_id, install_token=token, state=None)}


def onboarding_worker(event, context):
    """
    Handler for the onboarding worker.

    Args:
        event (dict): event coming from the state machine

    Returns:
        dict: end state of the worker
    """
    return github_onboarding_worker(event)


def onboarding_status(event, context):
    """
    Handler for the onboarding status.

    Args:
        event (dict): event coming from the state machine

    Returns:
        str: success message or message that a next coordinator has been called
    """
    return github_onboarding_status(event)
