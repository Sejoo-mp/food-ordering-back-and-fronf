from fastapi import HTTPException

def admin_only(user):

    if user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden"
        )