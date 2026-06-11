from beanie import Document
from datetime import datetime

class MenuItem(Document):
    name: str
    description: str
    price: float
    category: str
    is_available: bool = True
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "menu_items"
