import asyncio

from app.core.db import AsyncSessionLocal
from app.services.bootstrap import bootstrap_data


async def run_seed() -> None:
    async with AsyncSessionLocal() as session:
        await bootstrap_data(session)


if __name__ == "__main__":
    asyncio.run(run_seed())
