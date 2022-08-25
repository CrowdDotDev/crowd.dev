import io
import os

from setuptools import setup, find_namespace_packages


def read(rel_path):
    here = os.path.abspath(os.path.dirname(__file__))
    with io.open(os.path.join(here, rel_path), "r") as fp:
        return fp.read()


setup(
    name="crowd-check-merge-members",
    packages=find_namespace_packages(include=["crowd.*"]),
    install_requires=["fuzzy", "python-Levenshtein"],
)
