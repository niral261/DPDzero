import os
import os
from fastapi import Request
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
from routers.auth import ALGORITHM
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
from routers.auth import ALGORITHM
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

EXCLUDE_PATHS = {"/login", "/signup", "/docs"}


def auth_middleware(app):
    @app.middleware("http")
    async def auth_middleware(request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        for path in EXCLUDE_PATHS:
            if request.url.path.startswith(path):
                return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401, content={"detail": "Not authenticated"}
            )

        token = auth_header.split(" ", 1)[1]
        try:
            if SECRET_KEY is None:
                return JSONResponse(
                    status_code=500, content={"detail": "Server configuration error"}
                )
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            request.state.user = payload.get("sub")
        except JWTError:
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})
        return await call_next(request)
