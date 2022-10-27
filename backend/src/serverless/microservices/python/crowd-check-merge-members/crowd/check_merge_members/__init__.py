from .merge_suggestions_worker import merge_suggestions_worker  # noqa
from .merge_suggestions import MergeSuggestions  # noqa
import logging

root = logging.getLogger()
if root.handlers:
    for handler in root.handlers:
        root.removeHandler(handler)
logging.basicConfig(
    format="%(asctime)s.%(msecs)03d %(levelname)s [%(filename)s:%(lineno)s] %(message)s", level=logging.INFO
)
