import json
from crowd.eagle_eye.apis.vector_api import VectorAPI
import logging

logger = logging.getLogger(__name__)


def remove_duplicates(iter):
    """
    Remove duplicate posts from the list of returned posts. 
    If there are duplicates, we keep only the post with highest similarity score.

    Args:
        iter (list): list of points

    Returns:
        list: list of points without duplicates
    """
    filter_dict = {}
    for post in iter:
        vid = post['vectorId']
        if vid in filter_dict and filter_dict[vid]['similarityScore'] < post['similarityScore']:
            filter_dict[vid] = post
        filter_dict[vid] = post

    return [filter_dict[key] for key in filter_dict]


def transform(query, post):
    """
    Transform a set of results for crowd.dev's Node.js API

    Args:
        query (str): strings to test with
        post (dict): post coming from the vector DB

    Returns:
        dict: transformed dict for crowd.dev's API
    """
    metadata = post['metadata']

    return {
        'vectorId': post['id'],
        'sourceId': metadata['sourceId'],
        'title': metadata['title'],
        'url': metadata['url'],
        'text': metadata.get('text', ''),
        'username': metadata['username'],
        'platform': metadata['platform'],
        'timestamp': metadata['timestamp'],
        'similarityScore': post['score'],
        'userAttributes': json.loads(metadata.get('userAttributes', '{}')),
        'postAttributes': json.loads(metadata.get('postAttributes', '{}')),
        'keywords': [query, ]
    }


def search_main(queries, ndays, exclude):
    logger.info(f"Starting search for queries {queries}")
    vector = VectorAPI()
    out = []
    for query in queries:
        results = vector.search(query, ndays, exclude)['matches']

        for result in results:
            if result['score'] > 0.1:
                out.append(transform(query, result))
    out = remove_duplicates(out)
    logger.info(f"Search done. Returning {list(map(lambda x: x.get('title', ''), out))}")
    return json.dumps(out)
