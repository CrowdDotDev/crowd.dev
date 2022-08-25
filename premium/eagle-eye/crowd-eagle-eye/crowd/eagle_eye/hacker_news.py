import pandas as pd
import requests
import hashlib
import json
import logging
import signal
from bs4 import BeautifulSoup
from transformers import GPT2TokenizerFast
from urllib.parse import urlparse
from reppy.robots import Robots
import time


logger = logging.getLogger(__name__)


def pre_process(df):
    """
    Pre-process the data

    Args:
        df (DataFrame): DataFrame to be pre-processed

    Returns:
        DataFrame: Pre-processed DataFrame
    """
    df = df.rename(columns={'by': 'username'})
    df = df.drop(columns=['descendants', 'kids', 'type'])
    df['platform'] = df.apply(lambda x: 'Hacker News', axis=1)
    return make_ids(df)


def make_ids(df):

    def hash(r):
        return int(hashlib.sha256(f'{r.platform}-{r.id}'.encode('utf-8')).hexdigest(), 16) % 10**8

    df['vectorId'] = df.apply(lambda x: hash(x), axis=1)
    df.to_csv('hacker_news.csv', index=False)

    return df


def merge(from_db, from_hn):
    """
    Merge the data coming from the database and the data coming from Hacker News.
    It is merged by sourceId, with priority to the data coming from the database.

    Args:
        from_db (DataFrame): df from the database
        from_hn (DataFrame): df from Hacker News
    """
    pd.concat([from_db, from_hn]).drop_duplicates(subset='sourceId', keep="first")


def post_process(df):
    """
    Post-process the data, but still before training.

    Args:
        df (DataFrame): DataFrame to be post-processed for training
    """

    def fill_text(text, url):
        """
        If there is no text coming from Hacker News,
        we try to get it from the text in the website given by the url.
        We need to check robots.txt to see if we are allowed to crawl the website.

        Args:
            text (string): text field from Hacker News
            url (string): url field from Hacker News
        """

        def timeout_handler(num, stack):
            """
            Raises an exception after a timeout.
            """
            ("Received SIGALRM")
            raise Exception("Alarm")

        # We only need this if
        # 1. There is no text coming from Hacker News
        # 2. The url is not empty
        # 3. The site is not a PDF
        if not pd.notna(text) and pd.notna(url) and 'pdf' not in url:
            # We set a timeout for the request
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(4)

            try:
                # TODO: Make sure this works
                host = urlparse(url).hostname
                robots = Robots.fetch(f'https://{host}/robots.txt')
                if robots.allowed(url, 'my-user-agent'):
                    html = requests.get(url).text
                else:
                    return text
            except Exception as e:  # noqa: E722
                print(e)
                return text
            finally:
                signal.alarm(0)
            # Get the text in the page
            soup = BeautifulSoup(html, features="html.parser")
            allowlist = [
                'p'
            ]
            # Prune to 2000 characters to make sure we don't get a too long text for OpenAI
            text = ' '.join([t for t in soup.find_all(text=True) if t.parent.name in allowlist])[:800]
            return text
        return text

    def make_full_text(title, text):
        """
        Concatenate the title and the text.

        Args:
            title (string): title field from Hacker News
            text (string): text field from Hacker News

        Returns:
            string: concatenated title and text
        """
        return "Title: " + title + "; Content: " + text

    # Fill text and concatenated with the above functions
    df['text'] = df.apply(lambda x: fill_text(x.text, x.url), axis=1)

    df = df[df['text'].notna()]
    df['combined'] = df.apply(lambda x: make_full_text(x.title, x.text), axis=1)

    # Tokenise and drop rows that have too long tokens
    tokenizer = GPT2TokenizerFast.from_pretrained("gpt2")
    df['n_tokens'] = df.combined.apply(lambda x: len(tokenizer.encode(x)))
    df = df[df.n_tokens < 1000].tail(1_000)
    return df


def get_hacker_news_data():
    """
    Get the data from Hacker News.
    """
    print("Fetching top IDs from Hacker News...")
    top_500 = json.loads(requests.get('https://hacker-news.firebaseio.com/v0/topstories.json').content)
    print("Done")
    print("Fetching data from Hacker News...")
    ('Starting')
    start = time.time()
    dicts = [
        json.loads(requests.get(f'https://hacker-news.firebaseio.com/v0/item/{story_id}.json').content)
        for story_id in top_500
    ]
    print(f"Done in {time.time() - start} seconds")
    df = pd.DataFrame(dicts)
    return pre_process(df)


def main():
    """
    Main function.
    It will get the data from Hacker News, process the data that was not yet in the database, vectorise it, and save it to the database.
    """
    # Get the data from Hacker News
    df = get_hacker_news_data()
    # Post-process the data
    df = post_process(df)
    df.to_csv('hacker_news_processed.csv', index=False)


if __name__ == '__main__':
    from pprint import pprint as print
    # main()
    # get_hacker_news_data()
    df = pd.read_csv('hacker_news_processed.csv')

    import cohere
    import numpy as np
    co = cohere.Client("0BtmFTxNAhmanfNCdMRb10bpk2jtKCT1MLxQkSSF")

    # embeds = co.embed(
    #     texts=list(df['combined'].values),
    #     model='small',
    #     truncate='LEFT'
    # ).embeddings

    # import numpy as np

    # shape = np.array(embeds).shape
    # print(shape)

    from qdrant_client import QdrantClient
    from qdrant_client.http import models

    client = QdrantClient(host="localhost", port=6333)

    client.recreate_collection(
        collection_name="crowddev",
        distance="Cosine",
        vector_size=1024,
    )

    # Remove text nan
    df = df[df['text'].notna()]

    df1 = df.head(10)
    print(df1)

    embeds = co.embed(
        texts=list(df1['combined'].values),
        model='small',
        truncate='LEFT'
    ).embeddings
    df1.drop(columns=['combined'], inplace=True)
    ids = list(df1.vectorId.values)
    ids = [int(i) for i in ids]
    df1.drop(columns=['vectorId'], inplace=True)
    payloads = list(df1.T.to_dict().values())

    print(payloads)

    client.upsert(
        collection_name="crowddev",
        points=models.Batch(
            ids=ids,
            payloads=payloads,
            vectors=embeds
        ),
    )
