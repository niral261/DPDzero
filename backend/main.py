from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine, Base
from contextlib import asynccontextmanager
import routers.auth as auth
import routers.feedback as feedback
from middleware.auth_middleware import auth_middleware
import routers.activity_log as activity_log
import routers.user_management as user_management
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("🏪Database is ready")
    yield
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

app.add_middleware(HTTPSRedirectMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dp-dzero.vercel.app"],  
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
auth_middleware(app)

app.include_router(auth.router)
app.include_router(feedback.router) 
app.include_router(activity_log.router)
app.include_router(user_management.router)
