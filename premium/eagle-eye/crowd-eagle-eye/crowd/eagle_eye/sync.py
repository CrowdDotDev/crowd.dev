from pprint import pprint as pp
from crowd.eagle_eye.apis.vector_api import VectorAPI
from qdrant_client.http import models


import dotenv
found = dotenv.find_dotenv(".env.sync")
dotenv.load_dotenv(found)

vector_out = VectorAPI(do_init=False)
print("Vector out initialised. It has {} vectors".format(vector_out.count()))
vector_in = VectorAPI(do_init=True, cloud=True)
print("Vector in initialised")


number = vector_out.count()
offset = None

while True:
    vectors = vector_out.scroll(offset)

    vectors_to_add = [
        models.PointStruct(
            id=vector.id,
            payload=vector.payload,
            vector=vector.vector,
        ) for vector in vectors[0]
    ]
    vector_in.upsert(vectors_to_add, processed=True)

    offset = vectors[-1]
    if not offset:
        break
    print(f"Synced {vector_in.count()} of {number} vectors")
