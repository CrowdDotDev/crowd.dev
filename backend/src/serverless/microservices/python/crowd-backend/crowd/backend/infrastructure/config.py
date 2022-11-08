import os

# TODO-kube
KUBE_MODE = os.environ.get("KUBE_MODE") is not None

IS_TEST_ENV = os.environ.get("SERVICE_ENV") == "test"
IS_DEV_ENV = os.environ.get("SERVICE_ENV") == "development" or \
             os.environ.get("SERVICE_ENV") == "docker" or \
             os.environ.get("SERVICE_ENV") is None
IS_PROD_ENV = os.environ.get("SERVICE_ENV") == "production"
IS_STAGING_ENV = os.environ.get("SERVICE_ENV") == "staging"

SERVICE = os.environ.get("SERVICE")

LOG_LEVEL = os.environ.get("LOG_LEVEL") or "INFO"
if LOG_LEVEL == "TRACE":
    LOG_LEVEL = "DEBUG"
elif LOG_LEVEL == "FATAL":
    LOG_LEVEL = "CRITICAL"
elif LOG_LEVEL == "WARN":
    LOG_LEVEL = "WARNING"

# SQS Settings
NODEJS_WORKER_QUEUE = os.environ.get("CROWD_SQS_NODEJS_WORKER_QUEUE")
PYTHON_WORKER_QUEUE = os.environ.get("CROWD_SQS_PYTHON_WORKER_QUEUE")
SQS_HOST = os.environ.get("CROWD_SQS_HOST")
SQS_PORT = os.environ.get("CROWD_SQS_PORT")
SQS_ENDPOINT_URL = os.environ.get("CROWD_SQS_ENDPOINT")
SQS_ACCESS_KEY_ID = os.environ.get("CROWD_SQS_AWS_ACCESS_KEY_ID")
SQS_SECRET_ACCESS_KEY = os.environ.get("CROWD_SQS_AWS_SECRET_ACCESS_KEY")
SQS_REGION = os.environ.get("CROWD_SQS_AWS_REGION")

# DB Settings

if "CROWD_DB_PYTHON_WORKER_USERNAME" in os.environ:
    DB_USERNAME = os.environ.get("CROWD_DB_PYTHON_WORKER_USERNAME")
    DB_PASSWORD = os.environ.get("CROWD_DB_PYTHON_WORKER_PASSWORD")
elif "CROWD_DB_USERNAME" in os.environ:
    DB_USERNAME = os.environ.get("CROWD_DB_USERNAME")
    DB_PASSWORD = os.environ.get("CROWD_DB_PASSWORD")
else:
    raise Exception("No database credentials configured!")

DB_DATABASE = os.environ.get("CROWD_DB_DATABASE")
DB_HOST = os.environ.get("CROWD_DB_READ_HOST")
DB_PORT = os.environ.get("CROWD_DB_PORT")
DB_URL = f'postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_DATABASE}'
