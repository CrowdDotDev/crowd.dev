from sqlalchemy import Column, String, DateTime, ForeignKey
from .base import Base
from sqlalchemy.orm import relationship, validates


class Settings(Base):
    """
    Settings model

    Args:
        Base (Base): Parent class
    """

    __tablename__ = "settings"  # Table name in database

    id = Column(String, primary_key=True)
    theme = Column(String, nullable=False)
    backgroundImageUrl = Column(String)
    logoUrl = Column(String)

    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    deletedAt = Column(DateTime)

    tenantId = Column(String, ForeignKey("tenants.id"), nullable=False)
    parentTenant = relationship("Tenant", back_populates="reports")

    createdById = Column(String, ForeignKey("users.id"))
    updatedById = Column(String, ForeignKey("users.id"))

    parentUser = relationship("User", foreign_keys=[createdById])
    updateParentUser = relationship("User", foreign_keys=[updatedById])

    # validation
    @validates("theme")
    def validate_theme(self, key, value):
        assert value != ""
        assert value is not None
        assert len(value) <= 255
        return value
