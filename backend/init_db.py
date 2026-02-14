#!/usr/bin/env python3
"""Database initialization script"""
import asyncio
import sys

sys.path.insert(0, '/app')

from app.database import async_engine
from app.models import Base


async def init_db():
    """Create all tables"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())
