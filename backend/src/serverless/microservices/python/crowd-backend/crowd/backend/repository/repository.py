import logging
from crowd.backend.repository.keys import DBKeys as dbk
import dns
import os
from jmespath import search
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from crowd.backend.models.base import Base
from crowd.backend.models import Member
from crowd.backend.models import Activity
from crowd.backend.models import Integration
from crowd.backend.models import Tenant
from crowd.backend.models import Widget
from crowd.backend.models import Microservice
import uuid
import json

from datetime import timedelta
from sqlalchemy import desc, asc

logger = logging.getLogger(__name__)

_ = dns.version.version


class Repository(object):
    """
    Class for interacting with the database.
    """

    def __init__(self, tenant_id="", db_url=False, test=False, send=True):
        """
        Initialiser function for the the db repository.

        Args:
            tenant_id (str, optional): the tenant ID. Defaults to ''.
            db_url (bool, optional): the database url, otherwise it will be
            obtain from env variables. Defaults to False.
            test (bool, optional): whether we are in test mode. Defaults to
            False. send (bool, optional): whether to save the documents. Defaults
            to True.
        """
        self.test = test

        if db_url:
            self.db_url = db_url
        else:
            if test:
                self.db_url = os.environ.get("DB_URL_TEST")

            else:
                username = os.environ.get("DATABASE_USERNAME")
                password = os.environ.get("DATABASE_PASSWORD")
                database = os.environ.get("DATABASE_DATABASE")
                host = os.environ.get("DATABASE_HOST_READ")
                self.db_url = f'postgresql://{username}:{password}@{host}/{database}'

        self.engine = create_engine(
            self.db_url, echo=False, execution_options={"postgresql_readonly": True, "postgresql_deferrable": True}
        )

        Base.metadata.create_all(self.engine, checkfirst=True)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()

        self.tenant_id = tenant_id
        self.send = send

    def _validate_tenant_id(self):
        """
        Check if a tenant ID is valid

        Raises:
            BaseException: raise an error if the tenant id was not found

        Returns:
            bool: true if it was found
        """
        if not self.find_by_id(Tenant, self.tenant_id) and not self.test:
            raise BaseException("Invalid tenant id")
        return True

    def set_tenant_id(self, tenant_id):
        self.tenant_id = tenant_id

    def find_in_table(self, table, query, many=False):
        """
        Find a document in a collection

        Args:
            table (Base): class of the entity
            query (dict): query to search by. Example: {'firstname':'Duncan', 'lastname':'Iain'}
            many (bool): whether to return many (defaults to False)

        Returns:
            dict: document
        """

        search_query = self.session.query(table)
        for attr, value in query.items():

            # Check if query is nested
            nested_count = attr.count(".")
            # If nested
            if nested_count > 0:
                attributes = attr.split(".")
                nested_attributes = tuple(attributes[1:])
                # Define nested expression
                expr = getattr(table, attributes[0])[nested_attributes]
                # Execute search_query
                search_query = search_query.filter(expr == json.dumps(value))
            else:
                search_query = search_query.filter(getattr(table, attr) == value)

        if many:
            return search_query.all()
        return search_query.first()

    def find_by_id(self, table, id):
        """
        Find by id

        Args:
            table (Base): class of the entity
            id (str): the id of the document

        Returns:
            dict: the document
        """

        return self.session.query(table).get(id)

    def find_all(
        self, table, ignore_tenant: "bool" = False, query: "dict" = None, order: "dict" = None
    ) -> "list[dict]":
        """
        Find all the documents in a collection

        Args:
            table (Base): class of the entity
            ignore_tenant (bool, optional): whether to filter by tenant. Never set to True in production.
                                            Defaults to False.
            query (dict): The query dictionary
            order (dict)

        Returns:
            [type]: [description]
        """
        if not query:
            query = {}

        if not ignore_tenant:
            query = {
                **query,
                **{dbk.TENANT: uuid.UUID(self.tenant_id)},
            }

        search_query = self.session.query(table)
        for attr, value in query.items():
            # Check if query is nested
            nested_count = attr.count(".")
            # If nested
            if nested_count > 0:
                attributes = attr.split(".")
                nested_attributes = tuple(attributes[1:])
                # Define nested expression
                expr = getattr(table, attributes[0])[nested_attributes]
                # Execute search_query
                search_query = search_query.filter(expr == json.dumps(value))
            else:
                search_query = search_query.filter(getattr(table, attr) == value)

        if order:
            for key, value in order.items():
                if value:
                    search_query = search_query.order_by(asc(key))
                else:
                    search_query = search_query.order_by(desc(key))

        return search_query.all()

    def find_active_widgets(self, widget_type, ignore_tenant=False):
        search_query = self.session.query(Widget)
        if not ignore_tenant:
            search_query = search_query.filter(Widget.tenantId == uuid.UUID(self.tenant_id))

        search_query = search_query.filter(Widget.type == widget_type)
        search_query = search_query.filter(Widget.settings.is_not(None))

        return search_query.all()

    def find_members(self, username):
        return self.find_in_table(
            Member,
            {"username.crowdUsername": username, "tenantId": uuid.UUID(self.tenant_id)},
            many=True,
        )

    def find_activities(self, search_filters=None):
        if not search_filters:
            search_filters = {}
        return self.find_in_table(Activity, search_filters, many=True)

    def count(self, table, search_filters=None):
        if not search_filters:
            search_filters = {}

        search_filters[dbk.TENANT] = uuid.UUID(self.tenant_id)

        search_query = self.session.query(table)
        for attr, value in search_filters.items():
            # Check if query is nested
            nested_count = attr.count(".")
            # If nested
            if nested_count > 0:
                attributes = attr.split(".")
                nested_attributes = tuple(attributes[1:])
                # Define nested expression
                expr = getattr(table, attributes[0])[nested_attributes]
                # Execute query
                search_query = search_query.filter(expr == json.dumps(value))
            else:
                search_query = search_query.filter(getattr(table, attr) == value)

        return search_query.count()

    def find_integration_by_platform(self, platform):
        """
        Find an integration by platform in a specific tenant

        Args:
            platform (str): platform

        Returns:
            Integration: the integration found
        """
        if type(self.tenant_id) == str:
            tenant_id = uuid.UUID(self.tenant_id)
        else:
            tenant_id = self.tenant_id

        return self.find_in_table(Integration, {dbk.PLATFORM: platform, dbk.TENANT: tenant_id})

    def find_integration_by_identifier(self, platform, identifier):
        """
        Find an integration by platform in a specific tenant

        Args:
            platform (str): platform
            identifier (str): identifier

        Returns:
            Integration: the integration found
        """
        return self.find_in_table(
            Integration,
            {dbk.PLATFORM: platform, dbk.INTEGRATION_IDENTIFIER: identifier},
        )

    def find_available_microservices(self, service):
        """
        Function to get microservices of type service that are not running

        Args:
            service (str):
        """

        return self.find_in_table(Microservice, {"type": service, "running": False}, many=True)

    def find_new_members(self, microservice, query: "dict" = None) -> "list[dict]":
        """
        Find all the documents in a collection

        Args:
            table (Base): class of the entity

        Returns:
            [type]: [description]
        """
        if not query:
            query = {}

        query = {
            **query,
            **{dbk.TENANT: uuid.UUID(self.tenant_id)},
        }

        search_query = self.session.query(Member)

        # Filter with query
        for attr, value in query.items():
            search_query = search_query.filter(getattr(Member, attr) == value)

        # Find members that are of type member
        search_query = search_query.filter(Member.type == "member")
        # Find members that are new
        # We use a security padding of 5 minutes
        search_query = search_query.filter(
            Member.createdAt >= (microservice.updatedAt - timedelta(minutes=5))
        ).order_by(Member.createdAt.desc())

        return search_query.all()
