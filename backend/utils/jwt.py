from jose import jwt
from fastapi import HTTPException, Header

SECRET_KEY = "my_secret_key"
ALGORITHM = "HS256"

def create_token(data):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(authorization: str = Header()):
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or missing token")