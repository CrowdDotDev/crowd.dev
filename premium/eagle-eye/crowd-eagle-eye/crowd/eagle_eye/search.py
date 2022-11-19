import json
from crowd.eagle_eye.apis.vector_api import VectorAPI
from crowd.eagle_eye.infrastructure.logging import get_logger

logger = get_logger(__name__)


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


def transform(query, id, score, metadata):
    """
    Transform a set of results for crowd.dev's Node.js API

    Args:
        query (str): strings to test with
        id (int): id of the post
        score (float): similarity score
        post (dict): post coming from the vector DB

    Returns:
        dict: transformed dict for crowd.dev's API
    """

    return {
        'vectorId': id,
        'sourceId': metadata['sourceId'],
        'title': metadata['title'],
        'url': metadata['url'],
        'text': metadata.get('text', ''),
        'username': metadata['username'],
        'platform': metadata['platform'],
        'timestamp': metadata['timestamp'],
        'similarityScore': score,
        'userAttributes': json.loads(metadata.get('userAttributes', '{}')),
        'postAttributes': json.loads(metadata.get('postAttributes', '{}')),
        'keywords': [query, ]
    }


def search_main(queries, ndays, exclude, exact_keywords=[]):
    logger.info(f"Starting search for queries {queries}")
    vector = VectorAPI()
    out = []
    for query in queries:
        results = vector.search('query', ndays, exclude, exact_keywords)
        for returned_point in results:
            out.append(transform(query, returned_point.id, returned_point.score, returned_point.payload))
    out = remove_duplicates(out)
    # TODO: Remove
    from pprint import pprint
    out = sorted(out, key=lambda x: x['similarityScore'], reverse=True)
    p = [{'score': point['similarityScore'], 'title': point['title'],
          'url': point['url'], 'id': point['vectorId']} for point in out]
    pprint(p)
    return json.dumps(out)


def keyword_match(ndays, exclude, exact_keywords=[]):
    vector = VectorAPI()
    results = vector.keyword_match(ndays, exclude, exact_keywords)
    out = []
    if type(results[0]) == list:
        results = results[0]
    for returned_point in results:
        out.append(transform('', returned_point.id, 1, returned_point.payload))

     # TODO: Remove
    from pprint import pprint
    out = sorted(out, key=lambda x: x['similarityScore'], reverse=True)
    p = [{'score': point['similarityScore'], 'title': point['title'],
          'url': point['url'], 'id': point['vectorId']} for point in out]
    pprint(p)
    out = remove_duplicates(out)


if __name__ == '__main__':
    # search_main(['data-centric nlp'], 7, [79441250, 25615038], exact_keywords=['Machine learning', 'Serverless'])
    keyword_match(7, [], exact_keywords=['Machine learning', 'Serverless'])
