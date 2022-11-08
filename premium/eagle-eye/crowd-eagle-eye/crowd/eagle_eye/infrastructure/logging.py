import logging
from datetime import datetime

from pythonjsonlogger import jsonlogger
from crowd.eagle_eye.config import SERVICE, LOG_LEVEL

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        log_record['name'] = SERVICE
        if not log_record.get('timestamp'):
            now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            log_record['timestamp'] = now
        if log_record.get('level'):
            log_record['level'] = log_record['level'].upper()
        else:
            log_record['level'] = record.levelname


LOGGER = logging.getLogger(SERVICE)
LOGGER.setLevel(LOG_LEVEL.upper())

if not LOGGER.handlers:
    logHandler = logging.StreamHandler()
    formatter = CustomJsonFormatter('%(timestamp)s %(level)s %(name)s %(message)s')
    logHandler.setFormatter(formatter)
    LOGGER.addHandler(logHandler)
    LOGGER.propagate = False
