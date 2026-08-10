from beanie import Document, Indexed
from datetime import datetime
from typing import Literal


class User(Document):

    name: str
    email: Indexed(str, unique=True)
    password: str  # هش bcrypt پسورد - هرگز پسورد خام ذخیره نمی‌شود

    role: Literal["user", "admin"] = "user"

    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "users"
