from pydantic import BaseModel, Field
from typing import List, Optional

class OrderItemRequest(BaseModel):
    menu_item_id: str = Field(..., description="شناسه آیتم منو")
    quantity: int = Field(..., gt=0, description="تعداد سفارش")

class CreateOrderSchema(BaseModel):
    items: List[OrderItemRequest] = Field(..., min_length=1, description="لیست آیتم‌های سفارش")

class StatusSchema(BaseModel):
    status: str = Field(..., description="وضعیت جدید سفارش")