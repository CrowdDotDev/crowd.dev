# -*- coding: utf-8 -*-

import os
import dotenv


def load_env():
    """Tries to load the .env in the current directory. If not present
    it will try the user's home directory (so it will work when
    running as a cron job from a virtual env).
    """
    env_path = ".env"
    if not os.path.exists(env_path):
        env_path = os.path.expanduser("~/.env")

    if os.path.exists(env_path):
        dotenv.load_dotenv(env_path)


load_env()

DEFAULT_LOCAL_DIR = "local"
LOCAL_DIR = os.environ.get("CROWD_LOCAL_DIR", DEFAULT_LOCAL_DIR)
