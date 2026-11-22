from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import public_router, router
from app.database.db import Base, engine
from app.database.migrations import run_migrations
from app.models import recommendation_cache, travel_profile, trip  # noqa: F401  (registers the tables)

# Creates any missing tables (does not alter existing ones)
Base.metadata.create_all(bind=engine)
run_migrations(engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(router, prefix="/api")
app.include_router(public_router, prefix="/api")