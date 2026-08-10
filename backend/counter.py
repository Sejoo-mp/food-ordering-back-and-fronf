import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.food_ordering


async def get_next_id(collection_name: str) -> int:
    counter = await db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    return counter["seq"]
