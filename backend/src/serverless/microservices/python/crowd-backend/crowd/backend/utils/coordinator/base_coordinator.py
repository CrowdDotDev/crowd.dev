from crowd.backend.repository import Repository
from crowd.backend.models.tenant import Tenant
from crowd.backend.infrastructure import ServicesSQS


def base_coordinator(service, tenants=None):
    """
    Coordinator function handler that gets all the tenants and sends an SQS message to the worker for each tenant
    Args:
        service (str): The service to be processed
    Returns:
        (str): Success message
    """
    # Getting all available microservices of type service
    microservices = Repository().find_available_microservices(service)

    sqs_sender = ServicesSQS()
    for microservice in microservices:
        sqs_sender.send_message(microservice.tenantId, microservice.id, service)

    return f"{len(microservices)} microservices sent to {service} queue"
