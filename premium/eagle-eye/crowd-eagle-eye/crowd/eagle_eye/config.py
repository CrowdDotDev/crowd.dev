import os

KUBE_MODE = os.environ.get("KUBE_MODE") is not None

IS_TEST_ENV = os.environ.get("SERVICE_ENV") == "test"
IS_DEV_ENV = os.environ.get("SERVICE_ENV") == "development" or \
             os.environ.get("SERVICE_ENV") == "docker" or \
             os.environ.get("SERVICE_ENV") is None
IS_PROD_ENV = os.environ.get("SERVICE_ENV") == "production"
IS_STAGING_ENV = os.environ.get("SERVICE_ENV") == "staging"

COHERE_API_KEY = os.environ.get("CROWD_COHERE_API_KEY")
VECTOR_API_KEY = os.environ.get("CROWD_VECTOR_API_KEY")
VECTOR_INDEX = os.environ.get("CROWD_VECTOR_INDEX")