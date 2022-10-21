from sqlalchemy import Column, String, DateTime
from .base import Base
from sqlalchemy.orm import relationship, validates


class Tenant(Base):
    """
    Tenant model

    Args:
        Base (Base): Parent class
    """

    __tablename__ = "tenants"  # Table name in database
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    plan = Column(String, nullable=False)
    planStatus = Column(String, nullable=False, default="active")
    planStripeCustomerId = Column(String)
    planUserId = Column(String)
    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    deletedAt = Column(DateTime)
    createdById = Column(String)
    updatedById = Column(String)

    # relationships

    activities = relationship("Activity", back_populates="parentTenant")
    members = relationship("Member", back_populates="parentTenant")
    microservices = relationship("Microservice", back_populates="parentTenant")

    # validation
    @validates("name")
    def validate_name(self, key, value):
        assert value != ""
        assert value is not None
        assert len(value) <= 255
        return value

    @validates("url")
    def validate_url(self, key, value):
        assert value != ""
        assert value is not None
        assert len(value) <= 50
        return value

    @validates("planStatus")
    def validate_planStatus(self, key, value):
        assert value != ""
        assert value in ["active", "cancel_at_period_end", "error"]
        return value

    @validates("planStripeCustomerId")
    def validate_planStripeCustomerId(self, key, value):
        assert value is not None
        assert len(value) <= 255
        return value
