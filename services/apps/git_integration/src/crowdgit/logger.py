import os
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler

from pythonjsonlogger import jsonlogger

from crowdgit import LOCAL_DIR

SERVICE = "git-integration"
LOG_LEVEL = "INFO"


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        log_record["name"] = SERVICE
        if not log_record.get("timestamp"):
            now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            log_record["timestamp"] = now
        if log_record.get("level"):
            log_record["level"] = log_record["level"].upper()
        else:
            log_record["level"] = record.levelname


def get_logger(name):
    logger = logging.getLogger(f"{SERVICE}/{name}")
    logger.setLevel(LOG_LEVEL.upper())

    if not logger.handlers:
        # Add a stream handler
        stream_handler = logging.StreamHandler()
        formatter = CustomJsonFormatter("%(timestamp)s %(level)s %(name)s %(message)s")
        stream_handler.setFormatter(formatter)
        logger.addHandler(stream_handler)

        # Add a rotating file handler
        log_file = os.path.join(LOCAL_DIR, "logs", f"{name}.log")
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = RotatingFileHandler(log_file, maxBytes=10000, backupCount=30)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        logger.propagate = False

    return logger
