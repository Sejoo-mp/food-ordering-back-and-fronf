from fastapi import APIRouter, HTTPException, Depends

from bson import ObjectId
from bson.errors import InvalidId

from schemas.auth import RegisterSchema, LoginSchema, UserPublic
from models.user import User
from utils.jwt import create_token, decode_token
from utils.security import hash_password, verify_password

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


def _to_public(user: User) -> dict:
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


@router.post("/register", response_model=UserPublic, status_code=201)
async def register(data: RegisterSchema):

    # مقایسه ایمیل به‌صورت غیرحساس به بزرگی/کوچکی حروف
    existing_user = await User.find_one(User.email == data.email.lower())

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already exists"
        )

    user = User(
        name=data.name,
        email=data.email.lower(),
        password=hash_password(data.password),
        role="user",  # نقش همیشه از سمت سرور تعیین می‌شود، هرگز از ورودی کاربر گرفته نمی‌شود
    )

    await user.insert()

    return _to_public(user)


@router.get("/users", response_model=list[UserPublic])
async def get_all_users(current_user: dict = Depends(decode_token)):
    """فقط ادمین: لیست کاربران بدون افشای پسورد (حتی هش‌شده)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden - Admin only")

    users = await User.find_all().to_list()
    return [_to_public(u) for u in users]


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(decode_token)):
    """اطلاعات کاربر جاری بر اساس توکن ارسالی."""
    try:
        user = await User.get(ObjectId(current_user.get("id")))
    except InvalidId:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_public(user)


@router.post("/login")
async def login(data: LoginSchema):

    user = await User.find_one(User.email == data.email.lower())

    # پیام خطای یکسان برای «کاربر یافت نشد» و «پسورد اشتباه» تا از افشای
    # وجود/عدم‌وجود یک ایمیل خاص (user enumeration) جلوگیری شود
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Wrong credentials"
        )

    token = create_token({
        "id": str(user.id),
        "role": user.role
    })

    return {
        "token": token,
        "token_type": "bearer",
        "user": _to_public(user),
    }
