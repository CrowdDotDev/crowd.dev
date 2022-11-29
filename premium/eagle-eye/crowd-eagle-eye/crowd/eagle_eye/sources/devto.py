import json
import requests
from crowd.eagle_eye.models import Vector, Payload
from crowd.eagle_eye.infrastructure.logging import get_logger
import time
from dateutil import parser

logger = get_logger(__name__)


def pre_process(data):
    """
    Process dev.to data.

    Args:
        data ([dict]): List of posts.

    Returns:
        [Point]: List of points.
    """
    return [
        Vector(
            payload=Payload(
                id=point['id'],
                platform='devto',
                title=point['title'],
                destination_url='',
                url=point['url'],
                text=point['description'],
                username=point['user']['username'],
                timestamp=date_to_timestamp(point['published_timestamp']),
                postAttributes={
                    'tags': point.get('tag_list', []),
                },
                userAttributes={
                    'user': {
                        'githubUsername': point['user'].get('github_username', ''),
                        'twitterUsername': point['user'].get('twitter_username', ''),
                        'location': point['user'].get('location', ''),
                        'joinedAt': point['user'].get('joined_at', ''),
                        'name': point['user'].get('name', ''),
                        'summary': point['user'].get('summary', ''),
                        'website': point['user'].get('website', ''),
                    },
                    'organization': ({
                        'name': point['organization']['name'],
                        'username': point['organization']['username'],
                        'githubUsername': point['organization'].get('github_username', ''),
                        'twitterUsername': point['organization'].get('twitter_username', ''),
                        'location': point['organization'].get('location', ''),
                        'joinedAt': point['organization'].get('joined_at', ''),
                        'techStack': point['organization'].get('tech_stack', ''),
                        'summary': point['organization'].get('summary', ''),
                        'tagLine': point['organization'].get('tag_line', ''),
                    }
                        if point.get('organization', False) else {})
                }
            ),
            id=point['id'],
            combined='',
            embed=''
        ) for point in data if point.get('user', {}).get('username', False)
    ]


def ts_3h_ago():
    """
    Find the timestamp 3 hours ago.

    Returns:
        int: timestamp.
    """
    return int(round(time.time())) - (3 * 60 * 60)


def date_to_timestamp(date):
    """
    String date to unix timestamp.

    Args:
        date (str): date.

    Returns:
        int: unix timestamp
    """
    to_dt = parser.parse(date)
    return int(time.mktime(to_dt.timetuple()))


def devto(sleep=True):
    """
    Get dev.to data.

    Args:
        sleep (bool, optional): Whether to sleep. Defaults to False.

    Returns:
        [dict]: list of posts.
    """

    # We start with a non-finished state, and at page 1.
    isFinished = False
    page = 1
    finish_ts = ts_3h_ago()
    posts = []

    while not isFinished:
        # Get posts from DevTo
        from_dev = json.loads(requests.get('https://dev.to/api/articles/latest', params={
            'per_page': 100,
            'page': page
        }).content)

        # If there are no posts, we are done
        if len(from_dev) == 0:
            isFinished = True
            break

        # We enrich the posts: we can get extra organisation and user information
        enriched = []
        for post in from_dev:
            if sleep:
                time.sleep(1)

            user_content = requests.get(
                f'https://dev.to/api/users/{post["user"]["user_id"]}').content
            try:
                user = json.loads(user_content)
            except:
                user = False
            if user:
                post['user'] = user
                if 'organization' in post:

                    if sleep:
                        time.sleep(1)

                    post['organization'] = json.loads(requests.get(
                        f'https://dev.to/api/organizations/{post["organization"]["username"]}').content)

                enriched.append(post)

        # Add the enriched posts to the list of posts
        posts += enriched
        if date_to_timestamp(from_dev[-1]['published_timestamp']) < finish_ts:
            isFinished = True

        page += 1
        time.sleep(1)

    # Return the list of processed posts
    return pre_process(posts)


if __name__ == '__main__':
    from pprint import pprint as pp
    devto()
    # pp(devto())
