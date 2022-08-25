from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer
from .base import Base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.dialects.postgresql import JSONB


class Activity(Base):
    """
    Activity model

    Args:
        Base (Base): Parent class
    """

    __tablename__ = "activities"  # Table name in database
    # __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True)
    type = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    platform = Column(String, nullable=False)
    info = Column(JSONB, default={})
    crowdInfo = Column(JSONB, default={})
    isKeyAction = Column(Boolean, nullable=False, default=False)
    score = Column(Integer, default=2)
    sourceId = Column(String)
    sourceParentId = Column(String)
    importHash = Column(String, nullable=False)
    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    deletedAt = Column(DateTime)

    communityMemberId = Column(String, ForeignKey("communityMembers.id"), nullable=False)
    parentCommunityMember = relationship("CommunityMember", back_populates="activities")

    parentId = Column(String, ForeignKey("activities.id"))
    parent = relationship("Activity")

    tenantId = Column(String, ForeignKey("tenants.id"), nullable=False)
    parentTenant = relationship("Tenant", back_populates="activities")

    createdById = Column(String, ForeignKey("users.id"))
    updatedById = Column(String, ForeignKey("users.id"))

    parentUser = relationship("User", foreign_keys=[createdById])
    updateParentUser = relationship("User", foreign_keys=[updatedById])

    # validation
    @validates("type")
    def validate_type(self, key, value):
        assert value != ""
        return value

    @validates("platform")
    def validate_platform(self, key, value):
        assert value != ""
        return value

    @validates("importHash")
    def validate_importHash(self, key, value):
        if value is not None:
            assert len(value) <= 255
        return value
