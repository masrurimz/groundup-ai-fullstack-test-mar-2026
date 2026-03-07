from fastapi import APIRouter

from app.api.routes import alerts, lookup, utils

api_router = APIRouter()

# Include route modules
api_router.include_router(alerts.router)
api_router.include_router(lookup.router)
api_router.include_router(utils.router)
