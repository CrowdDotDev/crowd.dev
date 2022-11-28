from crowd.eagle_eye.apis.vector_api import VectorAPI
from crowd.eagle_eye.apis.embed_api import EmbedAPI
from crowd.eagle_eye.models import Vector, Payload
import pinecone
import os

import dotenv
found = dotenv.find_dotenv(".env.sync")
dotenv.load_dotenv(found)


pinecone.init(api_key=os.environ.get("PINECONE_API_KEY"), environment="us-east-1-aws")
index = pinecone.Index("crowddev-prod")
filters = [
    {"platform": {"$in": ["hacker_news"]}, "timestamp": {"$gt": 1666681782}},
    {"platform": {"$in": ["devto"]}, "timestamp": {"$gt": 1666681782}}
]

for filter in filters:
    query_response = index.query(
        top_k=10000,
        include_values=False,
        include_metadata=True,
        vector=[0.0] * 2048,
        filter=filter
    )

    print('Number of results from Pinecone:', len(query_response['matches']))

    vectors = []

    vectorAPI = VectorAPI(do_init=True)
    embedAPI = EmbedAPI()

    for i, match in enumerate(query_response['matches']):
        if i and i % 100 == 0:
            vectorAPI.upsert(vectors)
            vectors = []
            print('Processing match', i)
            print('Number of vectors in Qdrant:', vectorAPI.count())

        text = match['metadata']['text']
        if match['metadata']['platform'] == 'hacker_news':
            if len(match['metadata']['text']) > 200:
                text = match['metadata']['url']

        payload = Payload(
            id=match['id'],
            platform=match['metadata']['platform'],
            title=match['metadata']['title'],
            username=match['metadata']['username'],
            timestamp=match['metadata']['timestamp'],
            destination_url=match['metadata']['destination_url'],
            url=match['metadata']['url'],
            text=text,
            postAttributes=match['metadata'].get('postAttributes', ),
            userAttributes=match['metadata'].get('userAttributes', {})
        )
        combined = f'{match["metadata"]["title"]} {text}'
        vector = Vector(match['id'], payload, combined, embedAPI.embed_one(combined))
        vectors.append(vector)
