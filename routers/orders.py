from fastapi import (
    APIRouter,
    HTTPException
)

from models.order import Order
from models.menu import MenuItem

from schemas.order import (
    CreateOrderSchema,
    StatusSchema
)

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

@router.post("/")
async def create_order(
    data: CreateOrderSchema
):

    total_price = 0
    items = []

    for item in data.items:

        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity invalid"
            )

        menu_item = await MenuItem.get(
            item.menu_item_id
        )

        if not menu_item:
            raise HTTPException(
                status_code=404,
                detail="Menu item not found"
            )

        if not menu_item.is_available:
            raise HTTPException(
                status_code=400,
                detail="Item unavailable"
            )

        total_price += (
            menu_item.price *
            item.quantity
        )

        items.append({
            "menu_item_id": str(menu_item.id),
            "quantity": item.quantity,
            "price": menu_item.price
        })

    order = Order(
        user_id="user_id",
        items=items,
        total_price=total_price
    )

    await order.insert()

    return order


@router.get("/my")
async def my_orders():

    return await Order.find_all().to_list()


@router.get("/")
async def all_orders():

    return await Order.find_all().to_list()


@router.patch("/{id}/status")
async def update_status(
    id: str,
    data: StatusSchema
):

    order = await Order.get(id)

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    order.status = data.status

    await order.save()

    return order