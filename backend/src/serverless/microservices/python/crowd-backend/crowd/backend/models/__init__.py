import logging


from .activity import Activity  # noqa
from .member import Member  # noqa
from .tenant import Tenant
from .microservice import Microservice
from .integration import Integration
from ..infrastructure import KUBE_MODE

# from .repo import Repo  # noqa
# TODO-kube
if not KUBE_MODE:
    import dotenv  # noqa
    found = dotenv.find_dotenv(".env")
    found_base = dotenv.find_dotenv(".env")
    dotenv.load_dotenv(found)
    dotenv.load_dotenv(found_base)

root = logging.getLogger()
if root.handlers:
    for handler in root.handlers:
        root.removeHandler(handler)
logging.basicConfig(
    format="%(asctime)s.%(msecs)03d %(levelname)s [%(filename)s:%(lineno)s] %(message)s", level=logging.INFO
)
