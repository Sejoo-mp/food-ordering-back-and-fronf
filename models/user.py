from beanie import Document
from datetime import datetime

class User(Document):

    name: str
    email: str
    password: str

    role: str = "user"

    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "users"