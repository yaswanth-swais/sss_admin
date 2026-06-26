from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    PORT: int                  = int(os.getenv("PORT", 5000))
    NODE_ENV: str              = os.getenv("NODE_ENV", "development")

    # AWS RDS PostgreSQL
    DATABASE_URL: str          = os.getenv("DATABASE_URL", "")

    # JWT
    JWT_SECRET: str            = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str         = "HS256"
    JWT_EXPIRE_DAYS: int       = 7

    # Google OAuth
    GOOGLE_CLIENT_ID: str      = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str  = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_CALLBACK_URL: str   = os.getenv("GOOGLE_CALLBACK_URL", "http://localhost:5000/auth/google/callback")

    # URLs
    FRONTEND_URL: str          = os.getenv("FRONTEND_URL", "http://localhost:3000")

settings = Settings()
