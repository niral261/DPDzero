from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite+aiosqlite:////tmp/workplace_vibe.db"

engine = create_async_engine(DATABASE_URL, echo=True)

Base = declarative_base()

async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
