from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from .base import Base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.dialects.postgresql import JSONB


class Widget(Base):
    """
    Widget model

    Args:
        Base (Base): Parent class
    """

    __tablename__ = "widgets"  # Table name in database

    id = Column(String, primary_key=True)
    type = Column(Text, nullable=False)
    settings = Column(JSONB)
    cache = Column(JSONB)

    importHash = Column(String, nullable=True)

    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    deletedAt = Column(DateTime)

    tenantId = Column(String, ForeignKey("tenants.id"), nullable=False)
    parentTenant = relationship("Tenant", back_populates="widgets")

    reportId = Column(String, ForeignKey("reports.id"))
    parentReport = relationship("Report", back_populates="widgets")

    createdById = Column(String, ForeignKey("users.id"))
    updatedById = Column(String, ForeignKey("users.id"))

    parentUser = relationship("User", foreign_keys=[createdById])
    updateParentUser = relationship("User", foreign_keys=[updatedById])

    # validation
    @validates("type")
    def validate_type(self, key, value):
        assert value != ""
        return value

    @validates("importHash")
    def validate_importHash(self, key, value):
        if value is not None:
            assert len(value) <= 255
        return value
