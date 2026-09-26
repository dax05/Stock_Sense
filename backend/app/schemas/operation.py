from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.operation import OperationType, OperationStatus


class StockMoveCreate(BaseModel):
    product_id: int
    qty: float
    source_location_id: int
    dest_location_id: int

    @field_validator("qty")
    @classmethod
    def qty_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("qty must be greater than 0")
        return v


class StockMoveOut(BaseModel):
    id: int
    product_id: int
    qty: float
    source_location_id: int
    dest_location_id: int
    status: OperationStatus

    model_config = {"from_attributes": True}


class OperationCreate(BaseModel):
    warehouse_id: int
    type: OperationType
    partner_name: str | None = None
    scheduled_date: datetime | None = None
    moves: list[StockMoveCreate]

    @field_validator("moves")
    @classmethod
    def moves_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("An operation must have at least one stock move")
        return v


class OperationOut(BaseModel):
    id: int
    reference: str
    type: OperationType
    status: OperationStatus
    partner_name: str | None
    scheduled_date: datetime | None
    responsible_id: int
    created_at: datetime
    stock_moves: list[StockMoveOut]

    model_config = {"from_attributes": True}


class StockLevelOut(BaseModel):
    product_id: int
    sku: str
    name: str
    on_hand: float
    reserved: float
    free_to_use: float
