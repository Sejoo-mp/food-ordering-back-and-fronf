from beanie import Document
from datetime import datetime
from typing import Optional

class MenuItem(Document):
    image_url: Optional[str] = None
    name: str
    description: str
    price: float
    category: str
    is_available: bool = True
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "menu_items"
