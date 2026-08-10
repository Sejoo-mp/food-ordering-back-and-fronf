from pydantic import BaseModel, EmailStr, field_validator
from utils.security import validate_password_strength


class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("نام باید حداقل ۲ کاراکتر باشد")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return validate_password_strength(v)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    """خروجی امن کاربر - هرگز پسورد (حتی هش‌شده) را شامل نمی‌شود."""
    id: str
    name: str
    email: EmailStr
    role: str
