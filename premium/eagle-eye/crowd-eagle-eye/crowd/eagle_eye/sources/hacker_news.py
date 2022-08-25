import json
import requests
from crowd.eagle_eye.models import Vector, Payload
import logging

logger = logging.getLogger(__name__)


def pre_process(data):
    """
    Process Hacker News data.

    Args:
        data ([dict]): List of posts.

    Returns:
        [Point]: List of points.
    """
    return [
        Vector(
            payload=Payload(
                id=point['id'],
                platform='hacker_news',
                title=point['title'],
                destination_url=point.get('url', ''),
                url=f'https://news.ycombinator.com/item?id={point["id"]}',
                text=point.get('text', ''),
                username=point['by'],
                timestamp=point['time'],
                postAttributes={
                    'commentsCount': point['descendants'] if 'descendants' in point else len(point.get('kids', [])),
                    'score': point['score']
                }
            ),
            id=point['id'],
            combined='',
            embed=''
        ) for point in data
    ]


def hacker_news():
    """
    Get the data from Hacker News.
    """
    # Get top 500 posts from Hacker News. Returns a list of IDs
    logger.info("Fetching top IDs from Hacker News...")
    top_500 = json.loads(requests.get('https://hacker-news.firebaseio.com/v0/topstories.json').content)
    logger.info("Done")
    logger.info("Fetching data from Hacker News...")
    # For each post, get the data
    data = [
        json.loads(requests.get(f'https://hacker-news.firebaseio.com/v0/item/{story_id}.json').content)
        for story_id in top_500
    ]
    logger.info("Done")

    # Return the processed data
    return pre_process(data)


if __name__ == '__main__':
    hacker_news()
