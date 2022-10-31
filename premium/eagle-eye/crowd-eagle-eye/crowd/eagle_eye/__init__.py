import logging
from crowd.eagle_eye.config import KUBE_MODE

if not KUBE_MODE:
    import dotenv
    dotenv.load_dotenv()

root = logging.getLogger()
if root.handlers:
    for handler in root.handlers:
        root.removeHandler(handler)
logging.basicConfig(
    format="%(asctime)s.%(msecs)03d %(levelname)s [%(filename)s:%(lineno)s] %(message)s", level=logging.INFO
)
