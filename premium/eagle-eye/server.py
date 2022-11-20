from flask import Flask
from crowd.eagle_eye.search import search_main, keyword_match
from crowd.eagle_eye.infrastructure.logging import get_logger
from flask import request
from flask.logging import default_handler

app = Flask(__name__)

app.logger.removeHandler(default_handler)
logger = get_logger(__name__)


@app.route("/search", methods=['POST'])
def search():
    body = request.get_json()
    logger.info(f"Eagle Eye: received request for search: {body}")
    queries = body.get('queries', [])
    ndays = body.get('nDays', 10)
    exclude = body.get('filters', [])
    exact_keywords = body.get('exactKeywords', False)
    return search_main(queries, ndays, exclude, exact_keywords)


@app.route("/keyword-match", methods=['POST'])
def search():
    body = request.get_json()
    logger.info(f"Eagle Eye: received request for keyword_match: {body}")
    ndays = body.get('nDays', 10)
    exclude = body.get('filters', [])
    platform = body.get('platform', None)
    exact_keywords = body.get('exactKeywords', [])
    return keyword_match(ndays, exclude, exact_keywords, platform)
