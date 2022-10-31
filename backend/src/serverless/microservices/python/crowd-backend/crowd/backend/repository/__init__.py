from .repository import Repository  # noqa
from ..infrastructure import KUBE_MODE

# TODO-kube
if not KUBE_MODE:
    import dotenv
    found = dotenv.find_dotenv(".env")
    found_base = dotenv.find_dotenv(".env.base")
    dotenv.load_dotenv(found)
    dotenv.load_dotenv(found_base)
