from sqlalchemy import Column, String, DateTime, Integer, Boolean
from .base import Base
from sqlalchemy.orm import validates


class User(Base):
    """
    User model

    Args:
        Base (Base): Parent class
    """

    __tablename__ = "users"  # Table name in database
    id = Column(String, primary_key=True)
    fullName = Column(String, nullable=True)
    firstName = Column(String, nullable=True)
    password = Column(String, nullable=True)
    emailVerified = Column(Boolean, nullable=False, default=False)
    emailVerificationToken = Column(String, nullable=True)
    emailVerificationTokenExpiresAt = Column(DateTime)
    provider = Column(String)
    providerId = Column(String)
    passwordResetToken = Column(String, nullable=True)
    passwordResetTokenExpiresAt = Column(DateTime)
    lastName = Column(String, nullable=True)
    phoneNumber = Column(Integer, nullable=True)
    email = Column(String, nullable=False)
    jwtTokenInvalidBefore = Column(DateTime)
    importHash = Column(String, nullable=True)

    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    deletedAt = Column(DateTime)

    createdById = Column(String)
    updatedById = Column(String)

    # validation
    @validates("fullName")
    def validate_fullName(self, key, value):
        if value is not None:
            assert len(value) <= 255
        return value

    @validates("firstName")
    def validate_firstName(self, key, value):
        if value is not None:
            assert len(value) <= 80
        return value

    @validates("password")
    def validate_password(self, key, value):
        if value is not None:
            assert len(value) <= 255
        return value

    @validates("provider")
    def validate_provider(self, key, value):
        if value is not None:
            assert len(value) <= 255
        return value

    @validates("providerId")
    def validate_providerId(self, key, value):
        if value is not None:
            assert len(value) <= 2024
        return value

    @validates("passwordResetToken")
    def validate_passwordResetToken(self, key, value):
        if value is not None:
            assert len(value) <= 255
        return value

    @validates("lastName")
    def validate_lastName(self, key, value):
        if value is not None:
            assert len(value) <= 175
        return value

    @validates("phoneNumber")
    def validate_phoneNumber(self, key, value):
        if value is not None:
            assert len(value) <= 24
        return value

    @validates("email")
    def validate_email(self, key, value):
        assert value != ""
        assert value is not None
        assert len(value) <= 255
        return value

    @validates("importHash")
    def validate_importHash(self, key, value):
        if value is not None:
            assert len(value) <= 255
        return value
