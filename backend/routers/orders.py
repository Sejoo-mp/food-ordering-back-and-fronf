from fastapi import APIRouter, HTTPException, Depends
from models.order import Order
from models.menu import MenuItem
from typing import Optional
from models.user import User
from schemas.orders import (
    CreateOrderSchema,
    StatusSchema
)
from utils.jwt import decode_token
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

@router.post("/")
async def create_order(data: CreateOrderSchema, user=Depends(decode_token)):
    """
    ثبت سفارش جدید
    - نیاز به احراز هویت دارد
    - بررسی موجود بودن آیتم‌ها
    - محاسبه خودکار قیمت کل
    """
    if not data.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")
    
    total_price = 0
    items = []
    
    for item in data.items:
        # بررسی مقدار تعداد
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail=f"Quantity for item must be greater than 0")
        
        # بررسی و اعتبارسنجی ID
        if not item.menu_item_id or item.menu_item_id == 'undefined' or item.menu_item_id == 'null':
            raise HTTPException(status_code=400, detail="Invalid menu item ID")
        
        try:
            # تبدیل string به ObjectId
            menu_item_id = ObjectId(item.menu_item_id)
            menu_item = await MenuItem.get(menu_item_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Invalid menu item ID format: {item.menu_item_id}")
        except Exception as e:
            print(f"Error fetching menu item: {e}")
            raise HTTPException(status_code=404, detail=f"Menu item not found: {item.menu_item_id}")
        
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item not found: {item.menu_item_id}")
        
        if not menu_item.is_available:
            raise HTTPException(status_code=400, detail=f"Item '{menu_item.name}' is not available")
        
        # محاسبه قیمت
        item_total = menu_item.price * item.quantity
        total_price += item_total
        
        # افزودن به لیست آیتم‌های سفارش
        items.append({
            "menu_item_id": str(menu_item.id),
            "name": menu_item.name,  # اضافه کردن نام برای نمایش بهتر
            "quantity": item.quantity,
            "price": menu_item.price,
            "total": item_total  # قیمت کل برای این آیتم
        })
    
    # ایجاد سفارش
    order = Order(
        user_id=user.get("id"),
        items=items,
        total_price=total_price,
        status="pending"
    )
    
    await order.insert()
    
    # برگرداندن سفارش با فرمت مناسب
    return {
        "id": str(order.id),
        "user_id": order.user_id,
        "items": order.items,
        "total_price": order.total_price,
        "status": order.status,
        "created_at": order.created_at
    }


@router.get("/my")
async def my_orders(user=Depends(decode_token)):
    """
    دریافت سفارشات کاربر جاری
    - نیاز به احراز هویت دارد
    - فقط سفارشات خود کاربر را نشان می‌دهد
    """
    orders = await Order.find(Order.user_id == user.get("id")).to_list()
    
    # تبدیل به فرمت مناسب برای نمایش
    result = []
    for order in orders:
        result.append({
            "id": str(order.id),
            "user_id": order.user_id,
            "items": order.items,
            "total_price": order.total_price,
            "status": order.status,
            "created_at": order.created_at
        })
    
    return result


@router.get("/")
async def all_orders(status: Optional[str] = None, user=Depends(decode_token)):
    """
    دریافت تمام سفارشات (فقط ادمین) — با امکان فیلتر بر اساس وضعیت
    """
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden - Admin only")

    valid_statuses = ["pending", "completed", "cancelled"]
    if status and status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    if status:
        orders = await Order.find(Order.status == status).to_list()
    else:
        orders = await Order.find_all().to_list()

    result = []
    for order in orders:
        customer_name = None
        customer_email = None
        try:
            customer = await User.get(ObjectId(order.user_id))
            if customer:
                customer_name = customer.name
                customer_email = customer.email
        except Exception:
            pass

        result.append({
            "id": str(order.id),
            "user_id": order.user_id,
            "customer_name": customer_name,
            "customer_email": customer_email,
            "items": order.items,
            "total_price": order.total_price,
            "status": order.status,
            "created_at": order.created_at
        })

    return result
    """
    دریافت تمام سفارشات (فقط ادمین)
    - نیاز به احراز هویت دارد
    - فقط ادمین می‌تواند ببیند
    """
    # بررسی نقش ادمین
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden - Admin only")
    
    orders = await Order.find_all().to_list()
    
    # تبدیل به فرمت مناسب برای نمایش
    result = []
    for order in orders:
        result.append({
            "id": str(order.id),
            "user_id": order.user_id,
            "items": order.items,
            "total_price": order.total_price,
            "status": order.status,
            "created_at": order.created_at
        })
    
    return result


@router.patch("/{id}/status")
async def update_status(id: str, data: StatusSchema, user=Depends(decode_token)):
    """
    به‌روزرسانی وضعیت سفارش (فقط ادمین)
    - نیاز به احراز هویت دارد
    - فقط ادمین می‌تواند تغییر وضعیت دهد
    """
    # بررسی نقش ادمین
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden - Admin only")
    
    # اعتبارسنجی ID
    try:
        order_id = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid order ID format")
    
    # پیدا کردن سفارش
    order = await Order.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # اعتبارسنجی وضعیت جدید
    valid_statuses = ["pending", "completed", "cancelled"]
    if data.status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    # به‌روزرسانی وضعیت
    old_status = order.status
    order.status = data.status
    await order.save()
    
    return {
        "id": str(order.id),
        "old_status": old_status,
        "new_status": order.status,
        "message": f"Order status updated from '{old_status}' to '{order.status}'"
    }


@router.get("/{id}")
async def get_order(id: str, user=Depends(decode_token)):
    """
    دریافت جزئیات یک سفارش خاص
    - نیاز به احراز هویت دارد
    - کاربر عادی فقط سفارش خودش را می‌تواند ببیند
    - ادمین می‌تواند همه سفارشات را ببیند
    """
    # اعتبارسنجی ID
    try:
        order_id = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid order ID format")
    
    # پیدا کردن سفارش
    order = await Order.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # بررسی دسترسی
    if user.get("role") != "admin" and order.user_id != user.get("id"):
        raise HTTPException(status_code=403, detail="Forbidden - You can only view your own orders")
    
    return {
        "id": str(order.id),
        "user_id": order.user_id,
        "items": order.items,
        "total_price": order.total_price,
        "status": order.status,
        "created_at": order.created_at
    }