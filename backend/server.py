import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.routes.auth_routes import router as auth_router
from backend.routes.candidate_routes import router as candidate_router
from backend.routes.recruiter_routes import router as recruiter_router

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("DATABASE_URL")
DATABASE_URL = MONGODB_URI


def create_app() -> FastAPI:
    app = FastAPI(title="CirrusLabs TalentHub API", version="2.0.0")

    allowed_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5174,http://localhost:4173,http://localhost:5173",
    ).split(",")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    app.include_router(auth_router)
    app.include_router(candidate_router)
    app.include_router(recruiter_router)

    return app


app = create_app()
