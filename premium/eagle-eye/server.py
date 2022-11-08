from flask import Flask
from crowd.eagle_eye.search import search_main
from crowd.eagle_eye.infrastructure.logging import LOGGER
from flask import request
from flask.logging import default_handler

app = Flask(__name__)

app.logger.removeHandler(default_handler)

@app.route("/search", methods=['POST'])
def search():
    body = request.get_json()
    LOGGER.info(f"Eagle Eye: received request for search: {body}")
    queries = body.get('queries', [])
    ndays = body.get('nDays', 10)
    exclude = body.get('filters', [])
    return search_main(queries, ndays, exclude)
