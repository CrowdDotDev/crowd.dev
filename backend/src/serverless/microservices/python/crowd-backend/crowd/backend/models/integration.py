from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey
from .base import Base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.dialects.postgresql import JSONB


class Integration(Base):
    """
    Integration model

    Args:
        Base (Base): Parent class
    """

    __tablename__ = "integrations"  # Table name in database

    id = Column(String, primary_key=True)
    platform = Column(Text)
    status = Column(Text)
    limitCount = Column(Integer)
    limitLastResetAt = Column(DateTime)
    token = Column(Text)
    refreshToken = Column(Text)
    settings = Column(JSONB)
    integrationIdentifier = Column(Text)
    importHash = Column(String, nullable=True)
    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    deletedAt = Column(DateTime)

    tenantId = Column(String, ForeignKey("tenants.id"), nullable=False)
    # parentTenant = relationship("Tenant", back_populates="integrations")

    createdById = Column(String, ForeignKey("users.id"))
    updatedById = Column(String, ForeignKey("users.id"))

    parentUser = relationship("User", foreign_keys=[createdById])
    updateParentUser = relationship("User", foreign_keys=[updatedById])

    @validates("importHash")
    def validate_importHash(self, key, value):
        if value is not None:
            assert len(value) <= 255
        return value
