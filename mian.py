from fastapi import FastAPI

from routers.auth import (
    router as auth_router
)

from routers.menu import (
    router as menu_router
)

from routers.orders import (
    router as orders_router
)

app = FastAPI()

app.include_router(auth_router)
app.include_router(menu_router)
app.include_router(orders_router)