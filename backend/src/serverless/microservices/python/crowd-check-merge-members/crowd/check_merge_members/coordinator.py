from crowd.backend.controllers import MicroservicesController
from crowd.backend.enums import Services
from crowd.backend.utils.coordinator import base_coordinator


def check_merge_coordinator():

    return base_coordinator(Services.CHECK_MERGE.value)
