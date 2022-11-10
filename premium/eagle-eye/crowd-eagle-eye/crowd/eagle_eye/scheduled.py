import requests
import json
import json
from crowd.eagle_eye.sources import hacker_news
from crowd.eagle_eye.sources import devto
from crowd.eagle_eye.sources import post_process
from crowd.eagle_eye.apis import CohereAPI
from crowd.eagle_eye.apis.vector_api import VectorAPI
from crowd.eagle_eye.infrastructure.logging import get_logger

logger = get_logger(__name__)


def scheduled_main(source):
    """
    Main function.
    It will get the data from Hacker News, process the data that was not yet in the database, vectorise it, and save it to the database.
    """
    vector = VectorAPI()
    cohere = CohereAPI()

    if source == 'hacker_news':
        logger.info("Source is Hacker News")
        data = hacker_news()
    elif source == 'devto':
        logger.info("Source is Dev.to")
        data = devto()

    else:
        raise ValueError(f'Unknown source: {source}')

    logger.info('Finding existing IDs...')
    existing_ids = vector.find_existing_ids([point.id for point in data])
    data = post_process(data, existing_ids)
    data = cohere.embed_points(data)
    return vector.upsert(data)


if __name__ == '__main__':
    scheduled_main()
