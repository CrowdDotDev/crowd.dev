import requests
import signal
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from reppy.robots import Robots
from crowd.eagle_eye.infrastructure.logging import get_logger

logger = get_logger(__name__)


def filter_existing(data, ids):
    """
    Filter existing points from the data to post-process.

    Args:
        data (_type_): _description_
        ids (_type_): _description_

    Returns:
        _type_: _description_
    """
    # TODO-test
    filtered = [point for point in data if point.id not in ids]
    logger.info(f"Filtered {len(data) - len(filtered)} points")
    return filtered


def fill_text(url, request_timeout=4):
    """
    Fill text for points that don't have any given a destination URL.

    Args:
        url (str): destination URL.
        request_timeout (int): maximum time to wait for a content request

    Returns:
        str: string, or URL if we can't find any text.
    """
    # We cannot parse PDFs
    if 'pdf' in url:
        return url

    def timeout_handler(num, stack):
        """
        Raises an exception after a timeout.
        """
        raise Exception("Alarm")

    # We set a timeout for the request. If we don't get a response within this time, we give up.
    signal.signal(signal.SIGALRM, timeout_handler)
    # The timeout is 4 seconds
    signal.alarm(request_timeout)

    try:
        # We check if we are allowed to parse the text from this URL.
        host = urlparse(url).hostname
        robots = Robots.fetch(f'https://{host}/robots.txt')
        if robots.allowed(url, 'my-user-agent'):  # If we can parse

            # Return the text from the URL
            html = requests.get(url).text
            soup = BeautifulSoup(html, features="html.parser")
            allowlist = [
                'p'
            ]
            text = ' '.join([t for t in soup.find_all(text=True) if t.parent.name in allowlist])
            return text

        return url

    except Exception as e:  # noqa: E722
        return url

    finally:
        # Restart the timeout signal
        signal.alarm(0)


def html_link(url, max_link_chars=60):
    """
    Generate an HTML link from a URL.

    Args:
        url (str): url
        max_link_chars (int): maximum characters to allow in an HTML link

    Returns:
        str: HTML link
    """
    str_url = f'{url[:60]}...' if len(url) > max_link_chars else url
    return f'<a href="{url}" target="blank">{str_url}</a>'


def post_process(data, existing_ids, max_text_chars=2000):
    """
    Post-process the data. This is run when we already have a list of Points from the source.

    Args:
        data ([Point]): list of points
        existing_ids ([str]): Ids already found in the vector DB.
        max_text_chars (int): maximum characters in text

    Returns:
        [Point]: Points with the combined attribute filled out.
    """
    data = filter_existing(data, existing_ids)

    out = []
    logger.info("Finding missing texts...")
    for point in data:
        # If there is no text, we try to get it from the destination URL
        if not point.payload.text and point.payload.destination_url:
            text = fill_text(point.payload.destination_url)

            # We do not want that whole text in the text field. It is likely dirty and long.
            # Instead we give an HTML link to the destination URL.
            point.payload.text = html_link(point.payload.destination_url)

        else:
            text = point.payload.text
            # Cap to max_text_chars characters
            point.payload.text = text[:max_text_chars]

        point.combined = "Title: " + point.payload.title + "; Content: " + text

        out.append(point)

    logger.info("Done")
    return out
