from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine
from app.models import Base

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Database initialization warning: {e}")


# Set CORS origins
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Hirely API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
