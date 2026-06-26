from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, BigInteger
from app.database import Base


class User(Base):
    """
    Maps to the users_master table in swais_prod.
    Python attribute names are kept clean; SQLAlchemy maps them to the actual DB column names.
    """

    __tablename__ = "users_master"

    # Primary key — BIGSERIAL auto-incremented integer in users_master
    id                    = Column("user_id",               BigInteger, primary_key=True, autoincrement=True)

    # Auth / identity
    email                 = Column("login_id",              String(100), unique=True, nullable=False, index=True)
    email_id              = Column("email_id",              String(150), nullable=True)   # mirrors login_id
    password_hash         = Column("password_hash",         String,      nullable=True)   # NULL for OAuth users

    # Profile
    name                  = Column("full_name",             String(150), nullable=False, default="")
    first_name            = Column("first_name",            String(100), nullable=True)
    last_name             = Column("last_name",             String(100), nullable=True)
    phone_number          = Column("mobile_no",             String(20),  nullable=True)
    dob                   = Column("dob",                   String(20),  nullable=True)

    # Role & industry — stored as plain VARCHAR in users_master
    role                  = Column("role",                  String(10),  nullable=False, default="USER")
    user_type             = Column("user_type",             String(20),  nullable=True)

    # Activation flow
    registration_complete = Column("registration_complete", Boolean,     nullable=False, default=False)
    is_active             = Column("is_active",             Boolean,     nullable=False, default=False)

    # Audit
    createdAt             = Column("created_datetime",      DateTime(timezone=True),
                                   default=lambda: datetime.now(timezone.utc))
    record_status         = Column("record_status",         String(20),  nullable=True, default="Active")
