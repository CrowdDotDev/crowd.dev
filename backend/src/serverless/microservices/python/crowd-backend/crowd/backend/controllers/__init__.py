import logging

__version__ = "0.0.6"
from .base_controller import BaseController  # noqa
from .members_controller import MembersController  # noqa
from .activities_controller import ActivitiesController  # noqa
from .integrations_controller import IntegrationsController  # noqa
from .microservices_controller import MicroservicesController  # noqa
from ..infrastructure.config import KUBE_MODE

if not KUBE_MODE:
    import dotenv  # noqa
    found = dotenv.find_dotenv(".env")
    dotenv.load_dotenv(found)

root = logging.getLogger()
if root.handlers:
    for handler in root.handlers:
        root.removeHandler(handler)
logging.basicConfig(
    format="%(asctime)s.%(msecs)03d %(levelname)s [%(filename)s:%(lineno)s] %(message)s", level=logging.INFO
)
