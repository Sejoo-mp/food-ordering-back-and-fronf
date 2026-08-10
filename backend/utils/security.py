"""
ابزارهای مربوط به امنیت رمز عبور:
- هش کردن پسورد با bcrypt (هرگز پسورد خام ذخیره نمی‌شود)
- بررسی تطابق پسورد هنگام لاگین
- اعتبارسنجی قدرت پسورد هنگام ثبت‌نام
"""
import re
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# حداقل و حداکثر طول مجاز برای پسورد
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 72  # محدودیت الگوریتم bcrypt


def hash_password(plain_password: str) -> str:
    """پسورد خام را با bcrypt هش می‌کند."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """پسورد وارد شده را با هش ذخیره‌شده مقایسه می‌کند."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def validate_password_strength(password: str) -> str:
    """
    قدرت پسورد را بررسی می‌کند. اگر معتبر نبود ValueError می‌دهد.
    قوانین:
      - حداقل 8 و حداکثر 72 کاراکتر
      - حداقل یک حرف بزرگ
      - حداقل یک حرف کوچک
      - حداقل یک عدد
      - حداقل یک کاراکتر خاص
      - بدون فاصله خالی
    """
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"رمز عبور باید حداقل {MIN_PASSWORD_LENGTH} کاراکتر باشد")
    if len(password) > MAX_PASSWORD_LENGTH:
        raise ValueError(f"رمز عبور نباید بیشتر از {MAX_PASSWORD_LENGTH} کاراکتر باشد")
    if not re.search(r"[A-Z]", password):
        raise ValueError("رمز عبور باید حداقل شامل یک حرف بزرگ انگلیسی باشد")
    if not re.search(r"[a-z]", password):
        raise ValueError("رمز عبور باید حداقل شامل یک حرف کوچک انگلیسی باشد")
    if not re.search(r"\d", password):
        raise ValueError("رمز عبور باید حداقل شامل یک عدد باشد")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
        raise ValueError("رمز عبور باید حداقل شامل یک کاراکتر خاص باشد (مثل !@#$%)")
    if " " in password:
        raise ValueError("رمز عبور نباید شامل فاصله خالی باشد")
    return password
