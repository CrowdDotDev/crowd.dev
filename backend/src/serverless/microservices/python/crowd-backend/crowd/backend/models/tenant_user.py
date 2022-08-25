from sqlalchemy import Column, String, DateTime, ForeignKey
from .base import Base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.dialects.postgresql import JSONB


class TenantUser(Base):
    """
    TenantUser model

    Args:
        Base (Base): Parent class
    """

    __tablename__ = "tenantUsers"  # Table name in database

    id = Column(String, primary_key=True)
    # TO CHECK
    roles = Column(JSONB)
    invitationToken = Column(String, nullable=False)
    status = Column(String, nullable=False)

    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    deletedAt = Column(DateTime)

    tenantId = Column(String, ForeignKey("tenants.id"), nullable=False)
    parentTenant = relationship("Tenant", back_populates="tenantUser")

    userId = Column(String, ForeignKey("users.id"), nullable=False)

    createdById = Column(String, ForeignKey("users.id"))
    updatedById = Column(String, ForeignKey("users.id"))

    # validation
    @validates("status")
    def validate_status(self, key, value):
        assert value != ""
        assert value in ["active", "invited", "empty-permissions"]
        return value
