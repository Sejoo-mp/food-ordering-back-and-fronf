from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.food_ordering

async def get_next_id(collection_name: str) -> int:
    counter = await db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    return counter["seq"]