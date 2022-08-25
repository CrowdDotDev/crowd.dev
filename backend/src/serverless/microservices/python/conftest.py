import pytest
import os

from crowd.backend.repository import Repository
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError


def is_db_up(url):
    """Checks the connection to test db, and if successfull closes the connection"""
    try:
        engine = create_engine(
            url, echo=False, execution_options={"postgresql_readonly": True, "postgresql_deferrable": True}
        )
        engine.connect()
        engine.dispose()
        return True
    except SQLAlchemyError:
        return False


@pytest.fixture(scope="session")
def api(docker_services):
    """Ensure that the db is responsive and return a reference to the repository class"""

    docker_services.wait_until_responsive(
        timeout=300.0, pause=0.1, check=lambda: is_db_up("postgresql://postgres:example@localhost:5433/crowd-web")
    )
    tenant_id = "f5c97d75-b919-4be6-9e57-b851efb336a1"
    try:
        api = Repository(tenant_id, "postgresql://postgres:example@localhost:5433/crowd-web")
        yield api
    finally:
        api.session.close()


@pytest.fixture(scope="session")
def docker_compose_file(pytestconfig):
    return os.path.join(str(pytestconfig.rootdir), "docker-compose-test.yaml")
