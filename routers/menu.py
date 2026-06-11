from fastapi import APIRouter, HTTPException

from models.menu import MenuItem

from schemas.menu import (
    MenuCreate,
    MenuUpdate
)

router = APIRouter(
    prefix="/menu",
    tags=["Menu"]
)

@router.post("/")
async def create_menu(data: MenuCreate):

    item = MenuItem(**data.dict())

    await item.insert()

    return item


@router.get("/")
async def get_all_menu():

    return await MenuItem.find_all().to_list()


@router.get("/{id}")
async def get_menu_item(id: str):

    item = await MenuItem.get(id)

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    return item


@router.put("/{id}")
async def update_menu(
    id: str,
    data: MenuUpdate
):

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


@router.delete("/{id}")
async def delete_menu(id: str):

    item = await MenuItem.get(id)

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    await item.delete()

    return {
        "message": "Deleted"
    }