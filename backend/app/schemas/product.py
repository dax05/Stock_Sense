from pydantic import BaseModel, field_validator


class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: int | None = None
    uom: str = "Units"
    cost: float = 0.0
    min_stock_level: int = 0
    reorder_qty: int = 0

    @field_validator("cost")
    @classmethod
    def cost_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("cost cannot be negative")
        return v

    @field_validator("min_stock_level", "reorder_qty")
    @classmethod
    def non_negative_int(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Value cannot be negative")
        return v


class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    category_id: int | None
    category_name: str | None = None
    uom: str
    cost: float
    on_hand: float
    free_to_use: float
    min_stock_level: int
    reorder_qty: int

    model_config = {"from_attributes": True}


class LowStockAlert(BaseModel):
    id: int
    name: str
    sku: str
    category_name: str | None
    uom: str
    free_to_use: float
    min_stock_level: int
    reorder_qty: int
    shortage: float          # min_stock_level - free_to_use
