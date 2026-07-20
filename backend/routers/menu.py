from fastapi import APIRouter, HTTPException, Depends
from models.menu import MenuItem
from schemas.menu import MenuCreate, MenuUpdate
from utils.jwt import decode_token
import os, uuid
from fastapi import UploadFile, File

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(
    prefix="/menu",
    tags=["Menu"]
)

def admin_required(user=Depends(decode_token)):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden — admin only"
        )
    return user


@router.get("/")
async def get_all_menu():
    return await MenuItem.find_all().to_list()

@router.post("/upload-image", dependencies=[Depends(admin_required)])
async def upload_image(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        raise HTTPException(status_code=400, detail="فرمت عکس مجاز نیست")
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(await file.read())
    return {"url": f"/static/uploads/{filename}"}

@router.post("/", dependencies=[Depends(admin_required)])
async def create_menu(data: MenuCreate):
    item = MenuItem(**data.dict())
    await item.insert()
    return item


@router.get("/{id}")
async def get_menu_item(id: str):
    item = await MenuItem.get(id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )
    return item


@router.put("/{id}", dependencies=[Depends(admin_required)])
async def update_menu(id: str, data: MenuUpdate):
    item = await MenuItem.get(id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )
    item.name = data.name
    item.description = data.description
    item.price = data.price
    item.category = data.category
    item.is_available = data.is_available
    await item.save()
    return item


@router.delete("/{id}", dependencies=[Depends(admin_required)])
async def delete_menu(id: str):
    item = await MenuItem.get(id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )
    await item.delete()
    return {"message": "Deleted"}