import logging
from crowd.eagle_eye.scheduled import scheduled_main
from crowd.eagle_eye.search import search_main
import json


root = logging.getLogger()
if root.handlers:
    for handler in root.handlers:
        root.removeHandler(handler)
logging.basicConfig(
    format="%(asctime)s.%(msecs)03d %(levelname)s [%(filename)s:%(lineno)s] %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)


def scheduled(event, context=None):
    logger.info(f'Scheduled event: {event}')
    scheduled_main(event['platform'])


def search(event, context=None):
    queries = event['queries']
    ndays = event['ndays']
    exclude = event['filters']
    return search_main(queries, ndays, exclude)


if __name__ == '__main__':
    scheduled({'platform': 'devto'})
    # from pprint import pprint as pp
    # a = search({
    #     'queries': ['community'],
    #     'ndays': 10,
    #     'filters': []
    # }, None)
