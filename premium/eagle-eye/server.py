from flask import Flask
from crowd.eagle_eye.search import search_main
import logging
from flask import request

app = Flask(__name__)

root = logging.getLogger()
if root.handlers:
    for handler in root.handlers:
        root.removeHandler(handler)
logging.basicConfig(
    format="%(asctime)s.%(msecs)03d %(levelname)s [%(filename)s:%(lineno)s] %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)


@app.route("/search", methods=['POST'])
def search():
    body = request.get_json()
    queries = body.get('queries', [])
    ndays = body.get('nDays', 10)
    exclude = body.get('filters', [])
    return search_main(queries, ndays, exclude)
