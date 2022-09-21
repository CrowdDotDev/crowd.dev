__version__ = "0.0.7"
from .repository import Repository  # noqa
from ..infrastructure import KUBE_MODE

if not KUBE_MODE:
    import dotenv
    found = dotenv.find_dotenv(".env")
    found_base = dotenv.find_dotenv(".env.base")
    dotenv.load_dotenv(found)
    dotenv.load_dotenv(found_base)
