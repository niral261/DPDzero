from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine, Base
from contextlib import asynccontextmanager
import routers.auth as auth
import routers.feedback as feedback
from middleware.auth_middleware import auth_middleware
import routers.activity_log as activity_log


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("🏪Database is ready")
    yield
    await engine.dispose()

app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dp-dzero.vercel.app", "http://localhost:3000", "http://127.0.0.1:3000"],  
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
auth_middleware(app)

app.include_router(auth.router)
app.include_router(feedback.router) 
app.include_router(activity_log.router)
