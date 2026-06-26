from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# SQLAlchemy needs postgresql+psycopg2:// driver prefix
# Strip any Prisma-specific params (schema=public) that psycopg2 doesn't understand
DATABASE_URL = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+psycopg2://"
).split("&schema=")[0].split("?schema=")[0]

# For AWS RDS — sslmode=require stays in the URL, psycopg2 handles it natively
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={"connect_timeout": 5},  # 5 sec timeout — server starts fast even if RDS unreachable
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Ping the DB — used at startup. Times out after 5 seconds."""
    try:
        with engine.connect().execution_options(timeout=5) as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"   Database    : ❌ Connection failed — {e}")
        return False
