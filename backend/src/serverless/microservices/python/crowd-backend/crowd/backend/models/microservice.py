from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime
from .base import Base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.dialects.postgresql import JSONB


class Microservice(Base):
    """
    Activity model

    Args:
        Base (Base): Parent class
    """

    __tablename__ = "microservices"  # Table name in database
    # __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True)
    init = Column(Boolean, nullable=False)
    running = Column(Boolean, nullable=False)
    type = Column(String, nullable=False)
    variant = Column(String, nullable=False)
    settings = Column(JSONB)
    importHash = Column(String, nullable=True)
    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)

    tenantId = Column(String, ForeignKey("tenants.id"), nullable=False)
    parentTenant = relationship("Tenant", back_populates="microservices")

    createdById = Column(String, ForeignKey("users.id"))
    updatedById = Column(String, ForeignKey("users.id"))

    @validates("importHash")
    def validate_importHash(self, key, value):
        if value is not None:
            assert len(value) <= 255
        return value
