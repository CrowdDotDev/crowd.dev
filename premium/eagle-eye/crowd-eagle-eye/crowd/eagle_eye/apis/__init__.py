from crowd.eagle_eye.apis.cohere_api import CohereAPI  # noqa
from crowd.eagle_eye.apis.vector_api import VectorAPI  # noqa
import dotenv
found = dotenv.find_dotenv(".env")
dotenv.load_dotenv(found)
