from crowd.eagle_eye.apis.embed_api import EmbedAPI  # noqa
from crowd.eagle_eye.apis.vector_api import VectorAPI  # noqa
from crowd.eagle_eye.config import KUBE_MODE

if not KUBE_MODE:
    import dotenv
    found = dotenv.find_dotenv(".env")
    dotenv.load_dotenv(found)
