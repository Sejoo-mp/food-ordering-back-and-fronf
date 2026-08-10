import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from database import init_db

from routers.auth import router as auth_router
from routers.menu import router as menu_router
from routers.orders import router as orders_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Food Ordering API",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_router)
app.include_router(menu_router)
app.include_router(orders_router)

# در production مقدار CORS_ORIGINS را در .env با دامنه‌های واقعی ست کنید
# مثال: CORS_ORIGINS=https://myfrontend.com,https://www.myfrontend.com
_origins_env = os.environ.get("CORS_ORIGINS", "*")
allow_origins = [o.strip() for o in _origins_env.split(",")] if _origins_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_origins != ["*"],  # با origin=* نمی‌توان credentials=True داشت
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def health_check():
    """برای مانیتورینگ آنلاین بودن سرویس (مثلا توسط Render/UptimeRobot)."""
    return {"status": "ok"}
