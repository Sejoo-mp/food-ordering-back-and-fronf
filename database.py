from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from models.user import User
from models.menu import MenuItem
from models.order import Order

async def init_db():
    client = AsyncIOMotorClient(
        "mongodb://localhost:27017"
    )

    db = client.food_ordering

    await init_beanie(
        database=db,
        document_models=[
            User,
            MenuItem,
            Order
        ]
    )