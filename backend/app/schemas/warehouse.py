from pydantic import BaseModel, field_validator
from app.models.warehouse import LocationType


class WarehouseCreate(BaseModel):
    name: str
    short_code: str
    address: str | None = None

    @field_validator("short_code")
    @classmethod
    def upper(cls, v: str) -> str:
        return v.strip().upper()


class WarehouseOut(BaseModel):
    id: int
    name: str
    short_code: str
    address: str | None

    model_config = {"from_attributes": True}


class LocationCreate(BaseModel):
    warehouse_id: int | None = None
    name: str
    short_code: str
    location_type: LocationType = LocationType.internal

    @field_validator("short_code")
    @classmethod
    def upper(cls, v: str) -> str:
        return v.strip().upper()


class LocationOut(BaseModel):
    id: int
    warehouse_id: int | None
    name: str
    short_code: str
    location_type: LocationType

    model_config = {"from_attributes": True}
