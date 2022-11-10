from .base_controller import BaseController  # noqa
from .members_controller import MembersController  # noqa
from ..infrastructure.config import KUBE_MODE

# TODO-kube
if not KUBE_MODE:
    import dotenv  # noqa
    found = dotenv.find_dotenv(".env")
    dotenv.load_dotenv(found)