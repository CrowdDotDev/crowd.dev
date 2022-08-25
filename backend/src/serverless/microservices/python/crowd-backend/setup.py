import io
import os

from setuptools import setup, find_namespace_packages


def read(rel_path):
    here = os.path.abspath(os.path.dirname(__file__))
    with io.open(os.path.join(here, rel_path), "r") as fp:
        return fp.read()


def get_version(rel_path):
    for line in read(rel_path).splitlines():
        if line.startswith("__version__"):
            delim = '"' if '"' in line else "'"
            return line.split(delim)[1]
    else:
        raise RuntimeError("Unable to find version string.")


setup(
    name="crowd-backend",
    version=get_version("crowd/backend/__init__.py"),
    packages=find_namespace_packages(include=["crowd.*"]),
    install_requires=["pyjwt", "python-dotenv", "requests", "cryptography == 3.4.7",
                      "python-dateutil", "pytz", "SQLAlchemy", "dnspython==2.2.1", "boto3"],
)
