from .worker_check_merge import check_merge_members_worker  # noqa
from .check_merge_default import CheckMergeDefault  # noqa
from .check_merge_premium import CheckMergePremium  # noqa
import logging

root = logging.getLogger()
if root.handlers:
    for handler in root.handlers:
        root.removeHandler(handler)
logging.basicConfig(
    format="%(asctime)s.%(msecs)03d %(levelname)s [%(filename)s:%(lineno)s] %(message)s", level=logging.INFO
)
