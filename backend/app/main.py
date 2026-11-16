from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import get_settings
from app.core.database import check_db_connection
from app.routers import auth as auth_router
from app.routers import admin as admin_router
from app.deps.auth import require_admin
from app.models.user import User
from fastapi import Depends

settings = get_settings()

app = FastAPI(
    title="RoboKidz LMS API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(admin_router.router)


# ── System endpoints ──────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health_check():
    db_ok = check_db_connection()
    if not db_ok:
        return JSONResponse(status_code=503, content={"status": "error", "db": "unreachable"})
    return {"status": "ok", "db": "connected"}


@app.get("/test/admin-only", tags=["System"])
def admin_only_test(current_user: User = Depends(require_admin)):
    """Test route: returns 403 for non-admins, 200 for admin."""
    return {"message": f"Hello admin {current_user.name}"}
