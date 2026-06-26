from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine, check_db_connection
from app.models import User  # noqa: F401 — ensure model is registered
from app.routers import auth, user, admin, functions, warehouse

app = FastAPI(
    title="SWAIS API",
    description="Saraf Worldsphere AI Services — Backend API",
    version="2.0.0",
    docs_url="/docs",       # Swagger UI at http://localhost:5000/docs
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(admin.router)
app.include_router(functions.router)
app.include_router(warehouse.router)

# Legacy alias — /api/warehouse-data → /warehouse/data
from fastapi.responses import JSONResponse
from fastapi import Request, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.warehouse import get_data, require_warehousing

@app.get("/api/warehouse-data")
def legacy_warehouse_data(user=Depends(require_warehousing)):
    return get_data(user)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


# ── Startup log ───────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    print(f"\n🚀 SWAIS API running")
    print(f"   Environment : {settings.NODE_ENV}")
    print(f"   Frontend URL: {settings.FRONTEND_URL}")
    print(f"   API Docs    : http://localhost:{settings.PORT}/docs")

    if check_db_connection():
        print(f"   Database    : ✅ Connected to AWS RDS (swais_prod)\n")
        # We use the existing users_master table — create_all is a no-op if it already exists
        try:
            Base.metadata.create_all(bind=engine)
            print(f"   Tables      : ✅ users_master table ready\n")
        except Exception as e:
            print(f"   Tables      : ⚠️  create_all warning — {e}\n")
    else:
        print(f"   Database    : ❌ Not connected — server will run but DB calls will fail\n")
