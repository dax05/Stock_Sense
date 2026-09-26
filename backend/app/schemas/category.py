from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    parent_id: int | None = None


class CategoryOut(BaseModel):
    id: int
    name: str
    parent_id: int | None
    parent_name: str | None = None

    model_config = {"from_attributes": True}
