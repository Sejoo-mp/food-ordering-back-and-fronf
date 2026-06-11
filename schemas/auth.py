from pydantic import BaseModel, EmailStr

class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"

class LoginSchema(BaseModel):
    email: EmailStr
    password: str