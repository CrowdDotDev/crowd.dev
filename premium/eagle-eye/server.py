from flask import Flask
from crowd.eagle_eye.search import search_main, keyword_match_main
from crowd.eagle_eye.infrastructure.logging import get_logger
from flask import request
from flask.logging import default_handler

app = Flask(__name__)

app.logger.removeHandler(default_handler)
logger = get_logger(__name__)


@app.route("/search", methods=['POST'])
def search():
    try:
        body = request.get_json()
        logger.info(f"Eagle Eye: received request for search: {body}")
        queries = body.get('queries', [])
        ndays = body.get('nDays', 10)
        exclude = body.get('filters', [])
        exact_keywords = body.get('exactKeywords', False)
        return search_main(queries, ndays, exclude, exact_keywords)
    except Exception as e:
        logger.error(f"Eagle Eye: error in search: {e}")
        return {"error": str(e)}


@app.route("/keyword-match", methods=['POST'])
def keyword_match():
    try:
        body = request.get_json()
        logger.info(f"Eagle Eye: received request for keyword_match: {body}")
        ndays = body.get('nDays', 10)
        exclude = body.get('filters', [])
        platform = body.get('platform', None)
        exact_keywords = body.get('exactKeywords', [])
        out = keyword_match_main(ndays, exclude, exact_keywords, platform)
        return out
    except Exception as e:
        logger.error(f"Error in keyword_match: {e}")
        return {"error": str(e)}
