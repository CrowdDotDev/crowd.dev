from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from .base import Base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.dialects.postgresql import JSONB


class Report(Base):
    """
    Report model

    Args:
        Base (Base): Parent class
    """

    __tablename__ = "reports"  # Table name in database

    id = Column(String, primary_key=True)
    public = Column(Boolean, nullable=False, default=False)
    settings = Column(JSONB, nullable=False)
    cache = Column(JSONB)

    importHash = Column(String, nullable=True)

    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    deletedAt = Column(DateTime)

    tenantId = Column(String, ForeignKey("tenants.id"), nullable=False)
    parentTenant = relationship("Tenant", back_populates="reports")

    createdById = Column(String, ForeignKey("users.id"))
    updatedById = Column(String, ForeignKey("users.id"))

    parentUser = relationship("User", foreign_keys=[createdById])
    updateParentUser = relationship("User", foreign_keys=[updatedById])

    widgets = relationship("Widget", back_populates="parentReport")

    # validation
    @validates("importHash")
    def validate_importHash(self, key, value):
        if value is not None:
            assert len(value) <= 255
        return value
