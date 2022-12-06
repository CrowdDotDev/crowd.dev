from qdrant_client import QdrantClient
from qdrant_client.http import models
import datetime
import time
from crowd.eagle_eye.apis import EmbedAPI
import itertools
from crowd.eagle_eye.config import QDRANT_HOST, QDRANT_PORT
from crowd.eagle_eye.infrastructure.logging import get_logger

logger = get_logger(__name__)


class VectorAPI:
    """
    Class to interact with the vector database.
    """

    def __init__(self, do_init=False):
        """
        Initialize the VectorAPI.

        Args:
            index_name (str, optional): Name of the DB index. Defaults to "crowddev".
        """
        self.collection_name = "crowddev"

        if not QDRANT_HOST:
            host = "localhost"
        else:
            host = QDRANT_HOST

        if not QDRANT_PORT:
            port = 6333
        else:
            port = QDRANT_PORT

        self.client = QdrantClient(host=host, port=port)

        if do_init:
            self.client.recreate_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
            )
            for field_name in ['title', 'text', 'url']:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field_name,
                    field_schema=models.TextIndexParams(
                        type="text",
                        tokenizer=models.TokenizerType.WORD,
                        min_token_len=2,
                        max_token_len=15,
                        lowercase=True,
                    )
                )

    @staticmethod
    def _chunks(iterable, batch_size=80):
        """A helper function to break an iterable into chunks of size batch_size.
        https://www.pinecone.io/docs/insert-data/#batching-upserts.

        Args:
            iterable (iterable): The iterable to break into chunks.
            batch_size (int, optional): The size of each chunk. Defaults to 80.
        """
        it = iter(iterable)
        chunk = list(itertools.islice(it, batch_size))
        while chunk:
            yield chunk
            chunk = list(itertools.islice(it, batch_size))

    def upsert(self, points):
        """
        Upsert a list of points into the vector database.

        Args:
            points ([Point]): points to upsert.
        """

        if (len(points) == 0):
            return

        vectors = [
            models.PointStruct(
                id=point.id,
                payload=point.payload_as_dict(),
                vector=point.embed,
            ) for point in points
        ]

        for vectors_chunk in VectorAPI._chunks(vectors, batch_size=100):
            try:
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=vectors_chunk
                )
            except Exception as e:
                logger.error("Error in upsert: %s", {'error': e, 'points': vectors_chunk})
                raise e

        return "OK"

    def count(self):
        return self.client.count(
            collection_name=self.collection_name,
            exact=True,
        )

    @ staticmethod
    def _get_timestamp(ndays, start=int(time.time())):
        """
        Get the unix timestamp for a given number of days ago.

        Args:
            ndays (int): number of days ago.
            start (int, optional): start timestamp. Defaults to int(time.time()).

        Returns:
            int: timestamp
        """
        now = datetime.datetime.fromtimestamp(start)
        return int((now - datetime.timedelta(days=ndays)).timestamp())

    def find_existing_ids(self, ids):
        """
        Given a list of ids, find which ones already exist in the vector database.

        Args:
            ids ([str]): list of ids to find.

        Returns:
            [str]: list of existing ids.
        """
        try:
            existing = self.client.retrieve(
                collection_name=self.collection_name,
                ids=ids,
            )

            return [point.id for point in existing]
        except Exception as e:
            logger.error("Error in find_existing_ids: %s", e)
            raise e

    def delete(self, ids):
        """
        Delete a list of ids from the vector database.

        Args:
            ids ([str]): list of ids to delete.

        Returns:
            str: success message.
        """
        if type(ids) == str:
            ids = [ids]
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=models.PointIdsList(
                points=ids
            ),
        )

    def make_filters(self, ndays, exclude, exact_keywords, platform=None):
        """
        Make filters for search or scrolling

        Args:
            ndays (int): number of days ago to search
            exclude ([int]): List of IDs to exclude
            exact_keywords ([str]): List of keywords to match exactly. It will match any.

        Returns:
            models.Filter: Qdrant filter
        """
        start = self._get_timestamp(ndays)
        should = []
        if exact_keywords:
            for exact_keyword in exact_keywords:
                for key in ['title', 'text', 'url']:
                    should.append(
                        models.FieldCondition(
                            key=key,
                            match=models.MatchText(text=exact_keyword.lower()),
                        )
                    )
        must = [
            models.FieldCondition(
                key="timestamp",
                range=models.Range(
                    gte=start,
                ),
            )
        ]
        if platform:
            must.append(
                models.FieldCondition(
                    key="platform",
                    match=models.MatchText(text=platform),
                )
            )
        return models.Filter(
            must=must,
            should=should,
            must_not=[
                models.HasIdCondition(has_id=exclude),
            ]
        )

    def search(self, query, ndays, exclude, exact_keywords=False, embed_api=None):
        """
        Perform a search on the vector database.
        We can set number of days ago, and exclude certain ids.

        Args:
            query (str): query to perform, for example a keyword
            ndays (int): maximum number of days ago to search
            exclude ([str]): list of ids to exclude from the search
            embed_api (EmbedAPI, optional): Already initialised EmbedAPI. Defaults to None.

        Returns:
            [dict]: list of results
        """
        try:
            if embed_api is None:
                embed_api = EmbedAPI()
            # Embed the query into a vector
            vector = embed_api.embed_one(query)

            return self.client.search(
                collection_name=self.collection_name,
                query_vector=vector,
                limit=20,
                score_threshold=0.1,
                query_filter=self.make_filters(ndays, exclude, exact_keywords),
                with_payload=True,
            )
        except Exception as e:
            logger.error("Error in search: %s", {
                'error': e,
                'query': query,
                'ndays': ndays,
                'exclude': exclude,
                'exact_keywords': exact_keywords,
            })
            raise e

    def keyword_match(self, ndays, exclude, exact_keywords, platform=None):
        try:
            ndays = min(ndays, 10000)
            return self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=self.make_filters(ndays, exclude, exact_keywords, platform),
                limit=100,
                with_payload=True,
            )
        except Exception as e:
            logger.error("Error in keyword_match: %s", {
                'error': e,
                'ndays': ndays,
                'exclude': exclude,
                'exact_keywords': exact_keywords,
            })
            raise e
