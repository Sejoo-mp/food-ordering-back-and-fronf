from beanie import Document
from pydantic import BaseModel
from typing import List
from datetime import datetime

class OrderItem(BaseModel):  # ✅ اضافه شد
    menu_item_id: str
    quantity: int
    price: float

class Order(Document):
    user_id: str
    items: List[OrderItem]
    total_price: float
    status: str = "pending"
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "orders"