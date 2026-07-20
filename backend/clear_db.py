import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from models.user import User
from models.menu import MenuItem
from models.order import Order

async def clear_database():
    # اتصال به MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.food_ordering
    
    # حذف همه کالکشن‌ها
    await db.drop_collection("users")
    await db.drop_collection("menu_items")
    await db.drop_collection("orders")
    
    print("✅ تمام دیتا پاک شد!")
    
    # دوباره Beanie را راه‌اندازی کنید
    await init_beanie(
        database=db,
        document_models=[User, MenuItem, Order]
    )
    
    print("✅ Beanie دوباره راه‌اندازی شد!")
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_database())