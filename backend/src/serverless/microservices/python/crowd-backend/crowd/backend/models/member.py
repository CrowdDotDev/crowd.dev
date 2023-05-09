from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Table, ARRAY
from .base import Base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.dialects.postgresql import JSONB, UUID


association_noMerge_table = Table(
    "memberNoMerge",
    Base.metadata,
    Column("memberId", UUID(as_uuid=True), ForeignKey("members.id"), primary_key=True),
)

association_toMerge_table = Table(
    "memberToMerge",
    Base.metadata,
    Column("memberId", UUID(as_uuid=True), ForeignKey("members.id"), primary_key=True),
)


class Member(Base):
    """
    Member model

    Args:
        Base (Base): Parent class
    """

    __tablename__ = "members"  # Table name in database

    id = Column(String, primary_key=True)
    displayName = Column(String, nullable=False)
    displayName = Column(String, nullable=True)
    attributes = Column(JSONB, default={})
    emails = Column(ARRAY(String))
    score = Column(Integer, default=-1)
    joinedAt = Column(DateTime, nullable=False)
    importHash = Column(String, nullable=True)
    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    deletedAt = Column(DateTime)

    tenantId = Column(String, ForeignKey("tenants.id"), nullable=False)
    parentTenant = relationship("Tenant", back_populates="members")

    # relationships
    activities = relationship("Activity", back_populates="parentMember", lazy="dynamic")

    noMerge = relationship("Member", secondary=association_noMerge_table, back_populates="noMerge")

    toMerge = relationship("Member", secondary=association_toMerge_table, back_populates="toMerge")

    # validation
    @validates("username")
    def validate_username(self, key, value):
        assert value != ""
        return value

    @validates("type")
    def validate_type(self, key, value):
        assert value != ""
        assert value == "member"
        return value

    @validates("joinedAt")
    def validate_joinedAt(self, key, value):
        assert value != ""
        return value

    @validates("importHash")
    def validate_importHash(self, key, value):
        if value is not None:
            assert len(value) <= 255
        return value
