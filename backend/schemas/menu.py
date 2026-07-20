from pydantic import BaseModel
from typing import Optional

class MenuCreate(BaseModel):
    image_url: Optional[str] = None
    name: str
    description: str
    price: float
    category: str
    is_available: bool = True

class MenuUpdate(BaseModel):
    image_url: Optional[str] = None
    name: str
    description: str
    price: float
    category: str
    is_available: bool
