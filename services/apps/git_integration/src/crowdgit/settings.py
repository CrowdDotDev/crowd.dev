import os


def load_env_var(key: str, required=True, default=None):
    value = os.getenv(key, default)
    if required and value is None:
        raise EnvironmentError(f"Missing required environment variable: {key}")
    return value


CROWD_DB_WRITE_HOST = load_env_var("CROWD_DB_WRITE_HOST")
CROWD_DB_PORT = load_env_var("CROWD_DB_PORT")
CROWD_DB_USERNAME = load_env_var("CROWD_DB_USERNAME")
CROWD_DB_PASSWORD = load_env_var("CROWD_DB_PASSWORD")
CROWD_DB_DATABASE = load_env_var("CROWD_DB_DATABASE")
