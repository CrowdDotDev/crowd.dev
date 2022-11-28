# Crowd.dev Monorepository

This is the monorepository for most software related to crowd.dev.

Currently, all python software is contained in the crowd namespace, and the modules are in subfolders named accordingly.
E.g. the internally used github api resides in [crowd-github-api](crowd-github-api) and provides its functionality in a
`github_api` folder under the `crowd`

The `requirements.txt` contains dev requirements for formatting, linting, testing and `pre-commit`-hooks.
The modules specify their own requirements in their `setup.py's` `install_requires`.

## Setup

In order to start developing, the environment needs to be prepared and some hooks need to be configured.

### Requirements

- Python 3.8

### Steps

- Clone this repo and `cd` into it
- Create a virtual environment with `python -m venv venv-crowd`
- Activate it on unix/Windows with Git Bash `source venv-crowd/bin/activate` or on Windows `venv-crowd\Scripts\activate.bat`
- Install all crowd modules in editable mode: `pip install -r requirements.internal.txt`
- Install the dev modules `pip install -r requirements.txt`
- Setup the pre-commit hook for formatting and linting `pre-commit install`
- Setup the pre-push testing hook on Unix `make` or on Unix/Windows `cp hooks/pre-push .git/hooks`
- TODO setup ENV variables
- verify that everything works with running `pytest`
