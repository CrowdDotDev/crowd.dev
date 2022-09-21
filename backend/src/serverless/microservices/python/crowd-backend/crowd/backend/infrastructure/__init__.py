from .config import KUBE_MODE

if not KUBE_MODE:
    import dotenv
    found = dotenv.find_dotenv(".env")
    dotenv.load_dotenv(found)

from .state_machine import StateMachine  # noqa
from .sqs import SQS  # noqa
from .db_operations_sqs import DbOperationsSQS  # noqa
from .services_sqs import ServicesSQS  # noqa
